"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "badge-danger",
  MANAGER: "badge-warning",
  COUNSELOR: "badge-info",
  RECEPTIONIST: "badge-neutral",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  COUNSELOR: "Counselor",
  RECEPTIONIST: "Receptionist",
};

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "COUNSELOR",
  phone: "",
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"users" | "account">("account");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [savingUser, setSavingUser] = useState(false);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [editingRole, setEditingRole] = useState<Record<string, string>>({});

  const isAdmin = session?.user.role === "ADMIN";

  useEffect(() => {
    if (isAdmin && activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/settings/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    setUserError("");
    setUserSuccess("");
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserError(data.error || "Failed to create user");
        return;
      }
      setUserForm(emptyUserForm);
      setShowAddUser(false);
      setUserSuccess("User created successfully");
      fetchUsers();
      setTimeout(() => setUserSuccess(""), 3000);
    } catch {
      setUserError("Failed to create user");
    } finally {
      setSavingUser(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setEditingRole((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    } catch {
      // ignore
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm("Deactivate this user? They will no longer be able to log in.")) return;
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: false } : u))
        );
      }
    } catch {
      // ignore
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }
      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess("Password updated successfully");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch {
      setPasswordError("Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  function formatLastLogin(date: string | null) {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Manage your account and team settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
        {isAdmin && (
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "users"
                ? "text-white shadow-sm"
                : ""
            }`}
            style={
              activeTab === "users"
                ? { background: "var(--primary)", color: "#fff" }
                : { color: "var(--text-secondary)" }
            }
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        )}
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all`}
          style={
            activeTab === "account"
              ? { background: "var(--primary)", color: "#fff" }
              : { color: "var(--text-secondary)" }
          }
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && isAdmin && (
        <div className="space-y-5">
          {/* Add User Form */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Team Members
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddUser(!showAddUser)}
            >
              {showAddUser ? "Cancel" : "+ Add User"}
            </button>
          </div>

          {userSuccess && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
              {userSuccess}
            </div>
          )}

          {showAddUser && (
            <div className="card p-6 animate-fade-in">
              <h3 className="font-medium mb-4" style={{ color: "var(--text-primary)" }}>
                Add New User
              </h3>
              {userError && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                  {userError}
                </div>
              )}
              <form onSubmit={handleAddUser}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      First Name *
                    </label>
                    <input
                      className="input-base"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Last Name *
                    </label>
                    <input
                      className="input-base"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Email *
                    </label>
                    <input
                      className="input-base"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Password *
                    </label>
                    <input
                      className="input-base"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Role
                    </label>
                    <select
                      className="input-base"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Phone
                    </label>
                    <input
                      className="input-base"
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button type="submit" className="btn btn-primary" disabled={savingUser}>
                    {savingUser ? "Creating..." : "Create User"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setShowAddUser(false); setUserError(""); setUserForm(emptyUserForm); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="card overflow-hidden">
            {loadingUsers ? (
              <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
                Loading users...
              </div>
            ) : (
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {user.firstName} {user.lastName}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                      <td>
                        {editingRole[user.id] !== undefined ? (
                          <div className="flex gap-2 items-center">
                            <select
                              className="input-base text-xs py-1"
                              style={{ width: "130px" }}
                              value={editingRole[user.id]}
                              onChange={(e) =>
                                setEditingRole((prev) => ({ ...prev, [user.id]: e.target.value }))
                              }
                            >
                              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                              ))}
                            </select>
                            <button
                              className="btn btn-primary text-xs py-1 px-2"
                              onClick={() => handleRoleChange(user.id, editingRole[user.id])}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary text-xs py-1 px-2"
                              onClick={() =>
                                setEditingRole((prev) => {
                                  const next = { ...prev };
                                  delete next[user.id];
                                  return next;
                                })
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className={`badge ${ROLE_BADGE[user.role] || "badge-neutral"}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{user.phone || "—"}</td>
                      <td>
                        {user.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-neutral">Inactive</span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {formatLastLogin(user.lastLoginAt)}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {user.id !== session?.user.id && (
                            <>
                              <button
                                className="btn btn-ghost text-xs py-1 px-2"
                                onClick={() =>
                                  setEditingRole((prev) => ({ ...prev, [user.id]: user.role }))
                                }
                              >
                                Edit Role
                              </button>
                              {user.isActive && (
                                <button
                                  className="btn btn-danger text-xs py-1 px-2"
                                  onClick={() => handleDeactivate(user.id)}
                                >
                                  Deactivate
                                </button>
                              )}
                            </>
                          )}
                          {user.id === session?.user.id && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              (You)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6 max-w-xl">
          {/* Current User Info */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Account Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Name</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {session?.user.name}
                </span>
              </div>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Email</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {session?.user.email}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Role</span>
                <span className={`badge ${ROLE_BADGE[session?.user.role || ""] || "badge-neutral"}`}>
                  {ROLE_LABELS[session?.user.role || ""] || session?.user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Change Password
            </h2>

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Current Password
                </label>
                <input
                  className="input-base"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  New Password
                </label>
                <input
                  className="input-base"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Confirm New Password
                </label>
                <input
                  className="input-base"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
