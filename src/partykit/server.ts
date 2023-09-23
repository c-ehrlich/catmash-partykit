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

type Cat = {
  id: string;
  url: string;
  votes: Array<string>;
  width: number;
  height: number;
};
type Cats = Record<"a" | "b", Cat>;
type Winner = "a" | "b" | "tie";
type Round = { id: string; startTime: number; endTime: number };

export type ChatMessage = { id: string; message: string } & (
  | { type: "chat"; user: string; location: string }
  | { type: "info" }
);
export type ChatMessages = Array<ChatMessage>;

type ChatMessagesServerMessage = { type: "chat"; payload: ChatMessages };

export type GameState =
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

type GameStatusServerMessage = { type: "status"; payload: GameState };

export type PartykitServerMessage =
  | ChatMessagesServerMessage
  | GameStatusServerMessage;

const TIMES = {
  ROUND_LENGTH: 10_000,
  WAITING_LENGTH: 5_000,
};

export default class CatMashServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };

  gameStatus: GameState;
  chatMessages: ChatMessages;

  constructor(readonly party: Party.Party) {
    this.chatMessages = [];
    this.gameStatus = { status: "waiting" };
  }

  onStart() {
    this.startFromScratch();
  }

  onRequest(req: Party.Request): Response | Promise<Response> {
    console.log("onRequest", req.cf?.city);
    return new Response("Hello, world!", { status: 200 });
  }

  // getConnectionTags(
  //   connection: Party.Connection,
  //   context: Party.ConnectionContext
  // ): string[] | Promise<string[]> {}

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`onConnect, connection: ${connection}, ctx: ${ctx}`);
    // TODO: can we use `connection.send` here to send the current status only to the new connection?

    connection.serializeAttachment({
      ...connection.deserializeAttachment(),
      city: ctx.request.cf?.city,
      country: ctx.request.cf?.country,
    });

    this._broadcastStatus();
    this._broadcastChat();
  }

  onMessage(
    message: string,
    connection: Party.Connection
  ): void | Promise<void> {
    console.log(`onMessage, message: ${message}, sender: ${connection}`);

    const attachment = connection.deserializeAttachment();
    console.log("attachment", attachment);

    try {
      const parsedMessage = messageSchema.parse(JSON.parse(message as string));
      switch (parsedMessage.type) {
        case "vote":
          this.addVote({
            roundId: parsedMessage.roundId,
            cat: parsedMessage.cat,
            userId: connection.id,
          });
          // TODO: implement
          break;
        case "chat":
          this.addChatMessage({
            id: crypto.randomUUID(),
            type: "chat",
            user: connection.id,
            location: `${attachment.city}, ${attachment.country}`,
            message: parsedMessage.message,
          });
          break;
      }
    } catch (e) {
      console.error(e);
    }
  }

  onClose(connection: Party.Connection): void | Promise<void> {
    // kinda not necessary but whatever
    this.removeVotesForUser(connection.id);
    this._broadcastStatus();
  }

  onError(connection: Party.Connection, error: Error): void | Promise<void> {
    console.log(`onError, connection: ${connection}, error: ${error}`);
    this.removeVotesForUser(connection.id);
    this._broadcastStatus();
  }

  removeVotesForUser(id: string) {
    if (this.gameStatus.status === "voting") {
      this.updateStatus(
        produce(this.gameStatus, (draft) => {
          draft.cats.a.votes = draft.cats.a.votes.filter((vote) => vote !== id);
          draft.cats.b.votes = draft.cats.b.votes.filter((vote) => vote !== id);
        })
      );
    }
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

  async addChatMessage(message: ChatMessage) {
    // 0th index is most recent
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // TODO: add a toast telling the user to not say fuck
    if (!message.message.includes("fuck")) {
      this.chatMessages = [message, ...this.chatMessages].slice(0, 10);
    }
    this._broadcastChat();
  }

  resetChat() {
    this.chatMessages = [];
    this._broadcastChat();
  }

  updateStatus(status: GameState) {
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

    setTimeout(() => {
      this.startVotingRound();
    }, TIMES.WAITING_LENGTH);
  }

  async startVotingRound() {
    const cats = await this.getCatPair();

    this.updateStatus({
      status: "voting",
      cats,
      round: {
        id: crypto.randomUUID(),
        startTime: Date.now(),
        endTime: Date.now() + TIMES.ROUND_LENGTH,
      },
    });

    setTimeout(() => {
      this.showRoundResults();
    }, TIMES.ROUND_LENGTH);
  }

  async showRoundResults() {
    if (this.gameStatus.status !== "voting") {
      throw new Error("showRoundResults called when not voting");
    }

    const catAVotes = this.gameStatus.cats.a.votes.length;
    const catBVotes = this.gameStatus.cats.b.votes.length;

    const winner =
      catAVotes > catBVotes ? "a" : catAVotes < catBVotes ? "b" : "tie";

    // TODO: persist to db
    // use id
    // upsert url
    // increment votes

    this.updateStatus({
      status: "winner",
      cats: this.gameStatus.cats,
      winner,
      round: this.gameStatus.round,
    });

    setTimeout(() => {
      this.startVotingRound();
    }, TIMES.WAITING_LENGTH);
  }

  async getCatPair(): Promise<Cats> {
    const cats = await fetch(
      "https://api.thecatapi.com/v1/images/search?limit=10"
    ).then((res) => res.json());
    const parsedCats = catApiResponseSchema.parse(cats);
    return {
      a: {
        id: parsedCats[0].id,
        votes: [],
        url: parsedCats[0].url,
        width: parsedCats[0].width,
        height: parsedCats[0].height,
      },
      b: {
        id: parsedCats[1].id,
        votes: [],
        url: parsedCats[1].url,
        width: parsedCats[1].width,
        height: parsedCats[1].height,
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
