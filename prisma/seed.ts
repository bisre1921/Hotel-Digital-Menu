import { PrismaClient, Role, MenuLayout } from "@prisma/client";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

const prisma = new PrismaClient();

async function generateQr(url: string): Promise<string> {
  return await QRCode.toString(url, {
    type: "svg",
    color: {
      dark: "#1E1F24",
      light: "#FFFFFF",
    },
    margin: 2,
    width: 320,
  });
}

async function main() {
  console.log("Seeding luxury hotel database...");

  // Clean existing data
  await prisma.analyticsEvent.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 1. HOTEL: The Grand Azure Resort & Spa
  const azure = await prisma.hotel.create({
    data: {
      name: "The Grand Azure Resort & Spa",
      slug: "the-grand-azure",
      tagline: "Timeless luxury overlooking the Aegean Sea",
      description:
        "Perched atop the caldera cliffs, The Grand Azure offers world-class culinary experiences with panoramic sea views and Michelin-starred hospitality.",
      starRating: 5,
      phone: "+30 22860 12345",
      email: "concierge@grandazure.com",
      website: "https://grandazure.luxury",
      address: "Caldera Cliffside Promenade 4",
      city: "Oia, Santorini",
      country: "Greece",
      logoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
      coverImageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85",
      primaryColor: "#B89334",
      accentColor: "#131418",
      fontFamily: "serif",
      currency: "EUR",
      currencySymbol: "€",
    },
  });

  // Azure Users
  await prisma.user.create({
    data: {
      hotelId: azure.id,
      email: "admin@grandazure.com",
      name: "Jean-Luc Moreau",
      passwordHash,
      role: Role.OWNER,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
  });

  await prisma.user.create({
    data: {
      hotelId: azure.id,
      email: "manager@grandazure.com",
      name: "Elena Vasiliou",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  // Azure Menu 1: L'Étoile Fine Dining
  const letoileUrl = `${baseUrl}/menu/azure-letoile-dinner`;
  const letoileQr = await generateQr(letoileUrl);

  const letoileMenu = await prisma.menu.create({
    data: {
      hotelId: azure.id,
      title: "L'Étoile Fine Dining & Tasting",
      slug: "azure-letoile-dinner",
      description:
        "An avant-garde exploration of Aegean bounty paired with rare vintages, curated by Executive Chef Marcella D'Angelo.",
      headerImageUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85",
      isPublished: true,
      publishedAt: new Date(),
      displayLayout: MenuLayout.GRID,
      qrCodeSvg: letoileQr,
    },
  });

  // Categories for L'Étoile
  const catAppetizers = await prisma.menuCategory.create({
    data: {
      menuId: letoileMenu.id,
      name: "Signature Starters",
      description: "Delicate preludes celebrating the bounty of land and sea",
      orderIndex: 1,
      imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
    },
  });

  const catMains = await prisma.menuCategory.create({
    data: {
      menuId: letoileMenu.id,
      name: "Haute Cuisine Mains",
      description: "Masterfully grilled prime cuts and fresh day-boat seafood",
      orderIndex: 2,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    },
  });

  const catDesserts = await prisma.menuCategory.create({
    data: {
      menuId: letoileMenu.id,
      name: "Grand Desserts",
      description: "Handcrafted confections with 24k gold leaf and rare cacao",
      orderIndex: 3,
      imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    },
  });

  const catCocktails = await prisma.menuCategory.create({
    data: {
      menuId: letoileMenu.id,
      name: "Reserve Cellar & Elixirs",
      description: "Vintage champagnes, rare spirits, and bespoke botanical infusions",
      orderIndex: 4,
      imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    },
  });

  // Items for Starters
  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: catAppetizers.id,
        name: "Oscietra Royal Caviar & Warm Brioche",
        description:
          "30g Golden Oscietra caviar served on toasted Normandy brioche with cultured Normandy butter and chive crumpets.",
        price: 145.0,
        imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: true,
        isFeatured: true,
        isAvailable: true,
        orderIndex: 1,
        calories: 340,
        prepTimeMinutes: 12,
        dietaryTags: ["PESCATARIAN"],
        allergens: ["DAIRY", "GLUTEN", "FISH"],
      },
      {
        categoryId: catAppetizers.id,
        name: "Hokkaido Scallop Crudo",
        description:
          "Thinly sliced diver scallops, finger lime pearls, white truffle vinaigrette, and compressed green apple.",
        price: 42.0,
        imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: false,
        isFeatured: false,
        isAvailable: true,
        orderIndex: 2,
        calories: 220,
        prepTimeMinutes: 15,
        dietaryTags: ["GLUTEN_FREE", "PESCATARIAN"],
        allergens: ["SHELLFISH"],
      },
      {
        categoryId: catAppetizers.id,
        name: "A5 Miyazaki Wagyu Tartare",
        description:
          "Hand-chopped Japanese Wagyu, cured quail egg yolk, black winter truffle carpaccio, and gold leaf cracker.",
        price: 58.0,
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: true,
        isFeatured: false,
        isAvailable: true,
        orderIndex: 3,
        calories: 410,
        prepTimeMinutes: 18,
        dietaryTags: ["HALAL"],
        allergens: ["EGGS"],
      },
    ],
  });

  // Items for Mains
  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: catMains.id,
        name: "Wild Brittany Turbot Meunière",
        description:
          "Pan-roasted turbot, brown butter emulsion with Meyer lemon, caper berries, and smoked sea salt fingerling potatoes.",
        price: 88.0,
        imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: true,
        isFeatured: true,
        isAvailable: true,
        orderIndex: 1,
        calories: 580,
        prepTimeMinutes: 25,
        dietaryTags: ["PESCATARIAN"],
        allergens: ["FISH", "DAIRY"],
      },
      {
        categoryId: catMains.id,
        name: "45-Day Dry Aged Prime Ribeye",
        description:
          "Charred over binchotan charcoal, bone marrow emulsion, glazed wild morels, and pomme purée robuchon.",
        price: 110.0,
        imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: false,
        isFeatured: true,
        isAvailable: true,
        orderIndex: 2,
        calories: 890,
        prepTimeMinutes: 30,
        dietaryTags: ["GLUTEN_FREE"],
        allergens: ["DAIRY"],
      },
      {
        categoryId: catMains.id,
        name: "Acquerello Risotto with White Alba Truffle",
        description:
          "Aged carnaroli rice, 36-month Vacche Rosse Parmigiano-Reggiano, and freshly shaved white Alba truffles.",
        price: 76.0,
        imageUrl: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: false,
        isFeatured: false,
        isAvailable: true,
        orderIndex: 3,
        calories: 620,
        prepTimeMinutes: 22,
        dietaryTags: ["VEGETARIAN", "GLUTEN_FREE"],
        allergens: ["DAIRY"],
      },
    ],
  });

  // Items for Desserts
  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: catDesserts.id,
        name: "The Golden Azure Cacao Sphere",
        description:
          "72% Venezuelan dark chocolate sphere filled with passion fruit sorbet, hazelnut praline crisp, flamed with Grand Marnier table-side.",
        price: 34.0,
        imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: true,
        isFeatured: true,
        isAvailable: true,
        orderIndex: 1,
        calories: 460,
        prepTimeMinutes: 15,
        dietaryTags: ["VEGETARIAN"],
        allergens: ["DAIRY", "TREE_NUTS"],
      },
      {
        categoryId: catDesserts.id,
        name: "Tahitian Vanilla Mille-Feuille",
        description:
          "Caramelized puff pastry, silky diplomat cream with Tahitian vanilla bean, and salted caramel glaze.",
        price: 28.0,
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: false,
        isFeatured: false,
        isAvailable: true,
        orderIndex: 2,
        calories: 390,
        prepTimeMinutes: 10,
        dietaryTags: ["VEGETARIAN"],
        allergens: ["DAIRY", "GLUTEN", "EGGS"],
      },
    ],
  });

  // Items for Cocktails
  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: catCocktails.id,
        name: "Aegean Sunset 24K Gold Old Fashioned",
        description:
          "Yamazaki 12-Year Whisky, smoked fig leaf syrup, angostura bitters, adorned with edible 24K gold flakes.",
        price: 36.0,
        imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: true,
        isFeatured: true,
        isAvailable: true,
        orderIndex: 1,
        calories: 190,
        prepTimeMinutes: 8,
        dietaryTags: ["VEGAN"],
        allergens: [],
      },
      {
        categoryId: catCocktails.id,
        name: "Santorini Mist Champagne Cocktail",
        description:
          "Dom Pérignon Vintage, wild elderflower liqueur, clarified lemon, and dry ice lavender cloud.",
        price: 45.0,
        imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=1000&q=80",
        isChefSpecial: false,
        isFeatured: false,
        isAvailable: true,
        orderIndex: 2,
        calories: 140,
        prepTimeMinutes: 5,
        dietaryTags: ["VEGAN"],
        allergens: [],
      },
    ],
  });

  // Azure Menu 2: Pool & Rooftop Lounge
  const poolUrl = `${baseUrl}/menu/azure-pool-lounge`;
  const poolQr = await generateQr(poolUrl);

  const poolMenu = await prisma.menu.create({
    data: {
      hotelId: azure.id,
      title: "Azure Sunset Pool & Rooftop Lounge",
      slug: "azure-pool-lounge",
      description: "Refreshing craft cocktails, sun-drenched crudos, and artisanal poolside tapas.",
      headerImageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
      isPublished: true,
      publishedAt: new Date(),
      displayLayout: MenuLayout.CARDS,
      qrCodeSvg: poolQr,
    },
  });

  const poolBitesCat = await prisma.menuCategory.create({
    data: {
      menuId: poolMenu.id,
      name: "Poolside Bites & Tapas",
      description: "Light, exquisite refreshments for sunlit relaxation",
      orderIndex: 1,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: poolBitesCat.id,
        name: "Truffle Parmesan Hand-Cut Fries",
        description: "Crispy Yukon gold fries tossed in white truffle oil and 24-month aged parmesan.",
        price: 18.0,
        imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
        isAvailable: true,
        isChefSpecial: false,
        isFeatured: true,
        orderIndex: 1,
        calories: 450,
        prepTimeMinutes: 10,
        dietaryTags: ["VEGETARIAN"],
        allergens: ["DAIRY"],
      },
      {
        categoryId: poolBitesCat.id,
        name: "Crispy Rock Shrimp Tempura",
        description: "Spicy yuzu kosho aioli, toasted sesame, and micro cilantro.",
        price: 26.0,
        imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
        isAvailable: true,
        isChefSpecial: true,
        isFeatured: true,
        orderIndex: 2,
        calories: 380,
        prepTimeMinutes: 12,
        dietaryTags: ["PESCATARIAN"],
        allergens: ["SHELLFISH", "EGGS", "SESAME"],
      },
    ],
  });

  // Azure Menu 3: Unpublished Draft Menu (to demonstrate draft state)
  const roomServiceUrl = `${baseUrl}/menu/azure-royal-breakfast`;
  const roomServiceQr = await generateQr(roomServiceUrl);

  await prisma.menu.create({
    data: {
      hotelId: azure.id,
      title: "Royal Suite In-Room Dining (Breakfast & Brunch)",
      slug: "azure-royal-breakfast",
      description: "Artisanal bakery baskets, farm fresh organic eggs, and sparkling mimosa towers.",
      headerImageUrl:
        "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1600&q=85",
      isPublished: false, // Draft!
      displayLayout: MenuLayout.LIST,
      qrCodeSvg: roomServiceQr,
    },
  });

  // Seed sample analytics for Grand Azure dashboard
  await prisma.analyticsEvent.createMany({
    data: [
      { hotelId: azure.id, menuId: letoileMenu.id, type: "QR_SCAN", createdAt: new Date(Date.now() - 3600000 * 2) },
      { hotelId: azure.id, menuId: letoileMenu.id, type: "PAGE_VIEW", createdAt: new Date(Date.now() - 3600000 * 2) },
      { hotelId: azure.id, menuId: letoileMenu.id, type: "PAGE_VIEW", createdAt: new Date(Date.now() - 3600000 * 5) },
      { hotelId: azure.id, menuId: poolMenu.id, type: "QR_SCAN", createdAt: new Date(Date.now() - 3600000 * 8) },
      { hotelId: azure.id, menuId: poolMenu.id, type: "PAGE_VIEW", createdAt: new Date(Date.now() - 3600000 * 8) },
      { hotelId: azure.id, menuId: letoileMenu.id, type: "SEARCH", metadata: "truffle", createdAt: new Date(Date.now() - 3600000 * 12) },
    ],
  });

  // 2. HOTEL: Hôtel Saint-Germain Palais (Second Tenant to test multi-tenancy!)
  const saintGermain = await prisma.hotel.create({
    data: {
      name: "Hôtel Saint-Germain Palais",
      slug: "saint-germain-palais",
      tagline: "Haute Parisian elegance in the heart of the Latin Quarter",
      description:
        "An 18th-century aristocratic mansion transformed into an intimate luxury boutique hotel featuring Michelin-starred French gastronomy.",
      starRating: 5,
      phone: "+33 1 42 68 55 00",
      email: "contact@palaisgermain.com",
      website: "https://palaisgermain.fr",
      address: "24 Rue de l'Université",
      city: "Paris",
      country: "France",
      logoUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
      coverImageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=85",
      primaryColor: "#9E2A2B", // Burgundy Wine
      accentColor: "#0F172A",
      fontFamily: "serif",
      currency: "EUR",
      currencySymbol: "€",
    },
  });

  await prisma.user.create({
    data: {
      hotelId: saintGermain.id,
      email: "owner@palaisgermain.com",
      name: "Camille Claudel",
      passwordHash,
      role: Role.OWNER,
    },
  });

  const sgUrl = `${baseUrl}/menu/saint-germain-jardin`;
  const sgQr = await generateQr(sgUrl);

  const sgMenu = await prisma.menu.create({
    data: {
      hotelId: saintGermain.id,
      title: "Le Jardin Secret Bistronomy",
      slug: "saint-germain-jardin",
      description: "Classical French heritage infused with vibrant botanicals.",
      headerImageUrl:
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=85",
      isPublished: true,
      publishedAt: new Date(),
      displayLayout: MenuLayout.GRID,
      qrCodeSvg: sgQr,
    },
  });

  const sgEntrees = await prisma.menuCategory.create({
    data: {
      menuId: sgMenu.id,
      name: "Entrées Royales",
      description: "Soufflés et foies gras faits maison",
      orderIndex: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: sgEntrees.id,
      name: "Foie Gras Poêlé au Poivre de Sichuan",
      description: "Pan-seared duck foie gras, brioche dorée, and spiced cherry reduction.",
      price: 38.0,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80",
      isChefSpecial: true,
      isFeatured: true,
      isAvailable: true,
      orderIndex: 1,
      dietaryTags: [],
      allergens: ["GLUTEN", "DAIRY"],
    },
  });

  console.log("Database seeded successfully!");
  console.log("Login credentials:");
  console.log("  Hotel 1: admin@grandazure.com / Password123!");
  console.log("  Hotel 2: owner@palaisgermain.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
