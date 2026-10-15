'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  isRequired: boolean;
}

interface Group {
  id: string;
  name: string;
  isActive: boolean;
}

interface GroupProductPrice {
  groupId: string;
  productId: string;
  price: number;
}

export default function ProductsPage() {
  // Estado de listagem
  const [mainTab, setMainTab] = useState<'precos' | 'catalogo'>('precos');
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Estado de controle de carregamento
  const [loadingList, setLoadingList] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de preços locais do grupo selecionado
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});
  
  // Filtros locais
  const [groupSearch, setGroupSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Criação e Exclusão de Produtos
  const [newProductName, setNewProductName] = useState('');
  const [newProductIsRequired, setNewProductIsRequired] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Edição de Produto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductIsRequired, setEditProductIsRequired] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // 1. Carregar grupos e catálogo de produtos do backend
  const loadCatalogAndGroups = async () => {
    setLoadingList(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      
      // Carregar produtos
      const prodRes = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let prodData: Product[] = [];
      if (prodRes.ok) {
        prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Carregar grupos
      const groupRes = await fetch('/api/products/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroups(groupData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do catálogo:', err);
      setMessage({ type: 'error', text: 'Não foi possível se conectar com o servidor.' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCatalogAndGroups();
  }, []);

  // 2. Carregar preços específicos quando um grupo for selecionado
  const handleSelectGroup = async (group: Group) => {
    setSelectedGroup(group);
    setLoadingPrices(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/products/group-prices/${group.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao carregar os preços definidos para o grupo.');
      }

      const pricesData: GroupProductPrice[] = await res.json();
      const initialPrices: Record<string, number> = {};
      // Inicializar com 0 todos os produtos
      products.forEach(p => {
        initialPrices[p.id] = 0;
      });
      // Sobrescrever com os preços já configurados no banco
      pricesData.forEach(gp => {
        initialPrices[gp.productId] = gp.price;
      });
      setProductPrices(initialPrices);
    } catch (err: any) {
      console.error('Erro ao carregar preços do grupo:', err);
      // Sem os preços carregados não deixamos salvar, para não apagar a tabela existente
      setSelectedGroup(null);
      setProductPrices({});
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar os preços definidos para o grupo.' });
    } finally {
      setLoadingPrices(false);
    }
  };

  // Formatador monetário
  const formatBRL = (value: number | undefined) => {
    const val = value ?? 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Alteração de preços
  const handlePriceChangeRaw = (productId: string, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setProductPrices(prev => ({ ...prev, [productId]: 0 }));
      return;
    }
    const numericValue = parseFloat(digits) / 100;
    setProductPrices(prev => ({ ...prev, [productId]: numericValue }));
  };

  // 3. Salvar valores dos produtos para o grupo selecionado
  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setLoadingSave(true);
    setMessage(null);

    // Validação de itens obrigatórios (valores informados, aceitando 0)
    const missingRequired = products
      .filter(p => p.isRequired)
      .some(p => productPrices[p.id] === undefined);

    if (missingRequired) {
      setMessage({ type: 'error', text: 'Por favor, insira valores (mesmo que R$ 0,00) para todos os produtos obrigatórios (*).' });
      setLoadingSave(false);
      return;
    }

    try {
      const token = localStorage.getItem('@JMMaster:token');
      
      const payload = {
        products: Object.entries(productPrices).map(([productId, price]) => ({
          productId,
          price
        }))
      };

      const response = await fetch(`/api/products/group-prices/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar a tabela de preços do grupo.');
      }

      setMessage({ type: 'success', text: `Tabela de preços do grupo "${selectedGroup.name}" atualizada com sucesso!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoadingSave(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    setCreatingProduct(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProductName.trim(),
          isRequired: newProductIsRequired
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao criar o produto.');
      }

      setMessage({ type: 'success', text: `Produto "${newProductName}" cadastrado com sucesso!` });
      setNewProductName('');
      setNewProductIsRequired(false);
      await loadCatalogAndGroups(); // recarrega a lista
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`ATENÇÃO: Deseja realmente excluir o produto "${product.name}"? Esta ação não poderá ser desfeita.`)) return;
    
    setDeletingProductId(product.id);
    setMessage(null);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao excluir o produto.');
      }

      setMessage({ type: 'success', text: `Produto "${product.name}" excluído com sucesso!` });
      await loadCatalogAndGroups(); // recarrega a lista
    } catch (err: any) {
      // Aqui exibiremos os alertas de grupos vinculados, retornados pelo backend
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductIsRequired(product.isRequired);
    setMessage(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProductName.trim()) return;
    setSavingEdit(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('@JMMaster:token');
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editProductName.trim(),
          isRequired: editProductIsRequired
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao atualizar o produto.');
      }

      setMessage({ type: 'success', text: `Produto "${editProductName}" atualizado com sucesso!` });
      setEditingProduct(null);
      await loadCatalogAndGroups(); // recarrega a lista
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  // Filtrar lista de grupos pela busca
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-jm-bg text-jm-fg min-h-screen transition-colors duration-300">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-jm-border">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-jm-fg">Cadastro e Tabela de Produtos</h1>
          <p className="text-sm text-jm-muted mt-1">
            Defina e gerencie os valores comerciais ou adicione novos produtos ao catálogo.
          </p>
        </div>
      </div>

      {/* Controle de Abas */}
      <div className="jm-tabs">
        <button
          onClick={() => { setMainTab('precos'); setMessage(null); }}
          className={`jm-tab ${mainTab === 'precos' ? 'jm-tab-active' : ''}`}
        >
          Tabela de Preços
        </button>
        <button
          onClick={() => { setMainTab('catalogo'); setMessage(null); }}
          className={`jm-tab ${mainTab === 'catalogo' ? 'jm-tab-active' : ''}`}
        >
          Catálogo de Produtos
        </button>
      </div>

      {mainTab === 'precos' ? (
        /* ABA 1: TABELA DE PREÇOS (Atual) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: LISTA DE GRUPOS CORPORATIVOS */}
        <div className="jm-card p-5 md:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-jm-fg">Grupos Corporativos</h3>
            <p className="text-xs text-jm-muted mt-1">Selecione um grupo para configurar os preços dos produtos.</p>
          </div>

          {/* Campo de pesquisa de grupos */}
          <div className="relative">
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Pesquisar grupo corporativo..."
              className="jm-input text-xs"
            />
          </div>

          {/* Lista de Grupos */}
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {loadingList ? (
              <div className="text-center py-8 text-jm-muted text-sm font-medium animate-pulse">Carregando grupos corporativos...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-jm-muted text-xs italic">Nenhum grupo corporativo cadastrado.</div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-jm-primary-soft border-jm-primary-border text-jm-primary-text'
                        : 'bg-jm-surface hover:bg-jm-subtle border-jm-border text-jm-fg'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold text-sm">{group.name}</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-medium rounded ${
                        isSelected 
                          ? 'bg-jm-primary text-jm-primary-fg' 
                          : group.isActive 
                            ? 'jm-badge-success'
                            : 'jm-badge-danger'
                      }`}>
                        {group.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <span className="text-sm text-jm-muted">{isSelected ? '→' : '🏢'}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE PREÇOS */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <form onSubmit={handleSavePrices} className="jm-card p-5 md:p-6 space-y-6 shadow-xs">
              
              {/* Cabeçalho do Formulário */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-jm-border pb-4 gap-4">
                <div>
                  <h2 className="text-base font-semibold text-jm-fg flex items-center gap-2">
                    Tabela Comercial: <span className="text-jm-primary-text font-bold">{selectedGroup.name}</span>
                  </h2>
                  <p className="text-xs text-jm-muted mt-1">
                    Os itens com <span className="text-jm-accent-text font-bold">*</span> são de preenchimento obrigatório pelo administrador.
                  </p>
                </div>
                <div className="jm-badge jm-badge-neutral font-mono text-xs">
                  Grupo ID: {selectedGroup.id.substring(0, 8)}...
                </div>
              </div>

              {/* Feedback do Salvamento */}
              {message && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${
                  message.type === 'success'
                    ? 'border-jm-success-border bg-jm-success-bg text-jm-success-fg'
                    : 'border-jm-danger-border bg-jm-danger-bg text-jm-danger-fg'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Listagem de Produtos com inputs de valores */}
              {loadingPrices ? (
                <div className="p-16 text-center font-medium text-sm text-jm-muted animate-pulse">Buscando tabela de valores...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {products.map((product) => {
                    const priceValue = productPrices[product.id] ?? 0;
                    return (
                      <div
                        key={product.id}
                        className="p-3.5 rounded-lg border border-jm-border bg-jm-surface hover:border-jm-border-strong flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-0.5 pr-2">
                          <span className="text-sm font-semibold text-jm-fg flex items-center">
                            {product.name}
                            {product.isRequired && <span className="text-jm-accent-text ml-1 font-bold">*</span>}
                          </span>
                          <span className="text-[10px] text-jm-muted block uppercase tracking-wide">
                            {product.isRequired ? 'Obrigatório' : 'Opcional'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <input
                            type="text"
                            value={formatBRL(priceValue)}
                            onChange={(e) => handlePriceChangeRaw(product.id, e.target.value)}
                            className="w-32 jm-input text-right font-mono text-xs !h-9"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end border-t border-jm-border pt-4">
                <button
                  type="submit"
                  disabled={loadingPrices || loadingSave}
                  className="jm-btn jm-btn-primary"
                >
                  {loadingSave ? 'Salvando Valores...' : 'Salvar Tabela de Preços'}
                </button>
              </div>

            </form>
          ) : (
            <div className="jm-card p-12 flex flex-col items-center justify-center text-center h-full min-h-[360px]">
              <span className="text-4xl mb-3">🏢</span>
              <h3 className="text-base font-semibold text-jm-fg">Nenhum Grupo Selecionado</h3>
              <p className="text-xs text-jm-muted mt-1 max-w-sm">
                Selecione um grupo corporativo na lista à esquerda para carregar e configurar os preços dos produtos contratados.
              </p>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* ABA 2: CATÁLOGO DE PRODUTOS (NOVO) */
        <div className="space-y-8">
          {/* Feedback de mensagens globais para catálogo */}
          {message && (
            <div className={`p-4 rounded-xl text-sm font-semibold border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                : 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA: CADASTRAR NOVO PRODUTO */}
            <div className="lg:col-span-1">
              <form onSubmit={handleCreateProduct} className="jm-card p-5 md:p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-jm-fg">Cadastrar Novo Produto</h3>
                  <p className="text-xs text-jm-muted mt-1">Adicione novos serviços ou produtos ao catálogo comercial do CRM.</p>
                </div>
                
                <div className="space-y-1">
                  <label className="jm-label text-xs">Nome do Produto *</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ex: Assinatura Mensal"
                    className="jm-input text-sm"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={newProductIsRequired}
                    onChange={(e) => setNewProductIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-jm-border-strong text-jm-primary focus:ring-jm-ring cursor-pointer"
                  />
                  <label htmlFor="isRequired" className="text-sm font-medium text-jm-fg cursor-pointer">
                    Produto Obrigatório?
                  </label>
                </div>
                <p className="text-xs text-jm-muted">
                  Produtos obrigatórios exigem que o administrador informe um preço (mesmo que R$ 0,00) ao salvar a tabela de um grupo.
                </p>

                <button
                  type="submit"
                  disabled={creatingProduct || !newProductName.trim()}
                  className="jm-btn jm-btn-primary w-full"
                >
                  {creatingProduct ? 'Cadastrando...' : '+ Cadastrar Produto'}
                </button>
              </form>
            </div>

            {/* COLUNA DIREITA: LISTA DE PRODUTOS */}
            <div className="lg:col-span-2">
              <div className="jm-table-wrap">
                <div className="p-4 sm:p-5 border-b border-jm-border flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-base font-semibold text-jm-fg">Produtos Cadastrados ({products.length})</h3>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto..."
                    className="jm-input max-w-xs text-xs !h-9"
                  />
                </div>
                
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="jm-table">
                    <thead>
                      <tr>
                        <th className="jm-th">Produto</th>
                        <th className="jm-th">Tipo</th>
                        <th className="jm-th text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-jm-border">
                      {products
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((product) => (
                          <tr key={product.id} className="jm-tr">
                            <td className="jm-td font-medium text-jm-fg">
                              {product.name}
                            </td>
                            <td className="jm-td">
                              <span className={`jm-badge ${
                                product.isRequired
                                  ? 'jm-badge-accent'
                                  : 'jm-badge-neutral'
                              }`}>
                                {product.isRequired ? 'Obrigatório' : 'Opcional'}
                              </span>
                            </td>
                            <td className="jm-td text-center space-x-2">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="jm-btn jm-btn-secondary jm-btn-sm"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                disabled={deletingProductId === product.id}
                                className="jm-btn jm-btn-danger jm-btn-sm disabled:opacity-50"
                              >
                                {deletingProductId === product.id ? 'Excluindo...' : 'Excluir'}
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-sm text-jm-muted font-medium">Nenhum produto encontrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PRODUTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
          <div className="jm-card shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-jm-border flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-jm-fg">Editar Produto</h3>
                <p className="text-xs text-jm-muted mt-0.5">Altere o nome ou o tipo do produto.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="jm-icon-btn !h-8 !w-8"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="jm-label text-xs">Nome do Produto *</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="jm-input text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="editIsRequired"
                  checked={editProductIsRequired}
                  onChange={(e) => setEditProductIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-jm-border-strong text-jm-primary focus:ring-jm-ring cursor-pointer"
                />
                <label htmlFor="editIsRequired" className="text-sm font-medium text-jm-fg cursor-pointer">
                  Produto Obrigatório?
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-jm-border justify-end">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="jm-btn jm-btn-secondary jm-btn-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editProductName.trim()}
                  className="jm-btn jm-btn-primary jm-btn-sm"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
