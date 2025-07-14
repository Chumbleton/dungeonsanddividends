// src/rooms/WorldRoom.ts
import { Room, Client } from "colyseus";
import { startTicker, Ticker } from "../tick";
import { WorldState, PlayerSnapshot } from "./schema/WorldState";  // minimal version (globalTick only)

export class WorldRoom extends Room<WorldState> {
  private ticker?: Ticker;

  onCreate() {
    console.log("[WorldRoom] created");

    // ---- initialise state ----
    this.setState(new WorldState());
    console.log("[WorldRoom] state initialised");

    this.state.marketPrices.set("0", 10);

    // ---- start heartbeat (5 Hz) ----
    this.ticker = startTicker(this.runEconomyStep.bind(this));
  }

  onJoin(client: Client) {
    this.state.playerSnapshots.set(client.sessionId, new PlayerSnapshot());
    console.log(`[WorldRoom] ${client.sessionId} joined`);
  }

  onLeave(client: Client) {
    this.state.playerSnapshots.delete(client.sessionId);
    console.log(`[WorldRoom] ${client.sessionId} left`);
  }

  onDispose() {
    console.log("[WorldRoom] disposed");
    this.ticker?.stop();
  }

  /** Called every 0.2 s by the Ticker */
  private runEconomyStep(dt: number) {
    this.state.globalTick++;

      const cur = this.state.marketPrices.get("0")!;        // key "0"
     this.state.marketPrices.set("0", +(cur + 0.01).toFixed(2));

      this.state.playerSnapshots.forEach((snap) => {
      snap.cash = +(snap.cash + 0.05).toFixed(2);
      });

    // Log every 10 ticks so we can see progress.
    if (this.state.globalTick % 10 === 0) {
      console.log(
        "[Tick]", this.state.globalTick,
        "price", this.state.marketPrices.get("0"),
        "players", this.state.playerSnapshots.size,
      );
    }
  }
}
