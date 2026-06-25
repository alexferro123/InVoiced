export const fmt = (n: any) => Number(n||0).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
export const fmtK = (n: any) => { const v=Number(n||0); return v>=1000?(v/1000).toFixed(1)+"k €":v.toFixed(0)+" €"; };
export const parseD = (s: any) => { if(!s) return null; const p=s.split("/"); if(p.length<3) return null; const d=new Date(+p[2],+p[1]-1,+p[0]); return isNaN(d.getTime())?null:d; };
export const todayStr = () => new Date().toLocaleDateString("pt-PT");
export const isoToDisplay = (s: any) => { if(!s) return ""; const p=s.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s; };

export const SK = { invoices:"iv_inv_v3", folders:"iv_folders_v3", trends:"iv_trends_v3", clientInvoices:"iv_clinv_v3", clients:"iv_clients_v3", bankRows:"iv_bank_v3", company:"iv_company_v3", theme:"iv_theme_v3", onboarding:"iv_onboard_v3" };
export const safeGet = async (k: string) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
export const safeSet = async (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn(e); } };

export const WF_STATES = ["pendente","aguarda_aprovacao","aprovada","paga"];
export const WF_LABELS: Record<string,string> = { pendente:"Pendente", aguarda_aprovacao:"Ag. Aprovação", aprovada:"Aprovada", paga:"Paga" };
export const FOLDER_ICONS = ["📁","🏢","🏗️","⚡","💧","🌐","🚗","🛒","💼","🏥","📦","🔧","🎯","💡","🏠"];
export const FOLDER_COLORS = [
  {name:"Roxo",  bg:"rgba(155,89,245,.15)",text:"#C084FC",border:"rgba(155,89,245,.4)"},
  {name:"Ciano", bg:"rgba(34,211,238,.15)",text:"#22D3EE",border:"rgba(34,211,238,.4)"},
  {name:"Verde", bg:"rgba(34,197,94,.15)", text:"#4ADE80",border:"rgba(34,197,94,.4)"},
  {name:"Âmbar", bg:"rgba(245,158,11,.15)",text:"#FCD34D",border:"rgba(245,158,11,.4)"},
  {name:"Rosa",  bg:"rgba(236,72,153,.15)",text:"#F472B6",border:"rgba(236,72,153,.4)"},
  {name:"Azul",  bg:"rgba(59,130,246,.15)",text:"#60A5FA",border:"rgba(59,130,246,.4)"},
];
export const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
export const DAY_NAMES = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
export const ONBOARDING_STEPS = [
  { icon:"⚙️", title:"Define a tua empresa", desc:"Vai a Definições (⚙️) e preenche o NIF, nome e email para alertas." },
  { icon:"📁", title:"Cria pastas", desc:"No separador Pastas, cria categorias como 'EDP', 'Contabilidade'. A IA associa faturas automaticamente." },
  { icon:"↑",  title:"Carrega faturas", desc:"Clica em 'Carregar' para PDF/imagem, ou usa '✏️ Manual' para preencher à mão." },
  { icon:"🏦", title:"Reconcilia com o banco", desc:"No separador Reconciliação, importa o extrato do banco (Excel, PDF ou CSV)." },
  { icon:"✦",  title:"Usa o Assistente", desc:"O Assistente responde às tuas perguntas sobre cash flow, faturas em atraso e muito mais." },
];
export const getC = (dark: boolean) => ({
  purple:"#9B59F5", cyan:"#22D3EE",
  grad:"linear-gradient(135deg,#9B59F5,#22D3EE)",
  bg: dark?"#16161E":"#F4F4F8",
  bgCard: dark?"#1E1E2A":"#FFFFFF",
  bgElevated: dark?"#252533":"#EFEFEF",
  bgHover: dark?"#2D2D3F":"#E2E2EA",
  border: dark?"#2E2E40":"#D8D8E8",
  textPrimary: dark?"#F0EFFE":"#111120",
  textSecond: dark?"#9B9BBF":"#555570",
  textMuted: dark?"#6B6B8A":"#888899",
  green:"#22C55E", greenSoft:dark?"rgba(34,197,94,.15)":"rgba(34,197,94,.1)", greenBord:dark?"rgba(34,197,94,.3)":"rgba(34,197,94,.4)",
  amber:"#F59E0B", amberSoft:dark?"rgba(245,158,11,.15)":"rgba(245,158,11,.1)", amberBord:dark?"rgba(245,158,11,.3)":"rgba(245,158,11,.4)",
  red:"#EF4444", redSoft:dark?"rgba(239,68,68,.15)":"rgba(239,68,68,.1)", redBord:dark?"rgba(239,68,68,.3)":"rgba(239,68,68,.4)",
  purpleSoft:dark?"rgba(155,89,245,.15)":"rgba(155,89,245,.1)", purpleBord:dark?"rgba(155,89,245,.3)":"rgba(155,89,245,.4)",
  cyanSoft:dark?"rgba(34,211,238,.15)":"rgba(34,211,238,.1)", cyanBord:dark?"rgba(34,211,238,.3)":"rgba(34,211,238,.4)",
});
