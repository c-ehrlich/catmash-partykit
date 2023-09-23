/* for the sake of my vercel bill */
/* eslint-disable @next/next/no-img-element */

"use client";

import { observer } from "mobx-react-lite";
import { useMultiplayer } from "../providers/multiplayer-context";
import { party } from "./party-store";
import Image from "next/image";
import { ValidMessage } from "@/server/partykit/server";
import { TimeRemaining } from "./time-remaining";

export const CatVoting = observer(function CatVoting() {
  const { socket } = useMultiplayer();

  if (!socket) {
    return <h1>no socket</h1>;
  }

  const handleVote = (catId: "a" | "b") => {
    console.log(catId);

    if (party.gameState.status !== "voting") {
      console.log("wrong game status");
      return;
    }

    const vote: ValidMessage = {
      type: "vote",
      cat: catId,
      roundId: party.gameState.round.id,
    };

    socket.send(JSON.stringify(vote));
  };

  if (party.gameState.status === "voting") {
    const cats = party.gameState.cats;

    const endTime = party.gameState.round.endTime;
    const totalVotes = cats.a.votes.length + cats.b.votes.length;

    return (
      <div className="flex flex-col gap-4 items-center justify-center mx-4 w-10/12">
        <img
          src="/img/cats-header.png"
          alt="cats header"
          width={305}
          height={85}
          style={{ imageRendering: "pixelated" }}
        />
        <TimeRemaining endTime={endTime} totalVotes={totalVotes} />
        <p></p>

        <div className="flex gap-4">
          {(["a", "b"] as const).map((catId) => {
            const cat = cats[catId];

            return (
              <div key={catId} className="flex flex-col gap-2">
                <h2></h2>
                <img
                  src={cat.url}
                  alt={`cat-${cat.id}`}
                  width={cat.width}
                  height={cat.height}
                />
                <button
                  className="bg-yellow-200 text-black p-2"
                  value={cat.id}
                  onClick={() => handleVote(catId)}
                >
                  {catId === "a" ? "Pick me" : "Nooooo pick me"}
                </button>
              </div>
            );
          })}
        </div>
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
