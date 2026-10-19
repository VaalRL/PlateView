import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InstallHint } from '../../src/components/common/InstallHint';
import { isIos } from '../../src/utils/installPrompt';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';

describe('isIos', () => {
  it('knows an iPhone, and an iPad posing as a Mac by its touch screen', () => {
    expect(isIos(IPHONE, 5)).toBe(true);
    expect(isIos(MAC, 5)).toBe(true);
    expect(isIos(MAC, 0)).toBe(false);
  });
});

describe('InstallHint', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows nothing on a browser that cannot install the site', () => {
    const { container } = render(<InstallHint />);
    expect(container).toBeEmptyDOMElement();
  });

  it('explains the share menu on iOS', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE);
    render(<InstallHint />);
    expect(screen.getByText(/點「分享」，再選「加入主畫面」/)).toBeInTheDocument();
  });

  it('offers the browser’s install dialog once it is available, and only once', async () => {
    render(<InstallHint />);
    const prompt = vi.fn(async () => {});
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '加到主畫面' }));
    });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '加到主畫面' })).not.toBeInTheDocument();
  });
});
