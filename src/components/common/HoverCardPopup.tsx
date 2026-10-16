import React from 'react';
import { createPortal } from 'react-dom';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';

interface HoverCardPopupProps {
  reference: Element;
  id: string;
  children: React.ReactNode;
}

/**
 * The positioned card itself. Loaded on first hover (see HoverCard), so the
 * positioning library stays out of the main bundle.
 */
const HoverCardPopup: React.FC<HoverCardPopupProps> = ({ reference, id, children }) => {
  const { refs, floatingStyles } = useFloating({
    elements: { reference },
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  return createPortal(
    <div
      ref={refs.setFloating}
      id={id}
      role="tooltip"
      style={floatingStyles}
      className="z-50 w-64 max-w-[calc(100vw-16px)] rounded-xl border border-border bg-card p-3 text-xs text-main shadow-lg"
    >
      {children}
    </div>,
    document.body
  );
};

export default HoverCardPopup;
