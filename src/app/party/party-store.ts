import {
  GameStatus,
  type ChatMessages,
  PartykitServerMessage,
} from "@/partykit/server";
import { makeAutoObservable } from "mobx";

export class Party {
  constructor() {
    makeAutoObservable(this);
  }

  messages: ChatMessages = [];

  status: GameStatus = { status: "waiting" };

  handleMessage(message: PartykitServerMessage) {
    console.log("handleMessage, message: ", message);

    switch (message.type) {
      case "chat":
        this.messages = message.payload;
        break;
      case "status":
        this.status = message.payload;
        break;
    }
  }
}

export const party = new Party();
