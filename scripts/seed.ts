import { db } from "../src/prisma/db";

const img = (photo: string) =>
  `https://images.unsplash.com/${photo}?w=1600&q=80&fm=jpg`;
const naira = (amount: number) => amount * 100; // Money is stored in kobo.

const photos = {
  jacketOlive: img("photo-1575862469281-63389040c6fd"),
  blazer: img("photo-1717765697742-6b2f48f4a1fa"),
  tracksuit: img("photo-1780396508935-94e234affc92"),
  knit: img("photo-1574201635302-388dd92a4c3f"),
  tank: img("photo-1771012266130-435928e57460"),
  joggersSet: img("photo-1675280591581-657af8de8607"),
  joggersSneakers: img("photo-1595939152851-d1c3d6c39623"),
  greyOutdoor: img("photo-1576211473184-a3a1da6216b7"),
  hoodieCream: img("photo-1725944593135-9d829487ea01"),
  hoodieBlack: img("photo-1633002507458-d8d61e7bc5d6"),
  hoodieMono: img("photo-1723678712998-22157b59e929"),
  hoodieMint: img("photo-1715615245424-97d67b181c89"),
  hoodieWhite: img("photo-1601396344868-31e008cd6e7c"),
  hoodieDark: img("photo-1634509319985-32e4750dc78c"),
  hoodieTaupe: img("photo-1508216310976-c518daae0cdc"),
  perfumeSmoke: img("photo-1666621630026-862eea07236c"),
  perfumeGlass: img("photo-1572566202186-611ceb4042f0"),
  perfumeHand: img("photo-1639238589580-6831e93afb1f"),
  perfumeFloral: img("photo-1708486235073-14879ff14c4c"),
  perfumeBlue: img("photo-1608721279136-cd41b752fa41"),
};

type VariantSeed = {
  size?: string;
  color?: string;
  volumeMl?: number;
  price?: number;
  stock: number;
};
type ProductSeed = {
  name: string;
  description: string;
  price: number;
  compareAt?: number;
  featured?: boolean;
  images: string[];
  variants: VariantSeed[];
};

const apparelSizes = (color: string, stock: number[]): VariantSeed[] =>
  ["S", "M", "L", "XL"].map((size, i) => ({
    size,
    color,
    stock: stock[i] ?? 0,
  }));

const catalog: {
  name: string;
  slug: string;
  description: string;
  image: string;
  products: ProductSeed[];
}[] = [
  {
    name: "Clothes",
    slug: "clothes",
    description: "Jackets, tees and layers built to outlast trend cycles.",
    image: photos.jacketOlive,
    products: [
      {
        name: "Olive Field Jacket",
        description:
          "Washed cotton twill with a relaxed fit, hidden zip placket and two-way patch pockets. Layers over a tee or a hoodie.",
        price: 68000,
        compareAt: 85000,
        featured: true,
        images: [photos.jacketOlive, photos.greyOutdoor],
        variants: [...apparelSizes("Olive", [4, 8, 6, 2])],
      },
      {
        name: "Sharp Black Blazer",
        description:
          "Single-breasted blazer in a fluid crepe with a softly structured shoulder. Dress it up or wear it over a tank.",
        price: 74000,
        images: [photos.blazer],
        variants: [...apparelSizes("Black", [3, 5, 5, 1])],
      },
      {
        name: "Navy Track Jacket",
        description:
          "Retro track jacket with contrast frog fastenings and a boxy cut. Matches our Navy Track Pants.",
        price: 52000,
        images: [photos.tracksuit],
        variants: [...apparelSizes("Navy", [6, 10, 7, 3])],
      },
      {
        name: "Oversized Cable Knit",
        description:
          "Chunky oatmeal knit with dropped shoulders and a deep ribbed hem. Soft, heavy and made for cold evenings.",
        price: 46000,
        images: [photos.knit],
        variants: [...apparelSizes("Oatmeal", [5, 7, 4, 0])],
      },
      {
        name: "Ribbed Tank Top",
        description:
          "Second-skin ribbed cotton tank. The base layer for everything else in your wardrobe.",
        price: 14000,
        images: [photos.tank],
        variants: [
          ...apparelSizes("White", [12, 15, 10, 6]),
          ...apparelSizes("Black", [10, 12, 8, 4]),
        ],
      },
    ],
  },
  {
    name: "Joggers",
    slug: "joggers",
    description: "Tapered, cuffed and cut for movement. Your everyday staple.",
    image: photos.joggersSet,
    products: [
      {
        name: "Core Black Joggers",
        description:
          "Brushed-back fleece joggers with a tapered leg, ribbed cuffs and a drawcord waist.",
        price: 32000,
        featured: true,
        images: [photos.joggersSet, photos.joggersSneakers],
        variants: [...apparelSizes("Black", [10, 14, 12, 6])],
      },
      {
        name: "Charcoal Tapered Joggers",
        description:
          "Midweight loopback cotton in a slim taper. Zip back pocket keeps your keys put.",
        price: 29000,
        images: [photos.joggersSneakers],
        variants: [...apparelSizes("Charcoal", [8, 9, 9, 5])],
      },
      {
        name: "Navy Track Pants",
        description:
          "Wide, swishy track pants with a clean front and elastic waist. Pairs with the Navy Track Jacket.",
        price: 34000,
        compareAt: 40000,
        images: [photos.tracksuit],
        variants: [...apparelSizes("Navy", [5, 8, 6, 2])],
      },
      {
        name: "Weekend Fleece Joggers",
        description:
          "Our softest fleece in a relaxed straight leg. Built for days that don't need a plan.",
        price: 27000,
        images: [photos.greyOutdoor],
        variants: [
          ...apparelSizes("Navy", [7, 11, 9, 4]),
          ...apparelSizes("Grey", [6, 9, 7, 3]),
        ],
      },
    ],
  },
  {
    name: "Hoodies",
    slug: "hoodies",
    description:
      "Heavyweight fleece, oversized fits and details that start conversations.",
    image: photos.hoodieBlack,
    products: [
      {
        name: "Cream Statement Hoodie",
        description:
          "450gsm heavyweight fleece with an oversized hood and tonal chest print. Our signature piece.",
        price: 45000,
        featured: true,
        images: [photos.hoodieCream, photos.hoodieWhite],
        variants: [...apparelSizes("Cream", [6, 10, 8, 3])],
      },
      {
        name: "After Hours Black Hoodie",
        description:
          "Jet-black heavyweight hoodie with a double-layer hood and kangaroo pocket.",
        price: 42000,
        images: [photos.hoodieBlack, photos.hoodieDark],
        variants: [...apparelSizes("Black", [9, 12, 10, 5])],
      },
      {
        name: "Stone Grey Hoodie",
        description:
          "Classic grey marl in a boxy fit with ribbed side panels for movement.",
        price: 38000,
        images: [photos.hoodieMono],
        variants: [...apparelSizes("Grey", [8, 10, 7, 4])],
      },
      {
        name: "Mint Varsity Hoodie",
        description:
          "Garment-dyed mint hoodie with a cracked varsity print. Every piece fades a little differently.",
        price: 40000,
        compareAt: 48000,
        images: [photos.hoodieMint],
        variants: [...apparelSizes("Mint", [4, 6, 5, 2])],
      },
      {
        name: "Cloud White Hoodie",
        description:
          "Brushed white fleece with a soft hand feel and a relaxed drop shoulder.",
        price: 39000,
        images: [photos.hoodieWhite],
        variants: [...apparelSizes("White", [7, 9, 8, 3])],
      },
      {
        name: "Taupe Lounge Hoodie",
        description:
          "Washed taupe hoodie in a lighter-weight loopback, the one you'll wear all year.",
        price: 36000,
        images: [photos.hoodieTaupe],
        variants: [...apparelSizes("Taupe", [5, 8, 6, 2])],
      },
    ],
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    description: "Long-lasting fragrances to finish every look.",
    image: photos.perfumeSmoke,
    products: [
      {
        name: "Ambroxan No. 19",
        description:
          "A clean, skin-close musk built around ambroxan with a dry cedar base. Lasts all day without shouting.",
        price: 55000,
        featured: true,
        images: [photos.perfumeSmoke],
        variants: [
          { volumeMl: 50, stock: 15 },
          { volumeMl: 100, price: 89000, stock: 8 },
        ],
      },
      {
        name: "Glasshouse",
        description:
          "Green fig leaf and pink pepper over a soft white musk. Fresh in the heat, cosy at night.",
        price: 48000,
        images: [photos.perfumeGlass],
        variants: [
          { volumeMl: 50, stock: 12 },
          { volumeMl: 100, price: 78000, stock: 6 },
        ],
      },
      {
        name: "Golden Hour",
        description:
          "Warm amber, saffron and vanilla absolute. An evening scent with real presence.",
        price: 62000,
        images: [photos.perfumeHand],
        variants: [
          { volumeMl: 50, stock: 10 },
          { volumeMl: 100, price: 98000, stock: 4 },
        ],
      },
      {
        name: "Peony Bloom",
        description:
          "Fresh peony and jasmine with a hint of vanilla pod. Light, bright and easy to wear.",
        price: 44000,
        images: [photos.perfumeFloral],
        variants: [
          { volumeMl: 30, price: 28000, stock: 20 },
          { volumeMl: 50, stock: 14 },
        ],
      },
      {
        name: "Deep Blue",
        description:
          "Sea salt, bergamot and vetiver. A crisp aquatic for everyday wear.",
        price: 46000,
        images: [photos.perfumeBlue],
        variants: [
          { volumeMl: 50, stock: 0 },
          { volumeMl: 100, price: 74000, stock: 9 },
        ],
      },
    ],
  },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const reset = process.argv.includes("--reset");
const { products: existing } = await db.orm.public.Product.aggregate((a) => ({
  products: a.count(),
}));

if (existing > 0 && !reset) {
  console.log(
    `Catalog already has ${existing} products; nothing to do. Pass --reset to reseed.`,
  );
  await db.close();
  process.exit(0);
}

await db.transaction(async (tx) => {
  if (reset) {
    // Children first. Cart items cascade with variants; order items keep
    // their snapshot and lose only the variant link (SetNull).
    await tx.orm.public.ProductImage.where((i) => i.id.isNotNull()).deleteAll();
    await tx.orm.public.ProductVariant.where((v) =>
      v.id.isNotNull(),
    ).deleteAll();
    await tx.orm.public.Product.where((p) => p.id.isNotNull()).deleteAll();
    await tx.orm.public.Category.where((c) => c.id.isNotNull()).deleteAll();
  }

  for (const [sortOrder, cat] of catalog.entries()) {
    const category = await tx.orm.public.Category.create({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      sortOrder,
      imageUrl: cat.image,
    });

    for (const p of cat.products) {
      const slug = slugify(p.name);
      const product = await tx.orm.public.Product.create({
        categoryId: category.id,
        name: p.name,
        slug,
        description: p.description,
        status: "ACTIVE",
        isFeatured: p.featured ?? false,
        basePrice: naira(p.price),
        compareAtPrice: p.compareAt ? naira(p.compareAt) : null,
      });

      for (const [i, v] of p.variants.entries()) {
        const parts = [
          v.color,
          v.size,
          v.volumeMl ? `${v.volumeMl}ML` : undefined,
        ].filter(Boolean);
        await tx.orm.public.ProductVariant.create({
          productId: product.id,
          sku: `${slug}-${parts.join("-") || i}`.toUpperCase(),
          size: v.size ?? null,
          color: v.color ?? null,
          volumeMl: v.volumeMl ?? null,
          price: v.price ? naira(v.price) : null,
          stock: v.stock,
        });
      }

      for (const [position, url] of p.images.entries()) {
        await tx.orm.public.ProductImage.create({
          productId: product.id,
          arkAssetId: `seed:${slug}:${position}`,
          url,
          alt: p.name,
          position,
        });
      }
    }
  }
});

const total = catalog.reduce((n, c) => n + c.products.length, 0);
console.log(`Seeded ${catalog.length} categories and ${total} products.`);
await db.close();
