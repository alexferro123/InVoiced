import { useState, useRef } from "react";
import PortalDD from "../ui/PortalDD";
import WfPill from "../ui/WfPill";
import { WF_STATES } from "../../lib/constants";
import { todayStr } from "../../lib/utils";
import { Colors } from "../../lib/theme";

interface Invoice { id: string; wfStatus?: string; status?: string; }
interface Props { inv: Invoice; onUpdate: (fields: Partial<Invoice>) => void; C: Colors; }

export default function StatusPicker({ inv, onUpdate, C }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <WfPill status={inv.wfStatus || "pendente"} C={C} />
        <span style={{ fontSize: 9, color: C.textMuted }}>▼</span>
      </button>
      <PortalDD triggerRef={ref as any} open={open} onClose={() => setOpen(false)}>
        {WF_STATES.map(s => (
          <button key={s} onClick={() => { const isPaga = s === "paga"; onUpdate({ wfStatus: s, status: isPaga ? "paga" : "pendente", ...(isPaga ? { paidAt: todayStr() } : {}) }); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", width: "100%", background: inv.wfStatus === s ? C.purpleSoft : "transparent", border: "none", borderBottom: "1px solid #2E2E40", cursor: "pointer" }}>
            <WfPill status={s} C={C} />
            {inv.wfStatus === s && <span style={{ color: C.purple, fontSize: 12 }}>✓</span>}
          </button>
        ))}
      </PortalDD>
    </div>
  );
}
