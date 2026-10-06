"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, MessageCircle, Send, X } from "lucide-react";
import { startStoreVoice, type StoreVoiceSession } from "@/lib/store-voice";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const MAX_HISTORY = 20;

/**
 * Shopper-facing assistant for an AI-enabled store: a text chat (streamed) and a voice agent that can answer
 * questions and add products to the cart. Rendered once by the store layout, so every template gets it.
 */
export function StoreAssistant({ slug, storeName }: { slug: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voice, setVoice] = useState<"off" | "connecting" | "live">("off");
  const [error, setError] = useState<string | null>(null);

  const nextId = useRef(0);
  const voiceSession = useRef<StoreVoiceSession | null>(null);
  const abort = useRef<AbortController | null>(null);
  const listEnd = useRef<HTMLDivElement | null>(null);

  const append = (role: Message["role"], text: string) => {
    const id = ++nextId.current;
    setMessages((prev) => [...prev, { id, role, text }]);
    return id;
  };

  const appendTo = (id: number, text: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + text } : m)));
  };

  // Stop any open voice session and in-flight chat request when the shopper leaves the page.
  useEffect(() => {
    return () => {
      voiceSession.current?.stop();
      abort.current?.abort();
    };
  }, []);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, open]);

  const sendText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);

    const history = [...messages, { id: 0, role: "user" as const, text }]
      .filter((m) => m.text.trim())
      .slice(-MAX_HISTORY)
      .map(({ role, text: content }) => ({ role, content }));

    append("user", text);
    const replyId = append("assistant", "");

    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch(`/api/v1/public/stores/${encodeURIComponent(slug)}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The assistant is unavailable right now.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const raw = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");
          if (!raw.startsWith("data:")) continue;

          const event = JSON.parse(raw.slice(5).trim()) as { type: string; text?: string; message?: string };
          if (event.type === "delta" && event.text) appendTo(replyId, event.text);
          if (event.type === "error") {
            setError(event.message ?? "The assistant is unavailable right now.");
            finished = true;
            break;
          }
          if (event.type === "done") {
            finished = true;
            break;
          }
        }
      }
      await reader.cancel().catch(() => undefined);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  const toggleVoice = async () => {
    if (voice !== "off") {
      voiceSession.current?.stop();
      voiceSession.current = null;
      setVoice("off");
      return;
    }
    setError(null);
    setVoice("connecting");
    voiceSession.current = await startStoreVoice(slug, {
      onStatus: (status) => {
        if (status === "live") setVoice("live");
        if (status === "ended") setVoice("off");
      },
      onShopperText: (text) => append("user", text),
      onAssistantText: (text) => append("assistant", text),
      onError: (message) => setError(message),
    });
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          aria-label="Open shopping assistant"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Ask us
        </button>
      )}

      {open && (
        <section
          aria-label={`${storeName} shopping assistant`}
          className="fixed bottom-5 right-5 z-50 flex max-h-[min(640px,calc(100vh-40px))] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden border border-neutral-200 bg-white text-neutral-900 shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{storeName}</p>
              <p className="text-xs text-neutral-500">Shopping assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-neutral-500 hover:text-neutral-900"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-neutral-500">
                Ask about products, delivery or sizes. You can also tap the microphone and talk, for example “add the blue mug to my cart”.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap bg-neutral-900 px-3 py-2 text-white"
                      : "max-w-[85%] whitespace-pre-wrap border border-neutral-200 px-3 py-2"
                  }
                >
                  {m.text || (busy ? "…" : "")}
                </p>
              </div>
            ))}
            {error && <p className="text-xs text-red-700">{error}</p>}
            <div ref={listEnd} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = input;
              setInput("");
              void sendText(text);
            }}
            className="flex items-center gap-2 border-t border-neutral-200 p-3"
          >
            <button
              type="button"
              onClick={() => void toggleVoice()}
              aria-pressed={voice !== "off"}
              aria-label={voice === "off" ? "Start voice conversation" : "End voice conversation"}
              className={
                voice === "live"
                  ? "p-2 bg-red-600 text-white"
                  : voice === "connecting"
                    ? "p-2 border border-neutral-300 text-neutral-500"
                    : "p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-100"
              }
            >
              {voice === "off" ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={voice === "live" ? "Listening…" : "Type a question"}
              disabled={voice !== "off"}
              className="min-w-0 flex-1 border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
              aria-label="Message the assistant"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || voice !== "off"}
              className="p-2 bg-neutral-900 text-white disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
