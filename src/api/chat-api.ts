import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beacon-index-ai.azurewebsites.net';

const CLIENT_ID = "d6b607aa-578f-4916-90fa-e2358f366726";
const PRODUCT_ID = "15f4193d-1ae5-45b2-8cc3-4a82ac311903";

export const removeCookie = (name: string) => {
  Cookies.remove(name);
};

export const sendChatMessage = async (message: string) => {
  try {
    const chatId = Cookies.get('chat_id');
    const payload = {
      client_id: CLIENT_ID,
      product_id: PRODUCT_ID,
      query: message,
      chat_id: chatId || "",
    };
    const response = await axios.post(`${API_URL}/doc-chat/chat`, payload);
    const data = response.data;
    // If first time, store chat_id
    if (data.chatId) {
      Cookies.set('chat_id', data.chatId, { expires: 7 });
    }
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return null;
  }
};
