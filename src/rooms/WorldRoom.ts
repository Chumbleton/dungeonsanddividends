import { Room } from "colyseus";
import { Ticker, startTicker } from "../tick";

export class WorldRoom extends Room {
  private ticker?: Ticker;

  onCreate() {
    console.log("[WorldRoom] created");

    this.ticker = startTicker(this.runEconomyStep.bind(this));
  }

  onDispose() {
    console.log("[WorldRoom] disposed");

    this.ticker?.stop();
  }

  private runEconomyStep(dt: number) {
    console.log(`[TICK] dt=${dt.toFixed(3)}s`);
    // future: process production, market updates, etc.
  }
}