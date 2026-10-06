/**
 * Browser side of the storefront voice agent.
 *
 * The server mints a short-lived, session-scoped token (the long-lived provider key never leaves the server).
 * The browser connects over WebRTC with that token, streams the microphone up and the agent's voice back, and
 * executes the agent's tool calls by calling this store's own AI tool endpoint - the same allowlisted actions
 * the text chat uses, under the shopper's own session cookie.
 */

export interface StoreVoiceCallbacks {
  onShopperText(text: string): void;
  onAssistantText(text: string): void;
  onStatus(status: "connecting" | "live" | "ended"): void;
  onError(message: string): void;
}

export interface StoreVoiceSession {
  stop(): void;
}

const CONNECT_TIMEOUT_MS = 15_000;
const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

interface RealtimeEvent {
  type: string;
  transcript?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  error?: { message?: string };
}

export async function startStoreVoice(slug: string, callbacks: StoreVoiceCallbacks): Promise<StoreVoiceSession> {
  callbacks.onStatus("connecting");

  let pc: RTCPeerConnection | null = null;
  let mic: MediaStream | null = null;
  let channel: RTCDataChannel | null = null;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    channel?.close();
    pc?.close();
    mic?.getTracks().forEach((track) => track.stop());
    callbacks.onStatus("ended");
  };

  const fail = (message: string) => {
    callbacks.onError(message);
    stop();
  };

  try {
    const sessionRes = await fetchWithTimeout(`/api/v1/public/stores/${encodeURIComponent(slug)}/ai/voice-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!sessionRes.ok) {
      const body = await safeJson(sessionRes);
      throw new Error(typeof body?.error === "string" ? body.error : "The voice assistant is unavailable right now.");
    }
    const session = (await sessionRes.json()) as { clientSecret: string };

    mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (stopped) return { stop };

    pc = new RTCPeerConnection();
    const remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    pc.ontrack = (event) => {
      remoteAudio.srcObject = event.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === "failed" || pc?.connectionState === "disconnected") fail("The voice connection was lost.");
    };
    mic.getTracks().forEach((track) => pc!.addTrack(track, mic!));

    channel = pc.createDataChannel("oai-events");
    const dataChannel = channel;

    const send = (payload: unknown) => {
      if (dataChannel.readyState === "open") dataChannel.send(JSON.stringify(payload));
    };

    const runTool = async (name: string, callId: string, args: string) => {
      let output: string;
      try {
        const res = await fetchWithTimeout(`/api/v1/public/stores/${encodeURIComponent(slug)}/ai/tools/${encodeURIComponent(name)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: args || "{}",
        });
        output = res.ok
          ? await res.text()
          : JSON.stringify({ error: "REQUEST_FAILED", message: "That action could not be completed." });
      } catch {
        output = JSON.stringify({ error: "REQUEST_FAILED", message: "That action could not be completed." });
      }
      send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: callId, output } });
      send({ type: "response.create" });
    };

    dataChannel.onmessage = (message) => {
      let event: RealtimeEvent;
      try {
        event = JSON.parse(String(message.data)) as RealtimeEvent;
      } catch {
        return;
      }
      switch (event.type) {
        case "conversation.item.input_audio_transcription.completed":
          if (event.transcript) callbacks.onShopperText(event.transcript);
          break;
        case "response.output_audio_transcript.done":
          if (event.transcript) callbacks.onAssistantText(event.transcript);
          break;
        case "response.function_call_arguments.done":
          if (event.name && event.call_id) void runTool(event.name, event.call_id, event.arguments ?? "{}");
          break;
        case "error":
          callbacks.onError(event.error?.message ?? "The voice assistant hit an error.");
          break;
      }
    };
    dataChannel.onopen = () => {
      if (!stopped) callbacks.onStatus("live");
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerRes = await fetchWithTimeout(REALTIME_CALLS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });
    if (!answerRes.ok) throw new Error("Could not connect to the voice assistant.");
    await pc.setRemoteDescription({ type: "answer", sdp: await answerRes.text() });
  } catch (error) {
    const denied = error instanceof DOMException && error.name === "NotAllowedError";
    fail(
      denied
        ? "Allow microphone access in your browser to talk to the assistant."
        : error instanceof Error
          ? error.message
          : "The voice assistant is unavailable right now.",
    );
  }

  return { stop };
}

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS) });
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
