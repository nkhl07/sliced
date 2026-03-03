export interface MenuItem {
  id: number;
  name: string;
  base_price: number;
  dynamic_price: number;
  current_sold_quantity: number;
  target_daily_quantity: number;
  cost_to_make: number;
  [key: string]: unknown;
}

export function updateDynamicPrice(item: MenuItem): number {
  const sales_ratio = item.current_sold_quantity / item.target_daily_quantity;
  let newPrice = item.base_price;

  if (sales_ratio > 1.0) {
    // Selling faster than target: increase price up to 10% above base
    newPrice = Math.min(item.base_price * 1.1, item.dynamic_price * 1.02);
    if (newPrice === item.base_price) newPrice = item.base_price * 1.05;
  } else if (sales_ratio < 1.0) {
    // Selling slower than target: decrease price, stop-loss at cost_to_make
    const stopLoss = Math.max(item.base_price * 0.9, item.cost_to_make);
    newPrice = Math.max(stopLoss, item.dynamic_price * 0.98);
    if (newPrice === item.base_price) newPrice = Math.max(stopLoss, item.base_price * 0.95);
  }

  return Number(newPrice.toFixed(2));
}

export function applyDynamicPricingToMenu(menu: MenuItem[]): MenuItem[] {
  return menu.map(item => ({
    ...item,
    dynamic_price: updateDynamicPrice(item),
  }));
}
