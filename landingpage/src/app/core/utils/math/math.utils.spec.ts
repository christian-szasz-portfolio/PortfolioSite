import { MathUtils } from './math.utils';

describe('math utils', () => {
  describe('MathUtils.clamp', () => {
    it('passes a value inside the range through', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
    });

    it('holds at each end', () => {
      expect(MathUtils.clamp(-3, 0, 10)).toBe(0);
      expect(MathUtils.clamp(30, 0, 10)).toBe(10);
    });
  });

  describe('MathUtils.clampAround', () => {
    it('limits in both directions', () => {
      expect(MathUtils.clampAround(12, 8)).toBe(8);
      expect(MathUtils.clampAround(-12, 8)).toBe(-8);
      expect(MathUtils.clampAround(3, 8)).toBe(3);
    });
  });

  describe('MathUtils.mapRange', () => {
    it('maps the midpoint to the midpoint', () => {
      expect(MathUtils.mapRange(5, 0, 10, 0, 100)).toBe(50);
    });

    it('clamps outside the input range rather than extrapolating', () => {
      expect(MathUtils.mapRange(-5, 0, 10, 0, 100)).toBe(0);
      expect(MathUtils.mapRange(15, 0, 10, 0, 100)).toBe(100);
    });

    it('handles an inverted output range, which is what the drift uses', () => {
      expect(MathUtils.mapRange(0, 0, 10, 16, -16)).toBe(16);
      expect(MathUtils.mapRange(10, 0, 10, 16, -16)).toBe(-16);
    });

    it('does not divide by zero on an empty input range', () => {
      expect(MathUtils.mapRange(5, 3, 3, 7, 9)).toBe(7);
    });
  });

  describe('MathUtils.easeOutCubic', () => {
    it('runs from zero to one', () => {
      expect(MathUtils.easeOutCubic(0)).toBe(0);
      expect(MathUtils.easeOutCubic(1)).toBe(1);
    });

    it('is already past halfway at the midpoint, which is the point of it', () => {
      expect(MathUtils.easeOutCubic(0.5)).toBeGreaterThan(0.5);
    });
  });

  describe('MathUtils.lerp', () => {
    it('returns the ends exactly', () => {
      expect(MathUtils.lerp(0, 10, 0)).toBe(0);
      expect(MathUtils.lerp(0, 10, 1)).toBe(10);
    });

    it('interpolates in between', () => {
      expect(MathUtils.lerp(0, 10, 0.25)).toBe(2.5);
    });
  });
});
