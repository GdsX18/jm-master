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
      const prodRes = await fetch('http://localhost:3000/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let prodData: Product[] = [];
      if (prodRes.ok) {
        prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Carregar grupos
      const groupRes = await fetch('http://localhost:3000/products/groups', {
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
      const res = await fetch(`http://localhost:3000/products/group-prices/${group.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const initialPrices: Record<string, number> = {};
      
      if (res.ok) {
        const pricesData: GroupProductPrice[] = await res.json();
        // Inicializar com 0 todos os produtos
        products.forEach(p => {
          initialPrices[p.id] = 0;
        });
        // Sobrescrever com os preços já configurados no banco
        pricesData.forEach(gp => {
          initialPrices[gp.productId] = gp.price;
        });
      }
      setProductPrices(initialPrices);
    } catch (err) {
      console.error('Erro ao carregar preços do grupo:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar os preços definidos para o grupo.' });
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

      const response = await fetch(`http://localhost:3000/products/group-prices/${selectedGroup.id}`, {
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
      const res = await fetch('http://localhost:3000/products', {
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
      const res = await fetch(`http://localhost:3000/products/${product.id}`, {
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
      const res = await fetch(`http://localhost:3000/products/${editingProduct.id}`, {
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
    <div className="p-6 sm:p-8 md:p-10 space-y-8 bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cadastro e Tabela de Produtos</h1>
          <p className="text-sm text-neutral-500 dark:text-master-textMuted mt-1">
            Defina e gerencie os valores comerciais ou adicione novos produtos ao catálogo.
          </p>
        </div>
      </div>

      {/* Controle de Abas */}
      <div className="flex space-x-2 bg-neutral-200/60 dark:bg-neutral-900/60 p-1.5 rounded-xl w-fit border border-neutral-300/40 dark:border-neutral-800/40">
        <button
          onClick={() => { setMainTab('precos'); setMessage(null); }}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            mainTab === 'precos'
              ? 'bg-white dark:bg-neutral-800 text-master-blue dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
          }`}
        >
          <span>💲</span> Tabela de Preços
        </button>
        <button
          onClick={() => { setMainTab('catalogo'); setMessage(null); }}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            mainTab === 'catalogo'
              ? 'bg-white dark:bg-neutral-800 text-master-blue dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-master-textMuted dark:hover:text-white'
          }`}
        >
          <span>📦</span> Catálogo de Produtos
        </button>
      </div>

      {mainTab === 'precos' ? (
        /* ABA 1: TABELA DE PREÇOS (Atual) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: LISTA DE GRUPOS CORPORATIVOS */}
        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 transition duration-300">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Grupos Corporativos</h3>
            <p className="text-xs text-neutral-500 dark:text-master-textMuted mt-1">Selecione um grupo para configurar os preços dos produtos.</p>
          </div>

          {/* Campo de pesquisa de grupos */}
          <div className="relative">
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Pesquisar grupo corporativo..."
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
            />
          </div>

          {/* Lista de Grupos */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {loadingList ? (
              <div className="text-center py-8 text-neutral-500 text-sm font-bold animate-pulse">Carregando grupos corporativos...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs italic">Nenhum grupo corporativo cadastrado.</div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-master-orange border-master-orange text-white shadow-lg shadow-orange-950/20 scale-[1.01]'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900 dark:bg-neutral-950/50 dark:hover:bg-neutral-800/40 dark:border-neutral-800 dark:text-white'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-sm">{group.name}</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                        isSelected 
                          ? 'bg-orange-800/40 text-white border border-orange-500/25' 
                          : group.isActive 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/10'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-450 border border-rose-500/10'
                      }`}>
                        {group.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <span className="text-lg">{isSelected ? '➡️' : '🏢'}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE PREÇOS */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <form onSubmit={handleSavePrices} className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl transition-colors duration-300">
              
              {/* Cabeçalho do Formulário */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200 dark:border-neutral-800 pb-4 gap-4 transition-colors">
                <div>
                  <h2 className="text-xl font-bold text-master-blue dark:text-white flex items-center gap-2">
                    Tabela Comercial: <span className="text-master-orange">{selectedGroup.name}</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-master-textMuted mt-1">
                    Os itens com <span className="text-master-orange font-bold">*</span> são de preenchimento obrigatório pelo administrador.
                  </p>
                </div>
                <div className="bg-orange-600/10 text-master-orange border border-orange-500/20 px-3 py-1 rounded-lg text-xs font-bold font-mono">
                  Grupo ID: {selectedGroup.id.substring(0, 8)}...
                </div>
              </div>

              {/* Feedback do Salvamento */}
              {message && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                    : 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Listagem de Produtos com inputs de valores */}
              {loadingPrices ? (
                <div className="p-16 text-center font-bold text-neutral-500 animate-pulse">Buscando tabela de valores...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[480px] overflow-y-auto pr-1">
                  {products.map((product) => {
                    const priceValue = productPrices[product.id] ?? 0;
                    return (
                      <div
                        key={product.id}
                        className="p-4 bg-neutral-50 border border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 rounded-xl flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition"
                      >
                        <div className="space-y-1 pr-2">
                          <span className="text-sm font-bold text-neutral-800 dark:text-white flex items-center">
                            {product.name}
                            {product.isRequired && <span className="text-master-orange ml-1 font-bold">*</span>}
                          </span>
                          <span className="text-xxs text-neutral-400 dark:text-neutral-500 block uppercase tracking-wide">
                            {product.isRequired ? 'Obrigatório' : 'Opcional'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <input
                            type="text"
                            value={formatBRL(priceValue)}
                            onChange={(e) => handlePriceChangeRaw(product.id, e.target.value)}
                            className="w-36 px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-master-orange dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end border-t border-neutral-200 dark:border-neutral-800 pt-6 transition-colors">
                <button
                  type="submit"
                  disabled={loadingPrices || loadingSave}
                  className="px-8 py-3.5 bg-master-orange hover:bg-orange-600 disabled:bg-orange-850 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition shadow-lg shadow-orange-950/20"
                >
                  {loadingSave ? 'Salvando Valores...' : 'Salvar Tabela de Preços'}
                </button>
              </div>

            </form>
          ) : (
            <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-16 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[400px] transition duration-300">
              <span className="text-5xl mb-4">🏢</span>
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Nenhum Grupo Selecionado</h3>
              <p className="text-sm text-neutral-500 dark:text-master-textMuted mt-1 max-w-sm">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLUNA ESQUERDA: CADASTRAR NOVO PRODUTO */}
            <div className="lg:col-span-1">
              <form onSubmit={handleCreateProduct} className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 transition duration-300">
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Cadastrar Novo Produto</h3>
                  <p className="text-xs text-neutral-500 dark:text-master-textMuted mt-1">Adicione novos serviços ou produtos ao catálogo comercial do CRM.</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Nome do Produto *</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ex: Assinatura Mensal"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={newProductIsRequired}
                    onChange={(e) => setNewProductIsRequired(e.target.checked)}
                    className="w-4 h-4 text-master-orange rounded border-neutral-300 focus:ring-master-orange dark:border-neutral-700 dark:bg-neutral-900 dark:ring-offset-neutral-950"
                  />
                  <label htmlFor="isRequired" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    Produto Obrigatório?
                  </label>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  Produtos obrigatórios exigem que o administrador informe um preço (mesmo que R$ 0,00) ao salvar a tabela de um grupo.
                </p>

                <button
                  type="submit"
                  disabled={creatingProduct || !newProductName.trim()}
                  className="w-full px-4 py-3 bg-master-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-orange-950/20"
                >
                  {creatingProduct ? 'Cadastrando...' : '+ Cadastrar Produto'}
                </button>
              </form>
            </div>

            {/* COLUNA DIREITA: LISTA DE PRODUTOS */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden transition duration-300">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Produtos Cadastrados ({products.length})</h3>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full max-w-xs px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                  />
                </div>
                
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-sm font-semibold">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-xs border-b border-neutral-200 dark:border-neutral-800">
                        <th className="py-3 px-6">Produto</th>
                        <th className="py-3 px-6">Tipo</th>
                        <th className="py-3 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                      {products
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((product) => (
                          <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-850/40 transition">
                            <td className="py-4 px-6 font-bold text-neutral-800 dark:text-white">
                              {product.name}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-block px-2 py-1 text-[10px] font-extrabold uppercase rounded-full ${
                                product.isRequired
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900'
                                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                              }`}>
                                {product.isRequired ? 'Obrigatório' : 'Opcional'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center space-x-2">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 dark:bg-sky-950/30 dark:text-sky-450 dark:hover:bg-sky-950/50 dark:border-sky-900 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                disabled={deletingProductId === product.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:hover:bg-rose-950/50 dark:border-rose-900 transition disabled:opacity-50"
                              >
                                {deletingProductId === product.id ? 'Excluindo...' : 'Excluir'}
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-neutral-500 font-medium">Nenhum produto encontrado.</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Editar Produto</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Altere o nome ou o tipo do produto.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-neutral-600 dark:text-master-textLight">Nome do Produto *</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-master-orange focus:border-transparent dark:bg-neutral-950 dark:border-neutral-800 dark:text-white transition"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="editIsRequired"
                  checked={editProductIsRequired}
                  onChange={(e) => setEditProductIsRequired(e.target.checked)}
                  className="w-4 h-4 text-master-orange rounded border-neutral-300 focus:ring-master-orange dark:border-neutral-700 dark:bg-neutral-900 dark:ring-offset-neutral-950"
                />
                <label htmlFor="editIsRequired" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Produto Obrigatório?
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editProductName.trim()}
                  className="flex-1 px-4 py-3 bg-master-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-orange-950/20"
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
