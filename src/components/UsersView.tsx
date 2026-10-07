import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  KeyRound,
  ShieldCheck,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  Lock,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { User, UserRole } from '../types/pos';

export const UsersView: React.FC = () => {
  const {
    users,
    addUser,
    editUser,
    toggleUserStatus,
    resetUserPassword,
    deleteUser,
    currentUser,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'cashier' | 'waiter' | 'kitchen'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<User | null>(null);
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] = useState<User | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'waiter' as UserRole,
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addError, setAddError] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    role: 'waiter' as UserRole,
  });
  const [editError, setEditError] = useState('');

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Separate Owner account from employees
  const ownerAccount = users.find((u) => u.role === 'owner');
  const employees = users.filter((u) => u.role !== 'owner');

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
    if (statusFilter === 'active' && !emp.isActive) return false;
    if (statusFilter === 'disabled' && emp.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.username.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string }> = {
    owner: { label: 'Owner', bg: 'bg-amber-100', text: 'text-amber-900' },
    manager: { label: 'Manager', bg: 'bg-blue-100', text: 'text-blue-900' },
    cashier: { label: 'Cashier', bg: 'bg-emerald-100', text: 'text-emerald-900' },
    waiter: { label: 'Waiter', bg: 'bg-purple-100', text: 'text-purple-900' },
    kitchen: { label: 'Kitchen', bg: 'bg-rose-100', text: 'text-rose-900' },
  };

  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      username: '',
      password: '',
      role: 'waiter',
    });
    setAddError('');
    setShowAddPassword(false);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const res = addUser({
      name: addForm.name,
      username: addForm.username,
      password: addForm.password,
      role: addForm.role,
    });

    if (res.success) {
      setIsAddModalOpen(false);
      showNotification(`Employee "${addForm.name}" created successfully!`);
    } else {
      setAddError(res.message || 'Could not create employee.');
    }
  };

  const handleOpenEditModal = (emp: User) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      username: emp.username,
      role: emp.role,
    });
    setEditError('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError('');

    const res = editUser(editingEmployee.id, {
      name: editForm.name,
      username: editForm.username,
      role: editForm.role,
    });

    if (res.success) {
      setEditingEmployee(null);
      showNotification(`Employee "${editForm.name}" updated successfully!`);
    } else {
      setEditError(res.message || 'Could not update employee.');
    }
  };

  const handleOpenResetPassword = (emp: User) => {
    setResetPasswordEmployee(emp);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setResetError('');
    setShowNewPassword(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordEmployee) return;
    setResetError('');

    if (newPasswordInput !== confirmPasswordInput) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    const res = resetUserPassword(resetPasswordEmployee.id, newPasswordInput);
    if (res.success) {
      setResetPasswordEmployee(null);
      showNotification(`Password for "${resetPasswordEmployee.name}" reset successfully.`);
    } else {
      setResetError(res.message || 'Could not reset password.');
    }
  };

  const handleToggleStatus = (emp: User) => {
    const res = toggleUserStatus(emp.id);
    if (res.success) {
      showNotification(
        emp.isActive
          ? `Employee "${emp.name}" disabled.`
          : `Employee "${emp.name}" enabled.`
      );
    } else {
      alert(res.message || 'Action could not be performed.');
    }
  };

  const handleDeleteEmployee = (emp: User) => {
    const res = deleteUser(emp.id);
    if (res.success) {
      setConfirmDeleteEmployee(null);
      showNotification(`Employee "${emp.name}" deleted.`);
    } else {
      alert(res.message || 'Could not delete employee.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-900 text-white rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                Users & Employee Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Owner-only management · Create employees, assign roles, and manage access
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Toast notification */}
      {actionSuccessMsg && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PROTECTED OWNER ACCOUNT (Kept Separate & Protected)           */}
      {/* ------------------------------------------------------------- */}
      {ownerAccount && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-neutral-900">{ownerAccount.name}</span>
                <span className="font-mono text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  @{ownerAccount.username}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900 text-white uppercase tracking-wider">
                  Owner Account
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                Protected Primary Administrator · Has full authority over restaurant POS & employee operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-white/80 border border-amber-200 px-3 py-1.5 rounded-lg shrink-0">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Protected & Secure</span>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Total Employees
          </span>
          <div className="text-xl font-bold text-neutral-900 mt-1 font-mono-numbers">
            {employees.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Active Status
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono-numbers">
            {employees.filter((u) => u.isActive).length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Waiters & Kitchen
          </span>
          <div className="text-xl font-bold text-purple-700 mt-1 font-mono-numbers">
            {employees.filter((u) => u.role === 'waiter' || u.role === 'kitchen').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Managers & Cashiers
          </span>
          <div className="text-xl font-bold text-blue-700 mt-1 font-mono-numbers">
            {employees.filter((u) => u.role === 'manager' || u.role === 'cashier').length}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees by name, username, or role..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50"
          />
        </div>

        {/* Role & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role selector */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg text-xs">
            {(['all', 'manager', 'cashier', 'waiter', 'kitchen'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors capitalize ${
                  roleFilter === r
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
                statusFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-neutral-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
                statusFilter === 'disabled' ? 'bg-neutral-700 text-white shadow-2xs' : 'text-neutral-600'
              }`}
            >
              Disabled
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Employee Directory ({filteredEmployees.length})
          </h2>
          <span className="text-[11px] text-neutral-500">
            Roles: Manager, Cashier, Waiter, Kitchen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-[10px] uppercase font-bold bg-neutral-50/50">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-center">Active/Disabled Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-400">
                    No employees found. Click &quot;Add New Employee&quot; to add staff.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const roleBadge = roleBadges[emp.role] || {
                    label: emp.role,
                    bg: 'bg-neutral-100',
                    text: 'text-neutral-800',
                  };

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        !emp.isActive ? 'bg-neutral-50/50 opacity-70' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              emp.isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'
                            }`}
                          >
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900">{emp.name}</span>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              ID: {emp.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                          @{emp.username}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${roleBadge.bg} ${roleBadge.text}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Active/Disabled Status */}
                      <td className="px-4 py-3.5 text-center">
                        {emp.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit employee */}
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="px-2 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors inline-flex items-center gap-1"
                            title="Edit employee"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Reset password */}
                          <button
                            onClick={() => handleOpenResetPassword(emp)}
                            className="px-2 py-1 text-xs font-medium text-neutral-700 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors inline-flex items-center gap-1"
                            title="Reset employee password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>

                          {/* Disable / Enable toggle */}
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors inline-flex items-center gap-1 ${
                              emp.isActive
                                ? 'text-rose-700 hover:bg-rose-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={emp.isActive ? 'Disable employee' : 'Enable employee'}
                          >
                            {emp.isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Disable</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Enable</span>
                              </>
                            )}
                          </button>

                          {/* Delete employee */}
                          <button
                            onClick={() => setConfirmDeleteEmployee(emp)}
                            className="p-1.5 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Employee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-900">Add New Employee</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Employee Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Create Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh_waiter"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700"
                  >
                    {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Passwords are kept securely in local storage and never displayed in visible UI.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Role
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                >
                  <option value="manager">Manager (Operations, orders & billing)</option>
                  <option value="cashier">Cashier (Billing counter & settlements)</option>
                  <option value="waiter">Waiter (Table ordering & sending KOTs)</option>
                  <option value="kitchen">Kitchen (KDS food preparation board)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Employee */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-900">Edit Employee</h3>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Employee Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                >
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Employee Password */}
      {resetPasswordEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Reset Password for {resetPasswordEmployee.name}
                </h3>
              </div>
              <button
                onClick={() => setResetPasswordEmployee(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 space-y-1">
                <div>
                  Employee: <span className="font-semibold text-neutral-900">{resetPasswordEmployee.name}</span>
                </div>
                <div>
                  Username: <span className="font-mono text-neutral-900">@{resetPasswordEmployee.username}</span>
                </div>
              </div>

              {resetError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordEmployee(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Confirm Delete Employee */}
      {confirmDeleteEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-neutral-900">Delete Employee?</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-neutral-900">
                {confirmDeleteEmployee.name} (@{confirmDeleteEmployee.username})
              </span>
              ? This action cannot be undone.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteEmployee(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEmployee(confirmDeleteEmployee)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
