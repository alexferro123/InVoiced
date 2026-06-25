import { Colors } from "../../lib/theme";

export interface ToastItem { id: number; msg: string; type: string; }

export default function Toast({ toasts, C }: { toasts: ToastItem[]; C: Colors }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9998, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }}>
      {toasts.map(t => {
        const bord = t.type === "error" ? C.redBord : t.type === "warning" ? C.amberBord : t.type === "success" ? C.greenBord : C.purpleBord;
        const col  = t.type === "error" ? C.red     : t.type === "warning" ? C.amber     : t.type === "success" ? C.green     : C.purple;
        return (
          <div key={t.id} style={{ background: C.bgElevated, border: `1px solid ${bord}`, color: col, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 500, display: "flex", gap: 8, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
            <span>{t.type === "error" ? "❌" : t.type === "warning" ? "⚠️" : t.type === "success" ? "✅" : "ℹ️"}</span>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
