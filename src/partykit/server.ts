import type * as Party from "partykit/server";
import { z } from "zod";
import { produce } from "immer";

const catApiResponseSchema = z
  .array(
    z.object({
      id: z.string(),
      url: z.string().url(),
      // TODO: use these for something?
      width: z.number(),
      height: z.number(),
    })
  )
  .min(2);

const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("vote"),
    roundId: z.string().uuid(),
    cat: z.union([z.literal("a"), z.literal("b")]),
  }),
  z.object({
    type: z.literal("chat"),
    message: z.string(),
  }),
]);

type Cat = { id: string; url: string; votes: Array<string> };
type Cats = Record<"a" | "b", Cat>;
type Winner = "a" | "b" | "tie";
type Round = { id: string; startTime: number; endTime: number };

export type ChatMessage = { id: string; message: string } & (
  | { type: "chat"; user: string }
  | { type: "info" }
);
export type ChatMessages = Array<ChatMessage>;

type ChatMessagesServerMessage = { type: "chat"; payload: ChatMessages };

export type GameStatus =
  | {
      status: "waiting";
    }
  | {
      status: "voting";
      cats: Cats;
      round: Round;
    }
  | {
      status: "winner";
      cats: Cats;
      winner: Winner;
      round: Round;
    }
  | {
      status: "error";
      error: string;
    };

type GameStatusServerMessage = { type: "status"; payload: GameStatus };

export type PartykitServerMessage =
  | ChatMessagesServerMessage
  | GameStatusServerMessage;

const TIMES = {
  ROUND_LENGTH: 10_000,
  WAITING_LENGTH: 5_000,
};

export default class CatMashServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };

  gameStatus: GameStatus;
  chatMessages: ChatMessages;

  constructor(readonly party: Party.Party) {
    this.chatMessages = [];
    this.gameStatus = { status: "waiting" };
  }

  onStart() {
    this.startFromScratch();
  }

  // getConnectionTags(
  //   connection: Party.Connection,
  //   context: Party.ConnectionContext
  // ): string[] | Promise<string[]> {}

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`onConnect, connection: ${connection}, ctx: ${ctx}`);
    this._broadcastStatus();
    this._broadcastChat();
  }

  onMessage(message: string, sender: Party.Connection): void | Promise<void> {
    console.log(`onMessage, message: ${message}, sender: ${sender}`);

    try {
      const parsedMessage = messageSchema.parse(JSON.parse(message as string));
      switch (parsedMessage.type) {
        case "vote":
          this.addVote({
            roundId: parsedMessage.roundId,
            cat: parsedMessage.cat,
            userId: sender.id,
          });
          // TODO: implement
          break;
        case "chat":
          this.addChatMessage({
            id: crypto.randomUUID(),
            type: "chat",
            user: sender.id,
            message: parsedMessage.message,
          });
          break;
      }
    } catch (e) {
      console.error(e);
    }
  }

  onClose(connection: Party.Connection): void | Promise<void> {
    console.log(`onClose, connection: ${connection}`);
    this.removeVotesForUser(connection.id);
    this._broadcastStatus();
  }

  onError(connection: Party.Connection, error: Error): void | Promise<void> {
    console.log(`onError, connection: ${connection}, error: ${error}`);
    this.removeVotesForUser(connection.id);
    this._broadcastStatus();
  }

  removeVotesForUser(id: string) {
    // TODO: implement
  }

  addVote({
    roundId,
    cat,
    userId,
  }: {
    roundId: string;
    cat: "a" | "b";
    userId: string;
  }) {
    if (
      this.gameStatus.status === "voting" &&
      this.gameStatus.round.id === roundId
    ) {
      this.updateStatus(
        produce(this.gameStatus, (draft) => {
          // remove userId from both cats
          draft.cats.a.votes = draft.cats.a.votes.filter(
            (vote) => vote !== userId
          );
          draft.cats.b.votes = draft.cats.b.votes.filter(
            (vote) => vote !== userId
          );
          // add userId to voted for cat
          draft.cats[cat].votes = [...draft.cats[cat].votes, userId];
        })
      );
    }
  }

  addChatMessage(message: ChatMessage) {
    // 0th index is most recent
    this.chatMessages = [message, ...this.chatMessages].slice(0, 10);
    this._broadcastChat();
  }

  resetChat() {
    this.chatMessages = [];
    this._broadcastChat();
  }

  updateStatus(status: GameStatus) {
    this.gameStatus = status;
    this._broadcastStatus();
  }
  _broadcastStatus() {
    this.party.broadcast(
      JSON.stringify({
        type: "status",
        payload: this.gameStatus,
      } satisfies GameStatusServerMessage)
    );
  }

  _broadcastChat() {
    this.party.broadcast(
      JSON.stringify({
        type: "chat",
        payload: this.chatMessages,
      } satisfies ChatMessagesServerMessage)
    );
  }

  async startFromScratch() {
    this.updateStatus({ status: "waiting" });
    try {
      const cats = await this.getNextRoundCats();
      const id = crypto.randomUUID();
      setTimeout(() => {
        // TODO: extract this into another function and start a timer there
        this.updateStatus({
          status: "voting",
          cats,
          round: {
            id,
            startTime: Date.now(),
            endTime: Date.now() + TIMES.ROUND_LENGTH,
          },
        });
      }, TIMES.WAITING_LENGTH);
    } catch (e) {
      this.setError(e);
    }
  }

  async getNextRoundCats(): Promise<Cats> {
    const cats = await fetch(
      "https://api.thecatapi.com/v1/images/search?limit=10"
    ).then((res) => res.json());
    const parsedCats = catApiResponseSchema.parse(cats);
    return {
      a: {
        id: parsedCats[0].id,
        url: parsedCats[0].url,
        votes: [],
      },
      b: {
        id: parsedCats[1].id,
        url: parsedCats[1].url,
        votes: [],
      },
    };
  }

  setError(error: unknown) {
    this.gameStatus = {
      status: "error",
      error: error instanceof Error ? error.message : "unknown error",
    };
    setTimeout(() => {
      this.startFromScratch();
    }, TIMES.WAITING_LENGTH);
  }
}
