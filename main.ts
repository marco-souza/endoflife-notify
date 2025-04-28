import { type Context, Hono } from "hono";
import { type } from "arktype";
import { apiClient } from "#/lib/endoflife.ts";
import * as tg from "#/lib/telegram.ts";
import { Subscription } from "#/entities/subscription.ts";
import { config } from "#/config.ts";

const app = new Hono();
const kv = await Deno.openKv();

app.get("/", (c) => c.text("Hello World!"));

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

  const eol = await apiClient.singleCycleDetails(subscription); // TODO: cache results

  // if end of live already reached, return error
  if (eol.eol === true) {
    return c.json(
      { error: "Cannot subscribe to an expired version!", eol },
      404,
    );
  }

  const today = new Date();
  const notifyDate = new Date(
    eol.eol.getTime() - body.days_before_expire * 24 * 60 * 60 * 1000,
  );

  // INFO: enqueue notification
  const delay = Number(100) ?? notifyDate.getTime() - today.getTime();

  console.log(
    `Enqueueing notification for ${subscription.tech} ${subscription.version} in ${delay}ms`,
  );

  await kv.enqueue(subscription, { delay });
});

Deno.serve(app.fetch);

kv.listenQueue(async (msg) => {
  const subscription = Subscription(msg);
  if (subscription instanceof type.errors) {
    console.error(subscription);
    return;
  }

  const { webhook_url } = subscription;
  console.log(`Sending notification`, subscription);

  const res = await fetch(webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Failed to send notification", errorBody);
    return;
  }

  console.log("Notification sent successfully", subscription);
});
