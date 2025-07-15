// test/priceStability.test.ts
import { runTicks } from "./helpers/runRoomTicks";
import { COMMODITY } from "../src/constants/economy";

jest.setTimeout(10000);                    // 10 s wall-clock

describe("Price stabilises under elastic demand", () => {
  it("Iron and Steel converge within ±5 %", async () => {
    const prices = await runTicks(1_000);  // about 3 m of game time

    const iron  = prices[COMMODITY.IRON];
    const steel = prices[COMMODITY.STEEL];

    const ironTarget  = 10;
    const steelTarget = 40;

    const within = (p: number, target: number) =>
      Math.abs(p - target) / target < 0.05;   // 5 %

    expect(within(iron,  ironTarget)).toBe(true);
    expect(within(steel, steelTarget)).toBe(true);
  });
});
