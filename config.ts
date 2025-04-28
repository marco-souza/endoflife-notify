import { type } from "arktype";

const Config = type({
  webhookSecrets: "string",
});

const maybeConfig = Config({
  webhookSecrets: Deno.env.get("WEBHOOK_SECRET") ?? "",
});

if (maybeConfig instanceof type.errors) {
  console.error("Invalid config", maybeConfig.summary);
  throw new Error("Invalid config");
}

export const config = maybeConfig;
