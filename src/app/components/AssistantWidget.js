"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { ROLE_INFO, createSession, getProduct, money, respond, welcomeMessage } from "@/lib/assistant";

const STORAGE_KEY = "braintech-assistant-v1";
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function freshChat() {
  return { messages: [welcomeMessage()], session: createSession() };
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data.messages) && data.messages.length && data.session) return data;
  } catch {
    /* ignore a corrupted save */
  }
  return null;
}

// **bold**, *italic* and line breaks
function RichText({ text }) {
  return text.split("\n").map((line, i) =>
    line.trim() === "" ? (
      <span key={i} className="ai-gap" />
    ) : (
      <p key={i}>
        {line.split("**").map((part, j) =>
          j % 2 ? (
            <b key={j}>{part}</b>
          ) : (
            part.split("*").map((piece, k) => (k % 2 ? <em key={k}>{piece}</em> : piece))
          )
        )}
      </p>
    )
  );
}

function BuildList({ build }) {
  return (
    <div className="ai-build">
      <p className="ai-build-title">{build.title}</p>
      <ul>
        {build.items.map(({ role, id }) => {
          const product = getProduct(id);
          return (
            <li key={`${role}-${id}`}>
              <img src={product.image} alt="" loading="lazy" />
              <span className="ai-build-text">
                <small>{ROLE_INFO[role].label}</small>
                <Link href={`/products/${id}`}>{product.name}</Link>
              </span>
              <b>{money(product.price)}</b>
            </li>
          );
        })}
      </ul>
      <p className="ai-build-total">
        <span>Total</span>
        <b>{money(build.total)}</b>
      </p>
    </div>
  );
}

function ProductCards({ ids, added, onAdd }) {
  return (
    <div className="ai-cards">
      {ids.map((id) => {
        const product = getProduct(id);
        if (!product) return null;
        const done = added.includes(id);
        return (
          <div key={id} className="ai-card">
            <img src={product.image} alt="" loading="lazy" />
            <div>
              <Link href={`/products/${id}`}>{product.name}</Link>
              <span>
                <b>{money(product.price)}</b> <del>{money(product.oldPrice)}</del>
              </span>
            </div>
            <button type="button" className={done ? "done" : ""} onClick={() => onAdd(product)}>
              {done ? "✓ Added" : "Add to cart"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function AssistantWidget() {
  const { addToCart } = useCart();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [added, setAdded] = useState([]);
  // The panel is closed on first paint, so reading the saved chat here cannot cause a hydration mismatch.
  const [chat, setChat] = useState(() => (typeof window === "undefined" ? freshChat() : loadSaved() || freshChat()));

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Remember the chat so it survives closing the box, changing page and refreshing.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
    } catch {
      /* storage unavailable */
    }
  }, [chat]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, chat.messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function send(raw) {
    const text = raw.trim();
    if (!text || typing) return;

    const { replies, session, addIds } = respond(text, chat.session);
    const userMessage = { id: uid(), role: "user", text };

    setChat((current) => ({ messages: [...current.messages, userMessage], session }));
    setInput("");
    setTyping(true);

    const length = replies.reduce((sum, r) => sum + r.text.length, 0);
    timerRef.current = window.setTimeout(() => {
      addIds.forEach((id) => {
        const product = getProduct(id);
        if (product) addToCart(product);
      });
      setChat((current) => ({ ...current, messages: [...current.messages, ...replies] }));
      setTyping(false);
    }, 450 + Math.min(900, length * 3));
  }

  function addOne(product) {
    addToCart(product);
    setAdded((current) => (current.includes(product.id) ? current : [...current, product.id]));
  }

  function newChat() {
    window.clearTimeout(timerRef.current);
    setTyping(false);
    setAdded([]);
    setInput("");
    setChat(freshChat());
  }

  const lastBot = [...chat.messages].reverse().find((m) => m.role === "bot");

  return (
    <div className="ai-root">
      {open && (
        <section
          className="ai-panel"
          role="dialog"
          aria-label="BrainTech assistant"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <header className="ai-head">
            <span className="ai-avatar">🤖</span>
            <div>
              <b>BrainTech Assistant</b>
              <small>
                <i /> PC build guide · store help only
              </small>
            </div>
            <button type="button" className="ai-head-btn" onClick={newChat} title="Start a new chat">
              ↺ New chat
            </button>
            <button type="button" className="ai-head-close" onClick={() => setOpen(false)} aria-label="Close assistant">
              ✕
            </button>
          </header>

          <div className="ai-messages" ref={listRef}>
            {chat.messages.map((message) => (
              <div key={message.id} className={`ai-msg ${message.role}`}>
                <div className="ai-bubble">
                  <RichText text={message.text} />
                  {message.build && <BuildList build={message.build} />}
                  {message.products && <ProductCards ids={message.products} added={added} onAdd={addOne} />}
                </div>
              </div>
            ))}

            {typing && (
              <div className="ai-msg bot">
                <div className="ai-bubble ai-typing" aria-label="Assistant is typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}

            {!typing && lastBot?.chips && chat.messages[chat.messages.length - 1] === lastBot && (
              <div className="ai-chips">
                {lastBot.chips.map((chip) =>
                  chip.href ? (
                    <Link key={chip.label} href={chip.href} className="ai-chip link">
                      {chip.label} ↗
                    </Link>
                  ) : (
                    <button key={chip.label} type="button" className="ai-chip" onClick={() => send(chip.label)}>
                      {chip.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <form
            className="ai-input"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about PC parts, builds, prices…"
              aria-label="Message the assistant"
              autoComplete="off"
            />
            <button type="submit" disabled={!input.trim() || typing} aria-label="Send">
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`ai-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant — need help?"}
      >
        {open ? (
          <span className="ai-fab-icon">✕</span>
        ) : (
          <>
            <span className="ai-fab-icon">🤖</span>
            <span className="ai-fab-label">
              <b>Need help?</b>
              <small>Ask our AI assistant</small>
            </span>
          </>
        )}
      </button>
    </div>
  );
}