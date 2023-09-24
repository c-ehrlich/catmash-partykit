/* i cant afford vercel image optimization */
/* eslint-disable @next/next/no-img-element */

import { createDrizzle } from "@/server/db/drizzle";
import { cat } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function CutestCats() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL env var not set");
  }

  const db = createDrizzle(process.env.DATABASE_URL);

  const cats = await db.query.cat.findMany({
    orderBy: [desc(cat.votes)],
    limit: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1>Top10 cutest cates</h1>
      {cats.map((cat, idx) => (
        <div key={cat.id} className="flex flex-col">
          <p>
            Rank {idx + 1} with {cat.votes} vote{cat.votes !== 1 && "s"}
          </p>
          <img
            src={cat.url}
            alt={`Number ${idx + 1} cutest cat as chosen by CatMashers`}
            className="w-64 h-64"
            height={cat.height}
            width={cat.width}
          />
        </div>
      ))}
      <h2>Every cat is a winner!!!</h2>
    </div>
  );
}
