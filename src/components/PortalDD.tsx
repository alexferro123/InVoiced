import { useState, useEffect, RefObject } from "react";

interface Props {
  triggerRef: RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  minW?: number;
}

export default function PortalDD({ triggerRef, open, onClose, children, minW = 180 }: Props) {
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: minW, translateY: "0" });

  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom > 220;
      setPos({
        top: below ? r.bottom + 4 : r.top - 4,
        left: r.left,
        minWidth: Math.max(r.width, minW),
        translateY: below ? "0" : "-100%",
      });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} onClick={onClose}>
      <div
        style={{
          position: "absolute",
          top: pos.top, left: pos.left,
          minWidth: pos.minWidth,
          transform: `translateY(${pos.translateY})`,
          background: "#1E1E2A",
          border: "1px solid #2E2E40",
          borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,.6)",
          overflow: "hidden",
          maxHeight: 300,
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
