import { type } from "arktype";

const TelegramConfig = type({
  botToken: "string",
  chatId: "string",
});

const Config = type({
  webhookSecrets: "string",
  telegram: TelegramConfig,
});

const maybeConfig = Config({
  webhookSecrets: Deno.env.get("WEBHOOK_SECRET") ?? "",
  telegram: {
    botToken: Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "",
    chatId: Deno.env.get("TELEGRAM_CHAT_ID") ?? "",
  },
});

if (maybeConfig instanceof type.errors) {
  console.error("Invalid config", maybeConfig.summary);
  throw new Error("Invalid config");
}

export const config = maybeConfig;
