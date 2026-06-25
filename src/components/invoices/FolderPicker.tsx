import { useState, useRef } from "react";
import PortalDD from "../ui/PortalDD";
import { FOLDER_COLORS } from "../../lib/constants";
import { Colors } from "../../lib/theme";

interface Folder { id: number; name: string; icon: string; color?: typeof FOLDER_COLORS[number]; }
interface Invoice { id: string; folderId?: number | null; }

interface Props { inv: Invoice; folders: Folder[]; onAssign: (id: number | null) => void; C: Colors; }

export default function FolderPicker({ inv, folders, onAssign, C }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const folder = folders.find(f => f.id === inv.folderId) || null;
  const col = folder?.color || FOLDER_COLORS[0];

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(o => !o)} style={{ background: folder ? col.bg : C.bgElevated, border: `1px solid ${folder ? col.border : C.border}`, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: folder ? col.text : C.textMuted, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
        {folder ? `${folder.icon} ${folder.name}` : "+ Pasta"}
        <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>
      <PortalDD triggerRef={ref as any} open={open} onClose={() => setOpen(false)}>
        {folders.map(f => {
          const fc = f.color || FOLDER_COLORS[0];
          return (
            <button key={f.id} onClick={() => { onAssign(f.id); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "100%", background: inv.folderId === f.id ? fc.bg : "transparent", border: "none", borderBottom: "1px solid #2E2E40", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 15 }}>{f.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: inv.folderId === f.id ? fc.text : "#F0EFFE" }}>{f.name}</span>
              {inv.folderId === f.id && <span style={{ marginLeft: "auto", color: fc.text, fontSize: 12 }}>✓</span>}
            </button>
          );
        })}
        {inv.folderId && (
          <button onClick={() => { onAssign(null); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "100%", background: "transparent", border: "none", cursor: "pointer" }}>
            <span style={{ fontSize: 13, color: C.red }}>✕ Remover pasta</span>
          </button>
        )}
        {folders.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: C.textMuted }}>Sem pastas criadas.</div>}
      </PortalDD>
    </div>
  );
}
