export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  createdAt: Date;
  isActive: boolean;
}
