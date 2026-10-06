import { db } from '../lib/supabase.js';
import { kvDel } from '../lib/kv.js';

const AUDIT_LOG_KEY = 'super_admin_activity_log';
const MAX_ENTRIES_PER_TENANT = 200;

/** Shared with controllers/super-admin.controller.ts's getOverview cache - kept here too since every
 *  curated action ends up calling logSuperAdminAction, which is the one place guaranteed not to be
 *  forgotten as new actions are added. */
const OVERVIEW_CACHE_KEY = 'super-admin:overview';

export interface AuditEntry {
  action: string;
  actorEmail: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Every action a super admin takes against a tenant - including starting an impersonation session - is
 * logged here, scoped to that tenant's own settings row (same pattern as pending_invites). There is no
 * dedicated audit table (no migration path - see lib/super-admins.ts), so this piggybacks on the existing
 * generic key/value settings table instead. Capped per tenant so it can never grow unbounded.
 */
export async function logSuperAdminAction(
  tenantId: string,
  actorEmail: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const { data } = await db
      .from('tenant_settings')
      .select('setting_value')
      .eq('tenant_id', tenantId)
      .eq('setting_key', AUDIT_LOG_KEY)
      .maybeSingle();

    let entries: AuditEntry[] = [];
    if (data?.setting_value) {
      try {
        const parsed = JSON.parse(data.setting_value);
        if (Array.isArray(parsed)) entries = parsed;
      } catch {
        entries = [];
      }
    }

    entries.unshift({ action, actorEmail, timestamp: new Date().toISOString(), details });
    entries = entries.slice(0, MAX_ENTRIES_PER_TENANT);

    await db.from('tenant_settings').upsert(
      { tenant_id: tenantId, setting_key: AUDIT_LOG_KEY, setting_value: JSON.stringify(entries) },
      { onConflict: 'tenant_id,setting_key' },
    );

    // So an operator's own action is reflected on the Overview page immediately rather than waiting
    // out the cache TTL.
    await kvDel(OVERVIEW_CACHE_KEY).catch(() => {});
  } catch (error) {
    // Never let audit logging itself block or fail the underlying action.
    console.error('[super-admin-audit] failed to log action', { tenantId, action, error });
  }
}

export async function getAuditLog(tenantId: string): Promise<AuditEntry[]> {
  const { data } = await db
    .from('tenant_settings')
    .select('setting_value')
    .eq('tenant_id', tenantId)
    .eq('setting_key', AUDIT_LOG_KEY)
    .maybeSingle();

  if (!data?.setting_value) return [];
  try {
    const parsed = JSON.parse(data.setting_value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadAllActivitySorted(): Promise<Array<AuditEntry & { tenantId: string }>> {
  const { data } = await db.from('tenant_settings').select('tenant_id, setting_value').eq('setting_key', AUDIT_LOG_KEY);

  const all: Array<AuditEntry & { tenantId: string }> = [];
  for (const row of data ?? []) {
    try {
      const parsed = JSON.parse(row.setting_value);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) all.push({ ...entry, tenantId: row.tenant_id });
      }
    } catch {
      // skip malformed rows
    }
  }

  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Recent super-admin activity across ALL tenants, for the platform overview feed. */
export async function listRecentActivity(limit = 50): Promise<Array<AuditEntry & { tenantId: string }>> {
  const all = await loadAllActivitySorted();
  return all.slice(0, limit);
}

/** Paginated platform-wide activity for the dedicated Audit Log page. */
export async function listActivityPage(
  page: number,
  limit: number,
): Promise<{ data: Array<AuditEntry & { tenantId: string }>; total: number }> {
  const all = await loadAllActivitySorted();
  const offset = (page - 1) * limit;
  return { data: all.slice(offset, offset + limit), total: all.length };
}
