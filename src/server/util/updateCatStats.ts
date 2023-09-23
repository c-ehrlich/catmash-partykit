import { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import { cat } from "../db/schema";
import { type Cat } from "../partykit/server";
import * as schema from "../db/schema";

/**
 * TODO: this doesn't work for some reason, it just stops at the first db query
 */

export async function updateCatStats({
  db,
  winner,
  loser,
}: {
  db: PlanetScaleDatabase<typeof schema>;
  winner: Cat;
  loser: Cat;
}) {
  console.log("updating cat stats");

  const winnerExists = await db.query.cat.findFirst({
    where: (cat, { eq }) => eq(cat.id, winner.id),
  });
  const loserExists = await db.query.cat.findFirst({
    where: (cat, { eq }) => eq(cat.id, loser.id),
  });

  const votesDiff = winner.votes.length - loser.votes.length;

  console.log(`adding ${votesDiff} votes to ${winner.id}`);
  if (winnerExists) {
    db.update(cat).set({ votes: winnerExists.votes + votesDiff });
  } else {
    db.insert(cat).values({
      id: winner.id,
      url: winner.url,
      votes: winner.votes.length,
    });
  }

  console.log(`subtracting ${votesDiff} votes from ${loser.id}}`);
  if (loserExists) {
    db.update(cat).set({ votes: loserExists.votes + votesDiff });
  } else {
    db.insert(cat).values({
      id: loser.id,
      url: loser.url,
      votes: loser.votes.length,
    });
  }
}
