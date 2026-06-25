#!/usr/bin/env python3
"""
1_decompose.py
Decompõe invoiced.tsx num projeto Vite + React organizado.

Uso:
    python 1_decompose.py invoiced.tsx ./invoiced-app
"""

import sys
import os

# ── helpers ───────────────────────────────────────────────────────────────────

def write(path: str, content: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓  {path}")


def read(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


# ── file contents ─────────────────────────────────────────────────────────────

FILES: dict[str, str] = {}

# ── src/lib/storage.ts ────────────────────────────────────────────────────────
FILES["src/lib/storage.ts"] = '''\
export const SK = {
  invoices:       "iv_inv_v3",
  folders:        "iv_folders_v3",
  trends:         "iv_trends_v3",
  clientInvoices: "iv_clinv_v3",
  clients:        "iv_clients_v3",
  bankRows:       "iv_bank_v3",
  company:        "iv_company_v3",
  theme:          "iv_theme_v3",
  onboarding:     "iv_onboard_v3",
} as const;

export const safeGet = async <T = unknown>(k: string): Promise<T | null> => {
  try {
    // @ts-expect-error window.storage is injected by the Claude artifact runtime
    const r = await window.storage.get(k);
    return r ? (JSON.parse(r.value) as T) : null;
  } catch {
    return null;
  }
};

export const safeSet = async (k: string, v: unknown): Promise<void> => {
  try {
    // @ts-expect-error window.storage is injected by the Claude artifact runtime
    await window.storage.set(k, JSON.stringify(v));
  } catch (e) {
    console.warn(e);
  }
};
'''

# ── src/lib/files.ts ──────────────────────────────────────────────────────────
FILES["src/lib/files.ts"] = '''\
interface FileEntry {
  base64:   string;
  mimeType: string;
  fileName: string;
}

export const fileStore: Record<string, FileEntry> = {};

export const storeFile = (
  id: string,
  b64: string,
  mime: string,
  name: string,
): void => {
  fileStore[id] = { base64: b64, mimeType: mime, fileName: name };
};

// Removes binary data before persisting invoices to storage
export const stripFiles = (arr: any[]): any[] =>
  arr.map(({ base64: _b, mimeType: _m, ...rest }) => ({
    ...rest,
    hasFile: !!_b,
    receipt: rest.receipt
      ? { ...rest.receipt, base64: undefined, hasFile: !!rest.receipt?.base64 }
      : rest.receipt,
  }));
'''

# ── src/lib/utils.ts ──────────────────────────────────────────────────────────
FILES["src/lib/utils.ts"] = '''\
export const fmt = (n: number | undefined): string =>
  Number(n || 0).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

export const fmtK = (n: number | undefined): string => {
  const v = Number(n || 0);
  return v >= 1000 ? (v / 1000).toFixed(1) + "k €" : v.toFixed(0) + " €";
};

export const parseD = (s: string | undefined | null): Date | null => {
  if (!s) return null;
  const p = s.split("/");
  if (p.length < 3) return null;
  const d = new Date(+p[2], +p[1] - 1, +p[0]);
  return isNaN(d.getTime()) ? null : d;
};

export const todayStr = (): string => new Date().toLocaleDateString("pt-PT");

export const nifClean = (n: string | undefined): string =>
  (n || "").replace(/\\D/g, "");

export const isoToDisplay = (s: string | undefined): string => {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
};
'''

# ── src/lib/constants.ts ──────────────────────────────────────────────────────
FILES["src/lib/constants.ts"] = '''\
export const WF_STATES = ["pendente", "aguarda_aprovacao", "aprovada", "paga"] as const;
export type WfState = (typeof WF_STATES)[number];

export const WF_LABELS: Record<string, string> = {
  pendente:           "Pendente",
  aguarda_aprovacao:  "Ag. Aprovação",
  aprovada:           "Aprovada",
  paga:               "Paga",
};

export const FOLDER_ICONS = [
  "📁","🏢","🏗️","⚡","💧","🌐","🚗","🛒","💼","🏥","📦","🔧","🎯","💡","🏠",
];

export const FOLDER_COLORS = [
  { name: "Roxo",  bg: "rgba(155,89,245,.15)", text: "#C084FC", border: "rgba(155,89,245,.4)" },
  { name: "Ciano", bg: "rgba(34,211,238,.15)", text: "#22D3EE", border: "rgba(34,211,238,.4)" },
  { name: "Verde", bg: "rgba(34,197,94,.15)",  text: "#4ADE80", border: "rgba(34,197,94,.4)"  },
  { name: "Âmbar", bg: "rgba(245,158,11,.15)", text: "#FCD34D", border: "rgba(245,158,11,.4)" },
  { name: "Rosa",  bg: "rgba(236,72,153,.15)", text: "#F472B6", border: "rgba(236,72,153,.4)" },
  { name: "Azul",  bg: "rgba(59,130,246,.15)", text: "#60A5FA", border: "rgba(59,130,246,.4)" },
] as const;

export const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export const DAY_NAMES = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

export const ONBOARDING_STEPS = [
  { icon: "⚙️", title: "Define a tua empresa",    desc: "Vai a Definições (⚙️) e preenche o NIF, nome e email para alertas." },
  { icon: "📁", title: "Cria pastas",              desc: "No separador Pastas, cria categorias como 'EDP', 'Contabilidade'. A IA associa faturas automaticamente." },
  { icon: "↑",  title: "Carrega faturas",          desc: "Clica em 'Carregar' para PDF/imagem, ou usa '✏️ Manual' para preencher à mão." },
  { icon: "🏦", title: "Reconcilia com o banco",   desc: "No separador Reconciliação, importa o extrato do banco (Excel, PDF ou CSV)." },
  { icon: "✦",  title: "Usa o Assistente",         desc: "O Assistente responde às tuas perguntas sobre cash flow, faturas em atraso e muito mais." },
];
'''

# ── src/lib/theme.ts ──────────────────────────────────────────────────────────
FILES["src/lib/theme.ts"] = '''\
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
'''

# ── src/lib/folderMatcher.ts ──────────────────────────────────────────────────
FILES["src/lib/folderMatcher.ts"] = '''\
interface Folder { id: number; name: string; }
interface InvoiceHint { supplier?: string; description?: string; category?: string; }

export const matchFolder = (
  folders: Folder[],
  { supplier = "", description = "", category = "" }: InvoiceHint,
): Folder | null => {
  const hay = [supplier, description, category].join(" ").toLowerCase();
  let best: Folder | null = null;
  let bestScore = 0;

  for (const f of folders) {
    const words = f.name.toLowerCase().split(/[\\s\\-_/]+/).filter(w => w.length > 2);
    let score = 0;
    for (const w of words) { if (hay.includes(w)) score += w.length * 2; }
    if (score > bestScore) { bestScore = score; best = f; }
  }

  return bestScore >= 4 ? best : null;
};
'''

# ── src/components/ui/PortalDD.tsx ────────────────────────────────────────────
FILES["src/components/ui/PortalDD.tsx"] = '''\
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
'''

# ── src/components/ui/Btn.tsx ─────────────────────────────────────────────────
FILES["src/components/ui/Btn.tsx"] = '''\
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
'''

# ── src/components/ui/Card.tsx ────────────────────────────────────────────────
FILES["src/components/ui/Card.tsx"] = '''\
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
'''

# ── src/components/ui/Modal.tsx ───────────────────────────────────────────────
FILES["src/components/ui/Modal.tsx"] = '''\
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
'''

# ── src/components/ui/Toast.tsx ───────────────────────────────────────────────
FILES["src/components/ui/Toast.tsx"] = '''\
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
'''

# ── src/components/ui/Toggle.tsx ──────────────────────────────────────────────
FILES["src/components/ui/Toggle.tsx"] = '''\
import { Colors } from "../../lib/theme";

interface Props { on: boolean; onToggle: () => void; labelOn?: string; labelOff?: string; C: Colors; }

export default function Toggle({ on, onToggle, labelOn, labelOff, C }: Props) {
  return (
    <button onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.grad : C.bgElevated, position: "relative", transition: "background .25s", flexShrink: 0, border: `1px solid ${on ? C.purpleBord : C.border}` }}>
        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.4)", transition: "left .25s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: on ? C.purple : C.textMuted, minWidth: 60 }}>{on ? (labelOn || "Pago") : (labelOff || "Pendente")}</span>
    </button>
  );
}
'''

# ── src/components/ui/ConfirmDialog.tsx ───────────────────────────────────────
FILES["src/components/ui/ConfirmDialog.tsx"] = '''\
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
'''

# ── src/components/ui/WfPill.tsx ──────────────────────────────────────────────
FILES["src/components/ui/WfPill.tsx"] = '''\
import { WF_LABELS } from "../../lib/constants";
import { Colors } from "../../lib/theme";

export default function WfPill({ status, C }: { status: string; C: Colors }) {
  const s = status || "pendente";
  const map: Record<string, [string, string, string]> = {
    pendente:          [C.amberSoft,  C.amber,  C.amberBord],
    aguarda_aprovacao: [C.cyanSoft,   C.cyan,   C.cyanBord],
    aprovada:          [C.purpleSoft, C.purple, C.purpleBord],
    paga:              [C.greenSoft,  C.green,  C.greenBord],
  };
  const [bg, text, border] = map[s] || map.pendente;
  return (
    <span style={{ background: bg, color: text, border: `1px solid ${border}`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {WF_LABELS[s] || s}
    </span>
  );
}
'''

# ── src/components/ui/DueBadge.tsx ───────────────────────────────────────────
FILES["src/components/ui/DueBadge.tsx"] = '''\
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
'''

# ── src/components/invoices/FolderPicker.tsx ─────────────────────────────────
FILES["src/components/invoices/FolderPicker.tsx"] = '''\
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
'''

# ── src/components/invoices/StatusPicker.tsx ─────────────────────────────────
FILES["src/components/invoices/StatusPicker.tsx"] = '''\
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
'''

# ── src/App.tsx ───────────────────────────────────────────────────────────────
FILES["src/App.tsx"] = '''\
// Entry point — imports the original monolithic component.
// Gradually refactor by replacing sections with dedicated components.
import InVoiced from "./InVoiced";

export default function App() {
  return <InVoiced />;
}
'''

# ── src/InVoiced.tsx ──────────────────────────────────────────────────────────
# This is just a note file pointing to the original — we copy the source as-is.
FILES["src/InVoiced.tsx"] = "// TODO: paste the contents of the original invoiced.tsx here and refactor imports.\n// The decomposed modules in src/lib/ and src/components/ are ready to use.\n"

# ── src/main.tsx ──────────────────────────────────────────────────────────────
FILES["src/main.tsx"] = '''\
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
'''

# ── index.html ────────────────────────────────────────────────────────────────
FILES["index.html"] = '''\
<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InVoiced</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'''

# ── package.json ──────────────────────────────────────────────────────────────
FILES["package.json"] = '''\
{
  "name": "invoiced",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev":     "vite",
    "build":   "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react":     "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react":        "^18.3.1",
    "@types/react-dom":    "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite":       "^5.3.4"
  }
}
'''

# ── vite.config.ts ────────────────────────────────────────────────────────────
FILES["vite.config.ts"] = '''\
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
'''

# ── tsconfig.json ─────────────────────────────────────────────────────────────
FILES["tsconfig.json"] = '''\
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
'''

# ── .gitignore ────────────────────────────────────────────────────────────────
FILES[".gitignore"] = '''\
node_modules/
dist/
.env
.env.local
*.local
.DS_Store
'''

# ── README.md ─────────────────────────────────────────────────────────────────
FILES["README.md"] = '''\
# InVoiced

Gestão de faturas com IA para PMEs portuguesas.  
Construído com React + Vite + TypeScript.

## Funcionalidades

- Faturas de fornecedores e clientes
- Pastas com auto-classificação por IA
- Reconciliação bancária (Excel, CSV, PDF)
- Assistente de cash flow com IA
- Exportação PDF e resumo mensal
- Dark / Light mode

## Instalação

```bash
npm install
npm run dev
```

## Estrutura

```
src/
  lib/
    storage.ts        # wrapper window.storage (Claude artifact runtime)
    files.ts          # gestão de ficheiros em memória
    utils.ts          # formatação, datas, NIF
    constants.ts      # estados, cores, ícones
    theme.ts          # sistema de cores dark/light
    folderMatcher.ts  # auto-associação de faturas a pastas
  components/
    ui/               # componentes base reutilizáveis
    invoices/         # componentes específicos de faturas
  App.tsx
  InVoiced.tsx        # componente principal (monolítico, a refatorar)
  main.tsx
```

## Nota

`src/InVoiced.tsx` contém o componente principal ainda monolítico.  
Os módulos em `src/lib/` e `src/components/` são a base para refatoração progressiva.
'''

# ── main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print("Uso: python 1_decompose.py <invoiced.tsx> <output_dir>")
        sys.exit(1)

    src_tsx = sys.argv[1]
    out_dir = sys.argv[2]

    if not os.path.isfile(src_tsx):
        print(f"Erro: ficheiro '{src_tsx}' não encontrado.")
        sys.exit(1)

    original = read(src_tsx)

    print(f"\nA criar projecto em '{out_dir}' …\n")

    for rel_path, content in FILES.items():
        abs_path = os.path.join(out_dir, rel_path)
        write(abs_path, content)

    # Copy original TSX as InVoiced.tsx
    invoiced_path = os.path.join(out_dir, "src", "InVoiced.tsx")
    write(invoiced_path, original)

    print(f"\n✅  Projecto criado em '{out_dir}'")
    print("\nPróximos passos:")
    print("  1. Corre  2_push_github.py  para publicar no GitHub")
    print("  2. Depois:  cd", out_dir, "&& npm install && npm run dev")


if __name__ == "__main__":
    main()
