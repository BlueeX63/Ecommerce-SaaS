"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Check, Clock, Headset, Loader2, MapPin, Phone, Send, UserRound } from "lucide-react";
import type { AccountTheme } from "@/components/storefront/AccountCenter";

interface EditWindow {
  open: boolean;
  reason: string | null;
  hoursLeft: number;
  closesAt: string;
}

interface SupportMessage {
  role: "customer" | "assistant" | "staff";
  text: string;
  at: string;
}

interface SupportRequest {
  requestId: string;
  status: "OPEN" | "AI_RESOLVED" | "ESCALATED" | "RESOLVED" | "CLOSED";
  handledBy: "AI" | "STAFF";
  messages: SupportMessage[];
  pendingAction: { type: "change_phone" | "change_address"; label: string } | null;
}

const POLL_MS = 15_000;

const formatLeft = (hours: number) => {
  if (hours >= 1) return `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? "" : "s"} left`;
  return `${Math.max(1, Math.round(hours * 60))} minutes left`;
};

/**
 * AI-assisted help for one order. The shopper can change the delivery address or phone number within 24 hours of
 * ordering; the assistant collects the new value and the shopper confirms with a button. Anything it can't
 * resolve is passed to the store team, who reply in the same thread.
 */
export function OrderHelp({
  orderId,
  orderNumber,
  theme,
  onOrderChanged,
}: {
  orderId: string;
  orderNumber: string;
  theme: AccountTheme;
  onOrderChanged: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState<EditWindow | null>(null);
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/store/orders/${orderId}/support`);
      if (!res.ok) return;
      const data: { window: EditWindow; requests: SupportRequest[] } = await res.json();
      setWindow(data.window);
      // Resume the latest conversation that is still open or with the store team.
      setRequest((current) => current ?? data.requests.find((r) => r.status === "OPEN" || r.status === "ESCALATED") ?? null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // While the thread is with the store team, poll for their replies.
  useEffect(() => {
    if (request?.status !== "ESCALATED") return;
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/v1/store/orders/${orderId}/support`).catch(() => null);
      if (!res?.ok) return;
      const data: { requests: SupportRequest[] } = await res.json();
      const fresh = data.requests.find((r) => r.requestId === request.requestId);
      if (fresh) setRequest(fresh);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [request?.status, request?.requestId, orderId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [request?.messages.length]);

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  };

  const send = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    // Show the shopper's own message immediately.
    setRequest((r) => ({
      requestId: r?.requestId ?? "pending",
      status: r?.status ?? "OPEN",
      handledBy: r?.handledBy ?? "AI",
      pendingAction: null,
      messages: [...(r?.messages ?? []), { role: "customer", text: trimmed, at: new Date().toISOString() }],
    }));
    setText("");
    try {
      const data = await post(`/api/v1/store/orders/${orderId}/support/messages`, {
        requestId: request && request.requestId !== "pending" ? request.requestId : undefined,
        message: trimmed,
      });
      setRequest(data.request);
    } catch (e) {
      setError((e as Error).message);
      load();
    } finally {
      setSending(false);
    }
  };

  const confirm = async () => {
    if (!request) return;
    setConfirming(true);
    setError(null);
    try {
      const data = await post(`/api/v1/store/orders/${orderId}/support/${request.requestId}/confirm`, {});
      setRequest(data.request);
      onOrderChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConfirming(false);
    }
  };

  const escalate = async () => {
    setSending(true);
    setError(null);
    try {
      const data = await post(`/api/v1/store/orders/${orderId}/support/escalate`, {
        requestId: request && request.requestId !== "pending" ? request.requestId : undefined,
      });
      setRequest(data.request);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const startWith = (prefill: string) => {
    setText(prefill);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const t = theme;
  const messages = request?.messages ?? [];
  const closed = request?.status === "AI_RESOLVED" || request?.status === "RESOLVED" || request?.status === "CLOSED";
  const escalated = request?.status === "ESCALATED";

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm">
        <Loader2 className={`h-4 w-4 animate-spin ${t.textMuted}`} />
        <span className={t.textMuted}>Loading help…</span>
      </div>
    );
  }

  return (
    <div className={`mt-5 rounded-xl border p-4 sm:p-5 ${t.cardBorder}`} role="region" aria-label={`Help with order ${orderNumber}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.accentBg} ${t.accentText}`}>
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Order help</p>
          <p className={`mt-0.5 text-xs leading-relaxed ${t.textMuted}`}>
            {window?.open ? (
              <>
                <Clock className="mr-1 inline h-3 w-3 align-[-1px]" />
                You can change the delivery address or phone number on this order — {window ? formatLeft(window.hoursLeft) : ""}.
              </>
            ) : (
              window?.reason
            )}
          </p>
        </div>
      </div>

      {/* Conversation */}
      {messages.length > 0 && (
        <div className="mb-3 max-h-72 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m, i) => {
            const mine = m.role === "customer";
            return (
              <div key={i} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${t.cardBorder}`}>
                    {m.role === "staff" ? <UserRound className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </span>
                )}
                <div className={`max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-sm leading-relaxed ${t.rounded} ${mine ? `${t.accentBg} ${t.accentText}` : `border ${t.cardBorder} ${t.cardBg}`}`}>
                  {m.role === "staff" && <span className={`mb-0.5 block text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}>Store team</span>}
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* Confirm card */}
      {request?.pendingAction && !closed && (
        <div className={`mb-3 flex flex-col gap-3 border p-3.5 sm:flex-row sm:items-center sm:justify-between ${t.rounded} ${t.cardBorder}`}>
          <p className="text-sm font-medium">{request.pendingAction.label}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={confirming}
            className={`inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-xs font-semibold ${t.rounded} ${t.accentBg} ${t.accentText} disabled:opacity-60`}
          >
            {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Confirm change
          </button>
        </div>
      )}

      {closed && (
        <div className={`mb-1 flex items-center gap-2 border p-3 text-sm ${t.rounded} ${t.cardBorder}`}>
          <Check className="h-4 w-4 shrink-0" />
          {request?.status === "AI_RESOLVED" ? "All done — your order has been updated." : "The store team has closed this request."}
        </div>
      )}

      {escalated && (
        <div className={`mb-3 flex items-center gap-2 border p-3 text-xs ${t.rounded} ${t.cardBorder} ${t.textMuted}`}>
          <Headset className="h-4 w-4 shrink-0" />
          This is with the store team. They&apos;ll reply here — you can add more details below.
        </div>
      )}

      {/* Quick starts */}
      {!closed && messages.length === 0 && window?.open && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => startWith("Please change my delivery address to ")} className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium ${t.rounded} ${t.cardBorder} hover:opacity-70`}>
            <MapPin className="h-3.5 w-3.5" /> Change delivery address
          </button>
          <button type="button" onClick={() => startWith("Please change my phone number to ")} className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium ${t.rounded} ${t.cardBorder} hover:opacity-70`}>
            <Phone className="h-3.5 w-3.5" /> Change phone number
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-2 text-xs text-red-500">
          {error}
        </p>
      )}

      {!closed && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor={`help-${orderId}`} className="sr-only">
              Message
            </label>
            <textarea
              id={`help-${orderId}`}
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder={window?.open ? "e.g. Change my phone number to 98765 43210" : "Describe what you need help with"}
              className={`min-w-0 flex-1 resize-none border bg-transparent p-3 text-sm focus:outline-none ${t.rounded} ${t.cardBorder}`}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label="Send message"
              className={`flex h-11 w-11 shrink-0 items-center justify-center ${t.rounded} ${t.accentBg} ${t.accentText} disabled:opacity-50`}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          {!escalated && (
            <button type="button" onClick={escalate} disabled={sending} className={`mt-3 inline-flex items-center gap-2 text-xs font-medium underline-offset-4 hover:underline disabled:opacity-60 ${t.textMuted}`}>
              <Headset className="h-3.5 w-3.5" /> Talk to the store team instead
            </button>
          )}
        </>
      )}
    </div>
  );
}
