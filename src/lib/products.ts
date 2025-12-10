export type Product = {
  slug: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  dimensions?: string;
  colors?: string[];
};

const products: Product[] = [
  {
    slug: "circled-vase",
    name: "Circled Vase",
    price: 19.99,
    category: "Vases",
    description:
      "Minimalistinė 3D spausdinta vaza su apvalia forma. Tinka tiek sausoms šakelėms, tiek kaip skulptūrinis objektas ant lentynos.",
    imageUrl: "/images/image1.jpg",
    dimensions: "25x30x10 cm",
    colors: ["#e8e0d6", "#f5f0ea", "#c1a58a"]
  },
  {
    slug: "ringed-vase",
    name: "Ringed Vase",
    price: 24.5,
    category: "Vases",
    description:
      "Organinių linijų vaza, spausdinta 3D ir šlifuota rankomis. Kiekviena vaza šiek tiek skiriasi ir yra vienetinė.",
    imageUrl: "/images/image2.jpg",
    dimensions: "25x30x10 cm",
    colors: ["#f6f1eb", "#ddd2c4", "#c2a58a"]
  },
  {
    slug: "desk-calendar",
    name: "Desk Calendar",
    price: 29.0,
    category: "Objects",
    description:
      "Rotuojamas stalo kalendorius su 3D spausdintais kubeliais. Puikiai tinka ant darbo stalo ar lentynos.",
    imageUrl: "/images/image3.jpg",
    dimensions: "18x10x6 cm",
    colors: ["#f5f0ea", "#e0d6c7", "#b79d7a"]
  },
  {
    slug: "decorative-object",
    name: "Decorative Object",
    price: 34.99,
    category: "Objects",
    description:
      "Unikalus 3D spausdintas dekoratyvinis objektas, gaminamas mažomis serijomis ir baigiamas rankomis. Puikiai tinka kaip interjero detalė.",
    imageUrl: "/images/image4.jpg",
    dimensions: "20x15x12 cm",
    colors: ["#f5f0ea", "#e0d6c7", "#b79d7a"]
  }
];

export function getAllProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(): Product[] {
  return products.slice(0, 3);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
