import { CSSProperties, ReactNode } from "react";
import { Colors } from "../../lib/theme";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  v?: "primary" | "danger" | "ghost";
  disabled?: boolean;
  sx?: CSSProperties;
  C: Colors;
}

export default function Btn({ children, onClick, v, disabled, sx, C }: Props) {
  const base: CSSProperties = {
    borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    opacity: disabled ? 0.4 : 1, display: "inline-flex", alignItems: "center",
    gap: 6, ...(sx || {}),
  };

  if (v === "primary")
    return <button onClick={onClick} disabled={disabled} style={{ ...base, background: C.grad, color: "#fff", border: "none", boxShadow: "0 2px 16px rgba(155,89,245,.35)" }}>{children}</button>;

  if (v === "danger")
    return <button onClick={onClick} disabled={disabled} style={{ ...base, background: C.redSoft, color: C.red, border: `1px solid ${C.redBord}` }}>{children}</button>;

  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: C.bgElevated, color: C.textPrimary, border: `1px solid ${C.border}` }}>{children}</button>;
}
