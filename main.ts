import { type Context, Hono } from "hono";
import { type } from "arktype";
import * as tg from "#/lib/telegram.ts";
import { Subscription } from "#/entities/subscription.ts";
import { config } from "#/config.ts";
import { subscriptionService } from "#/services/subscription.ts";
import { setupCronJobs } from "./services/cron.ts";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    "title": "Welcome to EOL notify",
    "description":
      "Use this API to receive notifications when your dependencies are X days away from expiration",
    "example": "https://github.com/marco-souza/endoflife-notify",
  }));

app.post("/callback", async (c) => {
  const body = await c.req.json();
  console.log("Received callback:", body);

  const subscription = Subscription(body);
  if (subscription instanceof type.errors) {
    // hover summary to see validation errors
    console.error(subscription.summary);
    return c.json({ error: "Invalid subscription data" }, 400);
  }

  const { webhook_secret } = subscription;
  if (webhook_secret != config.webhookSecrets) {
    return c.json({ error: "Invalid webhook secret" }, 401);
  }

  // Send a message on my telegram
  const message = `Package ${subscription.tech} ${subscription.version} is EOL`;

  const res = await tg.apiClient.sendMessage(config.telegram.chatId, message);
  console.log("Message sent to Telegram", res);

  return c.json({ message });
});

app.post("/subscribe/:tech", async (c: Context) => {
  const tech = c.req.param("tech");
  const body = await c.req.json();

  const subscription = Subscription({ tech, ...body });
  if (subscription instanceof type.errors) {
    // hover summary to see validation errors
    console.error(subscription.summary);
    return c.json({ error: "Invalid subscription data" }, 400);
  }

  await subscriptionService.addSubscription(subscription);

  return c.json({
    message: "Subscription added",
    subscription,
  });
});

Deno.serve(app.fetch);

setupCronJobs();
