// Cache em memória das respostas GET do painel.
// Ao voltar para uma tela já visitada, ela mostra os últimos dados na hora
// e a requisição normal atualiza em segundo plano (stale-while-revalidate).
// Vive só na aba atual e é limpo no logout/reload.

const store = new Map<string, unknown>();

export function peekCache<T = unknown>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCache(key: string, value: unknown) {
  store.set(key, value);
}

export function clearCache() {
  store.clear();
}
