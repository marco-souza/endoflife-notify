import type { Subscription } from "#/entities/subscription.ts";
import { type } from "arktype";
import { type Database, type Document, ObjectId } from "@copilotz/dengo";
import { db } from "#/services/db.ts";

const TechVersion = type({
  tech: "string",
  version: "number",
  subscriptions: "string[]",
});

export type SubscriptionDocument = typeof Subscription.infer & Document;
export type TechnologiesDocument = typeof TechVersion.infer & Document;

export class SubscriptionService {
  constructor(private db: Database) {}

  async addSubscription(s: typeof Subscription.infer) {
    const { insertedId } = await this.db.collection<SubscriptionDocument>(
      "subscriptions",
    ).insertOne(s);

    const res = await this.db.collection<TechnologiesDocument>("technologies")
      .findOne(
        {
          tech: s.tech,
          version: s.version,
        },
      );
    if (!res) {
      await this.db.collection("technologies").insertOne({
        tech: s.tech,
        version: s.version,
        subscriptions: [insertedId.toString()],
      });
      return;
    }

    const { subscriptions } = res;
    if (subscriptions.includes(insertedId.toString())) {
      console.log("Subscription already exists", insertedId);
      return;
    }

    subscriptions.push(insertedId.toString());
    await this.db.collection("technologies").updateOne(
      { _id: res._id },
      { $set: { subscriptions } },
    );

    console.log("Subscription added to tech version", res._id);
  }

  async listTechnologies(): Promise<(typeof TechVersion.infer)[]> {
    const allSubscribedTechnologies = await this.db
      .collection<TechnologiesDocument>("technologies")
      .find({});

    const listTechnologies = await allSubscribedTechnologies.toArray()
      .then((techVersions) => {
        return techVersions
          .map((techVersion) => {
            const { _id, ...rest } = techVersion;
            return rest;
          });
      })
      .catch((err) => {
        console.log("Error listing tech versions", err);
        return [];
      });

    return listTechnologies;
  }

  async getSubscriptionByTechnology(
    tech: string,
    version: number,
  ): Promise<SubscriptionDocument[] | null> {
    const technology = await this.db
      .collection<TechnologiesDocument>("technologies")
      .findOne({ tech, version });

    if (!technology) {
      console.log("Technology not found", tech, version);
      return null;
    }

    const ids = technology.subscriptions.map((id) => new ObjectId(id));
    const subscriptions = await this.db
      .collection<SubscriptionDocument>("subscriptions").find({
        _id: { $in: ids },
      }).then((subs) => subs.toArray());

    if (subscriptions.length === 0) {
      console.log("Subscription not found", { technology, subscriptions });
      return null;
    }

    return subscriptions;
  }
}

export const subscriptionService = new SubscriptionService(db);
