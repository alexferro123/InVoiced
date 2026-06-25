export interface Colors {
  purple: string; cyan: string; grad: string;
  bg: string; bgCard: string; bgElevated: string; bgHover: string;
  border: string;
  textPrimary: string; textSecond: string; textMuted: string;
  green: string; greenSoft: string; greenBord: string;
  amber: string; amberSoft: string; amberBord: string;
  red: string;   redSoft: string;   redBord: string;
  purpleSoft: string; purpleBord: string;
  cyanSoft: string;   cyanBord: string;
}

export const getC = (dark: boolean): Colors => ({
  purple: "#9B59F5", cyan: "#22D3EE",
  grad:   "linear-gradient(135deg,#9B59F5,#22D3EE)",
  bg:         dark ? "#16161E" : "#F4F4F8",
  bgCard:     dark ? "#1E1E2A" : "#FFFFFF",
  bgElevated: dark ? "#252533" : "#EFEFEF",
  bgHover:    dark ? "#2D2D3F" : "#E2E2EA",
  border:     dark ? "#2E2E40" : "#D8D8E8",
  textPrimary: dark ? "#F0EFFE" : "#111120",
  textSecond:  dark ? "#9B9BBF" : "#555570",
  textMuted:   dark ? "#6B6B8A" : "#888899",
  green:     "#22C55E",
  greenSoft: dark ? "rgba(34,197,94,.15)" : "rgba(34,197,94,.1)",
  greenBord: dark ? "rgba(34,197,94,.3)"  : "rgba(34,197,94,.4)",
  amber:     "#F59E0B",
  amberSoft: dark ? "rgba(245,158,11,.15)" : "rgba(245,158,11,.1)",
  amberBord: dark ? "rgba(245,158,11,.3)"  : "rgba(245,158,11,.4)",
  red:     "#EF4444",
  redSoft: dark ? "rgba(239,68,68,.15)" : "rgba(239,68,68,.1)",
  redBord: dark ? "rgba(239,68,68,.3)"  : "rgba(239,68,68,.4)",
  purpleSoft: dark ? "rgba(155,89,245,.15)" : "rgba(155,89,245,.1)",
  purpleBord: dark ? "rgba(155,89,245,.3)"  : "rgba(155,89,245,.4)",
  cyanSoft: dark ? "rgba(34,211,238,.15)" : "rgba(34,211,238,.1)",
  cyanBord: dark ? "rgba(34,211,238,.3)"  : "rgba(34,211,238,.4)",
});
