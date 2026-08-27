import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CountDisplay } from '../../src/components/scoreboard/CountDisplay';

describe('CountDisplay component', () => {
  it('renders standard count 3-2 with 2 outs', () => {
    const { container, getByText } = render(
      <CountDisplay balls={3} strikes={2} outs={2} />
    );

    expect(getByText('3-2')).toBeInTheDocument();
    
    // Check out dots: 2 active out dots
    const activeOutDots = container.querySelectorAll('[data-out-active="true"]');
    expect(activeOutDots.length).toBe(2);
  });

  it('handles default or zero values', () => {
    const { container, getByText } = render(
      <CountDisplay balls={0} strikes={0} outs={0} />
    );

    expect(getByText('0-0')).toBeInTheDocument();
    const activeOutDots = container.querySelectorAll('[data-out-active="true"]');
    expect(activeOutDots.length).toBe(0);
  });
});
