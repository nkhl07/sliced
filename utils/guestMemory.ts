export interface GuestOrder {
  items: any[];
  tableId: string | null;
  timestamp: Date;
  total: number;
}

export interface Guest {
  guest_id: string;
  past_orders: GuestOrder[];
}

export function saveGuestOrder(guest: Guest, order: GuestOrder): Guest {
  return {
    ...guest,
    past_orders: [...(guest.past_orders || []), order],
  };
}

export function loadGuestMemory(guestId: string, guestsDB: Guest[]): Guest | undefined {
  return guestsDB.find(g => g.guest_id === guestId);
}

// localStorage helpers for persisting orders across sessions
export function saveOrdersToStorage(orders: GuestOrder[]): void {
  try {
    localStorage.setItem('slicedOrders', JSON.stringify(orders));
  } catch {}
}

export function loadOrdersFromStorage(): GuestOrder[] {
  try {
    const stored = localStorage.getItem('slicedOrders');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
