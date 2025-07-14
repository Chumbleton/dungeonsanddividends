import { Room, Client } from "colyseus";
import { Ticker, startTicker } from "../tick";
import { WorldState, PlayerSnapshot } from "./schema/WorldState";

export class WorldRoom extends Room {
  private ticker?: Ticker;

  onCreate() {
    console.log("[WorldRoom] created");
    this.setState(new WorldState());
    console.log("[WorldRoom] state initialized");
    this.ticker = startTicker(this.runEconomyStep.bind(this));
  }

  onJoin(client: Client) {
    super.onJoin?.(client);
    this.state.playerSnapshots.set(client.sessionId, new PlayerSnapshot());
    console.log(`[WorldRoom] player ${client.sessionId} snapshot created`);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.playerSnapshots.delete(client.sessionId);
    console.log(`[WorldRoom] player ${client.sessionId} snapshot removed`);
  }

  onDispose() {
    console.log("[WorldRoom] disposed");
    this.ticker?.stop();
  }

  private runEconomyStep(dt: number) {
        this.state.globalTick++;
    // TODO: update state, prices, player balances...
  }
}
