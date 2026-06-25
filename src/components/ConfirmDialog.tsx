import { Colors } from "../../lib/theme";

interface Props { open: boolean; msg?: string; onConfirm: () => void; onCancel: () => void; C: Colors; }

export default function ConfirmDialog({ open, msg, onConfirm, onCancel, C }: Props) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onCancel}>
      <div style={{ background: C.bgCard, borderRadius: 16, padding: 28, maxWidth: 360, width: "100%", border: `1px solid ${C.redBord}`, boxShadow: "0 24px 60px rgba(0,0,0,.6)" }} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: 22, textAlign: "center", margin: "0 0 12px" }}>🗑️</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, textAlign: "center", margin: "0 0 20px" }}>{msg || "Tens a certeza que queres apagar?"}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}  style={{ flex: 1, background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textPrimary }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, background: C.red, border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff" }}>Apagar</button>
        </div>
      </div>
    </div>
  );
}
