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
