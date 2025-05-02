import {
  assertEquals,
  assertNotEquals,
  assertNotInstanceOf,
} from "@std/assert";
import {
  SubscriptionService,
  type TechnologiesDocument,
} from "./subscription.ts";
import { Subscription } from "#/entities/subscription.ts";
import { type } from "arktype";
import { Database } from "@copilotz/dengo";

// setup

await Deno.remove("./test.db");
const kv = await Deno.openKv("./test.db");
export const db = new Database(kv);

const subscription = Subscription({
  tech: "node",
  version: 20,
  days_before_expire: 30,
  webhook_url: "https://example.org",
  webhook_secret: "string",
});

assertNotInstanceOf(subscription, type.errors);

const subscriptionService = new SubscriptionService(db);

Deno.test("SubscriptionService: addSubscription should add a new subscription", async () => {
  await subscriptionService.addSubscription(subscription);

  const { tech, version } = subscription;
  const technology = await db.collection<TechnologiesDocument>("technologies")
    .findOne({ tech, version });

  assertNotEquals(technology, null);
  assertEquals(technology!.subscriptions.length, 1);
});

Deno.test("SubscriptionService: listTechnologies should return all technologies", async () => {
  const technologies = await subscriptionService.listTechnologies();

  assertEquals(Array.isArray(technologies), true);
  assertEquals(technologies.length, 1);
});

Deno.test("SubscriptionService: getSubscriptionByTechnology should return subscriptions for a given tech and version", async () => {
  await subscriptionService.addSubscription(subscription);

  const { tech, version } = subscription;
  const subscriptions = await subscriptionService.getSubscriptionByTechnology(
    tech,
    version,
  );

  assertNotEquals(subscriptions, null);
  assertEquals(Array.isArray(subscriptions), true);
});
