import { parseD } from "../../lib/utils";
import { Colors } from "../../lib/theme";

interface Props { dueDate?: string; status?: string; C: Colors; }

export default function DueBadge({ dueDate, status, C }: Props) {
  if (status === "paga" || status === "recebida" || !dueDate) return null;
  const d = parseD(dueDate);
  if (!d) return null;

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff > 7) return null;

  const isOd = diff < 0;
  const bg   = isOd ? C.redSoft  : diff <= 2 ? C.amberSoft  : C.cyanSoft;
  const col  = isOd ? C.red      : diff <= 2 ? C.amber      : C.cyan;
  const bord = isOd ? C.redBord  : diff <= 2 ? C.amberBord  : C.cyanBord;
  const label = isOd ? `Venceu há ${-diff}d` : diff === 0 ? "Vence hoje" : diff === 1 ? "Vence amanhã" : `Vence em ${diff}d`;

  return (
    <span style={{ background: bg, color: col, border: `1px solid ${bord}`, borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}
