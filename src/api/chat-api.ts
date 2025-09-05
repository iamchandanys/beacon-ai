import axios from "axios";

const API_URL = "https://beacon-index-ai.azurewebsites.net";

export const sendChatMessage = async ({
  message,
  cid,
  pid,
  uid,
  chatId,
}: {
  message: string;
  cid: string;
  pid: string;
  uid: string;
  chatId?: string;
}) => {
  try {
    const payload = {
      client_id: cid,
      product_id: pid,
      user_id: uid,
      query: message,
      chat_id: chatId || "",
    };
    const response = await axios.post(`${API_URL}/doc-chat/chat`, payload);
    const data = response.data;
    return data;
  } catch (error) {
    return error;
  }
};

export const sendChatMessageStream = async ({
  message,
  cid,
  pid,
  uid,
  chatId,
  onData,
  onError,
  onComplete,
  signal,
}: {
  message: string;
  cid: string;
  pid: string;
  uid: string;
  chatId?: string;
  onData: (data: string) => void;
  onError: (error: any) => void;
  onComplete: (chatId?: string) => void;
  signal?: AbortSignal;
}) => {
  const payload = {
    client_id: cid,
    product_id: pid,
    user_id: uid,
    query: message,
    chat_id: chatId || "",
  };

  try {
    const res = await fetch(`${API_URL}/doc-chat/chat_stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok || !res.body) {
      onError(`HTTP ${res.status}: ${await res.text()}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let chatIdFromResponse: string | undefined;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let index;
      while ((index = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);

        if (chunk.startsWith(":")) continue; // ignore heartbeats

        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") {
            onComplete(chatIdFromResponse);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.response) {
              onData(parsed.response);
            }
            if (parsed.CHATID) {
              chatIdFromResponse = parsed.CHATID;
            }
          } catch (e) {
            // If not JSON, treat as plain text
            onData(data);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      onComplete();
    } else {
      onError(error);
    }
  }
};
