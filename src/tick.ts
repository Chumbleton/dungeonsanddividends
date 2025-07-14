// src/tick.ts
export type TickCallback = (dt: number) => void;

export class Ticker {
  private intervalId?: NodeJS.Timeout;
  private readonly dt = 0.2; // seconds (200ms)
  private readonly intervalMs = this.dt * 1000;
  private running = false;

  constructor(private callback: TickCallback) {}

  start() {
    if (this.running) return;
    this.running = true;

    this.intervalId = setInterval(() => {
      this.callback(this.dt);
    }, this.intervalMs);
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export function startTicker(callback: TickCallback): Ticker {
  const ticker = new Ticker(callback);
  ticker.start();
  return ticker;
}