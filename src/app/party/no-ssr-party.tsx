"use client";

import { CatVoting } from "./cat-voting";

export default function NoSsrParty() {
  return (
    <main className="p-2 flex flex-col gap-4">
      <CatVoting />
    </main>
  );
}
