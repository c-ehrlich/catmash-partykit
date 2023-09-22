"use client";

import { CatVoting } from "./cat-voting";
import { Chat } from "./chat";
import { PlayerInfo } from "./player-info";

export default function NoSsrParty() {
  return (
    <main className="p-2 flex flex-col gap-4">
      <PlayerInfo />
      <CatVoting />
      <Chat />
    </main>
  );
}
