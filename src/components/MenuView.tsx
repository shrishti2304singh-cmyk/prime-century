import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Check,
  AlertCircle,
  FileText,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { MenuCategory, MenuItem } from '../types/pos';

export const MenuView: React.FC = () => {
  const {
    menuItems,
    tables,
    orders,
    activeTableId,
    setActiveTableId,
    createOrGetOrderForTable,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    sendKOT,
    setActiveView,
    currentUser,
  } = usePOS();

  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemNoteInput, setItemNoteInput] = useState<{ [itemId: string]: string }>({});
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [kotSuccessMsg, setKotSuccessMsg] = useState<string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Active table
  const currentTableId = activeTableId || 1;
  const currentTable = tables.find((t) => t.id === currentTableId);

  // Active order for current table
  const activeOrder = orders.find((o) => o.tableId === currentTableId && o.status === 'active');
  const orderItems = activeOrder?.items || [];

  // Derive unique sections from menu items data structure
  const availableSections = Array.from(
    new Set(menuItems.map((m) => m.section || 'Food').filter(Boolean))
  );

  // Derive unique subcategories for currently selected section
  const availableSubcategories = Array.from(
    new Set(
      menuItems
        .filter((m) => selectedSection === 'All' || m.section === selectedSection)
        .map((m) => m.subcategory || m.category || 'General')
        .filter(Boolean)
    )
  );

  // Filtered menu items reading from this data structure
  const filteredMenuItems = menuItems.filter((item) => {
    // Only available items can be ordered
    if (!item.isAvailable) return false;
    if (selectedSection !== 'All' && item.section !== selectedSection) return false;
    const subcat = item.subcategory || item.category;
    if (selectedCategory !== 'All' && subcat !== selectedCategory) return false;
    if (dietFilter === 'veg' && !item.isVeg) return false;
    if (dietFilter === 'nonveg' && item.isVeg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.section && item.section.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Totals
  const subtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const totalItemCount = orderItems.reduce((sum, it) => sum + it.quantity, 0);

  // Unsent KOT items
  const unsentItemsCount = orderItems.reduce(
    (sum, it) => sum + (it.quantity - it.kotSentQuantity),
    0
  );

  const handleAddItem = (item: MenuItem) => {
    addItemToOrder(currentTableId, item);
  };

  const handleSendKOT = () => {
    if (!activeOrder || orderItems.length === 0) return;
    const res = sendKOT(activeOrder.id);
    if (res.success) {
      setKotSuccessMsg(`KOT #${res.kotNumber} sent to kitchen successfully!`);
      setTimeout(() => setKotSuccessMsg(null), 3000);
    } else {
      setKotSuccessMsg(res.message || 'Unable to send KOT.');
      setTimeout(() => setKotSuccessMsg(null), 3000);
    }
  };

  const handleSaveNote = (orderItemId: string) => {
    // Note saved in state
    setEditingNoteFor(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Table Selector & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
        {/* Table Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-neutral-600" />
            <span className="text-xs font-semibold text-neutral-700">Ordering for:</span>
          </div>

          <div className="relative">
            <select
              value={currentTableId}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setActiveTableId(newId);
                createOrGetOrderForTable(newId);
              }}
              className="appearance-none bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.section}) - {t.status.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <span
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
              currentTable?.status === 'occupied'
                ? 'bg-amber-100 text-amber-800'
                : currentTable?.status === 'billed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {currentTable?.status.toUpperCase()}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu dishes..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50"
          />
        </div>
      </div>

      {/* Main Split Layout: Menu Grid (Left) + Order Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Categories & Menu Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section & Subcategory Tabs & Diet Filter */}
          <div className="space-y-2">
            {/* Section Tabs (if multiple sections exist, e.g. Food, Beverages) */}
            {availableSections.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Section:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-lg">
                  <button
                    onClick={() => {
                      setSelectedSection('All');
                      setSelectedCategory('All');
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      selectedSection === 'All'
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    All Sections
                  </button>
                  {availableSections.map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        setSelectedSection(sec);
                        setSelectedCategory('All');
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        selectedSection === sec
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subcategory Tabs & Diet Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Dynamic Subcategories */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-neutral-200 rounded-lg">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  All ({selectedSection})
                </button>
                {availableSubcategories.map((subcat) => (
                  <button
                    key={subcat}
                    onClick={() => setSelectedCategory(subcat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      selectedCategory === subcat
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {subcat}
                  </button>
                ))}
              </div>

              {/* Diet Filter */}
              <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-lg text-xs">
                <button
                  onClick={() => setDietFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    dietFilter === 'all' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietFilter('veg')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    dietFilter === 'veg' ? 'bg-emerald-700 text-white' : 'text-emerald-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Veg
                </button>
                <button
                  onClick={() => setDietFilter('nonveg')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    dietFilter === 'nonveg' ? 'bg-rose-700 text-white' : 'text-rose-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span> Non-Veg
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMenuItems.map((item) => {
              // Check if item is already in active order
              const existingItem = orderItems.find((oi) => oi.menuItemId === item.id);
              const qtyInCart = existingItem ? existingItem.quantity : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-400 rounded-xl p-3.5 transition-all flex flex-col justify-between hover:shadow-xs group"
                >
                  <div>
                    {/* Header: Diet symbol & Section / Subcategory */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3 h-3 rounded-sm border flex items-center justify-center p-0.5 ${
                            item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                        </span>
                        <span className="text-[10px] text-neutral-500 font-semibold truncate max-w-[140px]">
                          {item.section} · {item.subcategory || item.category}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-neutral-900 font-mono-numbers">
                        ₹{item.price}
                      </span>
                    </div>

                    {/* Dish Name */}
                    <h3 className="text-xs font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Optional Availability Timing Badge */}
                    {item.availabilityTiming?.enabled && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200 rounded px-1.5 py-0.5 mt-2 font-mono-numbers w-fit">
                        <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                        <span>
                          {item.availabilityTiming.label ||
                            `${item.availabilityTiming.startTime} - ${item.availabilityTiming.endTime}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add / Quantity buttons */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400">
                      {qtyInCart > 0 ? `${qtyInCart} in order` : 'Available'}
                    </span>

                    {qtyInCart === 0 ? (
                      <button
                        onClick={() => handleAddItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-lg transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-neutral-900 text-white rounded-lg p-0.5">
                        <button
                          onClick={() => {
                            if (existingItem) {
                              updateItemQuantity(activeOrder!.id, existingItem.id, -1);
                            }
                          }}
                          className="p-1 hover:bg-neutral-800 rounded transition-colors text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1.5 font-mono-numbers">
                          {qtyInCart}
                        </span>
                        <button
                          onClick={() => handleAddItem(item)}
                          className="p-1 hover:bg-neutral-800 rounded transition-colors text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-500">
              <p className="text-sm">No dishes found matching your criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setDietFilter('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-semibold text-neutral-900 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Right: Active Table Order Cart (Sticky on Desktop) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl shadow-sm p-4 space-y-4 lg:sticky lg:top-20">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900">
                  {currentTable?.name || `Table ${currentTableId}`} Order
                </h2>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {activeOrder ? `#${activeOrder.orderNumber}` : 'New'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Waiter: {currentUser?.name || 'Staff'} · {totalItemCount} items
              </p>
            </div>
            <span className="text-base font-bold text-neutral-900 font-mono-numbers">
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* KOT Status Message */}
          {kotSuccessMsg && (
            <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{kotSuccessMsg}</span>
            </div>
          )}

          {/* Items List */}
          <div className="max-h-80 overflow-y-auto space-y-2.5 divide-y divide-neutral-100 pr-1">
            {orderItems.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                <p className="font-medium text-neutral-600">No items added yet</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Click dishes from the menu on the left to add
                </p>
              </div>
            ) : (
              orderItems.map((item) => {
                const isSentToKitchen = item.kotSentQuantity >= item.quantity;
                const unsentQty = item.quantity - item.kotSentQuantity;

                return (
                  <div key={item.id} className="pt-2.5 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                          <span className="text-xs font-semibold text-neutral-900 leading-tight">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                          <span>₹{item.price} each</span>
                          <span>·</span>
                          {isSentToKitchen ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                              <ChefHat className="w-3 h-3" /> In Kitchen
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium">
                              {unsentQty} unsent to KOT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Line Item Total */}
                      <span className="text-xs font-bold text-neutral-900 font-mono-numbers shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>

                    {/* Quantity controls & Notes */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
                        <button
                          onClick={() => updateItemQuantity(activeOrder!.id, item.id, -1)}
                          className="p-1 hover:bg-neutral-200 rounded text-neutral-700 transition-colors"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2 font-mono-numbers">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(activeOrder!.id, item.id, 1)}
                          className="p-1 hover:bg-neutral-200 rounded text-neutral-700 transition-colors"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingNoteFor === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={itemNoteInput[item.id] ?? item.notes ?? ''}
                              onChange={(e) =>
                                setItemNoteInput({ ...itemNoteInput, [item.id]: e.target.value })
                              }
                              placeholder="e.g. less spicy"
                              className="text-[11px] px-2 py-0.5 border border-neutral-300 rounded w-28"
                            />
                            <button
                              onClick={() => {
                                item.notes = itemNoteInput[item.id];
                                handleSaveNote(item.id);
                              }}
                              className="text-[10px] bg-neutral-900 text-white px-1.5 py-0.5 rounded font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteFor(item.id);
                              setItemNoteInput({
                                ...itemNoteInput,
                                [item.id]: item.notes || '',
                              });
                            }}
                            className="text-[11px] text-neutral-500 hover:text-neutral-900 underline"
                          >
                            {item.notes ? `Note: ${item.notes}` : '+ Add Note'}
                          </button>
                        )}

                        <button
                          onClick={() => removeItemFromOrder(activeOrder!.id, item.id)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Summary & Primary Action Buttons */}
          {orderItems.length > 0 && (
            <div className="pt-3 border-t border-neutral-200 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({totalItemCount} items)</span>
                  <span className="font-mono-numbers">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Est. GST (5%)</span>
                  <span className="font-mono-numbers">₹{(subtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-100">
                  <span>Estimated Total</span>
                  <span className="font-mono-numbers">₹{(subtotal * 1.05).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Send KOT Button */}
                <button
                  onClick={handleSendKOT}
                  disabled={unsentItemsCount === 0}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                    unsentItemsCount > 0
                      ? 'bg-purple-700 hover:bg-purple-800 text-white'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  }`}
                  title={
                    unsentItemsCount > 0
                      ? `Send ${unsentItemsCount} unsent items to kitchen`
                      : 'All items already sent to kitchen'
                  }
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Send KOT {unsentItemsCount > 0 ? `(${unsentItemsCount})` : ''}</span>
                </button>

                {/* Bill Button */}
                <button
                  onClick={() => {
                    setActiveTableId(currentTableId);
                    setActiveView('billing');
                  }}
                  className="py-2 px-3 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Proceed to Bill</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
