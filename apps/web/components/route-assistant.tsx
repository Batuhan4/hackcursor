"use client";

import { useEffect, useRef, useState } from "react";

import { postRouteAssistant } from "@/lib/api";
import type { RouteMode, RouteOption } from "@/lib/routes";

import styles from "./route-assistant.module.css";

/**
 * Frontend shell for the server-side Cursor SDK route assistant. There is no
 * local or provider fallback: failures are shown as unavailable states.
 */

const SUGGESTED_QUESTIONS = [
  "Neden bu rotayı önerdin?",
  "Daha yeşil bir rota var mı?",
  "Kaldırımı daha iyi olan yol hangisi?",
] as const;

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

interface RouteAssistantProps {
  routes: RouteOption[];
  mode: RouteMode;
}

export default function RouteAssistant({
  routes,
  mode,
}: RouteAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const nextIdRef = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, sending]);

  function pushMessage(
    role: ChatMessage["role"],
    text: string,
    error = false,
  ) {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setMessages((current) => [...current, { id, role, text, error }]);
  }

  function close() {
    setOpen(false);
    fabRef.current?.focus();
  }

  async function send(raw: string) {
    const question = raw.trim();
    if (question === "" || sending) return;

    pushMessage("user", question);
    setDraft("");
    setSending(true);

    try {
      const remote = await postRouteAssistant({
        message: question,
        preference: mode === "active" ? "active_frontage" : mode,
        routes: routes.map((route) => ({
          id: route.id,
          distance_meters: Math.round(route.distanceKm * 1000),
          duration_seconds: route.durationMin * 60,
          analysis_coverage: route.analysisCoverage,
          omnisight_score: route.omnisightScore,
          recommendation_status: route.recommendationStatus,
          explanation: route.reason || null,
        })),
      });
      pushMessage("assistant", remote.answer);
    } catch {
      pushMessage(
        "assistant",
        "Rota Asistanı şu anda kullanılamıyor. Sahte veya yerel bir yanıt gösterilmedi.",
        true,
      );
    }
    setSending(false);
  }

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-controls="route-assistant-panel"
        onClick={() => (open ? close() : setOpen(true))}
      >
        Rota Asistanı
      </button>

      {open && (
        <section
          id="route-assistant-panel"
          role="dialog"
          aria-label="Rota Asistanı"
          className={styles.panel}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <header className={styles.head}>
            <span className={styles.headTitle}>Rota Asistanı</span>
            <span className={styles.headBadge}>Cursor SDK</span>
            <button
              type="button"
              className={styles.close}
              onClick={close}
              aria-label="Asistanı kapat"
            >
              ×
            </button>
          </header>

          <div className={styles.list} ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <p className={styles.empty}>
                Rota kararlarını çevresel göstergelerle açıklayan asistan.
                Aşağıdaki örnek sorularla başlayabilirsin.
              </p>
            )}
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className={styles.user}>
                  <p>{message.text}</p>
                </div>
              ) : (
                <div
                  key={message.id}
                  className={styles.bot}
                  data-error={message.error || undefined}
                >
                  <p>{message.text}</p>
                </div>
              ),
            )}
            {sending && (
              <div className={styles.bot}>
                <p className={styles.typing}>Yanıt hazırlanıyor…</p>
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.suggestion}
                  onClick={() => void send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            className={styles.inputRow}
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <input
              ref={inputRef}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Rota hakkında sor…"
              aria-label="Asistana mesaj yaz"
              autoComplete="off"
            />
            <button
              type="submit"
              className={styles.send}
              disabled={sending || draft.trim() === ""}
            >
              Gönder
            </button>
          </form>
        </section>
      )}
    </>
  );
}
