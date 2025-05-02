import { type Context, Hono } from "hono";
import { type } from "arktype";
import { apiClient } from "#/lib/endoflife.ts";
import * as tg from "#/lib/telegram.ts";
import { Subscription } from "#/entities/subscription.ts";
import { config } from "#/config.ts";
import { subscriptionService } from "#/services/subscription.ts";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    "title": "Welcome to EOL notify",
    "description":
      "Use this API to get receive notifications when your dependencies are X days from expire",
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

// cron job
const CRON_EXPR = Deno.env.get("PROD") ? "0 0 * * *" : "* * * * *";
Deno.cron(
  "Dayly Checks",
  CRON_EXPR,
  async () => {
    const technologies = await subscriptionService.listTechnologies();

    for (const technology of technologies) {
      const { tech, version } = technology;
      const res = await apiClient.singleCycleDetails({ tech, version });
      if (res.eol === true) {
        console.log("Subscription expired", technology);
        continue;
      }

      const { eol } = res;
      const today = new Date();

      const subscriptions = await subscriptionService
        .getSubscriptionByTechnology(
          tech,
          version,
        );
      if (!subscriptions) {
        console.log("No subscriptions found for technology", tech, version);
        continue;
      }

      const toNotify = subscriptions.filter(({ days_before_expire }) => {
        const diffInDays = Math.floor(
          (eol.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return (diffInDays <= days_before_expire);
      });

      await Promise.all(
        toNotify.map(async (subscription) => {
          const { webhook_url, webhook_secret } = subscription;
          if (webhook_secret != config.webhookSecrets) {
            console.log("Invalid webhook secret", subscription);
            return;
          }
          const res = await fetch(webhook_url, {
            method: "POST",
            headers: {
              "User-Agent": "eol-notify",
              "Content-Type": "application/json",
              "Authorization": `Bearer ${webhook_secret}`,
            },
            body: JSON.stringify(subscription),
          });

          if (!res.ok) {
            console.log("Error sending notification", res.statusText);
          } else {
            console.log("Notification sent", res.statusText);
          }
        }),
      );
    }
  },
);
