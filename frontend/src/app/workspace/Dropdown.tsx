"use client";

import React, { useEffect, useRef, useState } from "react";

interface DropdownProps {
  /** Render the trigger button (receives the current open state). */
  button: (open: boolean) => React.ReactNode;
  /** Panel content; receives a close() callback so actions can dismiss it. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  buttonClassName?: string;
  panelClassName?: string;
  label: string;
}

/** Lightweight accessible popover: outside-click + Escape to close, no portal. */
export default function Dropdown({
  button,
  children,
  align = "right",
  buttonClassName = "",
  panelClassName = "",
  label
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(o => !o)}
        className={buttonClassName}
      >
        {button(open)}
      </button>
      {open && (
        <div
          role="menu"
          className={`animate-dropdownIn absolute top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[0_18px_44px_rgba(0,0,0,0.18)] ${align === "right" ? "right-0" : "left-0"} ${panelClassName}`}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
