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
