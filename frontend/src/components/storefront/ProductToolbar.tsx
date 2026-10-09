"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  NO_FILTERS,
  SORT_OPTIONS,
  activeFilterCount,
  applyCatalogView,
  priceBounds,
  type ProductFilters,
  type SortKey,
} from "@/lib/storefront/catalog";

type Product = Record<string, any>;

/**
 * Sort + filter (+ optional local search) state for a product grid. Search is applied first (typo tolerant),
 * then the category, price and availability filters, then the sort order.
 */
export function useProductBrowser<T extends Product>(products: T[], opts: { query?: string; category?: string } = {}) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [filters, setFilters] = useState<ProductFilters>(NO_FILTERS);
  const [localQuery, setLocalQuery] = useState("");
  const query = opts.query ?? localQuery;

  const view = useMemo(() => applyCatalogView(products, { query, category: opts.category, filters, sort }), [products, query, opts.category, filters, sort]);
  const bounds = useMemo(() => priceBounds(products), [products]);

  return {
    sort,
    setSort,
    filters,
    setFilters,
    query,
    setQuery: setLocalQuery,
    results: view.items,
    approximate: view.approximate,
    bounds,
    activeCount: activeFilterCount(filters),
    reset: () => {
      setFilters(NO_FILTERS);
      setSort("featured");
      setLocalQuery("");
    },
  };
}

export type ProductBrowser = ReturnType<typeof useProductBrowser>;

export interface ToolbarTheme {
  /** Text of controls, e.g. "text-[#111111]". */
  text: string;
  muted: string;
  border: string;
  /** Floating panel (filters) background + border. */
  panel: string;
  /** Selected / primary control. */
  primary: string;
  input: string;
  radius: string;
}

export const LIGHT_TOOLBAR: ToolbarTheme = {
  text: "text-[#111111]",
  muted: "text-black/50",
  border: "border-black/15",
  panel: "bg-white border-black/10 shadow-xl text-[#111111]",
  primary: "bg-[#111111] text-white",
  input: "bg-white border-black/15 text-[#111111] placeholder:text-black/30",
  radius: "rounded-lg",
};

export const DARK_TOOLBAR: ToolbarTheme = {
  text: "text-white",
  muted: "text-white/50",
  border: "border-white/20",
  panel: "bg-[#161616] border-white/15 shadow-2xl text-white",
  primary: "bg-white text-black",
  input: "bg-black border-white/20 text-white placeholder:text-white/30",
  radius: "rounded-none",
};

/** Price range + availability inputs. Exported so templates with their own filter UI can embed them. */
export type FilterState = Pick<ProductBrowser, "filters" | "setFilters" | "bounds" | "activeCount">;

export function FilterFields({ browser, theme, symbol = "" }: { browser: FilterState; theme: ToolbarTheme; symbol?: string }) {
  const { filters, setFilters, bounds } = browser;
  const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Math.max(0, Number(v)));
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className={`mb-2 text-[10px] font-semibold uppercase tracking-widest ${theme.muted}`}>Price {symbol && `(${symbol})`}</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="pf-min">
            Minimum price
          </label>
          <input
            id="pf-min"
            inputMode="decimal"
            placeholder={String(bounds.min)}
            value={filters.minPrice ?? ""}
            onChange={(e) => setFilters({ ...filters, minPrice: num(e.target.value) })}
            className={`w-full border px-3 py-2 text-sm focus:outline-none ${theme.input} ${theme.radius}`}
          />
          <span className={theme.muted}>–</span>
          <label className="sr-only" htmlFor="pf-max">
            Maximum price
          </label>
          <input
            id="pf-max"
            inputMode="decimal"
            placeholder={String(bounds.max)}
            value={filters.maxPrice ?? ""}
            onChange={(e) => setFilters({ ...filters, maxPrice: num(e.target.value) })}
            className={`w-full border px-3 py-2 text-sm focus:outline-none ${theme.input} ${theme.radius}`}
          />
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" checked={filters.inStockOnly} onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })} className="h-4 w-4" />
        In stock only
      </label>
      {browser.activeCount > 0 && (
        <button type="button" onClick={() => browser.setFilters(NO_FILTERS)} className={`self-start text-xs font-semibold underline underline-offset-4 ${theme.muted}`}>
          Clear filters
        </button>
      )}
    </div>
  );
}

/** Filters button with a popover panel. */
export function FilterMenu({ browser, theme, symbol }: { browser: FilterState; theme: ToolbarTheme; symbol?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${theme.border} ${theme.text} ${theme.radius} ${open ? "opacity-70" : ""}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        Filters
        {browser.activeCount > 0 && <span className={`flex h-4 min-w-4 items-center justify-center px-1 text-[10px] ${theme.primary} ${theme.radius}`}>{browser.activeCount}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Filters" className={`absolute right-0 top-full z-40 mt-2 w-72 max-w-[85vw] border p-4 ${theme.panel} ${theme.radius}`}>
          <FilterFields browser={browser} theme={theme} symbol={symbol} />
        </div>
      )}
    </div>
  );
}

/** Native select so it works with keyboards and screen readers on every template. */
export function SortSelect({ browser, theme }: { browser: ProductBrowser; theme: ToolbarTheme }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort products</span>
      <select
        value={browser.sort}
        onChange={(e) => browser.setSort(e.target.value as SortKey)}
        className={`cursor-pointer appearance-none border bg-transparent py-2 pl-3.5 pr-9 text-xs font-semibold uppercase tracking-widest focus:outline-none ${theme.border} ${theme.text} ${theme.radius}`}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-black">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-3 h-3.5 w-3.5 ${theme.muted}`} aria-hidden />
    </label>
  );
}

export function ProductToolbar({
  browser,
  theme,
  symbol,
  showSearch = false,
  hideSort = false,
  hideFilters = false,
  searchPlaceholder = "Search products…",
  className = "",
}: {
  browser: ProductBrowser;
  theme: ToolbarTheme;
  symbol?: string;
  /** Show a search box (for templates whose header has none). */
  showSearch?: boolean;
  /** For templates that already have their own sort control. */
  hideSort?: boolean;
  hideFilters?: boolean;
  searchPlaceholder?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {showSearch && (
        <div className="relative min-w-[200px] flex-1">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.muted}`} aria-hidden />
          <input
            type="search"
            value={browser.query}
            onChange={(e) => browser.setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search products"
            className={`w-full border py-2 pl-9 pr-8 text-sm focus:outline-none ${theme.input} ${theme.radius}`}
          />
          {browser.query && (
            <button type="button" onClick={() => browser.setQuery("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${theme.muted}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">
        {!hideFilters && <FilterMenu browser={browser} theme={theme} symbol={symbol} />}
        {!hideSort && <SortSelect browser={browser} theme={theme} />}
      </div>
    </div>
  );
}

/** One line under the toolbar: result count and, for typo/loose matches, a hint that results are approximate. */
export function ResultsNote({ browser, total, theme }: { browser: ProductBrowser; total: number; theme: ToolbarTheme }) {
  const searching = browser.query.trim() !== "";
  if (!searching && browser.activeCount === 0) return null;
  return (
    <p className={`text-xs ${theme.muted}`} role="status" aria-live="polite">
      {browser.results.length} of {total} products
      {searching && browser.approximate && browser.results.length > 0 ? ` · no exact match for “${browser.query.trim()}”, showing the closest` : ""}
    </p>
  );
}

/** Stand-alone search box for templates that lay out their own controls. */
export function SearchInput({
  value,
  onChange,
  theme,
  placeholder = "Search products…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  theme: ToolbarTheme;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.muted}`} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className={`w-full border py-2.5 pl-9 pr-8 text-sm focus:outline-none ${theme.input} ${theme.radius}`}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${theme.muted}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
