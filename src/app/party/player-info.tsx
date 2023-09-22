"use client";

import { observer } from "mobx-react-lite";
import { useMultiplayer } from "../providers/multiplayer-context";

export const PlayerInfo = observer(function PlayerInfo() {
  const { socket } = useMultiplayer();

  if (!socket) {
    return <h1 suppressHydrationWarning>no socket</h1>;
  }

  return <div>socket id: {socket.id}</div>;
});
