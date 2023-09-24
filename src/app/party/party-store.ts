import { GameState, PartykitServerMessage } from "@/server/partykit/server";
import { makeAutoObservable } from "mobx";

export class CatmashParty {
  constructor() {
    makeAutoObservable(this);
  }

  gameState: GameState = { status: "waiting for initial server connection" };

  handleMessage(message: PartykitServerMessage) {
    switch (message.type) {
      case "gameState":
        this.gameState = message.payload;
        break;
      default:
        console.error("Unexpected message:", message);
    }
  }
}

export const party = new CatmashParty();
