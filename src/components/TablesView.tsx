import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Users,
  Clock,
  PlusCircle,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ChefHat,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TableStatus } from '../types/pos';

export const TablesView: React.FC = () => {
  const {
    tables,
    orders,
    kots,
    setActiveTableId,
    setActiveView,
    createOrGetOrderForTable,
  } = usePOS();

  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billedCount = tables.filter((t) => t.status === 'billed').length;

  const filteredTables = tables.filter((table) => {
    if (statusFilter !== 'all' && table.status !== statusFilter) return false;
    if (sectionFilter !== 'all' && table.section !== sectionFilter) return false;
    return true;
  });

  const handleTableClick = (tableId: number) => {
    setActiveTableId(tableId);
    createOrGetOrderForTable(tableId);
    setActiveView('menu');
  };

  const handleBillingClick = (e: React.MouseEvent, tableId: number) => {
    e.stopPropagation();
    setActiveTableId(tableId);
    setActiveView('billing');
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Table Management (12 Tables)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time floor map. Click any table to start or modify its order.
          </p>
        </div>

        {/* Status badges summary */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All (12)
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                statusFilter === 'occupied'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Occupied ({occupiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('billed')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                statusFilter === 'billed'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Billed ({billedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Section Filters */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-500 font-medium">Floor Area:</span>
        {['all', 'Main Hall', 'Garden Terrace', 'Family AC'].map((sec) => (
          <button
            key={sec}
            onClick={() => setSectionFilter(sec)}
            className={`px-2.5 py-1 rounded-md transition-colors text-xs font-medium ${
              sectionFilter === sec
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {sec === 'all' ? 'All Sections' : sec}
          </button>
        ))}
      </div>

      {/* 12 Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const activeOrder = orders.find((o) => o.id === table.activeOrderId && o.status !== 'paid');
          const itemCount = activeOrder
            ? activeOrder.items.reduce((sum, it) => sum + it.quantity, 0)
            : 0;
          const orderTotal = activeOrder
            ? activeOrder.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
            : 0;

          // Kitchen tickets for this table
          const tableKOTs = kots.filter((k) => k.tableId === table.id && k.status !== 'served');

          const isOccupied = table.status === 'occupied';
          const isBilled = table.status === 'billed';
          const isAvailable = table.status === 'available';

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table.id)}
              className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between h-56 hover:shadow-md ${
                isAvailable
                  ? 'bg-white border-neutral-200 hover:border-emerald-500/70'
                  : isOccupied
                  ? 'bg-amber-50/40 border-amber-300 hover:border-amber-500'
                  : 'bg-blue-50/40 border-blue-300 hover:border-blue-500'
              }`}
            >
              {/* Top Row: Name and Status Badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-neutral-900">{table.name}</span>
                    <span className="text-[10px] text-neutral-500 font-medium px-1.5 py-0.5 bg-neutral-100 rounded">
                      {table.section}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isAvailable && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Available
                    </span>
                  )}
                  {isOccupied && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                      Occupied
                    </span>
                  )}
                  {isBilled && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                      <Receipt className="w-3 h-3" />
                      Billed
                    </span>
                  )}
                </div>

                {/* Capacity & Waiter */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {table.capacity} Seater
                  </span>
                  {activeOrder && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-[110px]">
                        Waiter: {activeOrder.waiterName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Middle: Order details if occupied/billed */}
              <div className="my-2 py-2 border-t border-b border-neutral-100">
                {isAvailable ? (
                  <div className="text-center py-2 text-neutral-400 text-xs">
                    <p>Table is clean & ready</p>
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5 group-hover:text-neutral-800">
                      Click to start order →
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-lg font-bold text-neutral-900 font-mono-numbers">
                        ₹{orderTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Active KOTs indicator */}
                    {tableKOTs.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-neutral-600">
                        <ChefHat className="w-3 h-3 text-purple-600" />
                        <span>KOT: {tableKOTs.map((k) => `#${k.kotNumber}`).join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-2 pt-1">
                {isAvailable ? (
                  <button
                    onClick={() => handleTableClick(table.id)}
                    className="w-full py-2 px-3 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Take Order</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleTableClick(table.id)}
                      className="flex-1 py-1.5 px-2.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors text-center truncate"
                    >
                      View / Add Items
                    </button>
                    <button
                      onClick={(e) => handleBillingClick(e, table.id)}
                      className="py-1.5 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Bill</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
