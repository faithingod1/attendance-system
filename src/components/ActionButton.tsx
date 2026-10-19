'use client';

import { useEffect, useId, useState, type ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { guide: string };

export default function ActionButton({ guide, children, ...props }: Props) {
  const id = useId();
  const [position, setPosition] = useState<{ left: number; top: number; below: boolean } | null>(null);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [position]);

  const show = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const width = Math.min(240, window.innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12)),
      top: rect.top < 110 ? rect.bottom + 8 : rect.top - 8,
      below: rect.top < 110,
    });
  };

  return (
    <>
      <button
        {...props}
        type="button"
        aria-label={guide}
        aria-describedby={position ? id : undefined}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setPosition(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setPosition(null)}
        onClick={(event) => { setPosition(null); props.onClick?.(event); }}
      >
        {children}
      </button>
      {position && createPortal(
        <div
          id={id}
          role="tooltip"
          className="fixed z-[60] pointer-events-none rounded-lg bg-ink px-3 py-2 text-xs leading-5 text-white shadow-lg"
          style={{ left: position.left, top: position.top, width: 'min(240px, calc(100vw - 24px))', transform: position.below ? undefined : 'translateY(-100%)' }}
        >
          {guide}
        </div>,
        document.body
      )}
    </>
  );
}
