import React from 'react';
import { Printer, X, ChefHat } from 'lucide-react';
import { KOT } from '../types/pos';
import { usePOS } from '../context/POSContext';

interface KOTModalProps {
  kot: KOT;
  onClose: () => void;
}

export const KOTModal: React.FC<KOTModalProps> = ({ kot, onClose }) => {
  const { settings } = usePOS();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold tracking-wide">KOT Ticket #{kot.kotNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable KOT Area */}
        <div className="p-5 bg-white text-neutral-900 font-mono-numbers text-xs leading-relaxed" id="printable-receipt">
          <div className="text-center pb-2 border-b-2 border-neutral-900">
            <h2 className="text-base font-black tracking-wide uppercase">KITCHEN ORDER TICKET</h2>
            <p className="text-xs font-semibold">{settings.name}</p>
          </div>

          <div className="py-2 border-b border-dashed border-neutral-400 text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-neutral-900">TABLE {kot.tableId}</span>
              <span className="font-bold text-sm bg-neutral-100 px-2 py-0.5 rounded">KOT #{kot.kotNumber}</span>
            </div>
            <div className="flex justify-between text-neutral-600 text-[11px]">
              <span>Order: {kot.orderId}</span>
              <span>Waiter: {kot.waiterName}</span>
            </div>
            <div className="text-neutral-500 text-[10px]">
              Time: {new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Items */}
          <div className="py-3 border-b-2 border-neutral-900">
            <div className="flex justify-between font-bold text-xs pb-1 mb-1 border-b border-neutral-300">
              <span>ITEM</span>
              <span>QTY</span>
            </div>
            <div className="space-y-2 pt-1">
              {kot.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div>
                    <div className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                      {item.name}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-amber-700 italic pl-3.5 font-sans font-medium">
                        * Note: {item.notes}
                      </div>
                    )}
                  </div>
                  <span className="font-black text-base px-2 py-0.5 bg-neutral-100 rounded">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-neutral-500">
            KOT #{kot.kotNumber} · Status: <span className="uppercase font-bold text-neutral-800">{kot.status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 p-4 bg-neutral-50 border-t border-neutral-200 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print KOT
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
