export const BASE_RATE          = 1;      // units per tick per worker
export const WORKERS_PER_LEVEL  = 50;     // C₀
export const FAIR_WAGE          = 10;     // arbitrary “fair” wage
export const SPECIES_BONUS      = 0.10;   // +10 % (we’ll wire species later)
export const MORALE_K           = 12;     // steepness for logistic curve
export const DEMAND_K                = 100;  // demand scale factor k_d
export const DEMAND_ELASTICITY       = -1.4; // ε
export const PRICE_ADJUST_RATE       = 0.02; // ±2 % nudge when imbalance
export const MIN_PRICE               = 1;    // hard floor
export const MAX_PRICE               = 9999; // hard cap


export const COMMODITY = {
  IRON: "0",
  STEEL: "1",
} as const;

export const BASE_PRICES: Record<string, number> = {
  [COMMODITY.IRON]: 10,
  [COMMODITY.STEEL]: 40,
};

export const STEEL_RECIPE = {
  input: COMMODITY.IRON,
  output: COMMODITY.STEEL,
  ratio: 3, // 3 iron → 1 steel
};