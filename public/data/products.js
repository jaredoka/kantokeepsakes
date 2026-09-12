/* ============================================================
   Kanto Keepsakes - THE CATALOGUE

   This is the only file to edit to list, price or retire a product. Add an
   entry to the array below; the site picks it up on the next push. There is
   no build step and no data request: the page already has this file.

   Each entry:
     id           unique, lowercase, dashes. Also the photo filename.
     name         shown on the card
     category     'japanese' | 'english' | 'accessories'    -> which page
     type         'sealed' | 'singles' | 'graded' | 'accessories' -> which sub-page
     price        number in BND, e.g. 65 or 12.5  (0 shows as "POA")
     image        path from the site root, e.g. 'images/products/pikachu.jpg'
     description  one line under the name
     inStock      optional, default true; false shows "Out of Stock" and blocks the cart
     preorder     optional, default false; preorders show only on the Preorder page
     stock        optional, default 1 - how many a customer may add

   To retire a product: set inStock: false, or delete the entry.
   ============================================================ */

export const PRODUCTS = [
  // Copy this shape, then delete the // marks. The photo goes in
  // images/products/<id>.jpg - see README.md.
  //
  // {
  //   id: 'pikachu-with-grey-felt-hat-psa10',
  //   name: 'Pikachu with Grey Felt Hat',
  //   category: 'english',
  //   type: 'graded',
  //   price: 395,
  //   image: 'images/products/pikachu-with-grey-felt-hat-psa10.jpg',
  //   description: 'PSA 10, SVP Black Star Promos 2023.',
  //   stock: 1,
  // },
];
