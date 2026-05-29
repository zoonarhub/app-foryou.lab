// ═══════════════════════════════════════════════════════════════
// syncEngine.js — Motor de Sincronização em Background
// Processa a fila de operações pendentes e envia ao Supabase.
// ═══════════════════════════════════════════════════════════════

import {
  getSyncQueue,
  removeSyncItem,
  updateSyncItem,
  setLastSyncTime,
  getSyncStats
} from './localDB';

const SYNC_INTERVAL = 30_000;  // 30 segundos
const MAX_RETRIES = 10;

let intervalId = null;
let isSyncing = false;

// Tabelas que usam colunas individuais (sem coluna 'data' JSONB)
const STRUCTURED_TABLES = ['campaign_trackings', 'optimization_logs'];

/**
 * Inicia o loop de sincronização em background.
 * @param {Object} supabase - Cliente Supabase autenticado
 * @param {Function} getAgencyId - Função que retorna o agencyId atual
 */
export function startSync(supabase, getAgencyId) {
  if (intervalId) {
    console.log('[SyncEngine] Já está rodando.');
    return;
  }

  console.log('[SyncEngine] ▶️ Iniciando sync em background (a cada 30s)');
  
  // Processar imediatamente na primeira vez
  processQueue(supabase, getAgencyId);
  
  // Loop recorrente
  intervalId = setInterval(() => {
    processQueue(supabase, getAgencyId);
  }, SYNC_INTERVAL);
}

/**
 * Para o loop de sincronização.
 */
export function stopSync() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SyncEngine] ⏹️ Sync parado.');
  }
}

/**
 * Processa todas as operações pendentes na fila.
 * @param {Object} supabase - Cliente Supabase
 * @param {Function} getAgencyId - Função que retorna agencyId
 */
export async function processQueue(supabase, getAgencyId) {
  if (isSyncing) {
    console.log('[SyncEngine] Sync já em andamento, pulando...');
    return;
  }

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const agencyId = getAgencyId();
  if (!agencyId) {
    console.warn('[SyncEngine] Sem agencyId, pulando sync.');
    return;
  }

  isSyncing = true;
  emitEvent('sync-start', { pending: queue.length });

  let successCount = 0;
  let errorCount = 0;

  // Processar apenas items com retries < MAX_RETRIES
  const pending = queue.filter(q => q.retries < MAX_RETRIES);
  
  for (const item of pending) {
    try {
      const result = await processItem(supabase, item, agencyId);
      
      if (result.success) {
        removeSyncItem(item.id);
        successCount++;
      } else {
        updateSyncItem(item.id, {
          retries: item.retries + 1,
          lastError: result.error,
          lastAttempt: Date.now()
        });
        errorCount++;
        console.warn(`[SyncEngine] Falha em ${item.action} ${item.table}:`, result.error);
      }
    } catch (err) {
      updateSyncItem(item.id, {
        retries: item.retries + 1,
        lastError: err.message,
        lastAttempt: Date.now()
      });
      errorCount++;
      console.error(`[SyncEngine] Exceção em ${item.action} ${item.table}:`, err);
    }
  }

  if (successCount > 0) {
    setLastSyncTime();
  }

  isSyncing = false;

  const stats = getSyncStats();
  emitEvent('sync-complete', {
    synced: successCount,
    errors: errorCount,
    remaining: stats.pending
  });

  if (successCount > 0) {
    console.log(`[SyncEngine] ✅ ${successCount} sincronizado(s), ${errorCount} erro(s), ${stats.pending} pendente(s)`);
  }
}

/**
 * Processa uma operação individual.
 * @param {Object} supabase
 * @param {Object} item - Item da fila de sync
 * @param {string} agencyId
 * @returns {{ success: boolean, error?: string }}
 */
async function processItem(supabase, item, agencyId) {
  const { action, table, payload, itemId } = item;
  const isStructured = STRUCTURED_TABLES.includes(table);

  try {
    switch (action) {
      case 'insert': {
        let insertPayload;
        if (isStructured) {
          insertPayload = { ...payload, user_id: agencyId };
        } else {
          insertPayload = { id: itemId, user_id: agencyId, data: payload };
        }

        const { error } = await supabase.from(table).upsert(insertPayload, {
          onConflict: 'id'
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      case 'update': {
        let updatePayload;
        if (isStructured) {
          updatePayload = { ...payload };
          delete updatePayload.id;
          delete updatePayload.user_id;
          delete updatePayload._dbId;
        } else {
          updatePayload = { data: payload };
        }

        const { error } = await supabase
          .from(table)
          .update(updatePayload)
          .eq('id', itemId)
          .eq('user_id', agencyId);

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      case 'delete': {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', itemId)
          .eq('user_id', agencyId);

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      default:
        return { success: false, error: `Ação desconhecida: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Força uma sincronização imediata (fora do intervalo).
 * @param {Object} supabase
 * @param {Function} getAgencyId
 */
export async function forceSync(supabase, getAgencyId) {
  await processQueue(supabase, getAgencyId);
}

/**
 * Retorna se o engine está ativo.
 */
export function isRunning() {
  return intervalId !== null;
}

/**
 * Retorna se está processando agora.
 */
export function isBusy() {
  return isSyncing;
}

// ── Eventos Customizados ──────────────────────────────────────

function emitEvent(name, detail) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch (e) {
    // Silenciar erros de evento em ambientes sem window
  }
}
