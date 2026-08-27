import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';

describe('OfflineBanner component', () => {
  it('renders nothing when online by default', () => {
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offline warning when offline event is fired', () => {
    render(<OfflineBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/目前處於離線狀態/)).toBeInTheDocument();
  });

  it('renders online restored message when online event is fired', () => {
    render(<OfflineBanner />);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText(/網路已連線/)).toBeInTheDocument();
  });
});
