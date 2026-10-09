"use client";

import { useCustomization } from "@/hooks/useCustomization";
import { pickText, POLICY_PAGES, type PolicySlug } from "@/lib/storefront/copy";

/**
 * A store policy page (privacy, terms, shipping & returns). The text is merchant-editable in the store editor's
 * Policies tab. Colours are inherited from the template's own layout so it fits every theme.
 */
export function PolicyPage({ slug, initialCustomData }: { slug: PolicySlug; initialCustomData?: unknown }) {
  const customData = useCustomization(initialCustomData);
  const page = POLICY_PAGES[slug];
  const text = pickText(customData?.formData, page.key, page.fallback);
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="w-full flex-grow">
      <article className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:pt-40">
        <h1 className="mb-10 text-3xl font-semibold tracking-tight md:text-5xl">{page.title}</h1>
        <div className="space-y-6 text-base leading-relaxed opacity-75">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
