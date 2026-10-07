import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Table,
  MenuItem,
  Order,
  OrderItem,
  KOT,
  KOTItem,
  KOTStatus,
  Bill,
  PaymentMethod,
  RestaurantSettings,
} from '../types/pos';
import {
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_TABLES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_KOTS,
  INITIAL_BILLS,
} from '../data/initialData';

export type AppView =
  | 'dashboard'
  | 'tables'
  | 'menu'
  | 'orders'
  | 'kitchen'
  | 'billing'
  | 'reports'
  | 'users'
  | 'menu_management';

interface POSContextType {
  currentUser: User | null;
  login: (username: string, pass: string) => { success: boolean; message?: string };
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  hasPermission: (view: AppView) => boolean;

  // Users Management
  users: User[];
  addUser: (userData: {
    name: string;
    username: string;
    password: string;
    role: UserRole;
  }) => { success: boolean; message?: string };
  editUser: (
    userId: string,
    data: { name: string; username: string; role: UserRole }
  ) => { success: boolean; message?: string };
  toggleUserStatus: (userId: string) => { success: boolean; message?: string };
  resetUserPassword: (
    userId: string,
    newPassword: string
  ) => { success: boolean; message?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string };
  
  // Data
  tables: Table[];
  menuItems: MenuItem[];
  orders: Order[];
  kots: KOT[];
  bills: Bill[];
  settings: RestaurantSettings;
  activeTableId: number | null;
  setActiveTableId: (id: number | null) => void;

  // Actions
  createOrGetOrderForTable: (tableId: number) => Order;
  addItemToOrder: (tableId: number, menuItem: MenuItem, notes?: string) => void;
  updateItemQuantity: (orderId: string, orderItemId: string, delta: number) => void;
  removeItemFromOrder: (orderId: string, orderItemId: string) => void;
  sendKOT: (orderId: string) => { success: boolean; kotNumber?: number; message?: string };
  updateKOTStatus: (kotId: string, status: KOTStatus) => void;
  
  // Billing
  generateBillForOrder: (
    orderId: string,
    discountType: 'percentage' | 'flat',
    discountValue: number
  ) => Bill;
  settleBill: (
    billId: string,
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeGiven?: number
  ) => boolean;
  
  // Receipts
  billToPrint: Bill | null;
  setBillToPrint: (bill: Bill | null) => void;
  kotToPrint: KOT | null;
  setKotToPrint: (kot: KOT | null) => void;

  // Settings & Admin
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;
  toggleMenuItemAvailability: (menuItemId: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => { success: boolean; message?: string; item?: MenuItem };
  editMenuItem: (menuItemId: string, updates: Partial<MenuItem>) => { success: boolean; message?: string };
  updateMenuItemPrice: (menuItemId: string, newPrice: number) => { success: boolean; message?: string };
  deleteMenuItem: (menuItemId: string) => { success: boolean; message?: string };
  loadMenuData: (items: any[]) => { success: boolean; count?: number; message?: string };
  resetMenuData: () => void;
  resetToDemoData: () => void;
}

const STORAGE_KEYS = {
  USER: 'my_pos_user',
  USERS: 'my_pos_users_list',
  TABLES: 'my_pos_tables',
  MENU: 'my_pos_menu',
  ORDERS: 'my_pos_orders',
  KOTS: 'my_pos_kots',
  BILLS: 'my_pos_bills',
  SETTINGS: 'my_pos_settings',
};

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Ensure admin owner account exists
        const hasAdmin = parsed.some((u) => u.username.toLowerCase() === 'admin');
        if (!hasAdmin) {
          return [INITIAL_USERS[0], ...parsed];
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS;
  });

  // Current user (defaults to the Owner account)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0];
  });

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [activeTableId, setActiveTableId] = useState<number | null>(1);
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null);
  const [kotToPrint, setKotToPrint] = useState<KOT | null>(null);

  // Tables
  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TABLES;
  });

  // Menu normalization helper
  const normalizeMenuItem = (item: any): MenuItem => {
    const subcategory = String(item.subcategory || item.category || 'General').trim();
    const section = String(
      item.section ||
      (subcategory.toLowerCase().includes('drink') || subcategory.toLowerCase().includes('beverage')
        ? 'Beverages'
        : 'Food')
    ).trim();

    let timing = item.availabilityTiming;
    if (!timing || typeof timing !== 'object') {
      timing = { enabled: false, label: 'All Day' };
    }

    return {
      id: String(item.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
      section: section || 'Food',
      subcategory: subcategory || 'General',
      name: String(item.name || 'Dish Item').trim(),
      price: Number(item.price) || 0,
      isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
      availabilityTiming: {
        enabled: Boolean(timing.enabled),
        startTime: timing.startTime || '',
        endTime: timing.endTime || '',
        days: Array.isArray(timing.days) ? timing.days : undefined,
        label: timing.label || (timing.enabled && timing.startTime && timing.endTime ? `${timing.startTime} - ${timing.endTime}` : 'All Day'),
      },
      category: item.category || subcategory,
      isVeg: typeof item.isVeg === 'boolean' ? item.isVeg : true,
      description: item.description || '',
    };
  };

  // Menu Items
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeMenuItem);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MENU_ITEMS;
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  // KOTs
  const [kots, setKots] = useState<KOT[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KOTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_KOTS;
  });

  // Bills
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BILLS;
  });

  // Settings
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  // Save to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(kots));
  }, [kots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Permissions helper
  const hasPermission = (view: AppView): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    switch (role) {
      case 'owner':
        return true; // ONLY the Owner can access 'menu_management' and 'users'
      case 'manager':
        return ['dashboard', 'tables', 'menu', 'orders', 'kitchen', 'billing', 'reports'].includes(view);
      case 'cashier':
        return ['dashboard', 'tables', 'orders', 'billing', 'reports'].includes(view);
      case 'waiter':
        return ['dashboard', 'tables', 'menu', 'orders', 'kitchen'].includes(view);
      case 'kitchen':
        return view === 'kitchen';
      default:
        return false;
    }
  };

  // Auth
  const login = (username: string, pass: string): { success: boolean; message?: string } => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    const found = users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (!found) {
      return { success: false, message: 'Invalid username or password.' };
    }

    if (!found.isActive) {
      return {
        success: false,
        message: 'This account has been disabled. Please contact the Owner.',
      };
    }

    if (found.password !== cleanPass) {
      return { success: false, message: 'Invalid username or password.' };
    }

    setCurrentUser(found);
    if (found.role === 'kitchen') {
      setActiveView('kitchen');
    } else {
      setActiveView('dashboard');
    }
    return { success: true };
  };

  const quickLogin = (role: UserRole) => {
    const found =
      users.find((u) => u.role === role && u.isActive) ||
      users.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      if (found.role === 'kitchen') {
        setActiveView('kitchen');
      } else {
        setActiveView('dashboard');
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // User Management Methods
  const addUser = (userData: {
    name: string;
    username: string;
    password: string;
    role: UserRole;
  }): { success: boolean; message?: string } => {
    const cleanUsername = userData.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'Username is required.' };
    }
    if (!userData.name.trim()) {
      return { success: false, message: 'Full name is required.' };
    }
    if (!userData.password.trim()) {
      return { success: false, message: 'Password is required.' };
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return {
        success: false,
        message: `Username "${userData.username.trim()}" is already in use. Please choose another.`,
      };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name.trim(),
      username: userData.username.trim(),
      password: userData.password,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const editUser = (
    userId: string,
    data: { name: string; username: string; role: UserRole }
  ): { success: boolean; message?: string } => {
    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'Username is required.' };
    }
    if (!data.name.trim()) {
      return { success: false, message: 'Full name is required.' };
    }

    // Check if new username conflicts with another existing user
    const existing = users.find(
      (u) => u.id !== userId && u.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      return {
        success: false,
        message: `Username "${data.username.trim()}" is already in use by another staff member.`,
      };
    }

    // Safety check: Cannot demote the last active owner
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'owner' && data.role !== 'owner') {
      const otherOwners = users.filter(
        (u) => u.role === 'owner' && u.isActive && u.id !== userId
      );
      if (otherOwners.length === 0) {
        return { success: false, message: 'Cannot change the role of the only remaining active Owner.' };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          name: data.name.trim(),
          username: data.username.trim(),
          role: data.role,
        };
      })
    );

    // If current logged-in user was updated, keep currentUser state in sync
    if (currentUser?.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: data.name.trim(),
              username: data.username.trim(),
              role: data.role,
            }
          : null
      );
    }

    return { success: true };
  };

  const toggleUserStatus = (userId: string): { success: boolean; message?: string } => {
    if (currentUser?.id === userId) {
      return { success: false, message: 'You cannot disable your own active account.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    if (target.role === 'owner' && target.isActive) {
      const otherActiveOwners = users.filter(
        (u) => u.role === 'owner' && u.isActive && u.id !== userId
      );
      if (otherActiveOwners.length === 0) {
        return { success: false, message: 'Cannot disable the only active Owner account.' };
      }
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
    return { success: true };
  };

  const resetUserPassword = (
    userId: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    if (!newPassword || newPassword.trim().length === 0) {
      return { success: false, message: 'New password cannot be empty.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: newPassword } : null));
    }

    return { success: true };
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    if (currentUser?.id === userId) {
      return { success: false, message: 'You cannot delete your own active account.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };
    if (target.role === 'owner') {
      const otherOwners = users.filter((u) => u.role === 'owner' && u.id !== userId);
      if (otherOwners.length === 0) {
        return { success: false, message: 'Cannot delete the only Owner.' };
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
  };

  // Create or retrieve active order for table
  const createOrGetOrderForTable = (tableId: number): Order => {
    const existing = orders.find((o) => o.tableId === tableId && o.status === 'active');
    if (existing) return existing;

    const newOrderNumber =
      orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1001;
    const newOrder: Order = {
      id: `ORD-${newOrderNumber}`,
      orderNumber: newOrderNumber,
      tableId,
      waiterName: currentUser?.name || 'Staff',
      status: 'active',
      createdAt: new Date().toISOString(),
      items: [],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update table status to occupied
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'occupied',
              activeOrderId: newOrder.id,
              occupiedSince: new Date().toISOString(),
            }
          : t
      )
    );

    return newOrder;
  };

  // Add Item to Table's active order
  const addItemToOrder = (tableId: number, menuItem: MenuItem, notes?: string) => {
    let targetOrder = orders.find((o) => o.tableId === tableId && o.status === 'active');
    if (!targetOrder) {
      targetOrder = createOrGetOrderForTable(tableId);
    }

    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id !== targetOrder!.id) return ord;

        // Check if item with same ID and notes already exists
        const existingItemIndex = ord.items.findIndex(
          (i) => i.menuItemId === menuItem.id && (i.notes || '') === (notes || '')
        );

        let updatedItems: OrderItem[];
        if (existingItemIndex >= 0) {
          updatedItems = ord.items.map((item, idx) =>
            idx === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          const newItem: OrderItem = {
            id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            isVeg: menuItem.isVeg ?? true,
            notes: notes?.trim() || undefined,
            kotSentQuantity: 0,
          };
          updatedItems = [...ord.items, newItem];
        }

        return { ...ord, items: updatedItems };
      })
    );

    // Ensure table is occupied
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: t.status === 'billed' ? 'billed' : 'occupied',
              activeOrderId: targetOrder!.id,
              occupiedSince: t.occupiedSince || new Date().toISOString(),
            }
          : t
      )
    );
  };

  // Update item quantity
  const updateItemQuantity = (orderId: string, orderItemId: string, delta: number) => {
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id !== orderId) return ord;

        const updatedItems = ord.items
          .map((item) => {
            if (item.id !== orderItemId) return item;
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          })
          .filter(Boolean) as OrderItem[];

        return { ...ord, items: updatedItems };
      })
    );
  };

  // Remove item completely
  const removeItemFromOrder = (orderId: string, orderItemId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.filter((item) => item.id !== orderItemId),
        };
      })
    );
  };

  // Send KOT to Kitchen
  const sendKOT = (orderId: string): { success: boolean; kotNumber?: number; message?: string } => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    // Find unsent items or delta quantities
    const itemsToCook: KOTItem[] = [];

    order.items.forEach((item) => {
      const unsent = item.quantity - item.kotSentQuantity;
      if (unsent > 0) {
        itemsToCook.push({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: unsent,
          notes: item.notes,
          isVeg: item.isVeg,
        });
      }
    });

    if (itemsToCook.length === 0) {
      return { success: false, message: 'All items are already sent to the kitchen.' };
    }

    const nextKotNumber =
      kots.length > 0 ? Math.max(...kots.map((k) => k.kotNumber)) + 1 : 201;

    const newKOT: KOT = {
      id: `KOT-${nextKotNumber}`,
      kotNumber: nextKotNumber,
      orderId: order.id,
      tableId: order.tableId,
      waiterName: currentUser?.name || order.waiterName,
      status: 'new',
      createdAt: new Date().toISOString(),
      items: itemsToCook,
    };

    setKots((prev) => [newKOT, ...prev]);

    // Update kotSentQuantity on order items
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) => ({
            ...it,
            kotSentQuantity: it.quantity,
          })),
        };
      })
    );

    return { success: true, kotNumber: nextKotNumber };
  };

  // Update KOT Status (New -> Preparing -> Ready -> Served)
  const updateKOTStatus = (kotId: string, status: KOTStatus) => {
    setKots((prev) =>
      prev.map((k) => (k.id === kotId ? { ...k, status } : k))
    );
  };

  // Generate Bill for an Order
  const generateBillForOrder = (
    orderId: string,
    discountType: 'percentage' | 'flat',
    discountValue: number
  ): Bill => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const subtotal = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round(((subtotal * discountValue) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discountValue, subtotal);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const cgstAmount = Math.round(((taxableAmount * settings.cgstRate) / 100) * 100) / 100;
    const sgstAmount = Math.round(((taxableAmount * settings.sgstRate) / 100) * 100) / 100;
    const grandTotal = Math.round(taxableAmount + cgstAmount + sgstAmount);

    const billNumber = `INV-${new Date().getFullYear()}-${String(bills.length + 41).padStart(4, '0')}`;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber,
      orderId: order.id,
      tableId: order.tableId,
      items: [...order.items],
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      cgstRate: settings.cgstRate,
      sgstRate: settings.sgstRate,
      cgstAmount,
      sgstAmount,
      grandTotal,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      cashierName: currentUser?.name || 'Cashier',
    };

    return newBill;
  };

  // Settle Bill
  const settleBill = (
    billId: string,
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeGiven?: number
  ): boolean => {
    const existing = bills.find((b) => b.id === billId);
    let targetBill: Bill;

    if (existing) {
      targetBill = {
        ...existing,
        paymentMethod,
        cashReceived,
        changeGiven,
        paidAt: new Date().toISOString(),
        cashierName: currentUser?.name || existing.cashierName,
      };
      setBills((prev) => prev.map((b) => (b.id === billId ? targetBill : b)));
    } else {
      return false;
    }

    // Mark Order as paid
    setOrders((prev) =>
      prev.map((o) => (o.id === targetBill.orderId ? { ...o, status: 'paid' } : o))
    );

    // Free the table
    setTables((prev) =>
      prev.map((t) =>
        t.id === targetBill.tableId
          ? {
              ...t,
              status: 'available',
              activeOrderId: undefined,
              occupiedSince: undefined,
            }
          : t
      )
    );

    return true;
  };

  // Settings
  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Menu items management (ONLY Owner can modify menu items, prices, and categories)
  const toggleMenuItemAvailability = (menuItemId: string) => {
    if (currentUser?.role !== 'owner') return;
    setMenuItems((prev) =>
      prev.map((m) => (m.id === menuItemId ? { ...m, isAvailable: !m.isAvailable } : m))
    );
  };

  const addMenuItem = (
    item: Omit<MenuItem, 'id'>
  ): { success: boolean; message?: string; item?: MenuItem } => {
    if (currentUser?.role !== 'owner') {
      return { success: false, message: 'Permission Denied: ONLY the Owner can add menu items.' };
    }
    if (!item.name || !item.name.trim()) {
      return { success: false, message: 'Item name is required.' };
    }
    if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0) {
      return { success: false, message: 'Valid price in INR (₹) is required.' };
    }
    if (!item.section || !item.section.trim()) {
      return { success: false, message: 'Section is required (e.g. Food, Beverages).' };
    }
    if (!item.subcategory || !item.subcategory.trim()) {
      return { success: false, message: 'Subcategory is required.' };
    }

    const newItem: MenuItem = {
      ...item,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      section: item.section.trim(),
      subcategory: item.subcategory.trim(),
      category: item.category || item.subcategory.trim(),
      name: item.name.trim(),
      price: Number(item.price),
      isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
      availabilityTiming: item.availabilityTiming || { enabled: false, label: 'All Day' },
      isVeg: typeof item.isVeg === 'boolean' ? item.isVeg : true,
      description: item.description?.trim() || '',
    };

    setMenuItems((prev) => [...prev, newItem]);
    return { success: true, item: newItem };
  };

  const editMenuItem = (
    menuItemId: string,
    updates: Partial<MenuItem>
  ): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'owner') {
      return { success: false, message: 'Permission Denied: ONLY the Owner can edit menu items or categories.' };
    }
    const existing = menuItems.find((m) => m.id === menuItemId);
    if (!existing) {
      return { success: false, message: 'Menu item not found.' };
    }
    if (updates.name !== undefined && !updates.name.trim()) {
      return { success: false, message: 'Item name cannot be empty.' };
    }
    if (updates.price !== undefined && (isNaN(updates.price) || updates.price < 0)) {
      return { success: false, message: 'Price must be a valid positive amount in ₹.' };
    }

    setMenuItems((prev) =>
      prev.map((m) => {
        if (m.id !== menuItemId) return m;
        const subcategory =
          updates.subcategory !== undefined ? updates.subcategory.trim() : m.subcategory;
        return {
          ...m,
          ...updates,
          section: updates.section !== undefined ? updates.section.trim() : m.section,
          subcategory,
          category: updates.category || subcategory,
          name: updates.name !== undefined ? updates.name.trim() : m.name,
          price: updates.price !== undefined ? Number(updates.price) : m.price,
        };
      })
    );
    return { success: true };
  };

  const updateMenuItemPrice = (
    menuItemId: string,
    newPrice: number
  ): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'owner') {
      return { success: false, message: 'Permission Denied: ONLY the Owner can change prices.' };
    }
    if (isNaN(newPrice) || newPrice < 0) {
      return { success: false, message: 'Price must be a valid positive amount in ₹.' };
    }
    return editMenuItem(menuItemId, { price: newPrice });
  };

  const deleteMenuItem = (menuItemId: string): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'owner') {
      return { success: false, message: 'Permission Denied: ONLY the Owner can delete menu items.' };
    }
    const existing = menuItems.find((m) => m.id === menuItemId);
    if (!existing) {
      return { success: false, message: 'Menu item not found.' };
    }
    setMenuItems((prev) => prev.filter((m) => m.id !== menuItemId));
    return { success: true };
  };

  const loadMenuData = (items: any[]): { success: boolean; count?: number; message?: string } => {
    if (currentUser?.role !== 'owner') {
      return { success: false, message: 'Permission Denied: ONLY the Owner can load menu data.' };
    }
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: 'Please provide a valid non-empty array of menu items.' };
    }
    try {
      const normalized = items.map((raw, idx) => {
        if (!raw.name) {
          throw new Error(`Item at position #${idx + 1} is missing an item name.`);
        }
        return normalizeMenuItem(raw);
      });
      setMenuItems(normalized);
      return { success: true, count: normalized.length };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to load menu data.' };
    }
  };

  const resetMenuData = () => {
    if (currentUser?.role !== 'owner') return;
    setMenuItems(INITIAL_MENU_ITEMS);
  };

  // Reset demo data
  const resetToDemoData = () => {
    setUsers(INITIAL_USERS);
    setTables(INITIAL_TABLES);
    setMenuItems(INITIAL_MENU_ITEMS);
    setOrders(INITIAL_ORDERS);
    setKots(INITIAL_KOTS);
    setBills(INITIAL_BILLS);
    setSettings(INITIAL_SETTINGS);
    setActiveTableId(1);
    setActiveView('dashboard');
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        login,
        quickLogin,
        logout,
        activeView,
        setActiveView,
        hasPermission,
        users,
        addUser,
        editUser,
        toggleUserStatus,
        resetUserPassword,
        deleteUser,
        tables,
        menuItems,
        orders,
        kots,
        bills,
        settings,
        activeTableId,
        setActiveTableId,
        createOrGetOrderForTable,
        addItemToOrder,
        updateItemQuantity,
        removeItemFromOrder,
        sendKOT,
        updateKOTStatus,
        generateBillForOrder,
        settleBill,
        billToPrint,
        setBillToPrint,
        kotToPrint,
        setKotToPrint,
        updateSettings,
        toggleMenuItemAvailability,
        addMenuItem,
        editMenuItem,
        updateMenuItemPrice,
        deleteMenuItem,
        loadMenuData,
        resetMenuData,
        resetToDemoData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
