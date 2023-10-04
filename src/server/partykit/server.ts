import type * as Party from "partykit/server";
import { z } from "zod";
import { produce } from "immer";
import { getCatPair } from "../util/getCatPair";
import { PlanetScaleDatabase } from "drizzle-orm/planetscale-serverless";
import * as schema from "../db/schema";
import { updateCatStats } from "../util/updateCatStats";
import { createDrizzle } from "../db/drizzle";
import { AxiomLogger } from "../util/axiom";

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

export type GameState = {
  // TODO: move connections to its own thing so we only need to pass them on player connect/disconnect
  connections: number;
} & (
  | { status: "waiting for initial server connection" }
  | {
      status: "initializing";
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
    }
);

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

  db: PlanetScaleDatabase<typeof schema>;

  axiom: AxiomLogger;

  constructor(readonly party: Party.Party) {
    this.gameState = { status: "initializing", connections: 0 };

    if (!party.env?.DATABASE_URL) {
      throw new Error("party.env.DATABASE_URL is undefined");
    }

    console.log("env", party.env);

    this.axiom = new AxiomLogger({
      dataset: party.env.AXIOM_DATASET as string,
      token: party.env.AXIOM_TOKEN as string,
      orgId: party.env.AXIOM_ORG_ID as string,
    });

    this.db = createDrizzle(party.env.DATABASE_URL as string);
  }

  onStart() {
    this.startFromScratch();
  }

  onRequest(_req: Party.Request): Response | Promise<Response> {
    return new Response("Hello, world!", { status: 200 });
  }

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    this.updateGameState({ ...this.gameState, connections: this.connections });
    this._broadcastGameState();

    connection.serializeAttachment({
      ...connection.deserializeAttachment(),
      cf: ctx.request.cf,
    });
  }

  onMessage(
    message: string,
    connection: Party.Connection
  ): void | Promise<void> {
    try {
      const parsedMessage = messageSchema.parse(JSON.parse(message));

      console.log("attachment:", connection.deserializeAttachment());
      this.axiom.log({
        message: parsedMessage,
        connectionId: connection.id,
        cf: connection.deserializeAttachment().cf,
      });

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
    console.error(`onError, connection: ${connection}, error: ${error}`);
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
    console.log("status", status);
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
    this.updateGameState({
      status: "initializing",
      connections: this.connections,
    });

    setTimeout(() => {
      this.startVotingRound();
    }, TIMES.WAITING_LENGTH);
  }

  get connections() {
    return Array.from(this.party.getConnections()).length;
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
        connections: this.connections,
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

    // update early, because we don't know how long the db calls will take
    this.updateGameState({
      status: "winner",
      cats: this.gameState.cats,
      winner,
      round: this.gameState.round,
      connections: this.connections,
    });

    setTimeout(() => {
      this.startVotingRound();
    }, TIMES.WAITING_LENGTH);

    // do this now so the game can continue even if this is slow
    // disable for now so that we don't dangle a millio promises
    await updateCatStats({
      db: this.db,
      cat1: this.gameState.cats.a,
      cat2: this.gameState.cats.b,
    });
  }

  setError(error: unknown) {
    this.gameState = {
      status: "error",
      error: error instanceof Error ? error.message : "unknown error",
      connections: this.connections,
    };
    setTimeout(() => {
      this.startFromScratch();
    }, TIMES.WAITING_LENGTH);
  }
}
