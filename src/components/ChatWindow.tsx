import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "../api/chat-api";
import ReactMarkdown from "react-markdown";
import ChatInput from "./ChatInput";
import { useSearchParams } from "next/navigation";

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

// Message bubble
const MessageBubble: React.FC<{ message: Message; index: number }> = ({
  message,
  index,
}) => {
  const isUser = message.role === "user";
  const content = message.content;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`flex justify-start relative`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] px-4 text-sm leading-relaxed backdrop-blur-xl ${
          isUser ? "border-none shadow-none mt-4" : "my-8"
        }`}
      >
        <p
          className={`whitespace-pre-wrap ${
            isUser
              ? "font-bold text-2xl "
              : "text-neutral-900 dark:text-neutral-100"
          }`}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </p>
        {index % 2 === 1 && (
          <p className={`mt-2 text-[10px] !text-black dark:text-neutral-500 `}>
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
      {index % 2 === 1 && (
        <div className="w-full mx-6 bg-black opacity-[0.05] !h-[1px] absolute bottom-0 -left-2" />
      )}
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
    thinking...
  </div>
);

// Header
const HeaderBar: React.FC<{ title: string }> = ({ title }) => (
  <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-4 py-3">
    <h1 className="text-xl font-semibold tracking-wide">{title}</h1>
  </div>
);

const ChatbotPage: React.FC = () => {
  // Single conversation state (no left history menu)
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  const params = useSearchParams();
  const productId = params.get("pid");
  const userId = params.get("uid");
  const clientId = params.get("cid");

  // Auto-scroll to latest message (window-level). We run twice to account for animations/layout.
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const doScroll = () => {
      // Anchor-based scroll (preferred)
      endRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
      // Fallback: scroll window to the very bottom
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    };
    doScroll();
    const id = setTimeout(doScroll, 150); // give framer-motion time to finish
    return () => clearTimeout(id);
  }, [messages.length, isTyping]);

  useEffect(() => {
    if(!productId || !clientId){
      alert("Missing product_id or client_id in URL. Please check the link.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const pageTitle = useMemo(() => "Beacon AI", []);

  const handleSend = async () => {
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

    try {
      const response = await sendChatMessage({
        message: trimmed,
        cid: clientId || "",
        pid: productId || "",
        uid: userId || "",
        chatId: chatId || undefined,
      });
      if (response && response.response) {
        const reply: Message = {
          id: uid(),
          role: "assistant",
          content: response.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, reply]);
        if (response.chatId) {
          setChatId(response.chatId);
        }
      } else {
        // Handle error or no message
        const errorMsg: Message = {
          id: uid(),
          role: "assistant",
          content: "Sorry, I couldn't process your message. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "An error occurred. Please try again later.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    // Clear chat_id for new conversation
    setChatId(null);
    setMessages([]);
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
                    disabled={isTyping || !productId || !clientId}
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
              <div className="mx-auto max-w-3xl px-4 pb-40 pt-6">
                <div
                  className="min-h-[calc(100vh-240px)] pr-1 space-y-3 isolate"
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions"
                  data-testid="messages-container"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((m, index) => (
                      <MessageBubble key={m.id} message={m} index={index} />
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <div className="flex justify-start ml-2">
                      <div className="rounded-3xl border border-neutral-200/60 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 px-3 py-2">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}

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
                    disabled={isTyping || !productId || !clientId}
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
