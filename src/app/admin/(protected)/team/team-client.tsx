"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  ShieldCheck,
  ChefHat,
  Crown,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  avatarUrl?: string | null;
  createdAt: string;
}

interface TeamClientProps {
  hotelName: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "OWNER" | "MANAGER" | "STAFF";
  };
}

export function TeamClient({ hotelName, currentUser }: TeamClientProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER" | "STAFF">("STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = currentUser.role === "OWNER" || currentUser.role === "MANAGER";

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/hotel/users")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load team members"))))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setMembers(data);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/hotel/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add team member");
      }

      setMembers((prev) => [...prev, data.user]);
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      setSuccess(`Successfully invited ${data.user.name} as ${data.user.role}.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "OWNER" | "MANAGER" | "STAFF") => {
    setUpdatingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/hotel/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: data.user.role } : m))
      );
      setSuccess(`Updated role for ${data.user.name} to ${data.user.role}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${memberName}?`)) return;

    setDeletingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/hotel/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove team member");
      }

      setMembers((prev) => prev.filter((m) => m.id !== userId));
      setSuccess(`Removed ${memberName} from the property team.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const ownersCount = members.filter((m) => m.role === "OWNER").length;
  const managersCount = members.filter((m) => m.role === "MANAGER").length;
  const staffCount = members.filter((m) => m.role === "STAFF").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            Access Control & Staff Roster
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Staff & Team Members
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            Manage who has access to update menus, toggle kitchen availability, and moderate guest reviews for {hotelName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs font-semibold uppercase tracking-wider text-gold-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Your Role: {currentUser.role}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Total Team
          </div>
          <div className="font-serif text-3xl font-semibold text-foreground">
            {members.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active property accounts</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Owners
          </div>
          <div className="font-serif text-3xl font-semibold text-foreground flex items-center gap-2">
            {ownersCount}
            <Crown className="w-4 h-4 text-gold-500" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">Full property administrators</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Managers
          </div>
          <div className="font-serif text-3xl font-semibold text-foreground flex items-center gap-2">
            {managersCount}
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">F&B and operations leads</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Staff & Kitchen
          </div>
          <div className="font-serif text-3xl font-semibold text-foreground flex items-center gap-2">
            {staffCount}
            <ChefHat className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">Kitchen & service crew</div>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Team Members List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-500" />
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Active Team Members ({members.length})
                </h3>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Loading team directory...
              </div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                No team members found. Invite your first colleague using the form.
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const isSelf = member.id === currentUser.id;
                  return (
                    <div
                      key={member.id}
                      className="p-4 rounded-2xl bg-secondary/30 border border-border hover:border-gold-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-400 font-serif font-bold text-sm flex items-center justify-center border border-gold-500/30 shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 text-[10px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-muted-foreground/70" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {canManage && !isSelf ? (
                          <select
                            value={member.role}
                            disabled={updatingId === member.id}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.id,
                                e.target.value as "OWNER" | "MANAGER" | "STAFF"
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-gold-500 disabled:opacity-50"
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="STAFF">STAFF</option>
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-wider border ${
                              member.role === "OWNER"
                                ? "bg-gold-500/10 text-gold-500 border-gold-500/30"
                                : member.role === "MANAGER"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            }`}
                          >
                            {member.role}
                          </span>
                        )}

                        {canManage && !isSelf && (
                          <button
                            type="button"
                            disabled={deletingId === member.id}
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
                            title="Remove staff member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Role Permissions Guide */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-subtle space-y-3">
            <h4 className="font-serif text-sm font-semibold text-foreground">
              Role Permissions Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1">
                <div className="font-bold text-gold-500 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> OWNER
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Full control: property branding, currency, menu creation &amp; deletion, inviting managers/owners, reviewing analytics.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1">
                <div className="font-bold text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> MANAGER
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Menu builder, category and dish CRUD, review moderation, batch photo matching, and staff invitations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/70 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5" /> STAFF
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Kitchen 86&apos;d availability toggling, dish price edits, viewing public menus and customer feedback.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite New Team Member Form */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-subtle space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/70">
              <UserPlus className="w-4 h-4 text-gold-500" />
              <h3 className="font-serif text-lg font-medium text-foreground">
                Add Team Member
              </h3>
            </div>

            {canManage ? (
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef Laurent Blanc"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. chef@grandazure.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Initial Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Access Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "OWNER" | "MANAGER" | "STAFF")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                  >
                    <option value="STAFF">STAFF — Kitchen 86&apos;d availability &amp; dish viewing</option>
                    <option value="MANAGER">MANAGER — Full menu builder &amp; operations</option>
                    {currentUser.role === "OWNER" && (
                      <option value="OWNER">OWNER — Full property management</option>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {submitting ? "Creating Account..." : "Create Team Account"}
                </button>
              </form>
            ) : (
              <div className="p-4 text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                You are currently signed in as <strong>{currentUser.role}</strong>. Only <strong>OWNER</strong> and <strong>MANAGER</strong> accounts can invite new team members.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
