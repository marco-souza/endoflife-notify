import { Hono } from "hono";
import { assertEquals } from "@std/assert";

Deno.test("Hello World", async () => {
  const app = new Hono();
  app.get("/", (c) => c.text("Please test me"));

  const res = await app.request("http://localhost/");
  assertEquals(res.status, 200);
});
