import { getProducts } from "@/lib/products";
import ProductGrid from "./ProductGrid";
import styles from "./CategoryPage.module.css";

interface Props {
  title: string;
  subtitle?: string;
  category?: string;
  type?: string;
  preorder?: boolean;
  showSubnav?: boolean;
}

export default function CategoryPage({
  title,
  subtitle,
  category,
  type,
  preorder,
  showSubnav,
}: Props) {
  const products = getProducts();

  return (
    <main className={`${styles.mainContent} container`}>
      <div className={styles.pageHeader}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <ProductGrid
        products={products}
        category={category}
        type={type}
        preorder={preorder}
        showSubnav={showSubnav}
        subnavCategory={category}
      />
    </main>
  );
}
