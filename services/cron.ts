import { config } from "../config.ts";
import { apiClient } from "../lib/endoflife.ts";
import { subscriptionService } from "./subscription.ts";

const CRON_EXPR = Deno.env.get("PROD") ? "0 0 * * *" : "* * * * *";

async function checkExpiringPackages() {
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
}

export function setupCronJobs() {
  console.log("Starting cron jobs");

  Deno.cron(
    "Daily expiring packages check",
    CRON_EXPR,
    checkExpiringPackages,
  );
}
