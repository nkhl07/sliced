export function suggestUpsell(orderItems: any[], menu: any[]): any[] {
  const suggestions: any[] = [];
  const orderItemNames = orderItems.map((item: any) => item.name);

  orderItems.forEach((item: any) => {
    menu.forEach((menuItem: any) => {
      if (orderItemNames.includes(menuItem.name)) return;
      // Suggest items from complementary categories
      if (menuItem.category !== item.category) {
        suggestions.push(menuItem);
      }
    });
  });

  // Deduplicate by id
  const uniqueSuggestions = Array.from(new Set(suggestions.map((s: any) => s.id)))
    .map(id => suggestions.find((s: any) => s.id === id));

  return uniqueSuggestions.slice(0, 2);
}
