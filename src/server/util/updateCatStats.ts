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
  otherWinner,
}: {
  db: PlanetScaleDatabase<typeof schema>;
  winner: Cat;
  otherWinner: Cat;
}) {
  /**
   * TODO: we're making too many db round trips here. this could be
   * done faster with transactions.
   */

  const winnerVotesToAdd = winner.votes.length;

  const winnerInDB = await db.query.cat.findFirst({
    where: (cat, { eq }) => eq(cat.id, winner.id),
  });
  const winnerExistsInDB = !!winnerInDB;

  console.log(`adding ${winnerVotesToAdd} votes to ${winner.id}`);
  if (winnerExistsInDB) {
    db.update(cat).set({ votes: winnerInDB.votes + winnerVotesToAdd });
  } else {
    db.insert(cat).values({
      id: winner.id,
      url: winner.url,
      votes: winner.votes.length,
    });
  }

  const otherWinnerVotesToAdd = otherWinner.votes.length;

  const otherWinnerInDB = await db.query.cat.findFirst({
    where: (cat, { eq }) => eq(cat.id, otherWinner.id),
  });

  const otherWinnerExistsInDB = !!otherWinnerInDB;

  console.log(`adding ${otherWinnerVotesToAdd} votes to ${otherWinner.id}`);
  if (otherWinnerExistsInDB) {
    db.update(cat).set({
      votes: otherWinnerInDB.votes + otherWinnerVotesToAdd,
    });
  } else {
    db.insert(cat).values({
      id: otherWinner.id,
      url: otherWinner.url,
      votes: otherWinner.votes.length,
    });
  }
}
