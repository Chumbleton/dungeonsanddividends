// tests/worldroom.test.ts
import { Server } from "colyseus";
import { createServer } from "http";
import { Client } from "colyseus.js";
import { WorldRoom } from "../src/rooms/WorldRoom";
import { WorldState } from "../src/rooms/schema/WorldState";

jest.setTimeout(10_000);

function createGameServer() {
  const gs = new Server({ server: createServer() });
  gs.define("world", WorldRoom);
  return gs.listen(0).then(() => gs);
}

function portOf(gs: Server) {
  // @ts-ignore  – private field
  return gs.transport.server.address().port;
}

describe("WorldRoom integration", () => {
  test("tick loop & snapshots", async () => {
    const gs  = await createGameServer();
    const url = `ws://localhost:${portOf(gs)}`;

    /* ---- first client ---- */
    const cli1  = new Client(url);
    const room1 = await cli1.joinOrCreate("world");
    const st1   = room1.state as unknown as WorldState;

    await new Promise(r => setTimeout(r, 1000));          // ≈5 ticks

    expect(st1.globalTick).toBeGreaterThanOrEqual(4);
    expect(st1.playerSnapshots.has(room1.sessionId)).toBe(true);  // ← FIX

    /* ---- second client ---- */
    const cli2  = new Client(url);
    const room2 = await cli2.joinOrCreate("world");
    const st2   = room2.state as unknown as WorldState;

    await new Promise(r => setTimeout(r, 250));

    expect(st1.playerSnapshots.size).toBeGreaterThanOrEqual(2);   // ← FIX
    expect(st2.playerSnapshots.has(room2.sessionId)).toBe(true);  // ← FIX

    /* ---- second client leaves ---- */
    await room2.leave();
    await new Promise(r => setTimeout(r, 250));

    expect(st1.playerSnapshots.size).toBe(1);                     // ← FIX

    /* ---- cleanup ---- */
    await room1.leave();
    await gs.gracefullyShutdown(false);
  });
});
