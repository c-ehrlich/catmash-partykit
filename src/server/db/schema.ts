import {
  bigint,
  int,
  mysqlTableCreator,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const mysqlTable = mysqlTableCreator((name) => `catmash_${name}`);

export const cat = mysqlTable(
  "cat",
  {
    id: varchar("id", { length: 16 }).primaryKey(),
    url: varchar("url", { length: 255 }).notNull(),
    votes: bigint("votes", { mode: "number" }).notNull().default(0),
    height: int("height").notNull(),
    width: int("width").notNull(),
  },
  (cat) => ({
    idIndex: uniqueIndex("id_idx").on(cat.id),
    // don't index votes because we'll write to it way more than reading
  })
);
