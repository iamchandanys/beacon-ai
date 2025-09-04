import React, { useEffect, useRef } from "react";
import { FiPlus, FiSend } from "react-icons/fi";

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
    el.style.height = Math.min(el.scrollHeight, 240) + "px"; // cap at ~7 lines
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2 rounded-2xl h-24 border border-2 border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-3 py-2">
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
          className="flex-1 resize-none bg-transparent outline-none placeholder:text-neutral-400/80 text-sm leading-relaxed h-full pr-10 !mt-4 pt-4 mb-2"
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
          className="shrink-0 rounded-xl p-2 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
          aria-label="Send message"
          data-testid="send-button"
        >
          <FiSend className="text-lg" />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500 text-center">
        AI can make mistakes. Check important info.
      </p>
    </div>
  );
};

export default ChatInput;
