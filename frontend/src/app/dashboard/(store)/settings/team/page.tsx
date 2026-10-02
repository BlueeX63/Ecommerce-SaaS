"use client";

import { useState, useEffect } from "react";
import { UserPlus, Shield, ShieldCheck, UserX, UserCheck, Trash2, Pencil, X, ShieldPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CustomSelect } from "@/components/CustomSelect";

type User = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_date: string;
  role: string;
};

type Role = {
  role_id: string;
  role_name: string;
  description: string | null;
  status: string;
  created_date: string;
};

type Invite = {
  jti: string;
  email: string;
  roleId: string | null;
  invitedDate: string;
};

type PermissionModule = {
  module_id: string;
  module_name: string;
  permissions: { permission_id: string; permission_name: string; permission_code: string; description: string | null }[];
};

type RoleForm = { roleName: string; description: string; permissionIds: Set<string> };

const EMPTY_ROLE_FORM: RoleForm = { roleName: "", description: "", permissionIds: new Set() };

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"members" | "roles">("members");

  // Members
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Invites
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  // Roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>(EMPTY_ROLE_FORM);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/v1/users");
      if (res.ok) setUsers((await res.json()).data || []);
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/v1/roles");
      if (res.ok) setRoles((await res.json()).data || []);
    } catch {
      console.error("Failed to fetch roles");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/v1/users/invites");
      if (res.ok) setInvites((await res.json()).data || []);
    } catch {
      console.error("Failed to fetch invites");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchInvites();
  }, []);

  // --- Members ---
  const toggleStatus = async (id: string, current: string) => {
    setBusyUserId(id);
    setMemberError(null);
    try {
      const nextStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/v1/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.user_id === id ? { ...u, status: nextStatus } : u)));
      } else {
        const data = await res.json();
        setMemberError(data.error || "Failed to update user");
      }
    } finally {
      setBusyUserId(null);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Remove this teammate? They will lose access to your workspace immediately.")) return;
    setBusyUserId(id);
    setMemberError(null);
    try {
      const res = await fetch(`/api/v1/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.user_id !== id));
      } else {
        const data = await res.json();
        setMemberError(data.error || "Failed to remove user");
      }
    } finally {
      setBusyUserId(null);
    }
  };

  const assignRole = async (id: string, roleName: string) => {
    const role = roles.find((r) => r.role_name === roleName);
    setBusyUserId(id);
    setMemberError(null);
    try {
      const res = await fetch(`/api/v1/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: roleName === "Member" ? null : role?.role_id ?? null }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.user_id === id ? { ...u, role: roleName } : u)));
      } else {
        const data = await res.json();
        setMemberError(data.error || "Failed to assign role");
      }
    } finally {
      setBusyUserId(null);
    }
  };

  // --- Invites ---
  const openInviteModal = () => {
    setInviteEmail("");
    setInviteRoleId("");
    setInviteError(null);
    setIsInviteModalOpen(true);
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingInvite(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/v1/users/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, roleId: inviteRoleId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsInviteModalOpen(false);
        fetchInvites();
      } else {
        setInviteError(data.error || "Failed to send invite");
      }
    } catch {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const revokeInvite = async (jti: string) => {
    if (!confirm("Revoke this invitation? The link will stop working immediately.")) return;
    setBusyInviteId(jti);
    try {
      const res = await fetch(`/api/v1/users/invites/${jti}`, { method: "DELETE" });
      if (res.ok) setInvites((prev) => prev.filter((inv) => inv.jti !== jti));
    } finally {
      setBusyInviteId(null);
    }
  };

  // --- Roles ---
  const loadModules = async () => {
    if (modules.length > 0) return;
    const res = await fetch("/api/v1/roles/permissions");
    if (res.ok) setModules((await res.json()).data || []);
  };

  const openAddRole = async () => {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setRoleError(null);
    setIsRoleModalOpen(true);
    await loadModules();
  };

  const openEditRole = async (role: Role) => {
    setEditingRole(role);
    setRoleError(null);
    setIsRoleModalOpen(true);
    await loadModules();
    const res = await fetch(`/api/v1/roles/${role.role_id}`);
    if (res.ok) {
      const data = await res.json();
      const assigned: string[] = (data.data?.role_permissions || []).map((rp: { permission_id: string }) => rp.permission_id);
      setRoleForm({ roleName: role.role_name, description: role.description ?? "", permissionIds: new Set(assigned) });
    } else {
      setRoleForm({ roleName: role.role_name, description: role.description ?? "", permissionIds: new Set() });
    }
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm((prev) => {
      const next = new Set(prev.permissionIds);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return { ...prev, permissionIds: next };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRole(true);
    setRoleError(null);
    try {
      const isEdit = !!editingRole;
      const res = await fetch(isEdit ? `/api/v1/roles/${editingRole!.role_id}` : "/api/v1/roles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: roleForm.roleName,
          description: roleForm.description || undefined,
          permissions: Array.from(roleForm.permissionIds),
        }),
      });
      if (res.ok) {
        setIsRoleModalOpen(false);
        fetchRoles();
      } else {
        const data = await res.json();
        setRoleError(data.error || `Failed to ${isEdit ? "update" : "create"} role`);
      }
    } catch {
      setRoleError("Something went wrong. Please try again.");
    } finally {
      setIsSavingRole(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (!confirm(`Delete the "${role.role_name}" role? This cannot be undone.`)) return;
    setBusyRoleId(role.role_id);
    try {
      const res = await fetch(`/api/v1/roles/${role.role_id}`, { method: "DELETE" });
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.role_id !== role.role_id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete role");
      }
    } finally {
      setBusyRoleId(null);
    }
  };

  const roleAssignOptions = [{ value: "Member", label: "Member" }, ...roles.filter((r) => r.status === "ACTIVE").map((r) => ({ value: r.role_name, label: r.role_name }))];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-1">Team & Roles</h2>
          <p className="text-secondary text-sm">Manage who has access to your workspace, and what they can do.</p>
        </div>
        {tab === "members" ? (
          <button
            onClick={openInviteModal}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        ) : (
          <button
            onClick={openAddRole}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
          >
            <ShieldPlus className="w-4 h-4" />
            Create Role
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-black/[0.06]">
        <button
          onClick={() => setTab("members")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "members" ? "border-black text-primary" : "border-transparent text-secondary hover:text-primary"}`}
        >
          Members
        </button>
        <button
          onClick={() => setTab("roles")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "roles" ? "border-black text-primary" : "border-transparent text-secondary hover:text-primary"}`}
        >
          Roles & Permissions
        </button>
      </div>

      {tab === "members" ? (
        <>
          {memberError && <p className="text-sm text-red-600">{memberError}</p>}
          <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.02] border-b border-black/[0.08]">
                  <tr>
                    <th className="px-6 py-4 font-medium text-primary">Name</th>
                    <th className="px-6 py-4 font-medium text-primary">Email</th>
                    <th className="px-6 py-4 font-medium text-primary">Role</th>
                    <th className="px-6 py-4 font-medium text-primary">Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-secondary">
                        <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-secondary">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.user_id === user?.userId;
                      const isOwner = u.role === "Owner";
                      return (
                        <tr key={u.user_id} className="hover:bg-black/[0.01]">
                          <td className="px-6 py-4 font-medium text-primary">
                            {u.first_name} {u.last_name}
                            {isSelf && <span className="ml-2 text-[10px] uppercase bg-black/5 px-2 py-0.5 rounded-full text-black/60">You</span>}
                          </td>
                          <td className="px-6 py-4 text-secondary">{u.email}</td>
                          <td className="px-6 py-4">
                            {isOwner || isSelf ? (
                              <div className="flex items-center gap-1.5 text-secondary">
                                {isOwner ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                <span>{u.role}</span>
                              </div>
                            ) : (
                              <div className="w-40">
                                <CustomSelect value={u.role} onChange={(v) => assignRole(u.user_id, v)} options={roleAssignOptions} />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isOwner || isSelf ? (
                              <span className="text-xs text-secondary/60">—</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => toggleStatus(u.user_id, u.status)}
                                  disabled={busyUserId === u.user_id}
                                  title={u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                                  className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                                >
                                  {u.status === "ACTIVE" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => removeUser(u.user_id)}
                                  disabled={busyUserId === u.user_id}
                                  title="Remove from workspace"
                                  className="p-1.5 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {invites.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-medium text-primary">Pending Invites</h3>
              <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white divide-y divide-black/[0.04]">
                {invites.map((inv) => (
                  <div key={inv.jti} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary">{inv.email}</p>
                      <p className="text-xs text-secondary">
                        Invited {new Date(inv.invitedDate).toLocaleDateString()}
                        {inv.roleId && roles.find((r) => r.role_id === inv.roleId) ? ` · ${roles.find((r) => r.role_id === inv.roleId)!.role_name}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => revokeInvite(inv.jti)}
                      disabled={busyInviteId === inv.jti}
                      className="p-1.5 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50"
                      title="Revoke invite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.02] border-b border-black/[0.08]">
                <tr>
                  <th className="px-6 py-4 font-medium text-primary">Role</th>
                  <th className="px-6 py-4 font-medium text-primary">Description</th>
                  <th className="px-6 py-4 font-medium text-primary">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {isLoadingRoles ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-secondary">
                      <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-secondary">
                      No custom roles yet. Everyone besides the owner is a plain Member until you create one.
                    </td>
                  </tr>
                ) : (
                  roles.map((r) => (
                    <tr key={r.role_id} className="hover:bg-black/[0.01]">
                      <td className="px-6 py-4 font-medium text-primary">{r.role_name}</td>
                      <td className="px-6 py-4 text-secondary">{r.description || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditRole(r)} className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRole(r)}
                            disabled={busyRoleId === r.role_id}
                            className="p-1.5 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-heading font-semibold">{editingRole ? "Edit Role" : "Create Role"}</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRole} className="p-6 space-y-5 overflow-y-auto">
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Role Name</label>
                  <input
                    required
                    type="text"
                    value={roleForm.roleName}
                    onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Description (Optional)</label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-primary mb-2 block">Permissions</label>
                {modules.length === 0 ? (
                  <p className="text-sm text-secondary">Loading permissions...</p>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {modules.map((mod) => (
                      <div key={mod.module_id}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">{mod.module_name}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mod.permissions.map((perm) => (
                            <label
                              key={perm.permission_id}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-black/[0.02] cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={roleForm.permissionIds.has(perm.permission_id)}
                                onChange={() => togglePermission(perm.permission_id)}
                                className="mt-0.5"
                              />
                              <span>
                                <span className="text-primary">{perm.permission_name}</span>
                                {perm.description && <span className="block text-xs text-secondary">{perm.description}</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {roleError && <p className="text-sm text-red-600">{roleError}</p>}
              <div className="flex justify-end gap-3 pt-2 border-t border-black/[0.04]">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSavingRole ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-heading font-semibold">Invite User</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={sendInvite} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Email Address</label>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Role (Optional)</label>
                <CustomSelect
                  value={inviteRoleId}
                  onChange={setInviteRoleId}
                  placeholder="Member (default)"
                  options={roles.filter((r) => r.status === "ACTIVE").map((r) => ({ value: r.role_id, label: r.role_name }))}
                />
              </div>
              <p className="text-xs text-secondary">
                We&apos;ll email them a link to create their account and join your workspace. The invite expires in 7 days.
              </p>
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSendingInvite ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
