import { drizzle } from "drizzle-orm/planetscale-serverless";
import { Client } from "@planetscale/database";
import * as schema from "../db/schema";

/**
 * We need to do this in a slightly roundabout way because next.js and partykit
 * get their environment variables from different places.
 */

export function createDrizzle(url: string) {
  console.log("Creating drizzle with url: ", url);

  return drizzle(new Client({ url: url }).connection(), { schema });
}
