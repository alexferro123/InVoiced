import { ReactNode, useEffect } from "react";
import { Colors } from "../../lib/theme";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  C: Colors;
}

export default function Modal({ open, onClose, title, children, wide, C }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: C.bgCard, borderRadius: 20, padding: 28, maxWidth: wide ? 860 : 560, width: "100%", maxHeight: "92vh", overflowY: "auto", border: `1px solid ${C.border}`, boxShadow: "0 32px 80px rgba(0,0,0,.6)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.bgElevated, border: `1px solid ${C.border}`, width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: "pointer", color: C.textSecond, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
