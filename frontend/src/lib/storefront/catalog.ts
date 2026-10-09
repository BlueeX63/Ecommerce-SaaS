/**
 * Search, filter and sort for storefront product grids. One implementation shared by every template so they all
 * behave the same: typo-tolerant search over name / category / description / SKU, price + availability
 * filters, and consistent sort options.
 */

// Products reach templates in a few shapes (mapped for templates, or raw from the API); read both.
type AnyProduct = Record<string, any>;

export const productName = (p: AnyProduct): string => String(p.name ?? p.product_name ?? "");
export const productCategory = (p: AnyProduct): string => String(p.category ?? p.categories?.category_name ?? "");
export const productPrice = (p: AnyProduct): number => Number(p.price ?? p.base_price ?? 0) || 0;
const productDescription = (p: AnyProduct): string => String(p.description ?? "");
const productSku = (p: AnyProduct): string => String(p.sku ?? "");
const productCreated = (p: AnyProduct): number => {
  const t = Date.parse(String(p.createdAt ?? p.created_date ?? ""));
  return Number.isFinite(t) ? t : 0;
};
/** Products whose stock the merchant doesn't track are treated as available. */
export const productInStock = (p: AnyProduct): boolean => (p.stockStatus ?? p.stock_status) !== "out_of_stock";

// ---------------------------------------------------------------------------------------------
// Fuzzy search
// ---------------------------------------------------------------------------------------------

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Light stemmer so "shoes"/"shoe", "bags"/"bag", "berries"/"berry" meet in the middle. */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es") && /(s|x|z|ch|sh|o)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Damerau-Levenshtein distance, bounded: returns max+1 as soon as the distance is known to exceed `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2: number[] = [];
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (prev2[j - 2] ?? Infinity) + 1);
      cur[j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2.splice(0, prev2.length, ...prev);
    prev = cur;
  }
  return prev[b.length];
}

const allowedTypos = (len: number) => (len <= 3 ? 0 : len <= 5 ? 1 : len <= 9 ? 2 : 3);

/** 0..1: how well one query word matches one word of a product field. */
function wordScore(q: string, w: string): number {
  if (!q || !w) return 0;
  if (q === w) return 1;
  if (w.startsWith(q)) return q.length >= 2 ? 0.92 : 0.5; // as-you-type
  if (q.length >= 3 && w.includes(q)) return 0.72;
  if (q.length >= 4 && q.startsWith(w) && w.length >= 4) return 0.7; // query is a longer form of the word
  const allowed = allowedTypos(q.length);
  if (allowed === 0) return 0;
  const whole = editDistance(q, w, allowed);
  const prefix = w.length > q.length ? editDistance(q, w.slice(0, q.length), allowed) + 0.5 : Infinity;
  const d = Math.min(whole, prefix);
  if (d > allowed) return 0;
  return Math.max(0.2, 0.84 - 0.3 * d);
}

interface Indexed {
  name: string[];
  category: string[];
  description: string[];
  sku: string[];
  nameJoined: string;
  categoryJoined: string;
}

const indexCache = new WeakMap<object, Indexed>();

function indexOf(p: AnyProduct): Indexed {
  const cached = indexCache.get(p);
  if (cached) return cached;
  const split = (s: string) => normalise(s).split(" ").filter(Boolean).map(stem);
  const name = split(productName(p));
  const category = split(productCategory(p));
  const built: Indexed = {
    name,
    category,
    description: split(productDescription(p)).slice(0, 80),
    sku: normalise(productSku(p)).split(" ").filter(Boolean),
    nameJoined: name.join(""),
    categoryJoined: category.join(""),
  };
  indexCache.set(p, built);
  return built;
}

const FIELD_WEIGHT = { name: 1, category: 0.65, sku: 0.6, description: 0.3 } as const;

/** Everyday alternative words, so "pants" finds trousers and "couch" finds a sofa. Keys and values are stemmed. */
const SYNONYMS: Record<string, string[]> = {
  pant: ["trouser", "jean", "denim"],
  trouser: ["pant"],
  jean: ["denim", "pant"],
  tee: ["tshirt", "shirt"],
  tshirt: ["tee", "shirt"],
  shirt: ["tee", "top"],
  top: ["shirt", "tee", "blouse"],
  sneaker: ["shoe", "trainer"],
  shoe: ["sneaker", "boot", "footwear"],
  trainer: ["sneaker", "shoe"],
  bag: ["tote", "backpack", "purse", "handbag"],
  purse: ["bag", "wallet"],
  sweater: ["jumper", "pullover", "knit"],
  jumper: ["sweater"],
  jacket: ["coat", "outerwear"],
  coat: ["jacket", "outerwear"],
  sofa: ["couch"],
  couch: ["sofa"],
  phone: ["mobile", "smartphone"],
  mobile: ["phone", "smartphone"],
  laptop: ["notebook", "computer"],
  tv: ["television"],
  television: ["tv"],
  watch: ["timepiece"],
  cup: ["mug"],
  mug: ["cup"],
};

function productScore(p: AnyProduct, tokens: string[], joinedQuery: string, requireAll: boolean): number {
  const idx = indexOf(p);
  let total = 0;
  let matched = 0;

  for (const token of tokens) {
    let best = 0;
    const alternatives: Array<[string, number]> = [[token, 1], ...(SYNONYMS[token] ?? []).map((alt): [string, number] => [alt, 0.85])];
    for (const field of ["name", "category", "sku", "description"] as const) {
      let fieldBest = 0;
      for (const w of idx[field]) for (const [alt, factor] of alternatives) fieldBest = Math.max(fieldBest, wordScore(alt, w) * factor);
      best = Math.max(best, fieldBest * FIELD_WEIGHT[field]);
    }
    if (best >= 0.22) matched += 1;
    total += best;
  }

  // "teeshirt" should find "Tee Shirt" (and vice-versa): compare with the spaces removed.
  if (joinedQuery.length >= 4) {
    for (const [joined, weight] of [[idx.nameJoined, 1], [idx.categoryJoined, 0.65]] as const) {
      if (!joined) continue;
      if (joined.includes(joinedQuery)) total = Math.max(total, 0.8 * weight * tokens.length);
      else if (editDistance(joinedQuery, joined.slice(0, joinedQuery.length), allowedTypos(joinedQuery.length)) <= allowedTypos(joinedQuery.length)) {
        total = Math.max(total, 0.6 * weight * tokens.length);
        matched = Math.max(matched, tokens.length);
      }
    }
  }

  if (requireAll && matched < tokens.length) return 0;
  if (matched === 0) return 0;
  return total / tokens.length;
}

export interface SearchResult<T> {
  items: T[];
  /** True when nothing matched exactly and the results are the closest guesses. */
  approximate: boolean;
}

/** Ranked, typo-tolerant search. An empty query returns everything in its original order. */
export function searchProducts<T extends AnyProduct>(items: T[], query: string): SearchResult<T> {
  const normalised = normalise(query);
  if (!normalised) return { items, approximate: false };

  const tokens = normalised.split(" ").filter(Boolean).map(stem);
  const joined = tokens.join("");

  const rank = (requireAll: boolean) => {
    const scored = items
      .map((p) => ({ p, score: productScore(p, tokens, joined, requireAll) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    // When there is a clear best match, drop the long tail of weak typo-matches.
    const top = scored[0]?.score ?? 0;
    return scored.filter((r) => top < 0.9 || r.score >= top * 0.5).map((r) => r.p);
  };

  const strict = rank(true);
  if (strict.length > 0) return { items: strict, approximate: false };

  // Nothing contains every word: fall back to products that match some of them.
  const loose = rank(false);
  return { items: loose, approximate: loose.length > 0 };
}

// ---------------------------------------------------------------------------------------------
// Filters + sort
// ---------------------------------------------------------------------------------------------

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export interface ProductFilters {
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
}

export const NO_FILTERS: ProductFilters = { minPrice: null, maxPrice: null, inStockOnly: false };

export function activeFilterCount(f: ProductFilters): number {
  return (f.minPrice !== null ? 1 : 0) + (f.maxPrice !== null ? 1 : 0) + (f.inStockOnly ? 1 : 0);
}

export function sortProducts<T extends AnyProduct>(items: T[], sort: SortKey): T[] {
  if (sort === "featured") return items;
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => productPrice(a) - productPrice(b));
    case "price-desc":
      return copy.sort((a, b) => productPrice(b) - productPrice(a));
    case "name-asc":
      return copy.sort((a, b) => productName(a).localeCompare(productName(b)));
    case "name-desc":
      return copy.sort((a, b) => productName(b).localeCompare(productName(a)));
    case "newest":
      return copy.sort((a, b) => productCreated(b) - productCreated(a));
  }
}

export function filterProducts<T extends AnyProduct>(items: T[], f: ProductFilters): T[] {
  return items.filter((p) => {
    const price = productPrice(p);
    if (f.minPrice !== null && price < f.minPrice) return false;
    if (f.maxPrice !== null && price > f.maxPrice) return false;
    if (f.inStockOnly && !productInStock(p)) return false;
    return true;
  });
}

export function priceBounds(items: AnyProduct[]): { min: number; max: number } {
  if (items.length === 0) return { min: 0, max: 0 };
  const prices = items.map(productPrice);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

export const sameCategory = (p: AnyProduct, category: string) => productCategory(p).trim().toLowerCase() === category.trim().toLowerCase();

export interface CatalogView {
  query: string;
  category?: string;
  filters: ProductFilters;
  sort: SortKey;
}

/** Search -> category -> filters -> sort. While searching, "featured" order means best match first. */
export function applyCatalogView<T extends AnyProduct>(items: T[], view: CatalogView): SearchResult<T> {
  let list = items;
  if (view.category && view.category.toLowerCase() !== "all") list = list.filter((p) => sameCategory(p, view.category!));
  const searched = searchProducts(list, view.query);
  return { items: sortProducts(filterProducts(searched.items, view.filters), view.sort), approximate: searched.approximate };
}
