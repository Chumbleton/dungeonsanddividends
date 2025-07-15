// test/helpers/runRoomTicks.ts
import { Server, matchMaker } from "@colyseus/core";
import { createServer } from "http";
import { WorldRoom } from "../../src/rooms/WorldRoom";

/** Utility: sleep n ms */
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Run `tickCount` economy steps synchronously and return price map. */
export async function runTicks(tickCount: number) {
  /* 1 ─ isolated GameServer */
  const gs = new Server({ server: createServer() });
  gs.define("world", WorldRoom);
  await gs.listen(0);

  /* 2 ─ create room listing */
  const listing = await matchMaker.createRoom("world", {});

  /* 3 ─ wait until .room is available */
  let world: WorldRoom | undefined;
  while (!(world = (listing as any).room)) {
    await delay(0); // next tick
  }

  /* 4 ─ stop live ticker to avoid background interval */
  (world as any).ticker?.stop?.();

  /* 5 ─ manual tick loop (dt = 0.2 s) */
  for (let i = 0; i < tickCount; i++) {
    (world as any).runEconomyStep(0.2);
  }

  /* 6 ─ snapshot prices */
  const prices = world.state.marketPrices.toJSON() as Record<string, number>;

  /* 7 ─ clean up */
  await world.disconnect();
  await gs.gracefullyShutdown(true);

  return prices;
}
