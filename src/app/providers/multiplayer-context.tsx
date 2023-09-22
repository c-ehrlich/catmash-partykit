"use client";

import { createContext, useContext } from "react";
import PartySocket from "partysocket";
import usePartySocket from "partysocket/react";
import { party } from "../party/party-store";
import { PartykitServerMessage } from "@/partykit/server";

interface MultiplayerContextType {
  socket: PartySocket | null;
}

export const MultiplayerContext = createContext<MultiplayerContextType>({
  socket: null,
});

export function useMultiplayer() {
  return useContext(MultiplayerContext);
}

const PARTY_HOST = "http://127.0.0.1:1999";
const PARTY_ROOM = "hardcoded";

export function MultiplayerContextProvider(props: {
  children: React.ReactNode;
}) {
  const socket = usePartySocket({
    host: PARTY_HOST, // TODO: don't hardcode
    //party: "youtube-party",
    room: PARTY_ROOM,
    onMessage: (message) => {
      const parsedMessageData = JSON.parse(message.data);
      party.handleMessage(parsedMessageData as PartykitServerMessage);
    },
  });

  return (
    <MultiplayerContext.Provider value={{ socket: socket }}>
      {props.children}
    </MultiplayerContext.Provider>
  );
}