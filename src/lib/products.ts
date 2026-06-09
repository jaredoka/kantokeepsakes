export interface Product {
  id: string;
  name: string;
  category: string;
  type: string;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
  preorder: boolean;
}

import productsData from "../../legacy/data/products.json";

export function getProducts(): Product[] {
  return productsData as Product[];
}

export function filterProducts(
  products: Product[],
  opts: { category?: string; type?: string; preorder?: boolean } = {}
): Product[] {
  return products.filter((p) => {
    if (opts.preorder === true) return p.preorder === true;
    if (opts.category && p.category !== opts.category) return false;
    if (opts.type && p.type !== opts.type) return false;
    if (!opts.preorder && p.preorder) return false;
    return true;
  });
}

export function sortProducts(products: Product[], order: string): Product[] {
  const sorted = [...products];
  if (order === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (order === "price-desc") sorted.sort((a, b) => b.price - a.price);
  return sorted;
}
