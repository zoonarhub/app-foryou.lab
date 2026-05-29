// ═══════════════════════════════════════════════════════════════
// localDB.js — Banco de Dados Local (localStorage)
// Persistência primária do sistema. Supabase sincroniza em background.
// ═══════════════════════════════════════════════════════════════

const DB_PREFIX = 'foryoulab_';
const SYNC_QUEUE_KEY = `${DB_PREFIX}sync_queue`;

// ── Coleções ──────────────────────────────────────────────────

/**
 * Salva uma coleção inteira no localStorage.
 * @param {string} key - Nome da coleção (ex: 'clients', 'leads')
 * @param {Array} items - Array de objetos
 */
export function saveCollection(key, items) {
  try {
    localStorage.setItem(`${DB_PREFIX}${key}`, JSON.stringify(items || []));
  } catch (e) {
    console.error(`[localDB] Erro ao salvar ${key}:`, e);
    // Se localStorage estiver cheio, tentar limpar dados antigos de sync
    if (e.name === 'QuotaExceededError') {
      clearOldSyncItems();
      try {
        localStorage.setItem(`${DB_PREFIX}${key}`, JSON.stringify(items || []));
      } catch (e2) {
        console.error(`[localDB] localStorage cheio, não foi possível salvar ${key}`);
      }
    }
  }
}

/**
 * Carrega uma coleção do localStorage.
 * @param {string} key - Nome da coleção
 * @returns {Array} Array de objetos (vazio se não existir)
 */
export function loadCollection(key) {
  try {
    const raw = localStorage.getItem(`${DB_PREFIX}${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`[localDB] Erro ao carregar ${key}:`, e);
    return [];
  }
}

/**
 * Remove uma coleção do localStorage.
 * @param {string} key - Nome da coleção
 */
export function clearCollection(key) {
  localStorage.removeItem(`${DB_PREFIX}${key}`);
}

// ── Fila de Sincronização ─────────────────────────────────────

/**
 * Adiciona uma operação à fila de sync pendente.
 * @param {Object} action - Operação pendente
 * @param {string} action.action - 'insert' | 'update' | 'delete'
 * @param {string} action.table - Nome da tabela no Supabase (snake_case)
 * @param {string} action.key - Chave da coleção no store (camelCase)
 * @param {Object} action.payload - Dados para enviar
 * @param {string} action.itemId - ID do item
 * @param {string} action.agencyId - ID da agência
 */
export function addToSyncQueue(action) {
  const queue = getSyncQueue();
  
  // Deduplicar: se já existe uma operação para o mesmo item/tabela, substituir
  const existingIndex = queue.findIndex(
    q => q.itemId === action.itemId && q.table === action.table
  );
  
  const syncItem = {
    id: generateSyncId(),
    ...action,
    timestamp: Date.now(),
    retries: 0
  };

  if (existingIndex >= 0) {
    // Se o item já existe na fila:
    // - Se a nova ação é 'delete', substituir tudo por delete
    // - Se a ação existente era 'insert' e a nova é 'update', manter como insert com dados atualizados
    const existing = queue[existingIndex];
    if (action.action === 'delete') {
      if (existing.action === 'insert') {
        // Item criado e deletado antes de sincronizar — remover da fila
        queue.splice(existingIndex, 1);
        saveSyncQueue(queue);
        return;
      }
      queue[existingIndex] = syncItem;
    } else if (action.action === 'update' && existing.action === 'insert') {
      // Manter como insert mas com payload atualizado
      queue[existingIndex] = { ...existing, payload: action.payload, timestamp: Date.now() };
    } else {
      queue[existingIndex] = syncItem;
    }
  } else {
    queue.push(syncItem);
  }

  saveSyncQueue(queue);
}

/**
 * Retorna a fila de sync pendente.
 * @returns {Array} Array de operações pendentes
 */
export function getSyncQueue() {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[localDB] Erro ao ler fila de sync:', e);
    return [];
  }
}

/**
 * Remove um item específico da fila de sync (após sync bem-sucedido).
 * @param {string} syncId - ID do item na fila
 */
export function removeSyncItem(syncId) {
  const queue = getSyncQueue().filter(item => item.id !== syncId);
  saveSyncQueue(queue);
}

/**
 * Atualiza um item na fila de sync (ex: incrementar retries).
 * @param {string} syncId - ID do item
 * @param {Object} updates - Campos a atualizar
 */
export function updateSyncItem(syncId, updates) {
  const queue = getSyncQueue().map(item =>
    item.id === syncId ? { ...item, ...updates } : item
  );
  saveSyncQueue(queue);
}

/**
 * Limpa toda a fila de sync.
 */
export function clearSyncQueue() {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Retorna estatísticas da fila.
 * @returns {{ pending: number, failed: number, oldest: number|null }}
 */
export function getSyncStats() {
  const queue = getSyncQueue();
  const MAX_RETRIES = 10;
  return {
    pending: queue.filter(q => q.retries < MAX_RETRIES).length,
    failed: queue.filter(q => q.retries >= MAX_RETRIES).length,
    total: queue.length,
    oldest: queue.length > 0 ? Math.min(...queue.map(q => q.timestamp)) : null
  };
}

// ── Helpers Internos ──────────────────────────────────────────

function saveSyncQueue(queue) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[localDB] Erro ao salvar fila de sync:', e);
  }
}

function generateSyncId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'sync_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function clearOldSyncItems() {
  const queue = getSyncQueue();
  // Remover items com mais de 7 dias ou mais de 10 retries
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const filtered = queue.filter(q => q.timestamp > cutoff && q.retries < 10);
  saveSyncQueue(filtered);
}

// ── Timestamp de Última Sincronização ─────────────────────────

const LAST_SYNC_KEY = `${DB_PREFIX}last_sync`;

export function getLastSyncTime() {
  const ts = localStorage.getItem(LAST_SYNC_KEY);
  return ts ? parseInt(ts, 10) : null;
}

export function setLastSyncTime(ts = Date.now()) {
  localStorage.setItem(LAST_SYNC_KEY, ts.toString());
}
