import React, { Suspense, cloneElement, isValidElement, lazy, useCallback, useEffect, useId, useRef, useState } from 'react';

const HoverCardPopup = lazy(() => import('./HoverCardPopup'));

/** A short rest before opening, so sweeping the mouse across a list loads nothing */
const OPEN_DELAY_MS = 350;
const CLOSE_DELAY_MS = 80;

type Handler<E> = ((event: E) => void) | undefined;

/** Run the trigger's own handler first, then the card's */
const chain =
  <E,>(own: Handler<E>, mine: (event: E) => void) =>
  (event: E) => {
    own?.(event);
    mine(event);
  };

/** Focus from the keyboard, not from a click or tap that is about to navigate */
function isKeyboardFocus(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

interface HoverCardProps {
  /** One element that takes a ref, usually a router Link */
  children: React.ReactElement;
  /**
   * Rendered only while open, so its queries run on first hover, not on page
   * load; it may be lazy, as the card waits in a Suspense boundary
   */
  renderContent: () => React.ReactNode;
}

/**
 * A card of background facts that opens when a mouse rests on the trigger
 * or the keyboard focuses it, and closes on leave, blur, click or Escape.
 * Touch screens never open it: a tap goes through to the link as before.
 * The card is portalled to the body so the horizontally scrolling tables it
 * sits in cannot clip it. Only the event handling lives here; the card and
 * its positioning load on first use, inside the open delay.
 */
export const HoverCard: React.FC<HoverCardProps> = ({ children, renderContent }) => {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState<Element | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const cardId = useId();

  const setLater = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };
  const setNow = (next: boolean) => {
    window.clearTimeout(timer.current);
    setOpen(next);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Stable, or React would detach and reattach the ref on every render
  const childRef = isValidElement(children) ? (children as { ref?: React.Ref<Element> }).ref : undefined;
  const ref = useCallback(
    (node: Element | null) => {
      setReference(node);
      if (typeof childRef === 'function') childRef(node);
      else if (childRef) (childRef as React.MutableRefObject<Element | null>).current = node;
    },
    [childRef]
  );

  if (!isValidElement(children)) return children;
  const own = children.props as {
    onPointerEnter?: Handler<React.PointerEvent>;
    onPointerLeave?: Handler<React.PointerEvent>;
    onFocus?: Handler<React.FocusEvent>;
    onBlur?: Handler<React.FocusEvent>;
    onClick?: Handler<React.MouseEvent>;
  };

  return (
    <>
      {cloneElement(children, {
        ref,
        // The card replaces the native tooltip; showing both would stack them
        title: undefined,
        'aria-describedby': open ? cardId : undefined,
        onPointerEnter: chain(own.onPointerEnter, (e: React.PointerEvent) => {
          if (e.pointerType === 'mouse') setLater(true, OPEN_DELAY_MS);
        }),
        onPointerLeave: chain(own.onPointerLeave, (e: React.PointerEvent) => {
          if (e.pointerType === 'mouse') setLater(false, CLOSE_DELAY_MS);
        }),
        onFocus: chain(own.onFocus, (e: React.FocusEvent) => {
          if (isKeyboardFocus(e.currentTarget)) setNow(true);
        }),
        onBlur: chain(own.onBlur, () => setNow(false)),
        onClick: chain(own.onClick, () => setNow(false)),
      } as Record<string, unknown>)}
      {open && reference && (
        <Suspense fallback={null}>
          <HoverCardPopup reference={reference} id={cardId}>
            {renderContent()}
          </HoverCardPopup>
        </Suspense>
      )}
    </>
  );
};
