import { type ReactNode } from 'react';

interface CollapseProps {
  /** Controls whether the content is visible */
  open: boolean;
  children: ReactNode;
  /** Optional class applied to the inner content wrapper */
  className?: string;
  /** Transition duration in ms (default 250) */
  duration?: number;
}

/**
 * Smoothly animates content open/closed using the CSS grid 0fr→1fr trick.
 * Supports height:auto — no JS measurement needed.
 *
 * Usage:
 *   <Collapse open={isOpen}>
 *     <div className="pt-4">…content…</div>
 *   </Collapse>
 */
export function Collapse({ open, children, className, duration = 450 }: CollapseProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: `grid-template-rows ${duration}ms ease`,
      }}
    >
      <div style={{ overflow: 'hidden' }} className={className}>
        {children}
      </div>
    </div>
  );
}
