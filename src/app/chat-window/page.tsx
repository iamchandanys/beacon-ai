"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiSend } from "react-icons/fi";

// ------------------------------------------------------------
// ChatbotPage (Next.js 13+ App Router)
// Drop this file in app/page.tsx. Requires Tailwind CSS, framer-motion, react-icons.
// ------------------------------------------------------------

// Types
export type Role = "user" | "assistant";
export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number; // ms
}

// Utilities
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const formatTime = (ms: number) => new Date(ms).toLocaleTimeString();

const DUMMY_REPLIES = [
  "I'm a demo bot for now — but I'm listening!",
  "Thanks! I simulated a response. Hook me to an API later.",
  "On it. (Well, pretending to be.)",
  "Got it. You can wire a backend when you're ready.",
  "Neat! Try sending more messages or start a new chat.",
];

const getDummyReply = (userText: string) => {
  const canned =
    DUMMY_REPLIES[Math.floor(Math.random() * DUMMY_REPLIES.length)];
  const prefix = userText.trim() ? `You said: "${userText.trim()}"` : "";
  // Join with two newlines so the echo and canned reply are split into paragraphs
  return [prefix, canned].filter(Boolean).join("\n\n");
};

// -------- Development Self-Tests (lightweight checks, no prod impact) --------
function runDevSelfTests() {
  try {
    const out1 = getDummyReply("Hello World");
    console.assert(
      out1.includes('You said: "Hello World"'),
      "Expected prefix with user text"
    );
    console.assert(
      out1.includes("\n\n"),
      "Expected two newlines between sections"
    );

    const out2 = getDummyReply("");
    console.assert(
      !out2.startsWith("You said:"),
      "No prefix expected for empty input"
    );

    console.assert(uid() !== uid(), "uid() should produce different values");
    // If all assertions pass, optionally log once
    // eslint-disable-next-line no-console
    console.debug("[Chatbot UI] Dev self-tests passed");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[Chatbot UI] Dev self-tests failed:", e);
  }
}
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Defer to avoid interfering with hydration
  setTimeout(runDevSelfTests, 0);
}

// Message bubble
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-3xl px-4 py-3 shadow-sm text-sm leading-relaxed backdrop-blur-xl border ${
          isUser
            ? "bg-gradient-to-tr from-neutral-900 to-neutral-700 text-white border-neutral-800"
            : "bg-white/80 dark:bg-neutral-900/70 text-neutral-900 dark:text-neutral-100 border-neutral-200/60 dark:border-neutral-800"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div
          className={`mt-2 text-[10px] ${
            isUser ? "text-white/70" : "text-neutral-500"
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

// Typing indicator
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-xs text-neutral-500">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-400/70"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
    typing…
  </div>
);

// Chat input
const ChatInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, onNewChat, disabled }) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 140) + "px"; // cap at ~7 lines
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-3 py-2 shadow-lg">
        {/* New Chat button in input area */}
        <button
          onClick={onNewChat}
          className="absolute -top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-medium shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
          aria-label="Start new chat"
          title="Start new chat"
          data-testid="new-chat-btn"
        >
          <FiPlus className="text-sm" /> New chat
        </button>

        <textarea
          ref={textAreaRef}
          className="flex-1 resize-none bg-transparent outline-none placeholder:text-neutral-400/80 text-sm leading-relaxed max-h-[140px] pr-10"
          placeholder="Send a message… (Shift+Enter for newline)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          data-testid="chat-input"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-2xl p-2 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
          aria-label="Send message"
          data-testid="send-button"
        >
          <FiSend className="text-lg" />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500 text-center">
        Press Enter to send • Shift+Enter for a new line
      </p>
    </div>
  );
};

// Header
const HeaderBar: React.FC<{ title: string }> = ({ title }) => (
  <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-4 py-3">
    <h1 className="text-sm font-semibold tracking-wide">{title}</h1>
  </div>
);

const ChatbotPage: React.FC = () => {
  // Single conversation state (no left history menu)
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to latest message
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  const pageTitle = useMemo(() => "Chat", []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate network/LLM delay
    const delay = 600 + Math.random() * 900;
    setTimeout(() => {
      const reply: Message = {
        id: uid(),
        role: "assistant",
        content: getDummyReply(trimmed),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, delay);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        timestamp: Date.now(),
        content: "New conversation started. How can I help?",
      },
    ]);
    setInput("");
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(0,0,0,0.05),transparent),radial-gradient(1200px_600px_at_110%_10%,rgba(0,0,0,0.05),transparent)] dark:bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,255,255,0.06),transparent),radial-gradient(1200px_600px_at_110%_10%,rgba(255,255,255,0.06),transparent)] text-neutral-900 dark:text-neutral-100">
      <main className="flex-1 min-h-screen">
        <HeaderBar title={pageTitle} />

        <AnimatePresence initial={false} mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-3xl px-4 pt-10 pb-24"
            >
              <div className="min-h-[70vh] grid place-items-center">
                <div className="w-full">
                  <ChatInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    onNewChat={handleNewChat}
                    disabled={isTyping}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* Messages area */}
              <div className="mx-auto max-w-3xl px-4 pb-40 pt-6">
                <div
                  className="h-[calc(100vh-220px)] md:h-[calc(100vh-240px)] overflow-y-auto pr-1 space-y-3"
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions"
                  data-testid="messages-container"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <MessageBubble key={m.id} message={m} />
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-3xl border border-neutral-200/60 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 px-4 py-3">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}

                  {/* Scroll anchor */}
                  <div ref={endRef} />
                </div>
              </div>

              {/* Composer */}
              <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 via-white/70 to-white/40 dark:from-neutral-950/80 dark:via-neutral-950/70 dark:to-neutral-950/40 backdrop-blur-xl border-t border-neutral-200/60 dark:border-neutral-800">
                <div className="mx-auto max-w-3xl px-4 py-4">
                  <ChatInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    onNewChat={handleNewChat}
                    disabled={isTyping}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ChatbotPage;
