import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
  RotateCcw,
  X,
  Save,
  Tag,
  Filter,
  Layers,
  FileJson,
  Check,
  Copy,
  ShieldAlert,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { MenuItem, MenuAvailabilityTiming } from '../types/pos';

export const MenuManagementView: React.FC = () => {
  const {
    menuItems,
    addMenuItem,
    editMenuItem,
    updateMenuItemPrice,
    deleteMenuItem,
    toggleMenuItemAvailability,
    loadMenuData,
    resetMenuData,
    currentUser,
    setActiveView,
  } = usePOS();

  // Strict Owner-only permission guard
  if (currentUser?.role !== 'owner') {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center max-w-lg mx-auto shadow-2xs my-12 animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-neutral-900">Owner Access Required</h2>
        <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
          ONLY the Restaurant Owner has permission to add menu items, edit details, change prices, delete items, enable/disable items, or modify categories.
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Managers and other staff can view the live menu and place orders in the Menu & Order section.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveView('menu')}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Go to Menu & Order
          </button>
        </div>
      </div>
    );
  }

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [subcatFilter, setSubcatFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Disabled'>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [priceEditingItem, setPriceEditingItem] = useState<MenuItem | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDataLoaderOpen, setIsDataLoaderOpen] = useState(false);

  // Data loader state
  const [jsonInput, setJsonInput] = useState('');
  const [dataLoaderMsg, setDataLoaderMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Notification banners
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Unique sections & subcategories
  const uniqueSections = Array.from(new Set(menuItems.map((m) => m.section || 'Food').filter(Boolean)));
  const uniqueSubcategories = Array.from(
    new Set(menuItems.map((m) => m.subcategory || m.category || 'General').filter(Boolean))
  );

  // Filtered items
  const filteredItems = menuItems.filter((item) => {
    if (sectionFilter !== 'All' && item.section !== sectionFilter) return false;
    const subcat = item.subcategory || item.category;
    if (subcatFilter !== 'All' && subcat !== subcatFilter) return false;
    if (statusFilter === 'Available' && !item.isAvailable) return false;
    if (statusFilter === 'Disabled' && item.isAvailable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.section && item.section.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Metrics
  const totalCount = menuItems.length;
  const availableCount = menuItems.filter((m) => m.isAvailable).length;
  const disabledCount = totalCount - availableCount;

  // New Item Form state
  const [formSection, setFormSection] = useState('Food');
  const [formSubcategory, setFormSubcategory] = useState('Starters');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>(250);
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formDescription, setFormDescription] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formTimingEnabled, setFormTimingEnabled] = useState(false);
  const [formStartTime, setFormStartTime] = useState('11:00');
  const [formEndTime, setFormEndTime] = useState('23:00');
  const [formTimingLabel, setFormTimingLabel] = useState('11:00 AM - 11:00 PM');
  const [formError, setFormError] = useState<string | null>(null);

  const resetFormFields = () => {
    setFormSection('Food');
    setFormSubcategory('Starters');
    setFormName('');
    setFormPrice(250);
    setFormIsVeg(true);
    setFormDescription('');
    setFormIsAvailable(true);
    setFormTimingEnabled(false);
    setFormStartTime('11:00');
    setFormEndTime('23:00');
    setFormTimingLabel('11:00 AM - 11:00 PM');
    setFormError(null);
  };

  const openAddModal = () => {
    resetFormFields();
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormSection(item.section || 'Food');
    setFormSubcategory(item.subcategory || item.category || 'General');
    setFormName(item.name);
    setFormPrice(item.price);
    setFormIsVeg(Boolean(item.isVeg));
    setFormDescription(item.description || '');
    setFormIsAvailable(item.isAvailable);
    setFormTimingEnabled(Boolean(item.availabilityTiming?.enabled));
    setFormStartTime(item.availabilityTiming?.startTime || '11:00');
    setFormEndTime(item.availabilityTiming?.endTime || '23:00');
    setFormTimingLabel(item.availabilityTiming?.label || '11:00 AM - 11:00 PM');
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (formPrice === '' || formPrice < 0) {
      setFormError('Please enter a valid price in INR (₹).');
      return;
    }
    if (!formSection.trim()) {
      setFormError('Section is required.');
      return;
    }
    if (!formSubcategory.trim()) {
      setFormError('Subcategory is required.');
      return;
    }

    const timing: MenuAvailabilityTiming = {
      enabled: formTimingEnabled,
      startTime: formTimingEnabled ? formStartTime : undefined,
      endTime: formTimingEnabled ? formEndTime : undefined,
      label: formTimingEnabled ? formTimingLabel : 'All Day',
    };

    const res = addMenuItem({
      section: formSection.trim(),
      subcategory: formSubcategory.trim(),
      name: formName.trim(),
      price: Number(formPrice),
      isAvailable: formIsAvailable,
      isVeg: formIsVeg,
      description: formDescription.trim(),
      availabilityTiming: timing,
    });

    if (res.success) {
      setIsAddModalOpen(false);
      showNotice(`Dish "${formName}" was successfully added to the menu!`);
    } else {
      setFormError(res.message || 'Failed to add item.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (formPrice === '' || formPrice < 0) {
      setFormError('Please enter a valid price in INR (₹).');
      return;
    }

    const timing: MenuAvailabilityTiming = {
      enabled: formTimingEnabled,
      startTime: formTimingEnabled ? formStartTime : undefined,
      endTime: formTimingEnabled ? formEndTime : undefined,
      label: formTimingEnabled ? formTimingLabel : 'All Day',
    };

    const res = editMenuItem(editingItem.id, {
      section: formSection.trim(),
      subcategory: formSubcategory.trim(),
      name: formName.trim(),
      price: Number(formPrice),
      isAvailable: formIsAvailable,
      isVeg: formIsVeg,
      description: formDescription.trim(),
      availabilityTiming: timing,
    });

    if (res.success) {
      setEditingItem(null);
      showNotice(`Updated dish "${formName}" successfully.`);
    } else {
      setFormError(res.message || 'Failed to update item.');
    }
  };

  const handleSaveQuickPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceEditingItem) return;
    const priceNum = parseFloat(newPriceInput);
    if (isNaN(priceNum) || priceNum < 0) {
      return;
    }
    const res = updateMenuItemPrice(priceEditingItem.id, priceNum);
    if (res.success) {
      showNotice(`Price for "${priceEditingItem.name}" updated to ₹${priceNum}.`);
      setPriceEditingItem(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    const res = deleteMenuItem(itemToDelete.id);
    if (res.success) {
      showNotice(`Item "${itemToDelete.name}" was deleted from the menu.`);
      setItemToDelete(null);
    }
  };

  // JSON Template sample
  const sampleJsonTemplate = JSON.stringify(
    [
      {
        section: 'Food',
        subcategory: 'Starters',
        name: 'Tandoori Paneer Tikka',
        price: 280,
        isAvailable: true,
        isVeg: true,
        description: 'Smoky grilled cottage cheese with bell peppers',
        availabilityTiming: {
          enabled: true,
          startTime: '11:00',
          endTime: '23:00',
          label: '11:00 AM - 11:00 PM',
        },
      },
      {
        section: 'Beverages',
        subcategory: 'Drinks',
        name: 'Fresh Mint Lime Soda',
        price: 90,
        isAvailable: true,
        isVeg: true,
        description: 'Chilled club soda with lime and mint leaves',
        availabilityTiming: {
          enabled: false,
          label: 'All Day',
        },
      },
    ],
    null,
    2
  );

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(sampleJsonTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(menuItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `menu_items_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    setDataLoaderMsg(null);
    if (!jsonInput.trim()) {
      setDataLoaderMsg({ type: 'error', text: 'Please paste valid JSON menu data.' });
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setDataLoaderMsg({ type: 'error', text: 'Root JSON must be an array of menu items.' });
        return;
      }
      const res = loadMenuData(parsed);
      if (res.success) {
        setDataLoaderMsg({
          type: 'success',
          text: `Successfully loaded and saved ${res.count} menu items!`,
        });
        showNotice(`Menu data loaded: ${res.count} items active.`);
        setTimeout(() => setIsDataLoaderOpen(false), 1200);
      } else {
        setDataLoaderMsg({ type: 'error', text: res.message || 'Validation error in JSON.' });
      }
    } catch (e: any) {
      setDataLoaderMsg({ type: 'error', text: `Invalid JSON syntax: ${e.message}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Menu Management
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-neutral-900 text-white rounded-md uppercase">
              Owner Exclusive
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            ONLY the Owner can add items, edit details, change prices in ₹, enable/disable items, change categories, or delete dishes.
          </p>
        </div>

        {/* Action Buttons: Add Item & Data Loader */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setJsonInput(JSON.stringify(menuItems, null, 2));
              setDataLoaderMsg(null);
              setIsDataLoaderOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Import or Export Menu JSON data"
          >
            <FileJson className="w-4 h-4 text-neutral-600" />
            <span>Data Loader</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
            Total Items
          </div>
          <div className="text-xl font-extrabold text-neutral-900 mt-1 font-mono-numbers">
            {totalCount}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
            Available / Active
          </div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1 font-mono-numbers">
            {availableCount}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
            Disabled / Hidden
          </div>
          <div className="text-xl font-extrabold text-neutral-600 mt-1 font-mono-numbers">
            {disabledCount}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
            Sections & Subcats
          </div>
          <div className="text-xl font-extrabold text-neutral-900 mt-1 font-mono-numbers">
            {uniqueSections.length} / {uniqueSubcategories.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dish name, section, subcategory..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50 font-medium"
            />
          </div>

          {/* Section Filter */}
          <div className="sm:col-span-2">
            <select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setSubcatFilter('All');
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section: {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div className="sm:col-span-3">
            <select
              value={subcatFilter}
              onChange={(e) => setSubcatFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="All">All Subcategories</option>
              {uniqueSubcategories.map((subcat) => (
                <option key={subcat} value={subcat}>
                  Subcategory: {subcat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="All">Status: All</option>
              <option value="Available">Available Only</option>
              <option value="Disabled">Disabled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold border-b border-neutral-200">
                <th className="py-3 px-4">Item Name & Details</th>
                <th className="py-3 px-3">Section</th>
                <th className="py-3 px-3">Subcategory</th>
                <th className="py-3 px-3">Price (₹)</th>
                <th className="py-3 px-3">Timing</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                    <p className="text-sm font-semibold text-neutral-700">No menu items found</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Try resetting filters or click &ldquo;Add Item&rdquo; to create a new dish.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-neutral-50/70 transition-colors ${
                      !item.isAvailable ? 'bg-neutral-50/50 opacity-75' : ''
                    }`}
                  >
                    {/* Item Name & Diet indicator */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        <span
                          className={`w-3.5 h-3.5 mt-0.5 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                            item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <div>
                          <div className="font-bold text-neutral-900 flex items-center gap-2">
                            <span>{item.name}</span>
                            {!item.isAvailable && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-neutral-200 text-neutral-700 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-neutral-500 line-clamp-1 max-w-sm mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Section */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-neutral-100 font-semibold text-neutral-700 rounded text-[11px]">
                        {item.section || 'Food'}
                      </span>
                    </td>

                    {/* Subcategory */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-neutral-800 text-[11px]">
                        {item.subcategory || item.category || 'General'}
                      </span>
                    </td>

                    {/* Price in INR */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPriceEditingItem(item);
                          setNewPriceInput(String(item.price));
                        }}
                        className="group flex items-center gap-1 font-mono-numbers font-bold text-neutral-900 text-xs px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
                        title="Click to quickly change price"
                      >
                        <span>₹{item.price}</span>
                        <Edit2 className="w-2.5 h-2.5 text-neutral-400 group-hover:text-neutral-900 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>

                    {/* Optional Availability Timing */}
                    <td className="py-3 px-3">
                      {item.availabilityTiming?.enabled ? (
                        <div className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 font-mono-numbers w-fit">
                          <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span>
                            {item.availabilityTiming.label ||
                              `${item.availabilityTiming.startTime} - ${item.availabilityTiming.endTime}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400">All Day</span>
                      )}
                    </td>

                    {/* Available / Disabled Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          toggleMenuItemAvailability(item.id);
                          showNotice(
                            `"${item.name}" is now ${!item.isAvailable ? 'Available' : 'Disabled'}.`
                          );
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.isAvailable ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions: Edit, Change Price, Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPriceEditingItem(item);
                            setNewPriceInput(String(item.price));
                          }}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                          title="Change Price"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                          title="Edit Item Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ================= MODAL: ADD ITEM ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Add New Menu Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section & Subcategory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    placeholder="e.g. Food, Beverages"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                    <span>Suggestions:</span>
                    {['Food', 'Beverages', 'Desserts'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormSection(s)}
                        className="underline hover:text-neutral-700"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Subcategory *</label>
                  <input
                    type="text"
                    required
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    placeholder="e.g. Starters, Main Course"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                    <span>Suggestions:</span>
                    {['Starters', 'Main Course', 'Breads', 'Rice', 'Drinks'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setFormSubcategory(sub)}
                        className="underline hover:text-neutral-700"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Item Name & Price */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-neutral-700 font-bold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Paneer Lababdar"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="250"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono-numbers font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Dietary & Initial Availability */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Dietary Type</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsVeg(true)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        formIsVeg
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white border border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsVeg(false)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        !formIsVeg
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'bg-white border border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Item Availability</label>
                  <button
                    type="button"
                    onClick={() => setFormIsAvailable(!formIsAvailable)}
                    className={`w-full py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      formIsAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-neutral-200 text-neutral-700 border border-neutral-300'
                    }`}
                  >
                    <span>{formIsAvailable ? '✓ Currently Available' : '✕ Disabled (Hidden)'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ingredients, preparation details, allergens..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Optional Availability Timing */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formTimingEnabled}
                      onChange={(e) => setFormTimingEnabled(e.target.checked)}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Optional Availability Timing (Specific Hours)</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {formTimingEnabled ? 'Enabled' : 'All Day'}
                  </span>
                </div>

                {formTimingEnabled && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-300 rounded font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-300 rounded font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={formTimingLabel}
                        onChange={(e) => setFormTimingLabel(e.target.value)}
                        placeholder="e.g. Lunch Only"
                        className="w-full px-2 py-1 text-xs border border-neutral-300 rounded font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-lg font-semibold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ITEM ================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Edit Item: {editingItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section & Subcategory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Subcategory *</label>
                  <input
                    type="text"
                    required
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Item Name & Price */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-neutral-700 font-bold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono-numbers font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Dietary & Availability */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Dietary Type</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsVeg(true)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        formIsVeg
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white border border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsVeg(false)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        !formIsVeg
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'bg-white border border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Item Status</label>
                  <button
                    type="button"
                    onClick={() => setFormIsAvailable(!formIsAvailable)}
                    className={`w-full py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      formIsAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-neutral-200 text-neutral-700 border border-neutral-300'
                    }`}
                  >
                    <span>{formIsAvailable ? '✓ Available' : '✕ Disabled'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Optional Availability Timing */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formTimingEnabled}
                      onChange={(e) => setFormTimingEnabled(e.target.checked)}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span>Optional Availability Timing (Specific Hours)</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {formTimingEnabled ? 'Enabled' : 'All Day'}
                  </span>
                </div>

                {formTimingEnabled && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-300 rounded font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-300 rounded font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={formTimingLabel}
                        onChange={(e) => setFormTimingLabel(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-neutral-300 rounded font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-lg font-semibold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Update Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUICK CHANGE PRICE ================= */}
      {priceEditingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Change Price</h3>
              </div>
              <button
                type="button"
                onClick={() => setPriceEditingItem(null)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-xs text-neutral-500">Dish Name</span>
                <div className="text-sm font-bold text-neutral-900 mt-0.5">
                  {priceEditingItem.name}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono-numbers mt-0.5">
                  Current Price: ₹{priceEditingItem.price}
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  New Price in INR (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-neutral-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    autoFocus
                    required
                    value={newPriceInput}
                    onChange={(e) => setNewPriceInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-base font-bold font-mono-numbers rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Quick adjustment buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-neutral-400 font-semibold mr-1">Adjust:</span>
                {[-50, -10, +10, +50].map((adj) => (
                  <button
                    key={adj}
                    type="button"
                    onClick={() => {
                      const cur = Number(newPriceInput) || priceEditingItem.price;
                      setNewPriceInput(String(Math.max(0, cur + adj)));
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700"
                  >
                    {adj > 0 ? `+₹${adj}` : `-₹${Math.abs(adj)}`}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setPriceEditingItem(null)}
                  className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 rounded-lg font-semibold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Update Price</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Delete Menu Item?</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Are you sure you want to remove &ldquo;{itemToDelete.name}&rdquo;?
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              This will remove the item from the live ordering menu. Historical past orders and bills will keep their item records intact.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 border border-neutral-300 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MENU DATA LOADER SYSTEM ================= */}
      {isDataLoaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Menu Data-Loading System</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDataLoaderOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <div className="font-bold text-neutral-900">Supported Data Structure:</div>
                  <div className="text-[11px] text-neutral-600 mt-0.5">
                    Requires <code className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">section</code>,{' '}
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">subcategory</code>,{' '}
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">name</code>,{' '}
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">price</code>,{' '}
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">isAvailable</code>,{' '}
                    and optional <code className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">availabilityTiming</code>.
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-700"
                  >
                    {copiedTemplate ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTemplate ? 'Copied!' : 'Copy Template'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-700"
                    title="Export menu as JSON file"
                  >
                    <Download className="w-3 h-3 text-neutral-600" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {dataLoaderMsg && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 ${
                    dataLoaderMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {dataLoaderMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-medium">{dataLoaderMsg.text}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-neutral-800">
                    Paste JSON Menu Dataset:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reload the standard default menu structure?')) {
                        resetMenuData();
                        showNotice('Reset menu to default structure.');
                        setIsDataLoaderOpen(false);
                      }
                    }}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Default Menu</span>
                  </button>
                </div>

                <textarea
                  rows={12}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[\n  {\n    "section": "Food",\n    "subcategory": "Starters",\n    "name": "Paneer Tikka",\n    "price": 260,\n    "isAvailable": true,\n    "availabilityTiming": { "enabled": true, "startTime": "11:00", "endTime": "23:00" }\n  }\n]`}
                  className="w-full p-3 font-mono text-[11px] border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <span className="text-[11px] text-neutral-500">
                  Currently loaded: <span className="font-bold font-mono-numbers text-neutral-900">{totalCount} items</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDataLoaderOpen(false)}
                    className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-lg font-semibold text-neutral-700"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleImportJson}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Validate & Load Menu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
