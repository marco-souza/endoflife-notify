import { type } from "arktype";
import { config } from "#/config.ts";

class APIClient {
  private base_url = "https://api.telegram.org";

  constructor(private botToken = "") {}

  async sendMessage(chatId: string, message: string) {
    const url = new URL(`/bot${this.botToken}/sendMessage`, this.base_url);

    url.searchParams.set("parse_mode", "Markdown");
    url.searchParams.set("chat_id", chatId);
    url.searchParams.set("text", message);

    console.log(`Sending message to ${chatId}: ${message}`);

    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      const errorMessage =
        `Error sending message to Telegram: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      console.warn(await response.text());
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Failed to parse message: ${data}`);
    }

    const messageResponse = Message(data.result);
    if (messageResponse instanceof type.errors) {
      throw new Error(`Invalid response: ${messageResponse.summary}`);
    }

    return messageResponse;
  }
}

export const apiClient = new APIClient(config.telegram.botToken);

const MessageFrom = type({
  id: "number",
  is_bot: "boolean",
  first_name: "string",
  username: "string",
});

const MessageChat = type({
  id: "number",
  first_name: "string",
  last_name: "string",
  username: "string",
  type: "string",
});

const Message = type({
  // Unique identifier for the target chat or username of the target channel (in the format @channelusername)
  message_id: "string | number.integer",
  // Text of the message to be sent, 1-4096 characters after entities parsing
  text: "1 <= string <= 4096",
  // Information from the sender
  from: MessageFrom,
  // Chat Information
  chat: MessageChat,
  // Message sent at
  date: "number.epoch",
});
