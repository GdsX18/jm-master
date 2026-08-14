'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToastState, useConfirm, ToastContainer, ConfirmModal } from '../components/ui/Notifications';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../components/ui/UnsavedChangesModal';

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
      const res = await fetch('http://localhost:3000/products/groups', {
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
      const res = await fetch(`http://localhost:3000/customers/${id}`, {
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

      const res = await fetch(`http://localhost:3000/customers/${editingId}/documents`, {
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
    try {
      const token = localStorage.getItem('@JMMaster:token');
      if (!token) {
        addToast('error', 'Erro no download', 'Usuário não autenticado.');
        return;
      }
      
      // Construir a URL direta para o backend passando o token via query parameter
      const downloadUrl = `http://localhost:3000/customers/documents/${docId}/download?token=${token}`;
      
      // Criar um elemento <a> temporário para disparar o download nativo do navegador
      const anchor = window.document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = downloadUrl;
      // O atributo download ajuda o navegador a entender que é um download
      // Mas o nome real será fornecido pelo header Content-Disposition do backend (que já configuramos)
      anchor.setAttribute('download', filename);
      window.document.body.appendChild(anchor);
      anchor.click();
      
      setTimeout(() => {
        window.document.body.removeChild(anchor);
      }, 1000);
      
      addToast('success', 'Download iniciado', `Baixando: ${filename}`);
    } catch (err) {
      console.error('Erro no download:', err);
      addToast('error', 'Erro de conexão', 'Não foi possível iniciar o download do documento.');
    }
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
      const res = await fetch(`http://localhost:3000/customers/${editingId}/documents/${docId}`, {
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
      const res = await fetch(`http://localhost:3000/customers/${editingId}/notes`, {
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
      const res = await fetch(`http://localhost:3000/customers/${editingId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchCustomerDetails(editingId);
        addToast('success', 'Observação excluída', 'A observação foi removida com sucesso.');
      } else {
        addToast('error', 'Erro ao excluir', 'Não foi possível excluir a observação.');
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
    setLoadingList(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      
      // Fetch customers
      const custRes = await fetch('http://localhost:3000/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }

      // Fetch groups
      const grpRes = await fetch('http://localhost:3000/products/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setAllGroups(grpData);
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
      message: `Deseja realmente excluir o cliente "${customerName}"? Esta ação removerá permanentemente todos os contatos e preços associados e não poderá ser desfeita.`,
      confirmLabel: 'Sim, excluir cliente',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const response = await fetch(`http://localhost:3000/customers/${id}`, {
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
      const response = await fetch(`http://localhost:3000/customers/groups/${id}/toggle`, {
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
        groupIds: groupIds.length > 0 ? groupIds : undefined,
        isActive,
        contacts: contacts.filter(c => c.name.trim() && c.phone.trim() && c.email.trim())
      };

      const url = editingId 
        ? `http://localhost:3000/customers/${editingId}`
        : 'http://localhost:3000/customers';

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
  // Agora usamos a lista completa que vem do backend (allGroups) que inclui grupos vazios
  const groupsList = allGroups;

  // Search Filter Implementation for Grupos
  const filteredGroups = groupsList.filter(g => 
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    (g.customers && g.customers.some((c: any) => c.name.toLowerCase().includes(groupSearch.toLowerCase())))
  );

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setShowCreateGroupModal(false)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Cadastrar Novo Grupo</h3>
            <p className="text-sm text-neutral-500 mb-6">Insira o nome do grupo corporativo que deseja criar.</p>
            <input
              type="text"
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup();
              }}
              placeholder="Ex: Grupo JMMaster"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup || !newGroupName.trim()}
                className="px-4 py-2 bg-master-orange hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
              >
                {creatingGroup ? 'Salvando...' : 'Salvar Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white p-6 sm:p-10 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">

        
        {/* Cabecalho Principal */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Clientes JM Master</h1>
            <p className="text-neutral-500 dark:text-master-textMuted mt-1">Gestão de carteira operacional, contatos e precificação customizada.</p>
          </div>
          {view === 'list' ? (
            mainTab === 'clientes' ? (
              <button
                onClick={handleOpenCreate}
                className="px-5 py-3 bg-master-orange hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-orange-950/20 flex items-center gap-2 self-start sm:self-center"
              >
                <span>+ Novo Cliente</span>
              </button>
            ) : (
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="px-5 py-3 bg-master-orange hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-orange-950/20 flex items-center gap-2 self-start sm:self-center"
              >
                <span>+ Cadastrar Grupo</span>
              </button>
            )
          ) : (
            <button
              onClick={() => requestLeave(() => { markClean(); setView('list'); setEditingId(null); })}
              className="px-5 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white font-bold text-sm rounded-xl transition flex items-center gap-2 self-start sm:self-center"
            >
              <span>Voltar para Lista</span>
            </button>
          )}
        </div>

        {/* Navegação entre Clientes e Grupos (Apenas na visualização de lista) */}
        {view === 'list' && (
          <div className="flex space-x-2 bg-neutral-200/60 dark:bg-neutral-900/60 p-1.5 rounded-xl w-fit border border-neutral-300/40 dark:border-neutral-800/40">
            <button
              onClick={() => { setMainTab('clientes'); setMessage(null); }}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                mainTab === 'clientes'
                  ? 'bg-white dark:bg-neutral-800 text-master-blue dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
              }`}
            >
              <span>👥</span> Clientes ({totalCustomers})
            </button>
            <button
              onClick={() => { setMainTab('grupos'); setMessage(null); }}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                mainTab === 'grupos'
                  ? 'bg-white dark:bg-neutral-800 text-master-blue dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
              }`}
            >
              <span>🏢</span> Grupos ({groupsList.length})
            </button>
          </div>
        )}

        {/* Notificacoes */}
        {message && (
          <div className={`p-4 rounded-lg text-sm font-semibold border ${
            message.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-350 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' 
              : 'bg-rose-100 text-rose-800 border-rose-350 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
          }`}>
            {message.text}
          </div>
        )}

        {view === 'list' ? (
          /* VISTA: LISTAS (ABAS DE CLIENTES OU GRUPOS) */
          mainTab === 'clientes' ? (
            /* ABA 1: CLIENTES */
            <div className="space-y-8">
              
              {/* MINI DASHBOARD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-md transition duration-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-master-textMuted">Clientes Cadastrados</p>
                  <h3 className="text-3xl font-extrabold mt-2 text-master-blue dark:text-white">{totalCustomers}</h3>
                </div>
                <div className="p-6 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-md transition duration-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-master-textMuted">Pré-Pago</p>
                  <h3 className="text-3xl font-extrabold mt-2 text-orange-600">{totalPrePaid}</h3>
                </div>
                <div className="p-6 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-md transition duration-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-master-textMuted">Pós-Pago</p>
                  <h3 className="text-3xl font-extrabold mt-2 text-emerald-600">{totalPostPaid}</h3>
                </div>
              </div>

              {/* BARRA DE PESQUISA */}
              <div className="flex gap-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquise por Nome do Cliente ou Documento..."
                  className="w-full max-w-md px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                />
              </div>

              {/* TABELA DE CLIENTES */}
              <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xl transition duration-300">
                {loadingList ? (
                  <div className="p-10 text-center font-bold text-neutral-500">Carregando carteira de clientes...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-10 text-center text-neutral-500 font-medium">Nenhum cliente cadastrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-master-textMuted">
                          <th className="py-4 px-6">Cliente</th>
                          <th className="py-4 px-6">CPF / CNPJ</th>
                          <th className="py-4 px-6">Tipo</th>
                          <th className="py-4 px-6">Grupo Corporativo</th>
                          <th className="py-4 px-6">Cidade/UF</th>
                          <th className="py-4 px-6 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm font-semibold">
                        {filteredCustomers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/35 transition">
                            <td className="py-4 px-6">
                              <span className="block text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                {cust.name}
                                <span className={`w-2.5 h-2.5 rounded-full ${cust.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} title={cust.isActive ? 'Ativo' : 'Inativo'}></span>
                              </span>
                              <div className="flex gap-2 items-center mt-1">
                                {cust.code && <span className="text-xs text-neutral-400 font-medium font-mono">{cust.code}</span>}
                                <span className={`text-xxs font-extrabold px-1.5 py-0.5 rounded ${cust.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'}`}>
                                  {cust.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300">{cust.document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-block px-3 py-1 text-xs font-extrabold uppercase rounded-full ${
                                cust.type === 'POS_PAGO' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900' 
                                  : 'bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-250 dark:border-orange-900'
                              }`}>
                                {cust.type === 'POS_PAGO' ? 'Pós-Pago' : 'Pré-Pago'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {cust.groups && cust.groups.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {cust.groups.map(g => (
                                    <span key={g.id} className="text-xs bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold text-neutral-800 dark:text-neutral-200">{g.name}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-neutral-400 dark:text-neutral-500 italic font-medium">Nenhum</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{cust.city}/{cust.state}</td>
                            <td className="py-4 px-6 text-center space-x-2">
                              <button
                                onClick={() => handleStartEdit(cust)}
                                className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-lg dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-950/60 border border-sky-250 dark:border-sky-900 transition"
                              >
                                Alterar
                              </button>
                              <button
                                onClick={() => handleDelete(cust.id, cust.name)}
                                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-250 dark:border-rose-900 transition"
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
            <div className="space-y-8">
              
              {/* MINI DASHBOARD GRUPOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-md transition duration-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-master-textMuted">Grupos Registrados</p>
                  <h3 className="text-3xl font-extrabold mt-2 text-master-blue dark:text-white">{groupsList.length}</h3>
                </div>
                <div className="p-6 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-md transition duration-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-master-textMuted">Empresas Integrantes</p>
                  <h3 className="text-3xl font-extrabold mt-2 text-master-orange">{customers.filter(c => c.groups && c.groups.length > 0).length}</h3>
                </div>
              </div>

              {/* BARRA DE PESQUISA GRUPOS */}
              <div className="flex gap-4">
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Pesquise por Nome do Grupo ou Empresas Vinculadas..."
                  className="w-full max-w-md px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                />
              </div>

              {/* LISTAGEM DE GRUPOS E SUAS EMPRESAS */}
              {loadingList ? (
                <div className="p-10 text-center font-bold text-neutral-500">Carregando grupos corporativos...</div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-10 text-center text-neutral-500 font-medium">Nenhum grupo corporativo encontrado.</div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredGroups.map((grp) => (
                    <div 
                      key={grp.id} 
                      className="p-6 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-lg space-y-4 transition duration-300"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-neutral-200 dark:border-neutral-850 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏢</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-master-blue dark:text-white uppercase tracking-wide">{grp.name}</h3>
                              <span className={`text-xxs font-extrabold px-2 py-0.5 rounded-full ${grp.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'}`}>
                                {grp.isActive ? 'Grupo Ativo' : 'Grupo Inativo'}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-400 font-mono">ID: {grp.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleGroupStatus(grp.id, grp.name)}
                            className={`px-3 py-1.5 text-xxs font-bold rounded-lg border transition ${
                              grp.isActive 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            }`}
                          >
                            {grp.isActive ? 'Inativar Grupo' : 'Ativar Grupo'}
                          </button>
                          <span className="px-3 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-850 dark:text-neutral-300 text-xs font-bold rounded-full">
                            {grp.customers.length} {grp.customers.length === 1 ? 'empresa' : 'empresas'}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Empresas sob o Grupo */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-semibold">
                          <thead>
                            <tr className="text-neutral-450 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
                              <th className="py-2 px-2">Razão Social / Filial</th>
                              <th className="py-2 px-2">CPF / CNPJ</th>
                              <th className="py-2 px-2">Consumo</th>
                              <th className="py-2 px-2">Cidade/UF</th>
                              <th className="py-2 px-2 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                            {grp.customers.map((c: any) => (
                              <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-850/40 transition">
                                <td className="py-3 px-2 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                  <span className="flex items-center gap-2">
                                    {c.name}
                                    <span className={`w-2 h-2 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} title={c.isActive ? 'Ativo' : 'Inativo'}></span>
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {c.code && <span className="text-xxs font-normal font-mono text-neutral-400">{c.code}</span>}
                                    <span className={`text-xxs font-extrabold px-1 rounded ${c.isActive ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/30 dark:text-rose-455'}`}>
                                      {c.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-neutral-600 dark:text-neutral-400">{c.document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}</td>
                                <td className="py-3 px-2">
                                  <span className={`inline-block px-2 py-0.5 text-xxs font-extrabold uppercase rounded ${
                                    c.type === 'POS_PAGO'
                                      ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50'
                                      : 'bg-orange-100/70 text-orange-850 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/50'
                                  }`}>
                                    {c.type === 'POS_PAGO' ? 'Pós-Pago' : 'Pré-Pago'}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-neutral-600 dark:text-neutral-400">{c.city}/{c.state}</td>
                                <td className="py-3 px-2 text-center space-x-1">
                                  <button
                                    onClick={() => handleStartEdit(c)}
                                    className="px-2 py-1 bg-sky-55 text-sky-800 text-xxs font-bold rounded hover:bg-sky-100 dark:bg-sky-950/20 dark:text-sky-400 transition"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(c.id, c.name)}
                                    className="px-2 py-1 bg-rose-55 text-rose-800 text-xxs font-bold rounded hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 transition"
                                  >
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )
        ) : (
          /* VISTA: FORMULÁRIO DE CADASTRO */
          <div className="space-y-6">
            
            {/* Titulo Dinamico de Edicao ou Criacao */}
            <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold text-master-blue dark:text-white">
                {editingId ? `Alterar Cliente: ${name}` : 'Cadastrar Novo Cliente'}
              </h2>
            </div>

            {/* Abas Estilo Tab */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-4">
              <button
                type="button"
                onClick={() => setActiveTab('geral')}
                className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'geral' 
                    ? 'border-master-orange text-master-orange' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
                }`}
              >
                1. Dados Gerais & Endereço
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contatos')}
                className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                  activeTab === 'contatos' 
                    ? 'border-master-orange text-master-orange' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
                }`}
              >
                2. Contatos ({contacts.filter(c => c.name).length})
              </button>
              <button
                type="button"
                onClick={() => editingId ? setActiveTab('documentos') : null}
                disabled={!editingId}
                className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                  !editingId ? 'opacity-30 cursor-not-allowed' : ''
                } ${
                  activeTab === 'documentos' 
                    ? 'border-master-orange text-master-orange' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
                }`}
              >
                3. Documentação ({editingId ? selectedCustomerDocs.length : 0})
              </button>
              <button
                type="button"
                onClick={() => editingId ? setActiveTab('observacoes') : null}
                disabled={!editingId}
                className={`py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                  !editingId ? 'opacity-30 cursor-not-allowed' : ''
                } ${
                  activeTab === 'observacoes' 
                    ? 'border-master-orange text-master-orange' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
                }`}
              >
                4. Observações ({editingId ? selectedCustomerNotes.length : 0})
              </button>
            </div>

            {/* Corpo do Formulário */}
            <form id="customer-form" onSubmit={handleSubmit} onChangeCapture={markDirty} className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl transition-colors duration-300">
              
              {/* TAB 1: DADOS GERAIS */}
              {activeTab === 'geral' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Razão Social / Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: JM Master Group LTDA"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={document}
                      onChange={(e) => setDocument(formatDocument(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Código Interno (Opcional)</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ex: CLI-102"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Tipo de Consumo *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'PRE_PAGO' | 'POS_PAGO')}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                    >
                      <option value="POS_PAGO">Pós-Pago (Fechamento)</option>
                      <option value="PRE_PAGO">Pré-Pago</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Status da Empresa *</label>
                    <select
                      value={isActive ? 'true' : 'false'}
                      onChange={(e) => setIsActive(e.target.value === 'true')}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Atrelar a Grupos Cadastrados (Opcional)</label>
                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg min-h-[48px] items-center">
                      {allGroups.length === 0 ? (
                        <span className="text-xs text-neutral-500 italic">Nenhum grupo cadastrado no sistema. Vá até a aba Grupos para cadastrar.</span>
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
                              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-master-orange text-white border-master-orange shadow-md'
                                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:bg-neutral-800'
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
                  <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-800 pt-6 mt-2">
                    <h3 className="text-lg font-bold mb-4">Endereço Operacional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">CEP *</label>
                        <input
                          type="text"
                          required
                          value={zipCode}
                          onChange={(e) => handleZipCodeChange(e.target.value)}
                          placeholder="00000-000"
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Rua / Avenida *</label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Ex: Av. Rio Branco"
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Número *</label>
                        <input
                          type="text"
                          required
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="123"
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Estado (UF) *</label>
                        <select
                          required
                          value={state}
                          onChange={(e) => {
                            setState(e.target.value);
                            setCity('');
                          }}
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                        >
                          <option value="">Selecione...</option>
                          {statesList.map((s) => (
                            <option key={s.sigla} value={s.sigla}>
                              {s.nome} ({s.sigla})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Cidade *</label>
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={!state}
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition disabled:opacity-50"
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
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Contatos</h3>
                    <button
                      type="button"
                      onClick={handleAddContact}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-master-orange font-bold text-xs uppercase rounded-lg border border-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 transition"
                    >
                      + Adicionar Contato
                    </button>
                  </div>

                  {contacts.map((contact, index) => (
                    <div key={index} className="p-5 bg-neutral-50 border border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-500 dark:text-master-textMuted">Nome do Contato</label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          placeholder="Ex: Camila Souza"
                          className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-500 dark:text-master-textMuted">Cargo</label>
                        <input
                          type="text"
                          value={contact.role || ''}
                          onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                          placeholder="Ex: Gerente de TI"
                          className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-500 dark:text-master-textMuted">Telefone</label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-500 dark:text-master-textMuted">E-mail</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                          placeholder="camila@jmmaster.com.br"
                          className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                        />
                      </div>

                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(index)}
                          className="absolute top-2 right-2 text-rose-600 hover:text-rose-500 dark:text-rose-500 dark:hover:text-rose-400 text-xs font-bold transition"
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">Documentação do Cliente</h3>
                    <p className="text-xs text-neutral-500 dark:text-master-textMuted mt-1">
                      Envie contratos, NFs e outras documentações digitalizadas do cliente.
                    </p>
                  </div>

                  {/* Form de Upload */}
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                    <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Anexar Novo Arquivo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Nome do Documento / Descrição</label>
                        <input
                          type="text"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="Ex: Contrato de Prestação de Serviços, NF 2450"
                          className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Selecionar Arquivo *</label>
                        <input
                          id="doc-file-picker"
                          type="file"
                          required
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-neutral-550 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-neutral-200 dark:file:bg-neutral-800 file:text-neutral-700 dark:file:text-white hover:file:bg-neutral-300 transition cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleUploadDocument}
                        disabled={uploadingDoc || !selectedFile}
                        className="px-5 py-2.5 bg-master-orange hover:bg-orange-600 disabled:bg-orange-850 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition"
                      >
                        {uploadingDoc ? 'Enviando...' : 'Enviar Documento'}
                      </button>
                    </div>
                  </div>

                  {/* Lista de Documentos */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Arquivos Anexados</h4>
                    {loadingDetails ? (
                      <div className="text-center py-6 text-neutral-500 font-bold animate-pulse text-sm">Carregando documentos...</div>
                    ) : selectedCustomerDocs.length === 0 ? (
                      <div className="text-center py-6 bg-neutral-50 dark:bg-neutral-950/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs italic">Nenhum documento anexado ainda.</div>
                    ) : (
                      <div className="overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 font-extrabold uppercase text-neutral-500">
                              <th className="py-3 px-4">Documento</th>
                              <th className="py-3 px-4">Arquivo Original</th>
                              <th className="py-3 px-4">Tamanho</th>
                              <th className="py-3 px-4">Enviado por</th>
                              <th className="py-3 px-4">Data</th>
                              <th className="py-3 px-4 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300">
                            {selectedCustomerDocs.map((doc) => (
                              <tr key={doc.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                                <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{doc.name}</td>
                                <td className="py-3 px-4 font-mono text-neutral-400">{doc.originalName}</td>
                                <td className="py-3 px-4">{(doc.size / 1024).toFixed(1)} KB</td>
                                <td className="py-3 px-4">{doc.userEmail}</td>
                                <td className="py-3 px-4">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="py-3 px-4 text-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(doc.id, doc.originalName)}
                                    className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 rounded transition font-bold"
                                  >
                                    Baixar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded transition font-bold"
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">Histórico de Observações e Notas</h3>
                    <p className="text-xs text-neutral-500 dark:text-master-textMuted mt-1">
                      Adicione notas internas e observações importantes sobre o relacionamento com o cliente.
                    </p>
                  </div>

                  {/* Form de Observação */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Nova Anotação *</label>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Digite aqui observações detalhadas..."
                        rows={3}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={savingNote || !noteContent.trim()}
                        className="px-5 py-2.5 bg-master-orange hover:bg-orange-600 disabled:bg-orange-850 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition"
                      >
                        {savingNote ? 'Adicionando...' : 'Registrar Observação'}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Timeline de Anotações</h4>
                    {loadingDetails ? (
                      <div className="text-center py-6 text-neutral-500 font-bold animate-pulse text-sm">Carregando observações...</div>
                    ) : selectedCustomerNotes.length === 0 ? (
                      <div className="text-center py-6 bg-neutral-50 dark:bg-neutral-950/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs italic">Nenhuma anotação registrada ainda.</div>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-[2px] before:bg-neutral-200 dark:before:bg-neutral-800">
                        {selectedCustomerNotes.map((note) => (
                          <div key={note.id} className="relative pl-9 flex flex-col space-y-1">
                            <div className="absolute left-[9px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-master-orange bg-white dark:bg-neutral-900" />
                            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 relative group transition">
                              <div className="flex justify-between items-start gap-4">
                                <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium whitespace-pre-wrap leading-relaxed">{note.content}</p>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-400 mt-3 font-medium border-t border-neutral-200 dark:border-neutral-800 pt-2 transition-colors uppercase tracking-wide">
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
              <div className="flex justify-end border-t border-neutral-200 dark:border-neutral-800 pt-6 transition-colors duration-300">
                {/* Nas abas de Documentação e Observações (editando) não há form submit — abas autônomas */}
                {(activeTab === 'documentos' || activeTab === 'observacoes') && editingId ? (
                  /* Nessas abas o conteúdo é salvo inline (upload/nota), sem necessidade de submit global */
                  null
                ) : (
                  <button
                    type="submit"
                    disabled={loadingSave}
                    className="px-8 py-3 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60 transition"
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
