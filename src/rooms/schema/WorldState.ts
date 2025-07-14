import { Schema, type, MapSchema  } from "@colyseus/schema";
import { FAIR_WAGE } from "../../constants/economy";


export class PlayerSnapshot extends Schema {
  @type("number") cash: number = 0;

  @type("number") facilityLevel: number = 1;         // NEW
  @type("number") workers: number = 1;               // NEW
  @type("number") wage: number = FAIR_WAGE;          // NEW

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