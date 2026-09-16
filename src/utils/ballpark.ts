/**
 * Turns MLB's published home run fence distances into the outfield shape drawn
 * by the alignment chart.
 *
 * `fieldInfo` gives the distance in feet at up to seven named angles, never a
 * real outline, so everything here is a deliberate model of a ballpark rather
 * than its geometry. See docs/adr/0003-venue-specific-ballpark-shape.md.
 */

import { VenueFieldInfo } from '../types/mlb';

/**
 * Degrees from straight-away centre, with the foul lines at +/-45. Real parks
 * do not put their gaps at exactly these angles; even 15-degree spacing is
 * chosen for predictability.
 */
export const FENCE_ANGLES: Array<{ key: keyof VenueFieldInfo; angle: number }> = [
  { key: 'leftLine', angle: -45 },
  { key: 'left', angle: -30 },
  { key: 'leftCenter', angle: -15 },
  { key: 'center', angle: 0 },
  { key: 'rightCenter', angle: 15 },
  { key: 'right', angle: 30 },
  { key: 'rightLine', angle: 45 },
];

export interface FencePoint {
  angle: number;
  /** Radius in SVG units, normalised so the deepest point of the park is `maxRadius` */
  radius: number;
  /** The published distance in feet, for labelling */
  feet: number;
}

/** A plausible MLB fence distance; anything outside this is treated as bad data */
const MIN_FEET = 250;
const MAX_FEET = 550;

/**
 * Normalised fence points, deepest first mapped to `maxRadius`, or null when the
 * venue has no usable dimensions. Callers fall back to a generic arc on null.
 */
export function buildFencePoints(
  fieldInfo: VenueFieldInfo | undefined | null,
  maxRadius: number
): FencePoint[] | null {
  if (!fieldInfo) return null;

  const measured = FENCE_ANGLES.map(({ key, angle }) => ({
    angle,
    feet: Number(fieldInfo[key]),
  })).filter(({ feet }) => Number.isFinite(feet) && feet >= MIN_FEET && feet <= MAX_FEET);

  // Both foul lines plus centre are the minimum that describes a shape
  const hasLines = measured.some((p) => p.angle === -45) && measured.some((p) => p.angle === 45);
  if (!hasLines || measured.length < 3) return null;

  const deepest = Math.max(...measured.map((p) => p.feet));

  return measured.map(({ angle, feet }) => ({
    angle,
    feet,
    radius: (feet / deepest) * maxRadius,
  }));
}

/** Linear interpolation of the fence radius at any angle between the measured points */
export function fenceRadiusAt(points: FencePoint[], angle: number): number {
  if (points.length === 0) return 0;

  const first = points[0];
  const last = points[points.length - 1];
  if (angle <= first.angle) return first.radius;
  if (angle >= last.angle) return last.radius;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (angle >= a.angle && angle <= b.angle) {
      const t = (angle - a.angle) / (b.angle - a.angle);
      return a.radius + (b.radius - a.radius) * t;
    }
  }

  return last.radius;
}

/** Polar (0 degrees is straight-away centre, negative is left field) to SVG coordinates */
export function polarToSvg(
  home: { x: number; y: number },
  angle: number,
  radius: number
): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: home.x + radius * Math.sin(radians),
    y: home.y - radius * Math.cos(radians),
  };
}

/**
 * Smooth fence curve through the measured points, as a quadratic spline whose
 * control points are the measurements themselves. A real fence is straight
 * segments and corners; this rounds them, which the ADR accepts.
 */
export function buildFencePath(home: { x: number; y: number }, points: FencePoint[]): string {
  if (points.length < 2) return '';

  const coords = points.map((p) => polarToSvg(home, p.angle, p.radius));
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  for (let i = 1; i < coords.length; i += 1) {
    const previous = coords[i - 1];
    const current = coords[i];
    const midpoint = { x: (previous.x + current.x) / 2, y: (previous.y + current.y) / 2 };
    d += ` Q ${previous.x.toFixed(1)} ${previous.y.toFixed(1)} ${midpoint.x.toFixed(
      1
    )} ${midpoint.y.toFixed(1)}`;
  }

  const end = coords[coords.length - 1];
  d += ` L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  return d;
}

/** The distances as they are quoted on a ballpark wall, left line to right line */
export function fenceDistanceLabel(points: FencePoint[]): string {
  return points.map((p) => p.feet).join(' · ');
}
