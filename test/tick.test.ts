// test/tick.test.ts
import { startTicker } from '../src/tick';

jest.useFakeTimers();

describe('Ticker', () => {
  it('calls the callback 5 times per second', () => {
    const callback = jest.fn();
    const ticker = startTicker(callback);

    jest.advanceTimersByTime(1000); // simulate 1 second

    expect(callback).toHaveBeenCalledTimes(5);
    ticker.stop();
  });
});