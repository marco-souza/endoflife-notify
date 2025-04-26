import { type Context, Hono } from "hono";
import { type } from "arktype";

// set subscription schema
const SubscriptionSchema = type({
  technology: "string",
  version: "string",
  days_to_expire: "0 < number.integer < 366",
  webhook_url: "string",
  webhook_secret: "string",
});

// setup db
const kv = await Deno.openKv();

const app = new Hono();

app.get("/", (c) => c.text("Hello World!"));

app.post("/subscribe", async (c: Context) => {
  try {
    // Parse and validate the request body against the SubscriptionSchema
    const body = await c.req.json();
    const subs = SubscriptionSchema(body);
    if (subs instanceof type.errors) {
      // hover summary to see validation errors
      console.error(subs.summary);
      return c.json({ error: "Invalid subscription data" }, 400);
    }

    console.info("Parsed subscription:", subs);

    // list of all technologies
    const registeredTechs = await kv.get<string[]>(["technologies"]);
    if (!registeredTechs.value) {
      return c.json({ error: "No technologies registered" }, 400);
    }

    // include the technology if it is not already registered
    if (!registeredTechs.value.includes(subs.technology)) {
      await kv.set(["technologies"], [
        ...registeredTechs.value,
        subs.technology,
      ]);
    }

    // Store the subscription in the database
    const subRes = await kv.set([
      "subscriptions",
      subs.technology,
      subs.version,
    ], subs);

    // if not ok, return
    if (!subRes.ok) {
      console.error("Failed to store subscription:", subRes);
      return c.json({ error: "Failed to store subscription" }, 500);
    }

    return c.json({ message: "Subscription created successfully" }, 201);
  } catch (error) {
    console.error("Error creating subscription:", error);
    return c.json({ error: "Failed to create subscription" }, 500);
  }
});

Deno.serve(app.fetch);

// register daily cronjob
Deno.cron(
  "Check what versions techs are expiring today",
  "* * * * *",
  async () => {
    const today = new Date();
    const subscriptions = await kv.get(["subscriptions"]);
    console.log({ subscriptions, today });
  },
);
