"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Power, RefreshCw, Trash2, UserPlus, X } from "lucide-react";
import { Bone } from "@/components/dashboard/Skeletons";

interface Employee {
  employee_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
}

const EMPLOYEE_PANEL_URL = (process.env.NEXT_PUBLIC_EMPLOYEE_URL || "http://localhost:3002").replace(/\/$/, "");

/** A strong random password that satisfies the platform's password rules. */
function generatePassword(): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  const chars = sets.map((set, i) => set[bytes[i] % set.length]);
  for (let i = sets.length; i < bytes.length; i++) chars.push(all[bytes[i] % all.length]);
  // Shuffle so the guaranteed characters aren't always first.
  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  return chars.map((c, i) => [c, order[i]] as const).sort((a, b) => a[1] - b[1]).map(([c]) => c).join("");
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // clipboard unavailable - the value stays selectable on screen
        }
      }}
      className="shrink-0 p-1.5 rounded-md text-secondary hover:bg-black/5 hover:text-primary"
    >
      {done ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export function WarehouseEmployeesModal({ warehouseId, warehouseName, onClose, onChanged }: { warehouseId: string; warehouseName: string; onClose: () => void; onChanged: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetting, setResetting] = useState<{ id: string; password: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/warehouses/${warehouseId}/employees`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load employees");
      setEmployees(data.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (url: string, init: RequestInit) => {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(Array.isArray(data.details) && data.details.length ? data.details.join(" · ") : data.error || "Request failed");
    return data;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await call(`/api/v1/warehouses/${warehouseId}/employees`, { method: "POST", body: JSON.stringify(form) });
      setCreated({ name: form.fullName, email: form.email, password: form.password });
      setForm({ fullName: "", email: "", password: "" });
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the employee");
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await call(`/api/v1/warehouses/${warehouseId}/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the employee");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (emp: Employee) => {
    if (!confirm(`Remove ${emp.full_name}? They will no longer be able to sign in.`)) return;
    setBusyId(emp.employee_id);
    setError(null);
    try {
      await call(`/api/v1/warehouses/${warehouseId}/employees/${emp.employee_id}`, { method: "DELETE" });
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the employee");
    } finally {
      setBusyId(null);
    }
  };

  const input = "w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Employees at ${warehouseName}`}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-heading font-semibold">Employees · {warehouseName}</h2>
            <p className="text-sm text-secondary mt-0.5">They sign in on the employee panel and can only manage this warehouse&apos;s stock, settings and orders.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</p>}

          {created && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-sm space-y-2">
              <p className="font-semibold text-green-900">{created.name} can now sign in. Share these details securely:</p>
              <div className="bg-white rounded-lg border border-green-100 divide-y divide-green-50">
                {[
                  ["Sign-in page", EMPLOYEE_PANEL_URL],
                  ["Email", created.email],
                  ["Password", created.password],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-xs text-secondary w-24 shrink-0">{k}</span>
                    <span className="font-mono text-xs break-all flex-1 select-all">{v}</span>
                    <CopyButton value={v} label={k} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-800">The password isn&apos;t shown again. You can set a new one at any time.</p>
              <button onClick={() => setCreated(null)} className="text-xs font-semibold text-green-900 underline">Done</button>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-primary mb-3">Team</h3>
            {loading ? (
              <div className="space-y-2" role="status" aria-busy="true">
                <Bone className="h-12 w-full" />
                <Bone className="h-12 w-full" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-sm text-secondary py-4 text-center border border-dashed border-black/10 rounded-xl">No employees yet. Create sign-in details below.</p>
            ) : (
              <ul className="divide-y divide-black/[0.05] border border-black/[0.06] rounded-xl">
                {employees.map((emp) => (
                  <li key={emp.employee_id} className="p-3.5 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-primary text-sm flex items-center gap-2">
                        {emp.full_name}
                        {!emp.is_active && <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-gray-100 text-gray-600">Disabled</span>}
                      </p>
                      <p className="text-xs text-secondary truncate">{emp.email} · {emp.last_login ? `last sign-in ${new Date(emp.last_login).toLocaleDateString()}` : "never signed in"}</p>
                    </div>
                    {resetting?.id === emp.employee_id ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input value={resetting.password} onChange={(e) => setResetting({ id: emp.employee_id, password: e.target.value })} placeholder="New password" className={`${input} font-mono sm:w-52`} />
                        <button type="button" onClick={() => setResetting({ id: emp.employee_id, password: generatePassword() })} className="p-2 rounded-md hover:bg-black/5" aria-label="Generate password"><RefreshCw className="w-4 h-4" /></button>
                        <button
                          type="button"
                          disabled={busyId === emp.employee_id || !resetting.password}
                          onClick={async () => {
                            await patch(emp.employee_id, { password: resetting.password });
                            setCreated({ name: emp.full_name, email: emp.email, password: resetting.password });
                            setResetting(null);
                          }}
                          className="px-3 py-2 bg-black text-white rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setResetting(null)} className="text-xs text-secondary">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setResetting({ id: emp.employee_id, password: generatePassword() })} className="p-2 rounded-md text-secondary hover:bg-black/5 hover:text-primary" title="Set a new password"><KeyRound className="w-4 h-4" /></button>
                        <button type="button" disabled={busyId === emp.employee_id} onClick={() => patch(emp.employee_id, { isActive: !emp.is_active })} className="p-2 rounded-md text-secondary hover:bg-black/5 hover:text-primary disabled:opacity-50" title={emp.is_active ? "Disable sign-in" : "Enable sign-in"}>
                          {busyId === emp.employee_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button type="button" onClick={() => remove(emp)} className="p-2 rounded-md text-secondary hover:bg-red-50 hover:text-red-600" title="Remove"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={create} className="space-y-3 pt-5 border-t border-black/[0.06]">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><UserPlus className="w-4 h-4" /> Onboard an employee</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required aria-label="Full name" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={input} />
              <input required type="email" aria-label="Email (used to sign in)" placeholder="Email (used to sign in)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
            </div>
            <div className="flex gap-2">
              <input required aria-label="Password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${input} font-mono`} />
              <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })} className="shrink-0 flex items-center gap-1.5 px-3.5 border border-black/10 rounded-lg text-xs font-medium hover:bg-black/5">
                <RefreshCw className="w-3.5 h-3.5" /> Generate
              </button>
            </div>
            <p className="text-xs text-secondary">At least 8 characters with upper and lower case, a number and a symbol.</p>
            <div className="flex justify-end">
              <button type="submit" disabled={creating} className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-50 flex items-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
