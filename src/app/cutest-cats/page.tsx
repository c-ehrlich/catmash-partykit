import { createDrizzle } from "@/server/db/drizzle";
import { cat } from "@/server/db/schema";

export const runtime = "edge";

export default async function CutestCats() {
  return (
    <div>
      todo - leaderboards will be added once i figure out how to get drizzle orm
      working in the partykit runtime
    </div>
  );
}
// export default async function CutestCats() {
//   if (!process.env.DATABASE_URL) {
//     throw new Error("DATABASE_URL env var not set");
//   }

//   const db = createDrizzle(process.env.DATABASE_URL);

//   console.log("db", db);
//   console.log("---done logging db");

//   await db
//     .insert(cat)
//     .values({
//       id: "test123",
//       url: "test123",
//       votes: 0,
//     })
//     .onDuplicateKeyUpdate({ set: { url: "test456" } });

//   const cats = await db.query.cat.findMany();

//   return <pre>{JSON.stringify(cats)}</pre>;
// }
