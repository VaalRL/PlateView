import { describe, it, expect } from 'vitest';
import {
  buildFencePoints,
  fenceRadiusAt,
  polarToSvg,
  buildFencePath,
  fenceDistanceLabel,
} from '../../src/utils/ballpark';

/** PNC Park's published dimensions: its left-centre gap is deeper than centre */
const pnc = {
  leftLine: 325,
  left: 389,
  leftCenter: 410,
  center: 399,
  rightCenter: 375,
  rightLine: 320,
};

describe('buildFencePoints', () => {
  it('normalises the deepest point of the park to the chart radius', () => {
    const points = buildFencePoints(pnc, 250)!;
    const deepest = points.find((p) => p.feet === 410)!;

    expect(deepest.radius).toBeCloseTo(250, 5);
    expect(deepest.angle).toBe(-15);
  });

  it('keeps the asymmetry that makes a park recognisable', () => {
    const points = buildFencePoints(pnc, 250)!;
    const leftCenter = points.find((p) => p.angle === -15)!;
    const center = points.find((p) => p.angle === 0)!;
    const rightLine = points.find((p) => p.angle === 45)!;

    // Left-centre really is deeper than dead centre at PNC
    expect(leftCenter.radius).toBeGreaterThan(center.radius);
    // And the right field line is the shortest wall
    expect(rightLine.radius).toBeLessThan(center.radius);
  });

  it('orders points from the left field line to the right field line', () => {
    const points = buildFencePoints(pnc, 250)!;
    expect(points.map((p) => p.angle)).toEqual([-45, -30, -15, 0, 15, 45]);
  });

  it('works from the five-point form, without the power alleys', () => {
    const points = buildFencePoints(
      { leftLine: 310, leftCenter: 379, center: 420, rightCenter: 380, rightLine: 302 },
      250
    )!;

    expect(points).toHaveLength(5);
    // A short porch against a deep centre is exactly the shape worth drawing
    expect(points[0].radius).toBeLessThan(points[2].radius * 0.8);
  });

  it('returns null when the venue has no usable dimensions', () => {
    expect(buildFencePoints(undefined, 250)).toBeNull();
    expect(buildFencePoints(null, 250)).toBeNull();
    expect(buildFencePoints({}, 250)).toBeNull();
    expect(buildFencePoints({ capacity: 38000, turfType: 'Grass' }, 250)).toBeNull();
  });

  it('rejects a park described by only one foul line', () => {
    // Without both lines there is no span to draw across
    expect(buildFencePoints({ leftLine: 325, leftCenter: 410, center: 399 }, 250)).toBeNull();
  });

  it('discards values outside any plausible fence distance', () => {
    expect(
      buildFencePoints({ leftLine: 0, center: 400, rightLine: 99999 }, 250)
    ).toBeNull();
  });
});

describe('fenceRadiusAt', () => {
  const points = buildFencePoints(pnc, 250)!;

  it('returns the measured radius at a measured angle', () => {
    expect(fenceRadiusAt(points, 0)).toBeCloseTo((399 / 410) * 250, 5);
  });

  it('interpolates between two measured angles', () => {
    const atMinus8 = fenceRadiusAt(points, -7.5);
    const leftCenter = fenceRadiusAt(points, -15);
    const center = fenceRadiusAt(points, 0);

    expect(atMinus8).toBeGreaterThan(Math.min(leftCenter, center));
    expect(atMinus8).toBeLessThan(Math.max(leftCenter, center));
    expect(atMinus8).toBeCloseTo((leftCenter + center) / 2, 5);
  });

  it('clamps beyond the foul lines rather than extrapolating', () => {
    expect(fenceRadiusAt(points, -90)).toBe(fenceRadiusAt(points, -45));
    expect(fenceRadiusAt(points, 90)).toBe(fenceRadiusAt(points, 45));
  });

  it('is safe on an empty set', () => {
    expect(fenceRadiusAt([], 0)).toBe(0);
  });
});

describe('polarToSvg', () => {
  const home = { x: 200, y: 318 };

  it('puts straight-away centre directly above home plate', () => {
    expect(polarToSvg(home, 0, 250)).toEqual({ x: 200, y: 68 });
  });

  it('puts left field to the left and right field to the right', () => {
    expect(polarToSvg(home, -45, 100).x).toBeLessThan(home.x);
    expect(polarToSvg(home, 45, 100).x).toBeGreaterThan(home.x);
  });

  it('places the foul lines at equal depth on both sides', () => {
    const left = polarToSvg(home, -45, 200);
    const right = polarToSvg(home, 45, 200);
    expect(left.y).toBeCloseTo(right.y, 5);
  });
});

describe('buildFencePath', () => {
  it('draws a path spanning both foul lines', () => {
    const points = buildFencePoints(pnc, 250)!;
    const d = buildFencePath({ x: 200, y: 318 }, points);

    expect(d.startsWith('M ')).toBe(true);
    expect(d).toContain('Q ');
    // One curve per gap between measurements, plus the closing segment
    expect(d.match(/Q /g)).toHaveLength(points.length - 1);
  });

  it('returns an empty path when there is nothing to draw', () => {
    expect(buildFencePath({ x: 200, y: 318 }, [])).toBe('');
  });
});

describe('fenceDistanceLabel', () => {
  it('quotes the distances the way a ballpark wall does', () => {
    expect(fenceDistanceLabel(buildFencePoints(pnc, 250)!)).toBe('325 · 389 · 410 · 399 · 375 · 320');
  });
});
