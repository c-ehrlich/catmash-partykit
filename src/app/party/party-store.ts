import { GameState, PartykitServerMessage } from "@/server/partykit/server";
import { makeAutoObservable } from "mobx";

/**
 * Using a store for this is hilariously overkill because we're only ever receiving one type
 * of message and updating one piece of data, but it's how I would approach something more complex.
 */

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
