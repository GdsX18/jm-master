'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { peekCache, setCache } from '../lib/cache';
import { formatBRL, parseMoney } from '../lib/format';
import { useNotify } from '../components/ui/Notifications';
import { clearQueryParams, useQueryParams } from '../hooks/useQueryParams';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isRequired: boolean;
  active: boolean;
  recurring: boolean;
}

interface Group {
  id: string;
  name: string;
  isActive: boolean;
  customerCount: number;
  priceCount: number;
}

type ProductDraft = Omit<Product, 'id'> & { priceText: string };

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  description: '',
  price: 0,
  priceText: '',
  category: '',
  isRequired: false,
  active: true,
  recurring: true,
};

// Campo monetário "digitando centavos": 1234 → R$ 12,34
function centsInput(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return digits ? parseFloat(digits) / 100 : 0;
}

export default function ProductsPage() {
  const { toast, confirm } = useNotify();
  const params = useQueryParams();
  const [tab, setTab] = useState<'precos' | 'catalogo'>('precos');
  const [products, setProducts] = useState<Product[]>(() => peekCache<Product[]>('/api/products') || []);
  const [groups, setGroups] = useState<Group[]>(() => peekCache<Group[]>('/api/products/groups') || []);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [pricesDirty, setPricesDirty] = useState(false);

  const [groupSearch, setGroupSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [editing, setEditing] = useState<{ id: string | null; draft: ProductDraft } | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const load = async () => {
    try {
      const [prod, grp] = await Promise.all([api<Product[]>('/api/products'), api<Group[]>('/api/products/groups')]);
      setProducts(prod);
      setGroups(grp);
      setCache('/api/products', prod);
      setCache('/api/products/groups', grp);
      return { prod, grp };
    } catch (e) {
      toast.error('Erro ao carregar o catálogo', e instanceof Error ? e.message : undefined);
      return null;
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?group=<id> (vindo da aba Grupos de Clientes) já abre a tabela daquele grupo
  useEffect(() => {
    const groupId = params?.get('group');
    if (!groupId || groups.length === 0) return;
    const group = groups.find((g) => g.id === groupId);
    if (group) selectGroup(group);
    clearQueryParams('group');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, groups.length]);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const selectGroup = async (group: Group) => {
    if (pricesDirty) {
      const ok = await confirm({ title: 'Descartar alterações?', message: 'Os preços alterados neste grupo ainda não foram salvos.', confirmLabel: 'Descartar', variant: 'warning' });
      if (!ok) return;
    }
    setSelectedGroup(group);
    setLoadingPrices(true);
    setPricesDirty(false);
    try {
      const data = await api<{ productId: string; price: number }[]>(`/api/products/group-prices/${group.id}`);
      const initial: Record<string, number> = {};
      data.forEach((gp) => (initial[gp.productId] = gp.price));
      setPrices(initial);
    } catch (e) {
      // Sem os preços carregados não deixamos salvar, para não apagar a tabela existente
      setSelectedGroup(null);
      toast.error('Erro ao carregar preços', e instanceof Error ? e.message : undefined);
    } finally {
      setLoadingPrices(false);
    }
  };

  const setPrice = (productId: string, value: number | undefined) => {
    setPrices((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[productId];
      else next[productId] = value;
      return next;
    });
    setPricesDirty(true);
  };

  const fillWithBasePrices = () => {
    setPrices((prev) => {
      const next = { ...prev };
      activeProducts.forEach((p) => {
        if (next[p.id] === undefined) next[p.id] = p.price;
      });
      return next;
    });
    setPricesDirty(true);
  };

  const savePrices = async () => {
    if (!selectedGroup) return;
    const missing = activeProducts.filter((p) => p.isRequired && prices[p.id] === undefined);
    if (missing.length) {
      return toast.warning('Preços obrigatórios', `Defina o preço de: ${missing.map((p) => p.name).join(', ')}`);
    }
    setSavingPrices(true);
    try {
      await api(`/api/products/group-prices/${selectedGroup.id}`, {
        method: 'PUT',
        json: { products: Object.entries(prices).map(([productId, price]) => ({ productId, price })) },
      });
      setPricesDirty(false);
      toast.success('Tabela salva', `Preços do grupo "${selectedGroup.name}" atualizados.`);
      load();
    } catch (e) {
      toast.error('Erro ao salvar preços', e instanceof Error ? e.message : undefined);
    } finally {
      setSavingPrices(false);
    }
  };

  const monthlyTotal = activeProducts.filter((p) => p.recurring).reduce((s, p) => s + (prices[p.id] ?? 0), 0);
  const oneTimeTotal = activeProducts.filter((p) => !p.recurring).reduce((s, p) => s + (prices[p.id] ?? 0), 0);

  const openNew = () => setEditing({ id: null, draft: { ...EMPTY_DRAFT } });
  const openEdit = (p: Product) =>
    setEditing({ id: p.id, draft: { ...p, priceText: p.price ? p.price.toFixed(2).replace('.', ',') : '' } });

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { draft, id } = editing;
    setSavingProduct(true);
    try {
      const payload = { ...draft, price: parseMoney(draft.priceText) };
      if (id) await api(`/api/products/${id}`, { method: 'PUT', json: payload });
      else await api('/api/products', { method: 'POST', json: payload });
      toast.success(id ? 'Produto atualizado' : 'Produto cadastrado', draft.name);
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Erro ao salvar produto', err instanceof Error ? err.message : undefined);
    } finally {
      setSavingProduct(false);
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await api(`/api/products/${p.id}`, { method: 'PUT', json: { active: !p.active } });
      toast.success(p.active ? 'Produto inativado' : 'Produto reativado', p.active ? 'Ele deixa de aparecer em tabelas de preço e propostas novas.' : p.name);
      load();
    } catch (e) {
      toast.error('Erro ao alterar status', e instanceof Error ? e.message : undefined);
    }
  };

  const removeProduct = async (p: Product) => {
    const ok = await confirm({
      title: 'Excluir produto',
      message: `Excluir "${p.name}"? Os preços dele em todos os grupos serão apagados. Se o produto só saiu de linha, prefira inativar.`,
      confirmLabel: 'Sim, excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/products/${p.id}`, { method: 'DELETE' });
      toast.success('Produto excluído', p.name);
      load();
    } catch (e) {
      toast.error('Não foi possível excluir', e instanceof Error ? e.message : undefined);
    }
  };

  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  const visibleProducts = products.filter(
    (p) =>
      (showInactive || p.active) &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();

  return (
    <div className="jm-page">
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Produtos e tabela de preços</h1>
          <p className="jm-page-desc">Catálogo comercial (mensalidades e cobranças únicas) e preços por grupo corporativo.</p>
        </div>
        {tab === 'catalogo' && (
          <button onClick={openNew} className="jm-btn jm-btn-accent self-start sm:self-auto">
            + Novo produto
          </button>
        )}
      </header>

      <div className="jm-tabs">
        <button onClick={() => setTab('precos')} className={`jm-tab ${tab === 'precos' ? 'jm-tab-active' : ''}`}>
          Tabela de preços
        </button>
        <button onClick={() => setTab('catalogo')} className={`jm-tab ${tab === 'catalogo' ? 'jm-tab-active' : ''}`}>
          Catálogo ({activeProducts.length})
        </button>
      </div>

      {tab === 'precos' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="jm-card flex flex-col overflow-hidden lg:self-start">
            <div className="border-b border-jm-border px-4 py-3">
              <h3 className="jm-card-title">Grupos corporativos</h3>
              <p className="mt-0.5 text-xs text-jm-muted">Selecione um grupo para configurar os preços.</p>
              <input value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} placeholder="Pesquisar grupo..." className="jm-input mt-3" />
            </div>
            <div className="max-h-[300px] divide-y divide-jm-border overflow-y-auto lg:max-h-[520px]">
              {loadingList && groups.length === 0 ? (
                <div className="jm-empty py-8">Carregando...</div>
              ) : filteredGroups.length === 0 ? (
                <div className="jm-empty py-8">Nenhum grupo. Crie em Clientes → Grupos.</div>
              ) : (
                filteredGroups.map((group) => {
                  const selected = selectedGroup?.id === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => selectGroup(group)}
                      className={`relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                        selected
                          ? 'bg-jm-primary-soft before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-jm-accent-line'
                          : 'hover:bg-jm-hover'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-jm-fg">{group.name}</span>
                        <span className="block text-[11px] text-jm-muted">
                          {group.customerCount} cliente(s) · {group.priceCount} preço(s)
                        </span>
                      </span>
                      <span className={`jm-badge shrink-0 ${group.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                        {group.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="min-w-0">
            {selectedGroup ? (
              <div className="jm-card overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-jm-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-jm-fg">
                      Tabela comercial · <span className="text-jm-primary-text">{selectedGroup.name}</span>
                    </h2>
                    <p className="mt-0.5 text-xs text-jm-muted">
                      Deixe em branco os produtos que o grupo não contrata. <span className="font-semibold text-jm-accent-text">*</span> obrigatório.
                    </p>
                  </div>
                  <button type="button" onClick={fillWithBasePrices} className="jm-btn jm-btn-secondary jm-btn-sm self-start">
                    Preencher vazios com preço base
                  </button>
                </div>

                {loadingPrices ? (
                  <div className="jm-empty py-16">Buscando tabela de valores...</div>
                ) : activeProducts.length === 0 ? (
                  <div className="jm-empty py-16">Nenhum produto ativo no catálogo.</div>
                ) : (
                  <div className="max-h-[520px] divide-y divide-jm-border overflow-y-auto">
                    {activeProducts.map((p) => {
                      const value = prices[p.id];
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-jm-hover md:px-5">
                          <div className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-jm-fg">
                              <span className="truncate">{p.name}</span>
                              {p.isRequired && <span className="font-semibold text-jm-accent-text">*</span>}
                              <span className={`jm-badge ${p.recurring ? 'jm-badge-primary' : 'jm-badge-neutral'}`}>
                                {p.recurring ? 'Mensal' : 'Único'}
                              </span>
                            </span>
                            <span className="block text-xs text-jm-muted">Preço base: {formatBRL(p.price)}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <input
                              value={value === undefined ? '' : formatBRL(value)}
                              placeholder="Não contratado"
                              onChange={(e) => setPrice(p.id, e.target.value.replace(/\D/g, '') ? centsInput(e.target.value) : undefined)}
                              className="jm-input w-36 text-right font-mono tabular-nums"
                            />
                            {value !== undefined && !p.isRequired && (
                              <button type="button" onClick={() => setPrice(p.id, undefined)} className="jm-icon-btn h-8 w-8" title="Remover do grupo">
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="jm-card-footer flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-jm-muted">
                    Mensalidade sugerida: <strong className="tabular-nums text-jm-fg">{formatBRL(monthlyTotal)}</strong>
                    {oneTimeTotal > 0 && (
                      <>
                        {' · '}Cobrança única: <strong className="tabular-nums text-jm-fg">{formatBRL(oneTimeTotal)}</strong>
                      </>
                    )}
                  </p>
                  <button onClick={savePrices} disabled={loadingPrices || savingPrices || !pricesDirty} className="jm-btn jm-btn-primary w-full sm:w-auto">
                    {savingPrices ? 'Salvando...' : pricesDirty ? 'Salvar tabela de preços' : 'Tabela salva'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="jm-card jm-empty h-full min-h-[280px]">
                <h3 className="text-sm font-semibold text-jm-fg">Nenhum grupo selecionado</h3>
                <p className="max-w-sm text-xs text-jm-muted">Selecione um grupo corporativo para configurar os preços dos produtos contratados.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="jm-table-wrap">
          <div className="flex flex-col gap-3 border-b border-jm-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar por nome ou categoria..." className="jm-input sm:max-w-xs" />
            <label className="flex cursor-pointer items-center gap-2 text-xs text-jm-muted">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Mostrar inativos ({products.length - activeProducts.length})
            </label>
          </div>
          <table className="jm-table min-w-[760px]">
            <thead>
              <tr>
                <th className="jm-th">Produto</th>
                <th className="jm-th">Categoria</th>
                <th className="jm-th">Cobrança</th>
                <th className="jm-th text-right">Preço base</th>
                <th className="jm-th">Status</th>
                <th className="jm-th text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr key={p.id} className={`jm-tr ${!p.active ? 'opacity-60' : ''}`}>
                  <td className="jm-td">
                    <span className="font-medium text-jm-fg">{p.name}</span>
                    {p.isRequired && <span className="jm-badge jm-badge-accent ml-2">Obrigatório</span>}
                    {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-jm-muted">{p.description}</p>}
                  </td>
                  <td className="jm-td text-jm-fg2">{p.category || '—'}</td>
                  <td className="jm-td">
                    <span className={`jm-badge ${p.recurring ? 'jm-badge-primary' : 'jm-badge-neutral'}`}>{p.recurring ? 'Mensal' : 'Única'}</span>
                  </td>
                  <td className="jm-td text-right tabular-nums">{formatBRL(p.price)}</td>
                  <td className="jm-td">
                    <span className={`jm-badge ${p.active ? 'jm-badge-success' : 'jm-badge-danger'}`}>{p.active ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="jm-td">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(p)} className="jm-btn jm-btn-secondary jm-btn-sm">
                        Editar
                      </button>
                      <button onClick={() => toggleActive(p)} className="jm-btn jm-btn-ghost jm-btn-sm">
                        {p.active ? 'Inativar' : 'Reativar'}
                      </button>
                      <button onClick={() => removeProduct(p)} className="jm-btn jm-btn-danger jm-btn-sm">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="jm-td py-8 text-center text-jm-muted">
                    {products.length === 0 ? 'Nenhum produto cadastrado. Clique em "+ Novo produto".' : 'Nenhum produto encontrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="jm-overlay" onClick={() => setEditing(null)}>
          <form className="jm-modal sm:max-w-lg" onClick={(e) => e.stopPropagation()} onSubmit={saveProduct}>
            <div className="jm-modal-header">
              <h3 className="jm-modal-title">{editing.id ? 'Editar produto' : 'Novo produto'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="jm-icon-btn" aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="jm-modal-body grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="jm-label">Nome *</label>
                <input
                  required
                  autoFocus
                  value={editing.draft.name}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })}
                  placeholder="Ex.: Plataforma WhatsApp API — plano Pro"
                  className="jm-input"
                />
              </div>
              <div>
                <label className="jm-label">Preço base (R$)</label>
                <input
                  inputMode="decimal"
                  value={editing.draft.priceText}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, priceText: e.target.value.replace(/[^\d,.]/g, '') } })}
                  placeholder="0,00"
                  className="jm-input text-right tabular-nums"
                />
                <p className="jm-help">Sugestão em propostas; cada grupo pode ter o próprio preço.</p>
              </div>
              <div>
                <label className="jm-label">Categoria</label>
                <input
                  list="product-categories"
                  value={editing.draft.category}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, category: e.target.value } })}
                  placeholder="Ex.: Mensageria, Setup, Chatbot"
                  className="jm-input"
                />
                <datalist id="product-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="jm-label">Descrição (aparece na proposta)</label>
                <textarea
                  rows={2}
                  value={editing.draft.description}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, description: e.target.value } })}
                  className="jm-input"
                />
              </div>
              <div>
                <label className="jm-label">Tipo de cobrança</label>
                <select
                  value={editing.draft.recurring ? 'mensal' : 'unica'}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, recurring: e.target.value === 'mensal' } })}
                  className="jm-input"
                >
                  <option value="mensal">Mensal (entra na mensalidade)</option>
                  <option value="unica">Única (setup, implantação)</option>
                </select>
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-jm-fg">
                  <input
                    type="checkbox"
                    checked={editing.draft.isRequired}
                    onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, isRequired: e.target.checked } })}
                  />
                  Obrigatório em toda tabela de grupo
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-jm-fg">
                  <input
                    type="checkbox"
                    checked={editing.draft.active}
                    onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, active: e.target.checked } })}
                  />
                  Ativo
                </label>
              </div>
            </div>
            <div className="jm-modal-footer">
              <button type="button" onClick={() => setEditing(null)} className="jm-btn jm-btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={savingProduct || !editing.draft.name.trim()} className="jm-btn jm-btn-primary">
                {savingProduct ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
