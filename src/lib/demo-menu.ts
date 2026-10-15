const image = (id: string, width = 500) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
export const demoMenu = {
  id: "sample-menu", title: "Something for every craving", slug: "sample-menu",
  hotel: { id: "sample-business", name: "Buna & Bloom", tagline: "Good coffee. Better company.", city: "Addis Ababa", currency: "ETB", currencySymbol: "Br " },
  categories: [
    { id: "breakfast", name: "Breakfast", orderIndex: 0, items: [
      { id: "sample-toast", name: "Avocado toast", description: "Sourdough, ripe avocado, a little lemon and a poached egg.", price: 280, imageUrl: image("photo-1525351484163-7529414344d8"), isAvailable: true, isChefSpecial: true, isFeatured: true, dietaryTags: ["VEGETARIAN"], allergens: ["GLUTEN", "EGGS"] },
      { id: "sample-bowl", name: "The breakfast bowl", description: "A colorful start with fresh vegetables and grains.", price: 240, imageUrl: image("photo-1512621776951-a57141f2eefd"), isAvailable: true, isChefSpecial: false, isFeatured: false, dietaryTags: ["VEGAN"], allergens: [] },
    ] },
    { id: "lunch", name: "Lunch", orderIndex: 1, items: [
      { id: "sample-rice", name: "House fried rice", description: "Wok-tossed vegetables, fragrant rice and our house sauce.", price: 320, imageUrl: image("photo-1603133872878-684f208fb84b"), isAvailable: true, isChefSpecial: true, isFeatured: false, dietaryTags: ["VEGETARIAN"], allergens: ["SOY"] },
      { id: "sample-pasta", name: "Sunday spaghetti", description: "Rich tomato sauce, fresh basil and a generous finish.", price: 350, imageUrl: image("photo-1563379926898-05f4575a45d8"), isAvailable: true, isChefSpecial: false, isFeatured: false, dietaryTags: [], allergens: ["GLUTEN"] },
    ] },
    { id: "coffee", name: "Coffee", orderIndex: 2, items: [
      { id: "sample-coffee", name: "Your morning macchiato", description: "A bold little coffee with a soft layer of milk.", price: 95, imageUrl: image("photo-1511081692775-05d0f180a065"), isAvailable: true, isChefSpecial: false, isFeatured: false, dietaryTags: [], allergens: ["DAIRY"] },
    ] },
  ],
};
