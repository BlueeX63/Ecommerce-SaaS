/** Storefront templates a store may be created with. Keep in sync with the frontend template registry. */
export const TEMPLATE_IDS = [
  'starter-minimalist',
  'starter-essence',
  'starter-origin',
  'starter-canvas',
  'growth-nexus-pro',
  'growth-velocity',
  'growth-quantum',
  'growth-horizon',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_TEMPLATE: TemplateId = 'starter-minimalist';

/** Upper bound for the serialized customization JSON stored per store. */
export const MAX_CUSTOMIZATION_BYTES = 512 * 1024;
