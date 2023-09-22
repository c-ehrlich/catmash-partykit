"use client";

import { observer } from "mobx-react-lite";
import { useMultiplayer } from "../providers/multiplayer-context";
import { party } from "./party-store";

export const CatVoting = observer(function CatVoting() {
  const { socket } = useMultiplayer();

  if (!socket) {
    return <h1>no socket</h1>;
  }

  return <div>{JSON.stringify(party.status)}</div>;
});
