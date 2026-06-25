import { CSSProperties, ReactNode } from "react";
import { Colors } from "../../lib/theme";

interface Props { children: ReactNode; sx?: CSSProperties; C: Colors; }

export default function Card({ children, sx, C }: Props) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px", ...(sx || {}) }}>
      {children}
    </div>
  );
}
