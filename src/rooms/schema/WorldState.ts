import { Schema, type, MapSchema } from "@colyseus/schema";

export class PlayerSnapshot extends Schema {
  @type("number") cash = 0;
  @type({ map: "number" }) inventory = new MapSchema<number>(); // resource ID → quantity
}

export class WorldState extends Schema {
  @type("number") globalTick = 0;
  @type({ map: "number" }) marketPrices = new MapSchema<number>(); // resource ID → price
  @type({ map: PlayerSnapshot }) playerSnapshots = new MapSchema<PlayerSnapshot>();
}
