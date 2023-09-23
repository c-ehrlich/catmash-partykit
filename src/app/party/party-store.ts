import { GameState, PartykitServerMessage } from "@/server/partykit/server";
import { makeAutoObservable } from "mobx";

export class Party {
  constructor() {
    makeAutoObservable(this);
  }

  gameState: GameState = { status: "waiting" };

  handleMessage(message: PartykitServerMessage) {
    console.log("handleMessage, message: ", message);

    switch (message.type) {
      case "gameState":
        this.gameState = message.payload;
        break;
      default:
        console.error("Unexpected message:", message);
    }
  }
}

export const party = new Party();
