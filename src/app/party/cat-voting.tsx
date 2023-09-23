"use client";

import { observer } from "mobx-react-lite";
import { useMultiplayer } from "../providers/multiplayer-context";
import { party } from "./party-store";
import Image from "next/image";

export const CatVoting = observer(function CatVoting() {
  const { socket } = useMultiplayer();

  if (!socket) {
    return <h1>no socket</h1>;
  }

  if (party.gameState.status === "voting") {
    return (
      <div className="flex gap-4">
        {[party.gameState.cats.a, party.gameState.cats.b].map((cat) => (
          <div key={cat.id} className="flex flex-col gap-2">
            <h2>Vote for me</h2>
            <Image
              src={cat.url}
              alt={`cat-${cat.id}`}
              width={cat.width}
              height={cat.height}
            />
            <p>votes: {cat.votes.length}</p>
          </div>
        ))}
      </div>
    );
  }

  if (party.gameState.status === "winner") {
    if (
      party.gameState.cats.a.votes.length ===
      party.gameState.cats.b.votes.length
    ) {
      // TODO: show when the next round starts
      return <h1>Its a tie!</h1>;
    }

    const winner =
      party.gameState.cats.a.votes.length > party.gameState.cats.b.votes.length
        ? party.gameState.cats.a
        : party.gameState.cats.b;
    const loser =
      party.gameState.cats.a.votes.length > party.gameState.cats.b.votes.length
        ? party.gameState.cats.b
        : party.gameState.cats.a;

    return (
      <div>
        <h1>Winner!</h1>
        <Image
          src={winner.url}
          alt={`cat-${winner.id}`}
          width={winner.width}
          height={winner.height}
        />
        <p>
          {" "}
          Won {winner.votes.length}:{loser.votes.length}
        </p>
      </div>
    );
  }

  return <div>{JSON.stringify(party.gameState)}</div>;
});
