'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useToastState, useConfirm, ToastContainer, ConfirmModal } from '../components/ui/Notifications';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../components/ui/UnsavedChangesModal';
import { peekCache, setCache } from '../lib/cache';

// Interfaces estruturadas baseadas na nossa API
interface Product {
  id: string;
  name: string;
  isRequired: boolean;
}

interface ContactInput {
  name: string;
  phone: string;
  email: string;
  role?: string;
}

interface Group {
  id: string;
  name: string;
  isActive?: boolean;
}

interface CustomerProduct {
  productId: string;
  price: number;
}

interface CustomerDocument {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  userEmail: string;
  createdAt: string;
}

interface CustomerNote {
  id: string;
  content: string;
  userEmail: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  document: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  code?: string;
  type: 'PRE_PAGO' | 'POS_PAGO';
  groupId?: string;
  groupIds?: string[];
  groups?: Group[];
  isActive: boolean;
  contacts: ContactInput[];
  products?: CustomerProduct[];
  documents?: CustomerDocument[];
  notes?: CustomerNote[];
}

export default function CustomersDashboardPage() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [mainTab, setMainTab] = useState<'clientes' | 'grupos'>('clientes');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Sistema de Notificações Customizadas ───────────────────────────────
  const { toasts, addToast, removeToast } = useToastState();
  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  // ─── Proteção de Alterações Não Salvas ──────────────────────────────────
  const { isDirty, markDirty, markClean } = useUnsavedChanges();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);

  // Intercepta qualquer tentativa de sair da tela de edição
  const requestLeave = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingLeaveAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  }, [isDirty]);

  const handleUnsavedSave = async () => {
    // Dispara o submit do formulário via ref lógica — reutiliza o handleSubmit
    const form = window.document.getElementById('customer-form') as HTMLFormElement | null;
    if (form) form.requestSubmit();
    setShowUnsavedModal(false);
  };

  const handleUnsavedDiscard = () => {
    markClean();
    setShowUnsavedModal(false);
    if (pendingLeaveAction) {
      pendingLeaveAction();
      setPendingLeaveAction(null);
    }
  };

  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false);
    setPendingLeaveAction(null);
  };

  // Search & Edit States
  const [search, setSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch('/api/products/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      if (res.ok) {
        addToast('success', 'Grupo criado!', `O grupo ${newGroupName} foi criado com sucesso.`);
        setNewGroupName('');
        setShowCreateGroupModal(false);
        await loadData(); // recarrega a lista de grupos do backend
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', 'Erro ao criar grupo', err.message || 'Falha na criação.');
      }
    } catch (err) {
      addToast('error', 'Erro de conexão', 'Falha ao conectar com servidor.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'geral' | 'contatos' | 'documentos' | 'observacoes'>('geral');
  const [selectedCustomerDocs, setSelectedCustomerDocs] = useState<CustomerDocument[]>([]);
  const [selectedCustomerNotes, setSelectedCustomerNotes] = useState<CustomerNote[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomerDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/customers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomerDocs(data.documents || []);
        setSelectedCustomerNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Erro ao carregar notas e documentos:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!selectedFile) {
      addToast('warning', 'Arquivo não selecionado', 'Por favor, selecione um arquivo antes de enviar.');
      return;
    }
    setUploadingDoc(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', docName || selectedFile.name);

      const res = await fetch(`/api/customers/${editingId}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setDocName('');
        setSelectedFile(null);
        const fileInput = window.document.getElementById('doc-file-picker') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await fetchCustomerDetails(editingId);
        addToast('success', 'Documento enviado!', 'O arquivo foi anexado ao cadastro do cliente.');
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast('error', 'Erro no upload', errData.message || 'Não foi possível enviar o documento.');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      addToast('error', 'Erro de conexão', 'Não foi possível conectar ao servidor para enviar o documento.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDocument = (docId: string, filename: string) => {
    // A sessão (cookie) autentica; a API redireciona para um link temporário do arquivo privado
    window.open(`/api/customers/documents/${docId}/download`, '_blank', 'noopener');
    addToast('success', 'Download iniciado', `Baixando: ${filename}`);
  };


  const handleDeleteDocument = async (docId: string) => {
    if (!editingId) return;
    const confirmed = await confirm({
      title: 'Excluir Documento',
      message: 'Deseja realmente excluir este documento? Esta ação não poderá ser desfeita e o arquivo será removido permanentemente do servidor.',
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/customers/${editingId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchCustomerDetails(editingId);
        addToast('success', 'Documento excluído', 'O arquivo foi removido com sucesso.');
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast('error', 'Erro ao excluir', errData.message || 'Não foi possível excluir o documento.');
      }
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      addToast('error', 'Erro de conexão', 'Não foi possível conectar ao servidor para excluir o documento.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !noteContent.trim()) return;
    setSavingNote(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/customers/${editingId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: noteContent })
      });
      if (res.ok) {
        setNoteContent('');
        await fetchCustomerDetails(editingId);
        addToast('success', 'Observação registrada', 'A observação foi salva com sucesso.');
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast('error', 'Erro ao salvar', errData.message || 'Não foi possível salvar a observação.');
      }
    } catch (err) {
      console.error('Erro ao adicionar observação:', err);
      addToast('error', 'Erro de conexão', 'Não foi possível conectar ao servidor.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!editingId) return;
    const confirmed = await confirm({
      title: 'Excluir Observação',
      message: 'Deseja realmente excluir esta observação? Esta ação não poderá ser desfeita.',
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/customers/${editingId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchCustomerDetails(editingId);
        addToast('success', 'Observação excluída', 'A observação foi removida com sucesso.');
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast('error', 'Erro ao excluir', errData.message || 'Não foi possível excluir a observação.');
      }
    } catch (err) {
      console.error('Erro ao excluir observação:', err);
      addToast('error', 'Erro de conexão', 'Não foi possível conectar ao servidor.');
    }
  };

  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PRE_PAGO' | 'POS_PAGO'>('POS_PAGO');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [contacts, setContacts] = useState<ContactInput[]>([{ name: '', phone: '', email: '', role: '' }]);
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});

  // Dynamic States and Cities from IBGE
  const [statesList, setStatesList] = useState<{ sigla: string; nome: string }[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);

  // 1. Fetch Customers and Products
  const loadData = async () => {
    // Dados da última visita aparecem na hora; a busca abaixo atualiza em seguida
    const cachedCustomers = peekCache<Customer[]>('/api/customers');
    const cachedGroups = peekCache<any[]>('/api/products/groups');
    if (cachedCustomers) setCustomers(cachedCustomers);
    if (cachedGroups) setAllGroups(cachedGroups);
    setLoadingList(!(cachedCustomers && cachedGroups));
    try {
      const token = localStorage.getItem('@JMMaster:token');

      // Fetch customers e groups em paralelo
      const [custRes, grpRes] = await Promise.all([
        fetch('/api/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/products/groups', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
        setCache('/api/customers', custData);
      }

      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setAllGroups(grpData);
        setCache('/api/products/groups', grpData);
      }

      // Products list loading removed
    } catch (err) {
      console.error('Erro ao carregar dados do módulo de clientes:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Brazilian States from IBGE on mount
  useEffect(() => {
    async function loadStates() {
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?ordenar=nome');
        if (res.ok) {
          const data = await res.json();
          setStatesList(data.map((s: any) => ({ sigla: s.sigla, nome: s.nome })));
        }
      } catch (err) {
        console.error('Erro ao carregar estados do IBGE:', err);
      }
    }
    loadStates();
  }, []);

  // Fetch Cities based on selected State (UF)
  useEffect(() => {
    if (!state) {
      setCitiesList([]);
      return;
    }
    async function loadCities() {
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?ordenar=nome`);
        if (res.ok) {
          const data = await res.json();
          setCitiesList(data.map((c: any) => c.nome));
        }
      } catch (err) {
        console.error('Erro ao carregar cidades do IBGE:', err);
      }
    }
    loadCities();
  }, [state]);

  // Format Helper Masks
  const formatDocument = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return clean
        .substring(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const formatZipCode = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.substring(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.substring(0, 11).replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
  };

  // BRL Monetary formatters
  const formatBRL = (value: number | undefined) => {
    const val = value ?? 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handlePriceChangeRaw = (productId: string, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setProductPrices(prev => ({ ...prev, [productId]: 0 }));
      return;
    }
    const numericValue = parseFloat(digits) / 100;
    setProductPrices(prev => ({ ...prev, [productId]: numericValue }));
  };

  // Auto-fill address via ViaCEP API
  const handleZipCodeChange = async (value: string) => {
    const formatted = formatZipCode(value);
    setZipCode(formatted);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (!data.erro) {
            setStreet(data.logradouro || '');
            setState(data.uf || '');
            setCity(data.localidade || '');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  // Contact actions
  const handleAddContact = () => setContacts([...contacts, { name: '', phone: '', email: '', role: '' }]);
  const handleRemoveContact = (index: number) => setContacts(contacts.filter((_, i) => i !== index));
  const handleContactChange = (index: number, field: keyof ContactInput, value: string) => {
    const updated = [...contacts];
    updated[index][field] = field === 'phone' ? formatPhone(value) : value;
    setContacts(updated);
  };

  // Switch to Form for NEW Customer
  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDocument('');
    setCode('');
    setType('POS_PAGO');
    setGroupIds([]);
    setZipCode('');
    setStreet('');
    setNumber('');
    setState('');
    setCity('');
    setIsActive(true);
    setContacts([{ name: '', phone: '', email: '', role: '' }]);
    setSelectedCustomerDocs([]);
    setSelectedCustomerNotes([]);
    setDocName('');
    setSelectedFile(null);
    setNoteContent('');
    setActiveTab('geral');
    setView('create');
    setMessage(null);
  };

  // Switch to Form to EDIT Customer
  const handleStartEdit = (cust: Customer) => {
    setEditingId(cust.id);
    setName(cust.name);
    setDocument(formatDocument(cust.document));
    setCode(cust.code || '');
    setType(cust.type);
    setGroupIds(cust.groups?.map(g => g.id) || []);
    setZipCode(formatZipCode(cust.zipCode));
    setStreet(cust.street);
    setNumber(cust.number);
    setState(cust.state);
    setCity(cust.city);
    setIsActive(cust.isActive);

    if (cust.contacts && cust.contacts.length > 0) {
      setContacts(cust.contacts.map(c => ({
        name: c.name,
        phone: formatPhone(c.phone),
        email: c.email,
        role: c.role || ''
      })));
    } else {
      setContacts([{ name: '', phone: '', email: '', role: '' }]);
    }

    setDocName('');
    setSelectedFile(null);
    setNoteContent('');
    setSelectedCustomerDocs([]);
    setSelectedCustomerNotes([]);
    fetchCustomerDetails(cust.id);

    setActiveTab('geral');
    setView('create');
    setMessage(null);
  };

  // Delete Customer
  const handleDelete = async (id: string, customerName: string) => {
    const confirmed = await confirm({
      title: 'Excluir Cliente',
      message: `Deseja realmente excluir o cliente "${customerName}"? Esta ação removerá permanentemente os contatos, documentos anexados e observações, e não poderá ser desfeita. O histórico de faturas é mantido.`,
      confirmLabel: 'Sim, excluir cliente',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir cliente.');
      }
      addToast('success', 'Cliente excluído', `O cliente "${customerName}" foi removido com sucesso.`);
      await loadData();
    } catch (err: any) {
      addToast('error', 'Erro ao excluir cliente', err.message);
    }
  };

  // Toggle Group Status (Active / Inactive)
  const handleToggleGroupStatus = async (id: string, groupName: string) => {
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const response = await fetch(`/api/customers/groups/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao alterar status do grupo.');
      }
      setMessage({ type: 'success', text: `Status do grupo "${groupName}" alterado com sucesso!` });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSave(true);
    setMessage(null);

    // 1. Validação frontend geral
    if (!name.trim() || !document.trim() || !street.trim() || !number.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios na aba "Dados Gerais & Endereço".' });
      setActiveTab('geral');
      setLoadingSave(false);
      return;
    }

    // 2. Criticar CPF/CNPJ Duplicado localmente na carteira
    const cleanDoc = document.replace(/\D/g, '');
    const docExists = customers.some(c => c.document.replace(/\D/g, '') === cleanDoc && c.id !== editingId);
    if (docExists) {
      setMessage({
        type: 'error',
        text: `O CPF ou CNPJ "${document}" já pertence a um cliente cadastrado no sistema. Por favor, insira um novo dado.`
      });
      setActiveTab('geral');
      setLoadingSave(false);
      return;
    }

    try {
      const token = localStorage.getItem('@JMMaster:token');

      const payload = {
        name,
        document,
        street,
        number,
        city,
        state,
        zipCode,
        code: code || undefined,
        type,
        groupIds,
        isActive,
        contacts: contacts.filter(c => c.name.trim() && (c.phone.trim() || c.email.trim()))
      };

      const url = editingId
        ? `/api/customers/${editingId}`
        : '/api/customers';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar cliente.');
      }

      if (editingId) {
        // EDIÇÃO: permanece na tela, apenas atualiza dados e mostra toast
        markClean();
        addToast('success', 'Alterações salvas!', 'O cadastro do cliente foi atualizado com sucesso.');
        await loadData();
        await fetchCustomerDetails(editingId);
      } else {
        // CRIAÇÃO: limpa formulário e volta para a lista
        markClean();
        setName('');
        setDocument('');
        setZipCode('');
        setStreet('');
        setNumber('');
        setCity('');
        setState('');
        setIsActive(true);
        setCode('');
        setType('POS_PAGO');
        setGroupIds([]);
        setContacts([{ name: '', phone: '', email: '', role: '' }]);
        setEditingId(null);
        addToast('success', 'Cliente cadastrado!', 'Novo cliente registrado com sucesso.');
        await loadData();
        setTimeout(() => {
          setView('list');
        }, 800);
      }

    } catch (err: any) {
      addToast('error', 'Erro ao salvar', err.message || 'Não foi possível salvar as alterações.');
    } finally {
      setLoadingSave(false);
    }
  };


  // Mini Dash Calculations (Tab Clientes)
  const totalCustomers = customers.length;
  const totalPrePaid = customers.filter(c => c.type === 'PRE_PAGO').length;
  const totalPostPaid = customers.filter(c => c.type === 'POS_PAGO').length;

  // Search Filter Implementation for Clientes
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.document.includes(search)
  );

  // Group Corporate Mapping and calculations (Tab Grupos)
  // Mapeamos os clientes para cada grupo garantindo que customers seja sempre um array
  const groupsList = (allGroups || []).map(g => {
    const groupCusts = (customers || []).filter((c: any) =>
      c.groupId === g.id ||
      (Array.isArray(c.groupIds) && c.groupIds.includes(g.id))
    );
    return {
      ...g,
      customers: groupCusts,
    };
  });

  // Search Filter Implementation for Grupos
  const filteredGroups = groupsList.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    (g.customers && g.customers.some((c: any) => c.name.toLowerCase().includes(groupSearch.toLowerCase())))
  );

  const handleDeleteGroup = async (id: string, groupName: string) => {
    const confirmed = await confirm({
      title: 'Excluir Grupo',
      message: `Deseja realmente excluir o grupo "${groupName}"?`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/products/groups?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Grupo excluído', `O grupo ${groupName} foi removido com sucesso.`);
        await loadData();
      } else {
        addToast('error', 'Erro ao excluir', 'Não foi possível excluir o grupo.');
      }
    } catch {
      addToast('error', 'Erro de conexão', 'Falha ao conectar com o servidor.');
    }
  };

  // Guarantee dynamically fetched ViaCEP city is inside the select dropdown options list
  const currentCities = [...citiesList];
  if (city && !currentCities.includes(city)) {
    currentCities.push(city);
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ─── Sistema de Notificações Global ─────────────────────────── */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal
        isOpen={confirmOpen}
        options={confirmOptions}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleUnsavedSave}
        onDiscard={handleUnsavedDiscard}
        onCancel={handleUnsavedCancel}
        isSaving={loadingSave}
      />

      {/* ─── Modal: Cadastrar Novo Grupo ─────────────────────────── */}
      {showCreateGroupModal && (
        <div className="jm-overlay">
          <div className="absolute inset-0" onClick={() => setShowCreateGroupModal(false)} />
          <div className="jm-modal relative p-4 sm:max-w-sm md:p-5">
            <h3 className="jm-modal-title mb-1">Cadastrar Novo Grupo</h3>
            <p className="mb-4 text-sm text-jm-muted">Insira o nome do grupo corporativo que deseja criar.</p>
            <input
              type="text"
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup();
              }}
              placeholder="Ex: Grupo JMMaster"
              className="jm-input mb-4"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="jm-btn jm-btn-secondary jm-btn-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup || !newGroupName.trim()}
                className="jm-btn jm-btn-primary jm-btn-sm"
              >
                {creatingGroup ? 'Salvando...' : 'Salvar Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="text-jm-fg">
      <div className="jm-page">

        {/* Cabecalho Principal */}
        <div className="jm-page-header">
          <div>
            <h1 className="jm-page-title">Clientes JM Master</h1>
            <p className="jm-page-desc">Gestão de carteira operacional, contatos e precificação customizada.</p>
          </div>
          {view === 'list' ? (
            mainTab === 'clientes' ? (
              <button
                onClick={handleOpenCreate}
                className="jm-btn jm-btn-accent self-start sm:self-auto"
              >
                <span>+ Novo Cliente</span>
              </button>
            ) : (
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="jm-btn jm-btn-accent self-start sm:self-auto"
              >
                <span>+ Cadastrar Grupo</span>
              </button>
            )
          ) : (
            <button
              onClick={() => requestLeave(() => { markClean(); setView('list'); setEditingId(null); })}
              className="jm-btn jm-btn-secondary self-start sm:self-auto"
            >
              <span>Voltar para Lista</span>
            </button>
          )}
        </div>

        {/* Navegação entre Clientes e Grupos (Apenas na visualização de lista) */}
        {view === 'list' && (
          <div className="jm-tabs">
            <button
              onClick={() => { setMainTab('clientes'); setMessage(null); }}
              className={`jm-tab ${mainTab === 'clientes' ? 'jm-tab-active' : ''}`}
            >
              Clientes ({totalCustomers})
            </button>
            <button
              onClick={() => { setMainTab('grupos'); setMessage(null); }}
              className={`jm-tab ${mainTab === 'grupos' ? 'jm-tab-active' : ''}`}
            >
              Grupos ({groupsList.length})
            </button>
          </div>
        )}

        {/* Notificacoes */}
        {message && (
          <div className={`jm-alert font-medium ${
            message.type === 'success'
              ? 'jm-alert-success'
              : 'jm-alert-danger'
          }`}>
            {message.text}
          </div>
        )}

        {view === 'list' ? (
          /* VISTA: LISTAS (ABAS DE CLIENTES OU GRUPOS) */
          mainTab === 'clientes' ? (
            /* ABA 1: CLIENTES */
            <div className="space-y-4">

              {/* MINI DASHBOARD */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="jm-card px-4 py-3.5">
                  <p className="jm-stat-label">Clientes Cadastrados</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-jm-fg">{totalCustomers}</p>
                </div>
                <div className="jm-card px-4 py-3.5">
                  <p className="jm-stat-label">Pré-Pago</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-jm-accent-text">{totalPrePaid}</p>
                </div>
                <div className="jm-card px-4 py-3.5">
                  <p className="jm-stat-label">Pós-Pago</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-jm-primary-text">{totalPostPaid}</p>
                </div>
              </div>

              {/* BARRA DE PESQUISA */}
              <div className="flex">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquise por Nome do Cliente ou Documento..."
                  className="jm-input max-w-md"
                />
              </div>

              {/* TABELA DE CLIENTES */}
              <div className="jm-table-wrap">
                {loadingList ? (
                  <div className="jm-empty">Carregando carteira de clientes...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="jm-empty">Nenhum cliente cadastrado.</div>
                ) : (
                  <div>
                    <table className="jm-table min-w-[760px]">
                      <thead>
                        <tr>
                          <th className="jm-th">Cliente</th>
                          <th className="jm-th">CPF / CNPJ</th>
                          <th className="jm-th">Tipo</th>
                          <th className="jm-th">Grupo Corporativo</th>
                          <th className="jm-th">Cidade/UF</th>
                          <th className="jm-th text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((cust) => (
                          <tr key={cust.id} className="jm-tr">
                            <td className="jm-td">
                              <span className="flex items-center gap-2 text-sm font-medium text-jm-fg">
                                {cust.name}
                                <span className={`w-2 h-2 rounded-full ${cust.isActive ? 'bg-jm-success-fg' : 'bg-jm-danger-fg'}`} title={cust.isActive ? 'Ativo' : 'Inativo'}></span>
                              </span>
                              <div className="mt-0.5 flex items-center gap-2">
                                {cust.code && <span className="text-xs text-jm-muted font-mono">{cust.code}</span>}
                                <span className={`jm-badge ${cust.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                                  {cust.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </td>
                            <td className="jm-td text-jm-fg2">{cust.document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}</td>
                            <td className="jm-td">
                              <span className={`jm-badge ${
                                cust.type === 'POS_PAGO'
                                  ? 'jm-badge-primary'
                                  : 'jm-badge-accent'
                              }`}>
                                {cust.type === 'POS_PAGO' ? 'Pós-Pago' : 'Pré-Pago'}
                              </span>
                            </td>
                            <td className="jm-td">
                              {cust.groups && cust.groups.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {cust.groups.map(g => (
                                    <span key={g.id} className="jm-badge jm-badge-neutral">{g.name}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-jm-muted italic text-xs">Nenhum</span>
                              )}
                            </td>
                            <td className="jm-td text-jm-fg2">{cust.city}/{cust.state}</td>
                            <td className="jm-td whitespace-nowrap text-right space-x-1.5">
                              <button
                                onClick={() => handleStartEdit(cust)}
                                className="jm-btn jm-btn-secondary jm-btn-sm"
                              >
                                Alterar
                              </button>
                              <button
                                onClick={() => handleDelete(cust.id, cust.name)}
                                className="jm-btn jm-btn-danger jm-btn-sm"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* ABA 2: GRUPOS CORPORATIVOS */
            <div className="space-y-4">

              {/* MINI DASHBOARD GRUPOS */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="jm-card px-4 py-3.5">
                  <p className="jm-stat-label">Grupos Registrados</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-jm-fg">{groupsList.length}</p>
                </div>
                <div className="jm-card px-4 py-3.5">
                  <p className="jm-stat-label">Empresas Integrantes</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-jm-primary-text">
                    {customers.filter(c => c.groupId || (c.groupIds && c.groupIds.length > 0)).length}
                  </p>
                </div>
              </div>

              {/* BARRA DE PESQUISA GRUPOS */}
              <div className="flex">
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Pesquise por Nome do Grupo ou Empresas Vinculadas..."
                  className="jm-input max-w-md"
                />
              </div>

              {/* LISTAGEM DE GRUPOS E SUAS EMPRESAS */}
              {loadingList ? (
                <div className="jm-empty">Carregando grupos corporativos...</div>
              ) : filteredGroups.length === 0 ? (
                <div className="jm-card jm-empty">
                  Nenhum grupo corporativo cadastrado. Clique no botão "+ Cadastrar Grupo" acima para criar o primeiro.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="jm-card overflow-hidden"
                    >
                      <div className="flex flex-col justify-between gap-3 border-b border-jm-border px-4 py-3 sm:flex-row sm:items-center md:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-jm-fg">{grp.name}</h3>
                              <span className={`jm-badge ${grp.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                                {grp.isActive ? 'Grupo Ativo' : 'Grupo Inativo'}
                              </span>
                            </div>
                            <span className="block truncate font-mono text-[11px] text-jm-muted">ID: {grp.id}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleToggleGroupStatus(grp.id, grp.name)}
                            className={`jm-btn jm-btn-sm ${
                              grp.isActive
                                ? 'jm-btn-danger'
                                : 'jm-btn-primary'
                            }`}
                          >
                            {grp.isActive ? 'Inativar Grupo' : 'Ativar Grupo'}
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(grp.id, grp.name)}
                            className="jm-btn jm-btn-ghost jm-btn-sm text-jm-danger-fg hover:bg-jm-danger-bg hover:text-jm-danger-fg"
                            title="Excluir Grupo"
                          >
                            Excluir
                          </button>
                          <span className="jm-badge jm-badge-neutral">
                            {(grp.customers || []).length} {(grp.customers || []).length === 1 ? 'empresa' : 'empresas'}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Empresas sob o Grupo */}
                      {(!grp.customers || grp.customers.length === 0) ? (
                        <div className="py-5 text-center text-xs text-jm-muted">
                          Nenhuma empresa vinculada a este grupo ainda.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="jm-table min-w-[680px]">
                            <thead>
                              <tr>
                                <th className="jm-th">Razão Social / Filial</th>
                                <th className="jm-th">CPF / CNPJ</th>
                                <th className="jm-th">Consumo</th>
                                <th className="jm-th">Cidade/UF</th>
                                <th className="jm-th text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grp.customers.map((c: any) => (
                                <tr key={c.id} className="jm-tr">
                                  <td className="jm-td">
                                    <span className="flex items-center gap-2 font-medium text-jm-fg">
                                      {c.name}
                                      <span className={`w-2 h-2 rounded-full ${c.isActive ? 'bg-jm-success-fg' : 'bg-jm-danger-fg'}`} title={c.isActive ? 'Ativo' : 'Inativo'}></span>
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {c.code && <span className="text-xs font-mono text-jm-muted">{c.code}</span>}
                                      <span className={`jm-badge ${c.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                                        {c.isActive ? 'Ativo' : 'Inativo'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="jm-td text-jm-fg2">{c.document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}</td>
                                  <td className="jm-td">
                                    <span className={`jm-badge ${
                                      c.type === 'POS_PAGO'
                                        ? 'jm-badge-primary'
                                        : 'jm-badge-accent'
                                    }`}>
                                      {c.type === 'POS_PAGO' ? 'Pós-Pago' : 'Pré-Pago'}
                                    </span>
                                  </td>
                                  <td className="jm-td text-jm-fg2">{c.city}/{c.state}</td>
                                  <td className="jm-td whitespace-nowrap text-right space-x-1.5">
                                    <button
                                      onClick={() => handleStartEdit(c)}
                                      className="jm-btn jm-btn-secondary jm-btn-sm"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDelete(c.id, c.name)}
                                      className="jm-btn jm-btn-danger jm-btn-sm"
                                    >
                                      Remover
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )
        ) : (
          /* VISTA: FORMULÁRIO DE CADASTRO */
          <div className="space-y-4">

            {/* Titulo Dinamico de Edicao ou Criacao */}
            <div>
              <h2 className="text-base font-semibold text-jm-fg">
                {editingId ? `Alterar Cliente: ${name}` : 'Cadastrar Novo Cliente'}
              </h2>
            </div>

            {/* Abas Estilo Tab */}
            <div className="jm-tabs">
              <button
                type="button"
                onClick={() => setActiveTab('geral')}
                className={`jm-tab ${
                  activeTab === 'geral'
                    ? 'jm-tab-active'
                    : ''
                }`}
              >
                1. Dados Gerais & Endereço
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contatos')}
                className={`jm-tab ${
                  activeTab === 'contatos'
                    ? 'jm-tab-active'
                    : ''
                }`}
              >
                2. Contatos ({contacts.filter(c => c.name).length})
              </button>
              <button
                type="button"
                onClick={() => editingId ? setActiveTab('documentos') : null}
                disabled={!editingId}
                className={`jm-tab ${
                  !editingId ? 'cursor-not-allowed opacity-40 hover:text-jm-muted' : ''
                } ${
                  activeTab === 'documentos'
                    ? 'jm-tab-active'
                    : ''
                }`}
              >
                3. Documentação ({editingId ? selectedCustomerDocs.length : 0})
              </button>
              <button
                type="button"
                onClick={() => editingId ? setActiveTab('observacoes') : null}
                disabled={!editingId}
                className={`jm-tab ${
                  !editingId ? 'cursor-not-allowed opacity-40 hover:text-jm-muted' : ''
                } ${
                  activeTab === 'observacoes'
                    ? 'jm-tab-active'
                    : ''
                }`}
              >
                4. Observações ({editingId ? selectedCustomerNotes.length : 0})
              </button>
            </div>

            {/* Corpo do Formulário */}
            <form id="customer-form" onSubmit={handleSubmit} onChangeCapture={markDirty} className="jm-card space-y-6 p-4 sm:p-5 md:p-6">

              {/* TAB 1: DADOS GERAIS */}
              {activeTab === 'geral' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="jm-label !mb-0">Razão Social / Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: JM Master Group LTDA"
                      className="jm-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="jm-label !mb-0">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={document}
                      onChange={(e) => setDocument(formatDocument(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      className="jm-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="jm-label !mb-0">Código Interno (Opcional)</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ex: CLI-102"
                      className="jm-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="jm-label !mb-0">Tipo de Consumo *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'PRE_PAGO' | 'POS_PAGO')}
                      className="jm-input"
                    >
                      <option value="POS_PAGO">Pós-Pago (Fechamento)</option>
                      <option value="PRE_PAGO">Pré-Pago</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="jm-label !mb-0">Status da Empresa *</label>
                    <select
                      value={isActive ? 'true' : 'false'}
                      onChange={(e) => setIsActive(e.target.value === 'true')}
                      className="jm-input"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="jm-label !mb-0">Atrelar a Grupos Cadastrados (Opcional)</label>
                    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[4px] border border-jm-border-strong bg-jm-surface p-1.5">
                      {allGroups.length === 0 ? (
                        <span className="px-1.5 text-xs text-jm-muted">Nenhum grupo cadastrado no sistema. Vá até a aba Grupos para cadastrar.</span>
                      ) : (
                        allGroups.map(g => {
                          const isSelected = groupIds.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                markDirty();
                                if (isSelected) {
                                  setGroupIds(groupIds.filter(id => id !== g.id));
                                } else {
                                  setGroupIds([...groupIds, g.id]);
                                }
                              }}
                              className={`flex h-7 items-center gap-1 rounded-[3px] border px-2.5 text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'border-jm-primary-border bg-jm-primary-soft text-jm-primary-text'
                                  : 'border-jm-border bg-jm-subtle text-jm-fg2 hover:bg-jm-hover hover:text-jm-fg'
                              }`}
                            >
                              {isSelected && <span>✓</span>}
                              {g.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Seção Endereço */}
                  <div className="mt-2 border-t border-jm-border pt-5 md:col-span-2">
                    <h3 className="mb-4 text-sm font-semibold text-jm-fg">Endereço Operacional</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">CEP *</label>
                        <input
                          type="text"
                          required
                          value={zipCode}
                          onChange={(e) => handleZipCodeChange(e.target.value)}
                          placeholder="00000-000"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="jm-label !mb-0">Rua / Avenida *</label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Ex: Av. Rio Branco"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Número *</label>
                        <input
                          type="text"
                          required
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="123"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Estado (UF) *</label>
                        <select
                          required
                          value={state}
                          onChange={(e) => {
                            setState(e.target.value);
                            setCity('');
                          }}
                          className="jm-input"
                        >
                          <option value="">Selecione...</option>
                          {statesList.map((s) => (
                            <option key={s.sigla} value={s.sigla}>
                              {s.nome} ({s.sigla})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="jm-label !mb-0">Cidade *</label>
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={!state}
                          className="jm-input"
                        >
                          <option value="">Selecione...</option>
                          {currentCities.map((cName) => (
                            <option key={cName} value={cName}>
                              {cName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTATOS */}
              {activeTab === 'contatos' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-jm-fg">Contatos</h3>
                    <button
                      type="button"
                      onClick={handleAddContact}
                      className="jm-btn jm-btn-secondary jm-btn-sm"
                    >
                      + Adicionar Contato
                    </button>
                  </div>

                  {contacts.map((contact, index) => (
                    <div key={index} className="relative grid grid-cols-1 gap-3 rounded-[4px] border border-jm-border bg-jm-subtle p-4 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Nome do Contato</label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          placeholder="Ex: Camila Souza"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Cargo</label>
                        <input
                          type="text"
                          value={contact.role || ''}
                          onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                          placeholder="Ex: Gerente de TI"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Telefone</label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">E-mail</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                          placeholder="camila@jmmaster.com.br"
                          className="jm-input"
                        />
                      </div>

                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(index)}
                          className="absolute right-2 top-1.5 rounded-[3px] px-1.5 py-0.5 text-xs font-medium text-jm-danger-fg transition-colors hover:bg-jm-danger-bg"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: DOCUMENTAÇÃO */}
              {activeTab === 'documentos' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-jm-fg">Documentação do Cliente</h3>
                    <p className="mt-1 text-xs text-jm-muted">
                      Envie contratos, NFs e outras documentações digitalizadas do cliente.
                    </p>
                  </div>

                  {/* Form de Upload */}
                  <div className="space-y-4 rounded-[4px] border border-jm-border bg-jm-subtle p-4">
                    <h4 className="text-[13px] font-semibold text-jm-fg">Anexar Novo Arquivo</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Nome do Documento / Descrição</label>
                        <input
                          type="text"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="Ex: Contrato de Prestação de Serviços, NF 2450"
                          className="jm-input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="jm-label !mb-0">Selecionar Arquivo *</label>
                        <input
                          id="doc-file-picker"
                          type="file"
                          required
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full cursor-pointer text-sm text-jm-muted file:mr-3 file:h-9 file:cursor-pointer file:rounded-[4px] file:border file:border-solid file:border-jm-border-strong file:bg-jm-surface file:px-3 file:text-xs file:font-medium file:text-jm-fg2 hover:file:bg-jm-hover"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleUploadDocument}
                        disabled={uploadingDoc || !selectedFile}
                        className="jm-btn jm-btn-primary"
                      >
                        {uploadingDoc ? 'Enviando...' : 'Enviar Documento'}
                      </button>
                    </div>
                  </div>

                  {/* Lista de Documentos */}
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-semibold text-jm-fg">Arquivos Anexados</h4>
                    {loadingDetails ? (
                      <div className="py-6 text-center text-sm text-jm-muted">Carregando documentos...</div>
                    ) : selectedCustomerDocs.length === 0 ? (
                      <div className="rounded-[4px] border border-dashed border-jm-border-strong bg-jm-subtle py-6 text-center text-xs text-jm-muted">Nenhum documento anexado ainda.</div>
                    ) : (
                      <div className="jm-table-wrap">
                        <table className="jm-table min-w-[720px]">
                          <thead>
                            <tr>
                              <th className="jm-th">Documento</th>
                              <th className="jm-th">Arquivo Original</th>
                              <th className="jm-th">Tamanho</th>
                              <th className="jm-th">Enviado por</th>
                              <th className="jm-th">Data</th>
                              <th className="jm-th text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCustomerDocs.map((doc) => (
                              <tr key={doc.id} className="jm-tr">
                                <td className="jm-td font-medium text-jm-fg">{doc.name}</td>
                                <td className="jm-td font-mono text-xs text-jm-muted">{doc.originalName}</td>
                                <td className="jm-td tabular-nums">{(doc.size / 1024).toFixed(1)} KB</td>
                                <td className="jm-td">{doc.userEmail}</td>
                                <td className="jm-td tabular-nums">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="jm-td whitespace-nowrap text-right space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(doc.id, doc.originalName)}
                                    className="jm-btn jm-btn-secondary jm-btn-sm"
                                  >
                                    Baixar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="jm-btn jm-btn-danger jm-btn-sm"
                                  >
                                    Excluir
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: OBSERVAÇÕES */}
              {activeTab === 'observacoes' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-jm-fg">Histórico de Observações e Notas</h3>
                    <p className="mt-1 text-xs text-jm-muted">
                      Adicione notas internas e observações importantes sobre o relacionamento com o cliente.
                    </p>
                  </div>

                  {/* Form de Observação */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="jm-label !mb-0">Nova Anotação *</label>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Digite aqui observações detalhadas..."
                        rows={3}
                        className="jm-input"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={savingNote || !noteContent.trim()}
                        className="jm-btn jm-btn-primary"
                      >
                        {savingNote ? 'Adicionando...' : 'Registrar Observação'}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-semibold text-jm-fg">Timeline de Anotações</h4>
                    {loadingDetails ? (
                      <div className="py-6 text-center text-sm text-jm-muted">Carregando observações...</div>
                    ) : selectedCustomerNotes.length === 0 ? (
                      <div className="rounded-[4px] border border-dashed border-jm-border-strong bg-jm-subtle py-6 text-center text-xs text-jm-muted">Nenhuma anotação registrada ainda.</div>
                    ) : (
                      <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-jm-border">
                        {selectedCustomerNotes.map((note) => (
                          <div key={note.id} className="relative flex flex-col space-y-1 pl-6">
                            <div className="absolute left-[4px] top-3.5 h-[7px] w-[7px] rounded-full bg-jm-accent-line" />
                            <div className="group relative rounded-[4px] border border-jm-border bg-jm-subtle px-3.5 py-3">
                              <div className="flex justify-between items-start gap-4">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-jm-fg">{note.content}</p>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  title="Excluir observação"
                                  className="jm-icon-btn h-7 w-7 hover:bg-jm-danger-bg hover:text-jm-danger-fg sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1 border-t border-jm-border pt-2 text-[11px] text-jm-muted">
                                <span>Operador: {note.userEmail}</span>
                                <span>•</span>
                                <span>Registrado em: {new Date(note.createdAt).toLocaleString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de Salvar — independente em cada aba */}
              <div className="flex justify-end border-t border-jm-border pt-4">
                {/* Nas abas de Documentação e Observações (editando) não há form submit — abas autônomas */}
                {(activeTab === 'documentos' || activeTab === 'observacoes') && editingId ? (
                  /* Nessas abas o conteúdo é salvo inline (upload/nota), sem necessidade de submit global */
                  null
                ) : (
                  <button
                    type="submit"
                    disabled={loadingSave}
                    className="jm-btn jm-btn-accent w-full sm:w-auto"
                  >
                    {loadingSave
                      ? 'Salvando...'
                      : editingId
                        ? 'Salvar Alterações'
                        : activeTab === 'geral'
                          ? 'Salvar e Continuar'
                          : 'Salvar e Registrar Cliente'}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
    </div>
  );
}
