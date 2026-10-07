import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { UserRole } from '../types/pos';

export const LoginView: React.FC = () => {
  const { login, quickLogin, settings, users } = usePOS();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(username, password);
    if (!res.success) {
      setError(res.message || 'Invalid username or password.');
    }
  };

  const roleLabels: Record<UserRole, { label: string; desc: string; access: string[] }> = {
    owner: {
      label: 'Owner',
      desc: 'Full system control, User Management, tax rates & financial reports',
      access: ['User Management', 'Tax & GST Config', 'Menu & Pricing', 'All Reports'],
    },
    manager: {
      label: 'Manager',
      desc: 'Floor operations, order management, kitchen oversight & settlements',
      access: ['Floor & Tables', 'Kitchen KOT', 'Billing & Discounts', 'Reports'],
    },
    cashier: {
      label: 'Cashier',
      desc: 'Handles table bills, cash & UPI payments, change calculation and receipts',
      access: ['Billing Counter', 'Cash / UPI / Card', 'Print Receipts', 'Daily Sales'],
    },
    waiter: {
      label: 'Waiter',
      desc: 'Takes customer table orders, manages food items, and sends KOT to kitchen',
      access: ['Table Map', 'Menu & Order Cart', 'Send KOT Tickets', 'Order Status'],
    },
    kitchen: {
      label: 'Kitchen Chef',
      desc: 'Live kitchen order screen (KDS) to track preparation and mark dishes ready',
      access: ['Kitchen KDS View', 'KOT Tickets', 'Status Stepper', 'Dish Notes'],
    },
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 text-white font-bold text-xl shadow-md mb-3">
          ₹
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {settings.name || 'PRIMECENTURY RESTAURANT & CAFE'}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Professional Restaurant Point of Sale System</p>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Manual Credentials Box */}
        <div className="lg:col-span-5 bg-white py-8 px-6 shadow-sm border border-neutral-200 rounded-2xl">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-neutral-900">Sign In to POS</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Enter your staff username and password to proceed
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-200">
            <p className="text-[11px] text-neutral-500 leading-relaxed text-center">
              Owner Account: <span className="font-semibold text-neutral-800">admin</span>
            </p>
          </div>
        </div>

        {/* Registered Users & Instant Role Selector */}
        <div className="lg:col-span-7 bg-white p-6 shadow-sm border border-neutral-200 rounded-2xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Registered Staff Accounts ({users.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Select an account to sign in or test that role&apos;s interface
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {users.map((user) => {
              const details = roleLabels[user.role];
              const isOwner = user.role === 'owner';

              return (
                <div
                  key={user.id}
                  className={`p-3.5 border rounded-xl transition-all ${
                    user.isActive
                      ? 'border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/70'
                      : 'border-neutral-200 bg-neutral-50/70 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">{user.name}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          @{user.username}
                        </span>
                        {!user.isActive && (
                          <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded font-semibold">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">{details?.desc}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-neutral-500">
                        {details?.access.map((acc, i) => (
                          <span key={i} className="flex items-center gap-1 text-neutral-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {acc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (user.isActive) {
                          quickLogin(user.role);
                        } else {
                          setError('This account has been disabled. Please contact the Owner.');
                        }
                      }}
                      disabled={!user.isActive}
                      className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs ${
                        user.isActive
                          ? 'text-neutral-900 bg-neutral-100 hover:bg-neutral-900 hover:text-white'
                          : 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                      }`}
                    >
                      <span>Sign In as {details?.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
