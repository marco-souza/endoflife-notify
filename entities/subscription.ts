import { type } from "arktype";

// set subscription schema
export const Subscription = type({
  tech: "string",
  version: "string.numeric.parse | number",
  days_before_expire: "0 < number.integer < 366",
  webhook_url: "string",
  webhook_secret: "string",
});
