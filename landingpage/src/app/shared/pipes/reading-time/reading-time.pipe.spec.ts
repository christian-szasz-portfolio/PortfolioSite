import { ReadingTimePipe } from './reading-time.pipe';

describe('ReadingTimePipe', () => {
  const pipe = new ReadingTimePipe();

  it('rounds to whole minutes', () => {
    expect(pipe.transform(220)).toBe('1 minute read');
    expect(pipe.transform(660)).toBe('3 minute read');
  });

  it('never claims less than a minute, however short the page', () => {
    expect(pipe.transform(12)).toBe('1 minute read');
  });

  it('says nothing numeric where there is nothing to count', () => {
    expect(pipe.transform(0)).toBe('A short read');
    expect(pipe.transform(-5)).toBe('A short read');
    expect(pipe.transform(Number.NaN)).toBe('A short read');
  });

  it('rounds rather than truncates, so 330 words is two minutes', () => {
    expect(pipe.transform(330)).toBe('2 minute read');
  });
});
