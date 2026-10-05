// Static copy and imagery for the landing page.
//
// Every image here is a placeholder from Unsplash (free licence, no
// attribution required). Swap them for product photography uploaded to Ark
// once the catalog exists — Ark's `url` values are already allowed in
// next.config.ts. Stats, address and contact details are placeholders too.

const unsplash = (photo: string) =>
  `https://images.unsplash.com/${photo}?w=1600&q=80&fm=jpg`;

export const images = {
  heroModel: unsplash("photo-1725944593135-9d829487ea01"), // g9du5D8qAm0
  hoodieBlack: unsplash("photo-1633002507458-d8d61e7bc5d6"), // 2hsBu0Wr2UY
  hoodieMono: unsplash("photo-1723678712998-22157b59e929"), // 9PYBriPBDSQ
  hoodieMint: unsplash("photo-1715615245424-97d67b181c89"), // 9X_mbQorlTI
  hoodieWhiteStreet: unsplash("photo-1601396344868-31e008cd6e7c"), // n-yh8Trp0EI
  joggersSet: unsplash("photo-1675280591581-657af8de8607"), // H_-bZhnPT1I
  joggersSneakers: unsplash("photo-1595939152851-d1c3d6c39623"), // yR7bfwEMLRk
  tracksuit: unsplash("photo-1780396508935-94e234affc92"), // 2Hu2ZPmkzBA
  jacketOlive: unsplash("photo-1575862469281-63389040c6fd"), // VDt-qMYzpdE
  knitCover: unsplash("photo-1574201635302-388dd92a4c3f"), // mU88MlEFcoU
  hoodieGreyOutdoor: unsplash("photo-1576211473184-a3a1da6216b7"), // h-Hd2wKPgjg
  studioPortrait: unsplash("photo-1771012266130-435928e57460"), // X5o7em8vopg
  blazerPortrait: unsplash("photo-1717765697742-6b2f48f4a1fa"), // h-jIyccjUwU
  perfumeSmoke: unsplash("photo-1666621630026-862eea07236c"), // OD1fzMu-UoY
  perfumeGlass: unsplash("photo-1572566202186-611ceb4042f0"), // 752a7fdivow
  perfumeHand: unsplash("photo-1639238589580-6831e93afb1f"), // R0wPxPsjkNg
} as const;

export const nav = {
  brand: "EMPEESS",
  links: [
    { label: "Shop", href: "/shop" },
    { label: "Clothes", href: "/shop/clothes" },
    { label: "Joggers", href: "/shop/joggers" },
    { label: "Hoodies", href: "/shop/hoodies" },
    { label: "Perfumes", href: "/shop/perfumes" },
  ],
};

export const hero = {
  imageAlt: "Model in a cream hoodie and sunglasses",
  lineA: ["where", "- style"],
  lineB: ["lives", "- now"],
  tagLeft: "//FASHION",
  tagRight: "//STYLED FOR\nLIFE.",
  blurb:
    "Explore curated collections, exclusive drops and everyday essentials — all thoughtfully designed in one stylish shopping destination.",
  collection: "/ New\nCollection 2026",
  stat: { value: 12, suffix: "K+", label: "PEOPLE WE DRESS" },
};

export const moments = {
  title: ["All - about", "moments ©26"],
  primary: {
    src: images.joggersSet,
    alt: "Model in a white hoodie and black joggers",
    caption: "©EMPEESS - going distance 2026",
  },
  secondary: {
    src: images.tracksuit,
    alt: "Model in a navy tracksuit on a city street",
    caption: "©EMPEESS - just move 2026",
    badge: "(30%)",
  },
  thumb: { src: images.knitCover, alt: "Oversized knit pulled over a face" },
  copy: "Where comfort meets street luxury, made accessible.",
  price: "(₦45,000)",
};

export const categories = {
  copy: "Every piece carries rhythm beyond clothing — its motion and meaning, where street energy meets everyday.",
  items: [
    {
      name: "Clothes",
      slug: "clothes",
      count: 174,
      src: images.jacketOlive,
      alt: "Model in an olive jacket and white tee",
    },
    {
      name: "Joggers",
      slug: "joggers",
      count: 96,
      src: images.joggersSneakers,
      alt: "Joggers and sneakers on a skateboard",
    },
    {
      name: "Hoodies",
      slug: "hoodies",
      count: 128,
      src: images.hoodieBlack,
      alt: "Model in a black hoodie against a white wall",
    },
    {
      name: "Perfumes",
      slug: "perfumes",
      count: 42,
      src: images.perfumeSmoke,
      alt: "Perfume bottle wrapped in soft smoke",
    },
  ],
};

export const testimonials = [
  {
    name: "Amaka O.",
    role: "Fashion Stylist",
    quote:
      "Everything is absolutely perfect! From the fabric quality to the flawless fit, every piece feels premium. EMPEESS has completely transformed my wardrobe.",
    src: images.studioPortrait,
  },
  {
    name: "Tobi A.",
    role: "Creative Director",
    quote:
      "The joggers are the softest I own and the cut is unreal. I've ordered three more colours and every delivery arrived faster than promised.",
    src: images.hoodieMint,
  },
  {
    name: "Zara M.",
    role: "Content Creator",
    quote:
      "I came for the hoodies and stayed for the perfumes. The scents last all day and the packaging feels like opening a gift every single time.",
    src: images.blazerPortrait,
  },
];

export const testimonialRating = { score: "5.0", reviews: 49 };

export const lookbook = {
  title: ["©empeess -", "hoodie momento"],
  year: "2026",
  slides: [
    { src: images.hoodieMono, alt: "Black and white portrait in a grey hoodie", label: "[Wear the Moment]" },
    { src: images.hoodieWhiteStreet, alt: "Woman in a white hoodie on a sunny street", label: "[Soft Power]" },
    { src: images.tracksuit, alt: "Woman in a navy tracksuit", label: "[Track Ready]" },
    { src: images.jacketOlive, alt: "Model in an olive jacket", label: "[Layer Up]" },
    { src: images.hoodieGreyOutdoor, alt: "Man in a grey hoodie sitting outdoors", label: "[Off Duty]" },
    { src: images.hoodieBlack, alt: "Man in a black hoodie", label: "[After Hours]" },
    { src: images.perfumeHand, alt: "Hand holding a perfume bottle", label: "[Signature]" },
  ],
};

export const collections = {
  intro:
    "From enduring classics to daring statement pieces, our collections are crafted with intention.",
  outro: "Be part of our journey.",
  items: [
    {
      title: "Statement Hoodies 2026",
      copy: "Heavyweight fleece, oversized fits and details that start conversations.",
      href: "/shop/hoodies",
      src: images.hoodieMono,
      thumb: images.hoodieBlack,
    },
    {
      title: "Everyday Joggers 2026",
      copy: "Your go-to staples, cut for comfort and effortless movement.",
      href: "/shop/joggers",
      src: images.joggersSet,
      thumb: images.joggersSneakers,
    },
    {
      title: "Timeless Clothes 2026",
      copy: "Jackets, tees and layers that outlast every trend cycle.",
      href: "/shop/clothes",
      src: images.jacketOlive,
      thumb: images.knitCover,
    },
    {
      title: "Signature Scents 2026",
      copy: "Long-lasting fragrances to finish every look.",
      href: "/shop/perfumes",
      src: images.perfumeGlass,
      thumb: images.perfumeSmoke,
    },
  ],
};

export const footer = {
  eyebrow: "CONTACT US",
  headline: ["Fast selling urban", "__fashion collection"],
  contact: [
    { label: "LOCATION", value: "Lagos, Nigeria" },
    { label: "CALL US", value: "+234 000 000 0000" },
    { label: "EMAIL", value: "hello@empeess.com" },
    { label: "OPEN TIME", value: "08.00 - 21.00" },
  ],
  columns: [
    {
      title: "MENU",
      links: [
        { label: "About", href: "/about" },
        { label: "Shop", href: "/shop" },
        { label: "New in", href: "/shop?sort=new" },
        { label: "Account", href: "/account" },
      ],
    },
    {
      title: "SHOP",
      links: [
        { label: "Clothes", href: "/shop/clothes" },
        { label: "Joggers", href: "/shop/joggers" },
        { label: "Hoodies", href: "/shop/hoodies" },
        { label: "Perfumes", href: "/shop/perfumes" },
      ],
    },
    {
      title: "HELP",
      links: [
        { label: "Orders", href: "/account/orders" },
        { label: "Shipping", href: "/shipping" },
        { label: "Returns", href: "/returns" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],
};
