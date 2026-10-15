'use client';

import { useState, useEffect } from 'react';
import { peekCache, setCache } from '../lib/cache';

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
    // Com dados em cache a lista continua visível enquanto atualiza
    if (!peekCache('/api/products/groups')) setLoadingList(true);
    try {
      const token = localStorage.getItem('@JMMaster:token');

      // Produtos e grupos em paralelo
      const [prodRes, groupRes] = await Promise.all([
        fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/products/groups', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);
      let prodData: Product[] = [];
      if (prodRes.ok) {
        prodData = await prodRes.json();
        setProducts(prodData);
        setCache('/api/products', prodData);
      }

      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroups(groupData);
        setCache('/api/products/groups', groupData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do catálogo:', err);
      setMessage({ type: 'error', text: 'Não foi possível se conectar com o servidor.' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    // Dados da última visita aparecem na hora; a requisição atualiza em seguida
    const cachedProducts = peekCache<Product[]>('/api/products');
    const cachedGroups = peekCache<Group[]>('/api/products/groups');
    if (cachedProducts) setProducts(cachedProducts);
    if (cachedGroups) {
      setGroups(cachedGroups);
      setLoadingList(false);
    }
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
    <div className="jm-page">

      {/* Cabeçalho da Página */}
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Produtos e tabela de preços</h1>
          <p className="jm-page-desc">
            Defina os valores comerciais por grupo ou adicione novos produtos ao catálogo.
          </p>
        </div>
      </header>

      {/* Controle de Abas */}
      <div className="jm-tabs">
        <button
          onClick={() => { setMainTab('precos'); setMessage(null); }}
          className={`jm-tab ${mainTab === 'precos' ? 'jm-tab-active' : ''}`}
        >
          Tabela de preços
        </button>
        <button
          onClick={() => { setMainTab('catalogo'); setMessage(null); }}
          className={`jm-tab ${mainTab === 'catalogo' ? 'jm-tab-active' : ''}`}
        >
          Catálogo de produtos
        </button>
      </div>

      {mainTab === 'precos' ? (
        /* ABA 1: TABELA DE PREÇOS */
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">

        {/* COLUNA ESQUERDA: LISTA DE GRUPOS CORPORATIVOS */}
        <div className="jm-card flex flex-col overflow-hidden lg:self-start">
          <div className="border-b border-jm-border px-4 py-3">
            <h3 className="jm-card-title">Grupos corporativos</h3>
            <p className="mt-0.5 text-xs text-jm-muted">Selecione um grupo para configurar os preços.</p>
            <div className="relative mt-3">
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Pesquisar grupo..."
                className="jm-input"
              />
            </div>
          </div>

          {/* Lista de Grupos */}
          <div className="max-h-[300px] divide-y divide-jm-border overflow-y-auto lg:max-h-[520px]">
            {loadingList ? (
              <div className="jm-empty py-8">Carregando grupos corporativos...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="jm-empty py-8">Nenhum grupo corporativo cadastrado.</div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors duration-100 cursor-pointer ${
                      isSelected
                        ? 'bg-jm-primary-soft text-jm-fg before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-jm-accent-line'
                        : 'text-jm-fg hover:bg-jm-hover'
                    }`}
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{group.name}</span>
                    <span className={`jm-badge shrink-0 ${group.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                      {group.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE PREÇOS */}
        <div className="min-w-0">
          {selectedGroup ? (
            <form onSubmit={handleSavePrices} className="jm-card overflow-hidden">

              {/* Cabeçalho do Formulário */}
              <div className="flex flex-col gap-2 border-b border-jm-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-jm-fg">
                    Tabela comercial · <span className="text-jm-primary-text">{selectedGroup.name}</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-jm-muted">
                    Itens com <span className="font-semibold text-jm-accent-text">*</span> são de preenchimento obrigatório.
                  </p>
                </div>
                <span className="jm-badge jm-badge-neutral self-start font-mono sm:self-auto">
                  Grupo ID: {selectedGroup.id.substring(0, 8)}...
                </span>
              </div>

              {/* Feedback do Salvamento */}
              {message && (
                <div className="px-4 pt-4 md:px-5">
                  <div className={`jm-alert ${message.type === 'success' ? 'jm-alert-success' : 'jm-alert-danger'}`}>
                    {message.text}
                  </div>
                </div>
              )}

              {/* Listagem de Produtos com inputs de valores */}
              {loadingPrices ? (
                <div className="jm-empty py-16">Buscando tabela de valores...</div>
              ) : (
                <div className="max-h-[520px] divide-y divide-jm-border overflow-y-auto">
                  {products.map((product) => {
                    const priceValue = productPrices[product.id] ?? 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-75 hover:bg-jm-hover md:px-5"
                      >
                        <div className="min-w-0">
                          <span className="flex items-center text-sm font-medium text-jm-fg">
                            <span className="truncate">{product.name}</span>
                            {product.isRequired && <span className="ml-1 font-semibold text-jm-accent-text">*</span>}
                          </span>
                          <span className="block text-xs text-jm-muted">
                            {product.isRequired ? 'Obrigatório' : 'Opcional'}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <input
                            type="text"
                            value={formatBRL(priceValue)}
                            onChange={(e) => handlePriceChangeRaw(product.id, e.target.value)}
                            className="jm-input w-32 text-right font-mono tabular-nums sm:w-36"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="jm-card-footer">
                <button
                  type="submit"
                  disabled={loadingPrices || loadingSave}
                  className="jm-btn jm-btn-primary w-full sm:w-auto"
                >
                  {loadingSave ? 'Salvando valores...' : 'Salvar tabela de preços'}
                </button>
              </div>

            </form>
          ) : (
            <div className="jm-card jm-empty h-full min-h-[280px]">
              <h3 className="text-sm font-semibold text-jm-fg">Nenhum grupo selecionado</h3>
              <p className="max-w-sm text-xs text-jm-muted">
                Selecione um grupo corporativo na lista para carregar e configurar os preços dos produtos contratados.
              </p>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* ABA 2: CATÁLOGO DE PRODUTOS */
        <div className="space-y-5">
          {/* Feedback de mensagens globais para catálogo */}
          {message && (
            <div className={`jm-alert ${message.type === 'success' ? 'jm-alert-success' : 'jm-alert-danger'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
            {/* COLUNA ESQUERDA: CADASTRAR NOVO PRODUTO */}
            <div className="lg:self-start">
              <form onSubmit={handleCreateProduct} className="jm-card overflow-hidden">
                <div className="border-b border-jm-border px-4 py-3">
                  <h3 className="jm-card-title">Novo produto</h3>
                  <p className="mt-0.5 text-xs text-jm-muted">Adicione serviços ou produtos ao catálogo comercial.</p>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <label className="jm-label">Nome do produto *</label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Ex: Assinatura Mensal"
                      className="jm-input"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isRequired"
                        checked={newProductIsRequired}
                        onChange={(e) => setNewProductIsRequired(e.target.checked)}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="isRequired" className="cursor-pointer text-sm font-medium text-jm-fg">
                        Produto obrigatório
                      </label>
                    </div>
                    <p className="jm-help">
                      Produtos obrigatórios exigem que o administrador informe um preço (mesmo que R$ 0,00) ao salvar a tabela de um grupo.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingProduct || !newProductName.trim()}
                    className="jm-btn jm-btn-primary w-full"
                  >
                    {creatingProduct ? 'Cadastrando...' : '+ Cadastrar produto'}
                  </button>
                </div>
              </form>
            </div>

            {/* COLUNA DIREITA: LISTA DE PRODUTOS */}
            <div className="min-w-0">
              <div className="jm-table-wrap">
                <div className="flex flex-col gap-3 border-b border-jm-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="jm-card-title">
                    Produtos cadastrados <span className="font-normal text-jm-muted tabular-nums">({products.length})</span>
                  </h3>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto..."
                    className="jm-input sm:max-w-xs"
                  />
                </div>

                <div className="max-h-[600px] overflow-auto">
                  <table className="jm-table min-w-[480px]">
                    <thead>
                      <tr>
                        <th className="jm-th">Produto</th>
                        <th className="jm-th">Tipo</th>
                        <th className="jm-th text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
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
                            <td className="jm-td">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(product)}
                                  className="jm-btn jm-btn-secondary jm-btn-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product)}
                                  disabled={deletingProductId === product.id}
                                  className="jm-btn jm-btn-danger jm-btn-sm"
                                >
                                  {deletingProductId === product.id ? 'Excluindo...' : 'Excluir'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={3} className="jm-td py-8 text-center text-jm-muted">Nenhum produto encontrado.</td>
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
        <div className="jm-overlay">
          <div className="jm-modal sm:max-w-md">
            <div className="jm-modal-header">
              <div>
                <h3 className="jm-modal-title">Editar produto</h3>
                <p className="mt-0.5 text-xs text-jm-muted">Altere o nome ou o tipo do produto.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="jm-icon-btn"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="flex min-h-0 flex-col">
              <div className="jm-modal-body space-y-4">
                <div>
                  <label className="jm-label">Nome do produto *</label>
                  <input
                    type="text"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    className="jm-input"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsRequired"
                    checked={editProductIsRequired}
                    onChange={(e) => setEditProductIsRequired(e.target.checked)}
                    className="h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="editIsRequired" className="cursor-pointer text-sm font-medium text-jm-fg">
                    Produto obrigatório
                  </label>
                </div>
              </div>

              <div className="jm-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="jm-btn jm-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editProductName.trim()}
                  className="jm-btn jm-btn-primary"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
