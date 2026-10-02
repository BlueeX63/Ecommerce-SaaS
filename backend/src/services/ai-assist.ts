/**
 * "AI Product Tools" add-on — generates a starter description, alt text and tags for a product from its
 * name and category.
 *
 * This is a deliberately self-contained, deterministic generator: no external model or API key is
 * configured for this project, so rather than fake a call to one, it composes real (if simple) copy
 * locally, for free, with no added latency or cost. The endpoint and its entitlement gate are the same
 * shape a hosted-model call would use, so swapping in a real provider later only means replacing the body
 * of `generateProductCopy`.
 */

export interface ProductCopyInput {
  productName: string;
  category?: string;
}

export interface ProductCopy {
  description: string;
  altText: string;
  tags: string[];
}

const OPENERS = [
  'Meticulously crafted',
  'Thoughtfully designed',
  'Built for everyday use',
  'A modern essential',
  'Designed with intention',
];

const CLOSERS = [
  'made to earn a permanent place in your routine.',
  'balancing form and function without compromise.',
  'so you get quality that lasts, not just looks.',
  'crafted for people who notice the details.',
  'built to perform as good as it looks.',
];

function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length];
}

/** Small, stable hash so the same input always suggests the same copy (not cryptographic, just deterministic). */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export function generateProductCopy({ productName, category }: ProductCopyInput): ProductCopy {
  const name = productName.trim();
  const cat = category?.trim();
  const seed = hash(name + (cat ?? ''));

  const opener = pick(OPENERS, seed);
  const closer = pick(CLOSERS, seed >> 3);
  const categoryPhrase = cat ? ` in the ${cat.toLowerCase()} category` : '';

  const description = `${opener}, the ${name}${categoryPhrase} is ${closer}`;
  const altText = cat ? `${titleCase(name)} — ${titleCase(cat)} product photo` : `${titleCase(name)} product photo`;

  const words = `${name} ${cat ?? ''}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  const tags = [...new Set(words)].slice(0, 6);

  return { description, altText, tags };
}
