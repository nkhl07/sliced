'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MenuScreen from '@/components/User/MenuScreen';
import VoiceBubble from '@/components/User/VoiceBubble';
import initialMenu from '@/data/menuItems.json';
import { applyDynamicPricingToMenu } from '@/utils/dynamicPricing';
import { saveOrdersToStorage, loadOrdersFromStorage } from '@/utils/guestMemory';

function MenuContent() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table');
  const [menu, setMenu] = useState<any[]>(() => applyDynamicPricingToMenu(initialMenu as any[]));
  const [orders, setOrders] = useState<any[]>([]);
  const [ownerPersona, setOwnerPersona] = useState({ tone: 'friendly', upsellStyle: 'suggestive' });

  useEffect(() => {
    // Load owner persona from localStorage
    const ownerData = localStorage.getItem('ownerData');
    if (ownerData) {
      const parsed = JSON.parse(ownerData);
      if (parsed.persona) setOwnerPersona(parsed.persona);
    }

    // Load existing orders
    setOrders(loadOrdersFromStorage());

    // Refresh dynamic pricing every 30 seconds
    const interval = setInterval(() => {
      setMenu(prev => applyDynamicPricingToMenu(prev));
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  const handleOrder = (order: { items: any[]; total: number }) => {
    const newOrder = { ...order, tableId, timestamp: new Date().toISOString() };
    setOrders(prev => {
      const updated = [...prev, newOrder];
      saveOrdersToStorage(updated);
      return updated;
    });

    // Update sold quantities to drive dynamic pricing
    setMenu(prev =>
      applyDynamicPricingToMenu(
        prev.map(item => {
          const ordered = order.items.find((it: any) => it.id === item.id);
          if (ordered) {
            return { ...item, current_sold_quantity: item.current_sold_quantity + 1 };
          }
          return item;
        }),
      ),
    );
  };

  return (
    <div>
      <MenuScreen menu={menu} activeTable={tableId} />
      <VoiceBubble menu={menu} onOrderParsed={handleOrder} persona={ownerPersona} />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-stone-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Menu...</div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
