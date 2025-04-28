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

    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const data = await response.json();
    const messageResponse = Message(data);
    if (messageResponse instanceof type.errors) {
      throw new Error(`Invalid response: ${messageResponse.summary}`);
    }

    return messageResponse;
  }
}

export const apiClient = new APIClient(config.telegram.botToken);

const MessageEntity = type({
  // Type of the entity. Can be various types like "mention", "hashtag", "url", etc.
  type: "string",
  // Offset in UTF-16 code units to the start of the entity
  offset: "number.integer",
  // Length of the entity in UTF-16 code units
  length: "number.integer",
  // Optional. For "text_link" only, URL that will be opened after user taps on the text
  url: "string?",
  // Optional. For "text_mention" only, the mentioned user
  user: "object?", // Assuming a User type is defined elsewhere
  // Optional. For "pre" only, the programming language of the entity text
  language: "string?",
  // Optional. For "custom_emoji" only, unique identifier of the custom emoji
  custom_emoji_id: "string?",
});

const Message = type({
  // Unique identifier for the target chat or username of the target channel (in the format @channelusername)
  chat_id: "string | number.integer",
  // Text of the message to be sent, 1-4096 characters after entities parsing
  text: "1 <= string <= 4096",
  // Unique identifier of the business connection on behalf of which the message will be sent
  business_connection_id: "string?",
  // Unique identifier for the target message thread (topic) of the forum; for forum supergroups only
  message_thread_id: "number.integer?",
  // Mode for parsing entities in the message text. See formatting options for more details.
  parse_mode: "string?",
  // A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode
  entities: MessageEntity.array().optional(),
  // Link preview generation options for the message
  link_preview_options: "object?",
  // Sends the message silently. Users will receive a notification with no sound.
  disable_notification: "boolean?",
  // Protects the contents of the sent message from forwarding and saving
  protect_content: "boolean?",
  // Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance
  allow_paid_broadcast: "boolean?",
  // Unique identifier of the message effect to be added to the message; for private chats only
  message_effect_id: "string?",
  // Description of the message to reply to
  reply_parameters: "object?",
  // Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user
  reply_markup: "object?",
});
