// src/rooms/WorldRoom.ts
import { Room, Client } from "colyseus";
import { startTicker, Ticker } from "../tick";
import { WorldState, PlayerSnapshot } from "./schema/WorldState";  // minimal version (globalTick only)
import {
  BASE_RATE,
  WORKERS_PER_LEVEL,
  FAIR_WAGE,
  SPECIES_BONUS,
  MORALE_K,
} from "../constants/economy";

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
    const snap = new PlayerSnapshot();

    // starter cash, facility already pre-filled above
    snap.cash = 1000;
    snap.inventory.set("0", 0);

    this.state.playerSnapshots.set(client.sessionId, snap);
    console.log(`[Join] ${client.sessionId}`);
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
        /* ----- 3.1 morale ----- */
        const wageRatio = snap.wage / FAIR_WAGE;
        const morale =
          1 / (1 + Math.exp(-MORALE_K * (wageRatio - 1)));   // logistic curve

        /* ----- 3.2 capacity & output ----- */
        const capacity = WORKERS_PER_LEVEL * snap.facilityLevel;
        const effectiveWorkers = Math.min(snap.workers, capacity);

        const output =
          BASE_RATE *
          effectiveWorkers *
          (1 + SPECIES_BONUS) *   // dwarf/elf later
          morale;

        /* ----- 3.3 update inventory ----- */
        const currentQty = snap.inventory.get("0") ?? 0;
        snap.inventory.set("0", +(currentQty + output).toFixed(2));

        /* ----- 3.4 pay wages ----- */
        snap.cash = +(snap.cash - snap.workers * snap.wage).toFixed(2);
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
