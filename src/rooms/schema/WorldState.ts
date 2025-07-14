import { Schema, type, MapSchema  } from "@colyseus/schema";


export class PlayerSnapshot extends Schema {
  @type("number") cash: number = 0;

  // commodityId (string) → quantity (number)
  @type({ map: "number" })
  inventory: MapSchema<number> = new MapSchema<number>();
}

/* ---------- room-wide state ---------- */
export class WorldState extends Schema {
  @type("number") globalTick: number = 0;

  @type({ map: "number" })
  marketPrices: MapSchema<number> = new MapSchema<number>();

  // sessionId (string) → PlayerSnapshot
  @type({ map: PlayerSnapshot })
  playerSnapshots: MapSchema<PlayerSnapshot> = new MapSchema<PlayerSnapshot>();
}