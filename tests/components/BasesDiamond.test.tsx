import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BasesDiamond } from '../../src/components/scoreboard/BasesDiamond';

describe('BasesDiamond component', () => {
  it('renders all bases empty when no runners on base', () => {
    const { container } = render(<BasesDiamond hasFirst={false} hasSecond={false} hasThird={false} />);
    const activeBases = container.querySelectorAll('[data-active="true"]');
    expect(activeBases.length).toBe(0);
  });

  it('renders 1st and 3rd base active correctly', () => {
    const { container } = render(<BasesDiamond hasFirst={true} hasSecond={false} hasThird={true} />);
    const firstBase = container.querySelector('[data-base="1st"]');
    const secondBase = container.querySelector('[data-base="2nd"]');
    const thirdBase = container.querySelector('[data-base="3rd"]');

    expect(firstBase?.getAttribute('data-active')).toBe('true');
    expect(secondBase?.getAttribute('data-active')).toBe('false');
    expect(thirdBase?.getAttribute('data-active')).toBe('true');
  });

  it('renders bases loaded (all 3 bases active)', () => {
    const { container } = render(<BasesDiamond hasFirst={true} hasSecond={true} hasThird={true} />);
    const activeBases = container.querySelectorAll('[data-active="true"]');
    expect(activeBases.length).toBe(3);
  });
});
