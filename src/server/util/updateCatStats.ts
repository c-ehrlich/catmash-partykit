import { db } from "../db/drizzle";
import { cat } from "../db/schema";
import { type Cat } from "../partykit/server";

export async function updateCatStats({
  winner,
  loser,
}: {
  winner: Cat;
  loser: Cat;
}) {
  const winnerExists = await db.query.cat.findFirst({
    where: (cat, { eq }) => eq(cat.id, winner.id),
  });
  const loserExists = await db.query.cat.findFirst({
    where: (cat, { eq }) => eq(cat.id, loser.id),
  });

  if (winnerExists) {
    db.update(cat).set({ votes: winnerExists.votes + 1 });
  } else {
    db.insert(cat).values({
      id: winner.id,
      url: winner.url,
      votes: winner.votes.length,
    });
  }

  if (loserExists) {
    db.update(cat).set({ votes: loserExists.votes + 1 });
  } else {
    db.insert(cat).values({
      id: loser.id,
      url: loser.url,
      votes: loser.votes.length,
    });
  }
}
