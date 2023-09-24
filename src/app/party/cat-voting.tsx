/* for the sake of my vercel bill */
/* eslint-disable @next/next/no-img-element */

"use client";

import { observer } from "mobx-react-lite";
import { useMultiplayer } from "../providers/multiplayer-context";
import { party } from "./party-store";
import { ValidMessage } from "@/server/partykit/server";
import { TimeRemaining } from "./time-remaining";
import Link from "next/link";

const CatVoting = observer(function CatVoting() {
  const { socket } = useMultiplayer();

  if (!socket) {
    return <h1>no socket</h1>;
  }

  const handleVote = (catId: "a" | "b") => {
    if (party.gameState.status !== "voting") {
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

    const playerHasVotes =
      cats.a.votes.includes(socket.id) || cats.b.votes.includes(socket.id);

    return (
      <div className="flex flex-col gap-4 items-center justify-center mx-4 w-10/12">
        <img
          src="/img/cats-header.png"
          alt="cats header"
          width={305}
          height={85}
          style={{ imageRendering: "pixelated" }}
        />

        <h1 className="text-5xl font-bold text-red-600 text-center">
          Which cat is cuter?
        </h1>

        <TimeRemaining endTime={endTime} totalVotes={totalVotes} />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
          {(["a", "b"] as const).map((catId) => {
            const cat = cats[catId];
            const playerVotedForCat = cat.votes.includes(socket.id);

            return (
              <div
                key={catId}
                className={`flex flex-col gap-4 items-center p-4 ${
                  playerVotedForCat ? "bg-green-700" : "bg-green-500"
                } rounded-lg w-full max-w-sm`}
              >
                <div className="flex items-center justify-center aspect-square w-full bg-transparent rounded-md overflow-hidden">
                  <div className="flex align-center items-center w-full h-full">
                    <img
                      className="object-fill rounded-md"
                      src={cat.url}
                      alt={`cat-${cat.id}`}
                      width={cat.width}
                      height={cat.height}
                    />
                  </div>
                </div>
                <button
                  className="bg-yellow-300 hover:bg-yellow-400 text-xl text-yellow-800 font-bold py-2 px-4 rounded"
                  value={cat.id}
                  onClick={() => handleVote(catId)}
                >
                  {playerVotedForCat
                    ? "Thx!!!"
                    : playerHasVotes
                    ? "Its ok im not upset"
                    : catId === "a"
                    ? "Pick me"
                    : "Nooooo pick me"}
                </button>
              </div>
            );
          })}
        </div>
        <span className="flex gap-2 text-sky-600 font-bold">
          {/* <Link href="/cutest-cats">Cutest Cats</Link> */}
          {/* <span className="font-light">/</span> */}
          <Link href="/about">About</Link>
        </span>
      </div>
    );
  }

  if (party.gameState.status === "winner") {
    if (
      party.gameState.cats.a.votes.length ===
      party.gameState.cats.b.votes.length
    ) {
      return (
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-red-500 text-4xl font-bold">It&rsquo;s a tie!</h1>
          <h2 className="text-2xl font-bold font-serif text-pink-600">
            Congratulations to both cats
          </h2>
        </div>
      );
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
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-bold text-red-600 text-center">
          Winner Winner Chicken Dinner
        </h1>
        <div className="flex flex-col gap-4 items-center p-4 bg-green-500 rounded-lg w-full max-w-md">
          <div className="flex items-center justify-center aspect-square w-full bg-transparent rounded-md overflow-hidden">
            <div className="flex align-center items-center w-full h-full">
              <img
                className="object-fill rounded-md"
                src={winner.url}
                alt={`cat-${winner.id}`}
                width={winner.width}
                height={winner.height}
              />
            </div>
          </div>
        </div>
        <p className="text-center font-bold text-blue-800 text-xl">
          Won {winner.votes.length}:{loser.votes.length}
        </p>
      </div>
    );
  }

  if (party.gameState.status === "initializing") {
    return (
      <h1 className="text-5xl font-bold text-red-600 text-center">
        Get ready to look at some cats!!
      </h1>
    );
  }

  return <div>Unhandled game state {JSON.stringify(party.gameState)}</div>;
});

export default CatVoting;
