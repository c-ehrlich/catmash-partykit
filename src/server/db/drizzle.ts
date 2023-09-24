import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";
import * as schema from "../db/schema";

/**
 * We need to do this in a slightly roundabout way because next.js and partykit
 * get their environment variables from different places.
 */

export function createDrizzle(url: string) {
  console.log("Creating drizzle with url:", url);

  return drizzle(
    connect({
      url: url,
      fetch: (url, init) => {
        if (init) {
          // bug: https://github.com/cloudflare/workerd/issues/698
          // fix: https://github.com/planetscale/database-js/pull/102#issuecomment-1508219636
          delete init["cache"];
        }
        return fetch(url, init);
      },
    }),
    { schema }
  );
}
