import type * as Party from "partykit/server";
import { z } from "zod";
import { produce } from "immer";
import { getCatPair } from "../util/getCatPair";
import { db } from "../db/drizzle";
import { cat } from "../db/schema";
import { updateCatStats } from "../util/updateCatStats";

const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("vote"),
    roundId: z.string().uuid(),
    cat: z.union([z.literal("a"), z.literal("b")]),
  }),
  // add other types of messages here
]);
export type ValidMessage = z.infer<typeof messageSchema>;

export type Cat = {
  id: string;
  url: string;
  votes: Array<string>;
  width: number;
  height: number;
};
export type Cats = Record<"a" | "b", Cat>;
type Winner = "a" | "b" | "tie";
type Round = { id: string; startTime: number; endTime: number };

export type GameState =
  | { status: "waiting for initial server connection" }
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

type GameStateServerMessage = { type: "gameState"; payload: GameState };

// add union of other message types here
export type PartykitServerMessage = GameStateServerMessage;

const TIMES = {
  ROUND_LENGTH: 15_000,
  WAITING_LENGTH: 5_000,
} as const;

export default class CatMashServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };

  gameState: GameState;

  constructor(readonly party: Party.Party) {
    this.gameState = { status: "waiting" };
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

    this._broadcastGameState();
  }

  onMessage(
    message: string,
    connection: Party.Connection
  ): void | Promise<void> {
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
        default:
          console.error("Unexpected message:", message);
      }
    } catch (e) {
      console.error(e);
    }
  }

  onClose(connection: Party.Connection): void | Promise<void> {
    // kinda not necessary but whatever
    this.removeVotesForUser(connection.id);
    this._broadcastGameState();
  }

  onError(connection: Party.Connection, error: Error): void | Promise<void> {
    console.log(`onError, connection: ${connection}, error: ${error}`);
    this.removeVotesForUser(connection.id);
    this._broadcastGameState();
  }

  removeVotesForUser(id: string) {
    if (this.gameState.status === "voting") {
      this.updateGameState(
        produce(this.gameState, (draft) => {
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
    console.log(roundId, cat, userId);

    if (
      this.gameState.status === "voting" &&
      this.gameState.round.id === roundId
    ) {
      this.updateGameState(
        produce(this.gameState, (draft) => {
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

  updateGameState(status: GameState) {
    this.gameState = status;
    this._broadcastGameState();
  }

  _broadcastGameState() {
    this.party.broadcast(
      JSON.stringify({
        type: "gameState",
        payload: this.gameState,
      } satisfies GameStateServerMessage)
    );
  }

  async startFromScratch() {
    this.updateGameState({ status: "waiting" });

    setTimeout(() => {
      this.startVotingRound();
    }, TIMES.WAITING_LENGTH);
  }

  async startVotingRound() {
    try {
      const cats = await getCatPair();

      this.updateGameState({
        status: "voting",
        cats,
        round: {
          id: crypto.randomUUID(),
          startTime: Date.now(),
          // TODO: maybe dont implement it like this?
          endTime: Date.now() + TIMES.ROUND_LENGTH - 1000, // -1s to account for network latency
        },
      });

      setTimeout(() => {
        this.showRoundResults();
      }, TIMES.ROUND_LENGTH);
    } catch (e) {
      this.startFromScratch();
    }
  }

  async showRoundResults() {
    if (this.gameState.status !== "voting") {
      throw new Error("showRoundResults called when not voting");
    }

    const catAVotes = this.gameState.cats.a.votes.length;
    const catBVotes = this.gameState.cats.b.votes.length;

    const winner =
      catAVotes > catBVotes ? "a" : catAVotes < catBVotes ? "b" : "tie";
    const votesDiff = Math.abs(catAVotes - catBVotes);

    if (winner !== "tie") {
      const winnerData = this.gameState.cats[winner];
      const loserData = this.gameState.cats[winner === "a" ? "b" : "a"];

      // we don't want to await this so the game can go on
      updateCatStats({ winner: winnerData, loser: loserData });
    }

    this.updateGameState({
      status: "winner",
      cats: this.gameState.cats,
      winner,
      round: this.gameState.round,
    });

    setTimeout(() => {
      this.startVotingRound();
    }, TIMES.WAITING_LENGTH);
  }

  setError(error: unknown) {
    this.gameState = {
      status: "error",
      error: error instanceof Error ? error.message : "unknown error",
    };
    setTimeout(() => {
      this.startFromScratch();
    }, TIMES.WAITING_LENGTH);
  }
}
