/** Helpers for reading merchant-edited storefront copy (the `formData` of a store's customization). */

type FormData = Record<string, unknown> | null | undefined;

/** A non-blank string from `formData[key]`, else `fallback`. */
export function pickText(fd: FormData, key: string, fallback: string): string {
  const v = fd?.[key];
  return typeof v === "string" && v.trim() !== "" ? v : fallback;
}

export interface NavDefaults {
  home: string;
  shop: string;
  about: string;
  contact: string;
  orders: string;
  search: string;
}

/** Navigation labels with the merchant's overrides applied. */
export function navLabels(fd: FormData, defaults: NavDefaults): NavDefaults {
  return {
    home: pickText(fd, "navHomeLabel", defaults.home),
    shop: pickText(fd, "navShopLabel", defaults.shop),
    about: pickText(fd, "navAboutLabel", defaults.about),
    contact: pickText(fd, "navContactLabel", defaults.contact),
    orders: pickText(fd, "navOrdersLabel", defaults.orders),
    search: pickText(fd, "searchPlaceholder", defaults.search),
  };
}

export const POLICY_PAGES = {
  "privacy-policy": {
    key: "privacyPolicy",
    title: "Privacy Policy",
    fallback:
      "We respect your privacy. We collect only the information needed to process your orders and support you - your name, contact details and delivery address - and we never sell it.\n\nYour information is used to fulfil and deliver your orders, to contact you about them, and to improve our store. You can ask us to update or delete your information at any time by contacting us.",
  },
  "terms-conditions": {
    key: "termsConditions",
    title: "Terms & Conditions",
    fallback:
      "By placing an order you agree to these terms. Prices include applicable taxes unless stated otherwise. We may cancel orders that cannot be fulfilled, in which case you will be refunded in full.\n\nProduct images are for illustration and may differ slightly from the item delivered. Delivery dates are estimates and may vary with your location and carrier availability.",
  },
  "shipping-returns": {
    key: "shippingReturns",
    title: "Shipping & Returns",
    fallback:
      "Orders are dispatched from the warehouse nearest to you that has your items in stock. The estimated delivery date is shown at checkout.\n\nYou can cancel an order before it ships, and change the delivery address or phone number within 24 hours of ordering. If something is wrong with your order, request a return from your orders page. Refunds for online payments go back to the original payment method; for Cash on Delivery orders we transfer to the bank account you provide.",
  },
} as const;

export type PolicySlug = keyof typeof POLICY_PAGES;
