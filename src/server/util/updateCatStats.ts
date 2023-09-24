import { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import { cat } from "../db/schema";
import { type Cat } from "../partykit/server";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * TODO: this doesn't work for some reason, it just stops at the first db query
 */

export async function updateCatStats({
  db,
  cat1,
  cat2,
}: {
  db: PlanetScaleDatabase<typeof schema>;
  cat1: Cat;
  cat2: Cat;
}) {
  /**
   * TODO: we're making too many db round trips here. this could be
   * done faster with transactions.
   */

  const cat1VotesToAdd = cat1.votes.length;

  if (cat1VotesToAdd > 0) {
    const cat1record = await db.query.cat.findFirst({
      where: (cat, { eq }) => eq(cat.id, cat1.id),
    });
    console.log("cat1record", cat1record);

    const cat1ExistsInDB = !!cat1record;

    console.log(`adding ${cat1VotesToAdd} votes to ${cat1.id}`);
    if (cat1ExistsInDB) {
      console.log("updating cat1");
      await db
        .update(cat)
        .set({ votes: cat1record.votes + cat1VotesToAdd })
        .where(eq(cat.id, cat1.id));
    } else {
      console.log("creating cat1");
      await db.insert(cat).values({
        id: cat1.id,
        url: cat1.url,
        votes: cat1.votes.length,
        height: cat1.height,
        width: cat1.width,
      });
    }
  }

  const cat2VotesToAdd = cat2.votes.length;

  if (cat2VotesToAdd > 0) {
    const cat2record = await db.query.cat.findFirst({
      where: (cat, { eq }) => eq(cat.id, cat2.id),
    });
    console.log("cat2record", cat2record);

    const cat2ExistsInDB = !!cat2record;

    console.log(`adding ${cat2VotesToAdd} votes to ${cat2.id}`);
    if (cat2ExistsInDB) {
      console.log("updating cat2");
      await db
        .update(cat)
        .set({ votes: cat2record.votes + cat2VotesToAdd })
        .where(eq(cat.id, cat2.id));
    } else {
      console.log("creating cat2");
      await db.insert(cat).values({
        id: cat2.id,
        url: cat2.url,
        votes: cat2.votes.length,
        height: cat2.height,
        width: cat2.width,
      });
    }
  }
}
