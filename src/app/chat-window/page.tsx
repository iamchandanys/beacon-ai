"use client";

import ChatbotPage from "@/components/chat-window/ChatWindow";
import { useEffect } from "react";
import Cookie from "js-cookie";

const ChatWindowPage = () => {
    useEffect(() => {
      return () => {
        Cookie.remove('chat_id');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const handleBeforeUnload = () => {
        Cookie.remove('chat_id');
        window.location.reload();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  return (
    <div className="flex flex-col h-screen">
      <ChatbotPage />
    </div>
  );
};

export default ChatWindowPage;