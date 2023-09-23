import { sql } from "drizzle-orm";
import {
  bigint,
  mysqlTableCreator,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const mysqlTable = mysqlTableCreator((name) => `catmash_${name}`);

export const cat = mysqlTable(
  "cat",
  {
    id: varchar("id", { length: 16 }).primaryKey(),
    url: varchar("url", { length: 255 }),
    votes: bigint("votes", { mode: "number" }).notNull().default(0),
  },
  (cat) => ({
    idIndex: uniqueIndex("id_idx").on(cat.id),
    // don't index votes because we'll write to it way more than reading
  })
);
