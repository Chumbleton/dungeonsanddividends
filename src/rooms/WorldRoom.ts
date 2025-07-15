// src/rooms/WorldRoom.ts
import { Room, Client } from "colyseus";
import { startTicker, Ticker } from "../tick";
import { WorldState, PlayerSnapshot } from "./schema/WorldState";  // minimal version (globalTick only)
import {
  BASE_RATE, WORKERS_PER_LEVEL, FAIR_WAGE, SPECIES_BONUS, MORALE_K,
  DEMAND_K, DEMAND_ELASTICITY, PRICE_ADJUST_RATE, MIN_PRICE, MAX_PRICE, COMMODITY, STEEL_RECIPE, BASE_PRICES
} from "../constants/economy";
import { prisma } from "../services/prismaClient";


export class WorldRoom extends Room<WorldState> {
  private ticker?: Ticker;

  onCreate() {
    console.log("[WorldRoom] created");

    // ---- initialise state ----
    this.setState(new WorldState());
    console.log("[WorldRoom] state initialised");
    this.state.marketPrices.set(COMMODITY.IRON,  BASE_PRICES[COMMODITY.IRON]);
    this.state.marketPrices.set(COMMODITY.STEEL, BASE_PRICES[COMMODITY.STEEL]);



    // ---- start heartbeat (5 Hz) ----
    this.ticker = startTicker(this.runEconomyStep.bind(this));
  }

  onJoin(client: Client) {
    const snap = new PlayerSnapshot();

    // starter cash, facility already pre-filled above
    snap.cash = 1000;
    snap.inventory.set(COMMODITY.IRON,  0);
    snap.inventory.set(COMMODITY.STEEL, 0);

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

    /* 1 ─ production + wages + morale */
    for (const player of this.state.playerSnapshots.values()) {
      this.processProduction(player);
      this.processSteelCrafting(player);
    }

    /* 2 ─ market demand & price move (unchanged) */
    this.clearMarketAndAdjustPrice();

    // ─── persist prices (fire-and-forget) ───
    for (const resourceId of Object.values(COMMODITY)) {
      const price = this.state.marketPrices.get(resourceId)!;

      prisma.tickPrice
        .create({
          data: {
            tick:        this.state.globalTick,
            commodityId: resourceId,
            price,
          },
        })
        .catch((err) => console.error("prisma.write", err));   // log, don’t crash
    }


    /* 3 ─ auto-sell inventory at clearing price */
    for (const player of this.state.playerSnapshots.values()) {
      this.processAutoSell(player);
    }

    /* 4 ─ optional log */
    if (this.state.globalTick % 25 === 0 && this.state.playerSnapshots.size > 0) {
      const p = this.state.playerSnapshots.values().next().value;
      console.log(
        `[Tick ${this.state.globalTick}] ` +
          `Cash=${p.cash.toFixed(2)} ` +
          `Iron=${p.inventory.get(COMMODITY.IRON) ?? 0} ` +
          `Steel=${p.inventory.get(COMMODITY.STEEL) ?? 0}`
      );
    }
  }

  private computeMorale(player: PlayerSnapshot) {
    const wageRatio = player.wage / FAIR_WAGE;
    return 1 / (1 + Math.exp(-MORALE_K * (wageRatio - 1)));
  }

  private processProduction(player: PlayerSnapshot) {
    const morale = this.computeMorale(player);

    const capacity = WORKERS_PER_LEVEL * player.facilityLevel;
    const effectiveWorkers = Math.min(player.workers, capacity);

    const output =
      BASE_RATE *
      effectiveWorkers *
      (1 + SPECIES_BONUS) *
      morale;

    const cur = player.inventory.get(COMMODITY.IRON) ?? 0;
    player.inventory.set(COMMODITY.IRON, +(cur + output).toFixed(2));

    // pay wages
    player.cash = +(player.cash - player.workers * player.wage).toFixed(2);
  }

  private processSteelCrafting(player: PlayerSnapshot) {
    const { input, output, ratio } = STEEL_RECIPE;
    const inv = player.inventory;

    const ironQty = inv.get(input) ?? 0;
    if (ironQty >= ratio) {
      inv.set(input, ironQty - ratio);
      const curSteel = inv.get(output) ?? 0;
      inv.set(output, curSteel + 1);
    }
  }

  private processAutoSell(player: PlayerSnapshot) {
    for (const [rid, qty] of player.inventory) {
      if (qty <= 0) continue;
      const price = this.state.marketPrices.get(rid) ?? BASE_PRICES[rid] ?? 1;
      player.cash = +(player.cash + qty * price).toFixed(2);
      player.inventory.set(rid, 0);
    }
  }

    private clearMarketAndAdjustPrice() {
    for (const resourceId of Object.values(COMMODITY)) {
      // Current reference price (fallback to base table)
      const price =
        this.state.marketPrices.get(resourceId) ??
        BASE_PRICES[resourceId] ??
        1;

      // Elastic demand for this tick
      const demand = DEMAND_K * Math.pow(price, DEMAND_ELASTICITY);

      // Aggregate total supply currently held by all players
      let supply = 0;
      this.state.playerSnapshots.forEach((snap) => {
        supply += snap.inventory.get(resourceId) ?? 0;
      });

      // Decide direction
      let newPrice: number;
      if (supply < demand) {
        // shortage → price up
        newPrice = price * (1 + PRICE_ADJUST_RATE);
      } else {
        // surplus → price down
        newPrice = price * (1 - PRICE_ADJUST_RATE);
      }

      // Clamp & store
      newPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice));
      this.state.marketPrices.set(resourceId, +newPrice.toFixed(2));
    }
  }

}
