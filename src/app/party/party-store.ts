import {
  GameState,
  PartykitServerMessage,
  type ChatMessage,
  type ChatMessages,
} from "@/partykit/server";
import { makeAutoObservable } from "mobx";

export class Party {
  constructor() {
    makeAutoObservable(this);
  }

  messages: ChatMessages = [];

  status: GameState = { status: "waiting" };

  handleMessage(message: PartykitServerMessage) {
    console.log("handleMessage, message: ", message);

    switch (message.type) {
      case "chat":
        this.messages = message.payload;
        break;
      case "status":
        this.status = message.payload;
        break;
      default:
        console.error("Unexpected message:", message);
    }
  }

  optimisticallyAddMessage(message: ChatMessage) {
    this.messages.unshift(message);
  }
}

export const party = new Party();
