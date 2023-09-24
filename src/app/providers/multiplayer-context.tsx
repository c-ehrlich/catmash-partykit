"use client";

import { createContext, useContext } from "react";
import PartySocket from "partysocket";
import usePartySocket from "partysocket/react";
import { party } from "../party/party-store";
import { PartykitServerMessage } from "@/server/partykit/server";

const PARTY_HOST =
  process.env.NEXT_PUBLIC_PARTY_HOST ?? "http://127.0.0.1:1999";
const PARTY_ROOM = "default_room";

interface MultiplayerContextType {
  socket: PartySocket | null;
}

export const MultiplayerContext = createContext<MultiplayerContextType>({
  socket: null,
});

export function useMultiplayer() {
  return useContext(MultiplayerContext);
}

export function MultiplayerContextProvider(props: {
  children: React.ReactNode;
}) {
  const socket = usePartySocket({
    host: PARTY_HOST,
    //party: "youtube-party", // TODO: what does this do?
    room: PARTY_ROOM,
    onMessage: (message) => {
      // TODO: maybe safely parse?
      const parsedMessageData = JSON.parse(message.data);
      party.handleMessage(parsedMessageData as PartykitServerMessage);
    },
  });

  console.log("opening socket, host:", PARTY_HOST);

  return (
    <MultiplayerContext.Provider value={{ socket: socket }}>
      {props.children}
    </MultiplayerContext.Provider>
  );
}
