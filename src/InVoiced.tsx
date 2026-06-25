import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DashboardPage from "./pages/DashboardPage";
import PastasPage from "./pages/PastasPage";
import AssistentePage from "./pages/AssistentePage";

const SK = { invoices:"iv_inv_v3", folders:"iv_folders_v3", trends:"iv_trends_v3", clientInvoices:"iv_clinv_v3", clients:"iv_clients_v3", bankRows:"iv_bank_v3", company:"iv_company_v3", theme:"iv_theme_v3", onboarding:"iv_onboard_v3" };
const safeGet = async k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const safeSet = async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn(e); } };

const fileStore = {};
const storeFile = (id, b64, mime, name) => { fileStore[id] = { base64:b64, mimeType:mime, fileName:name }; };
const stripFiles = arr => arr.map(({ base64:_b, mimeType:_m, ...rest }) => ({
  ...rest, hasFile:!!_b,
  receipt: rest.receipt ? { ...rest.receipt, base64:undefined, hasFile:!!rest.receipt?.base64 } : rest.receipt,
}));

const fmt = n => Number(n||0).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const fmtK = n => { const v=Number(n||0); return v>=1000?(v/1000).toFixed(1)+"k €":v.toFixed(0)+" €"; };
const parseD = s => { if(!s) return null; const p=s.split("/"); if(p.length<3) return null; const d=new Date(+p[2],+p[1]-1,+p[0]); return isNaN(d)?null:d; };
const todayStr = () => new Date().toLocaleDateString("pt-PT");
const nifClean = n => (n||"").replace(/\D/g,"");
const isoToDisplay = s => { if(!s) return ""; const p=s.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s; };

const WF_STATES = ["pendente","aguarda_aprovacao","aprovada","paga"];
const WF_LABELS = { pendente:"Pendente", aguarda_aprovacao:"Ag. Aprovação", aprovada:"Aprovada", paga:"Paga" };
const FOLDER_ICONS = ["📁","🏢","🏗️","⚡","💧","🌐","🚗","🛒","💼","🏥","📦","🔧","🎯","💡","🏠"];
const FOLDER_COLORS = [
  {name:"Roxo",  bg:"rgba(155,89,245,.15)",text:"#C084FC",border:"rgba(155,89,245,.4)"},
  {name:"Ciano", bg:"rgba(34,211,238,.15)",text:"#22D3EE",border:"rgba(34,211,238,.4)"},
  {name:"Verde", bg:"rgba(34,197,94,.15)", text:"#4ADE80",border:"rgba(34,197,94,.4)"},
  {name:"Âmbar", bg:"rgba(245,158,11,.15)",text:"#FCD34D",border:"rgba(245,158,11,.4)"},
  {name:"Rosa",  bg:"rgba(236,72,153,.15)",text:"#F472B6",border:"rgba(236,72,153,.4)"},
  {name:"Azul",  bg:"rgba(59,130,246,.15)",text:"#60A5FA",border:"rgba(59,130,246,.4)"},
];
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const ONBOARDING_STEPS = [
  { icon:"⚙️", title:"Define a tua empresa", desc:"Vai a Definições (⚙️) e preenche o NIF, nome e email para alertas." },
  { icon:"📁", title:"Cria pastas", desc:"No separador Pastas, cria categorias como 'EDP', 'Contabilidade'. A IA associa faturas automaticamente." },
  { icon:"↑",  title:"Carrega faturas", desc:"Clica em 'Carregar' para PDF/imagem, ou usa '✏️ Manual' para preencher à mão." },
  { icon:"🏦", title:"Reconcilia com o banco", desc:"No separador Reconciliação, importa o extrato do banco (Excel, PDF ou CSV)." },
  { icon:"✦",  title:"Usa o Assistente", desc:"O Assistente responde às tuas perguntas sobre cash flow, faturas em atraso e muito mais." },
];

const getC = dark => ({
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

function matchFolder(folders, {supplier="",description="",category=""}) {
  const hay=[supplier,description,category].join(" ").toLowerCase();
  let best=null, bestScore=0;
  for(const f of folders){
    const words=f.name.toLowerCase().split(/[\s\-_/]+/).filter(w=>w.length>2);
    let score=0; for(const w of words){if(hay.includes(w))score+=w.length*2;}
    if(score>bestScore){bestScore=score;best=f;}
  }
  return bestScore>=4?best:null;
}

// ── UI Components ─────────────────────────────────────────────────────────
function PortalDD({triggerRef,open,onClose,children,minW=180}){
  const [pos,setPos]=useState({top:0,left:0,minWidth:minW,translateY:"0"});
  useEffect(()=>{
    if(open&&triggerRef.current){
      const r=triggerRef.current.getBoundingClientRect();
      const below=window.innerHeight-r.bottom>220;
      setPos({top:below?r.bottom+4:r.top-4,left:r.left,minWidth:Math.max(r.width,minW),translateY:below?"0":"-100%"});
    }
  },[open]);
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999}} onClick={onClose}>
      <div style={{position:"absolute",top:pos.top,left:pos.left,minWidth:pos.minWidth,transform:`translateY(${pos.translateY})`,background:"#1E1E2A",border:"1px solid #2E2E40",borderRadius:12,boxShadow:"0 16px 48px rgba(0,0,0,.6)",overflow:"hidden",maxHeight:300,overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FolderPicker({inv,folders,onAssign,C}){
  const [open,setOpen]=useState(false);
  const ref=useRef();
  const folder=folders.find(f=>f.id===inv.folderId)||null;
  const col=folder?.color||FOLDER_COLORS[0];
  return(
    <div ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:folder?col.bg:C.bgElevated,border:"1px solid "+(folder?col.border:C.border),borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600,color:folder?col.text:C.textMuted,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
        {folder?folder.icon+" "+folder.name:"+ Pasta"}<span style={{fontSize:9,opacity:.6}}>▼</span>
      </button>
      <PortalDD triggerRef={ref} open={open} onClose={()=>setOpen(false)}>
        {folders.map(f=>{
          const fc=f.color||FOLDER_COLORS[0];
          return(
            <button key={f.id} onClick={()=>{onAssign(f.id);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",width:"100%",background:inv.folderId===f.id?fc.bg:"transparent",border:"none",borderBottom:"1px solid #2E2E40",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:15}}>{f.icon}</span>
              <span style={{fontSize:13,fontWeight:600,color:inv.folderId===f.id?fc.text:"#F0EFFE"}}>{f.name}</span>
              {inv.folderId===f.id&&<span style={{marginLeft:"auto",color:fc.text,fontSize:12}}>✓</span>}
            </button>
          );
        })}
        {inv.folderId&&<button onClick={()=>{onAssign(null);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",width:"100%",background:"transparent",border:"none",cursor:"pointer"}}><span style={{fontSize:13,color:C.red}}>✕ Remover pasta</span></button>}
        {folders.length===0&&<div style={{padding:"12px 14px",fontSize:12,color:C.textMuted}}>Sem pastas criadas.</div>}
      </PortalDD>
    </div>
  );
}

function StatusPicker({inv,onUpdate,C}){
  const [open,setOpen]=useState(false);
  const ref=useRef();
  return(
    <div ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4}}>
        <WfPill status={inv.wfStatus||"pendente"} C={C}/><span style={{fontSize:9,color:C.textMuted}}>▼</span>
      </button>
      <PortalDD triggerRef={ref} open={open} onClose={()=>setOpen(false)}>
        {WF_STATES.map(s=>(
          <button key={s} onClick={()=>{const isPaga=s==="paga";onUpdate({wfStatus:s,status:isPaga?"paga":"pendente",...(isPaga?{paidAt:todayStr()}:{})});setOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",width:"100%",background:inv.wfStatus===s?C.purpleSoft:"transparent",border:"none",borderBottom:"1px solid #2E2E40",cursor:"pointer"}}>
            <WfPill status={s} C={C}/>{inv.wfStatus===s&&<span style={{color:C.purple,fontSize:12}}>✓</span>}
          </button>
        ))}
      </PortalDD>
    </div>
  );
}

function WfPill({status,C}){
  const s=status||"pendente";
  const map={pendente:[C.amberSoft,C.amber,C.amberBord],aguarda_aprovacao:[C.cyanSoft,C.cyan,C.cyanBord],aprovada:[C.purpleSoft,C.purple,C.purpleBord],paga:[C.greenSoft,C.green,C.greenBord]};
  const [bg,text,border]=map[s]||map.pendente;
  return <span style={{background:bg,color:text,border:"1px solid "+border,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{WF_LABELS[s]||s}</span>;
}

function Btn({children,onClick,v,disabled,sx,C}){
  const base={borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?.4:1,display:"inline-flex",alignItems:"center",gap:6,...(sx||{})};
  if(v==="primary") return <button onClick={onClick} disabled={disabled} style={{...base,background:C.grad,color:"#fff",border:"none",boxShadow:"0 2px 16px rgba(155,89,245,.35)"}}>{children}</button>;
  if(v==="danger")  return <button onClick={onClick} disabled={disabled} style={{...base,background:C.redSoft,color:C.red,border:"1px solid "+C.redBord}}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{...base,background:C.bgElevated,color:C.textPrimary,border:"1px solid "+C.border}}>{children}</button>;
}
function Card({children,sx,C}){return <div style={{background:C.bgCard,borderRadius:16,border:"1px solid "+C.border,padding:"20px 22px",...(sx||{})}}>{children}</div>;}

function Modal({open,onClose,title,children,wide,C}){
  useEffect(()=>{const h=e=>{if(e.key==="Escape"&&open)onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{background:C.bgCard,borderRadius:20,padding:28,maxWidth:wide?860:560,width:"100%",maxHeight:"92vh",overflowY:"auto",border:"1px solid "+C.border,boxShadow:"0 32px 80px rgba(0,0,0,.6)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:C.textPrimary}}>{title}</h3>
          <button onClick={onClose} style={{background:C.bgElevated,border:"1px solid "+C.border,width:34,height:34,borderRadius:8,fontSize:18,cursor:"pointer",color:C.textSecond,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({toasts,C}){
  return(
    <div style={{position:"fixed",top:20,right:20,zIndex:9998,display:"flex",flexDirection:"column",gap:8,maxWidth:380}}>
      {toasts.map(t=>{
        const bord=t.type==="error"?C.redBord:t.type==="warning"?C.amberBord:t.type==="success"?C.greenBord:C.purpleBord;
        const col=t.type==="error"?C.red:t.type==="warning"?C.amber:t.type==="success"?C.green:C.purple;
        return <div key={t.id} style={{background:C.bgElevated,border:"1px solid "+bord,color:col,borderRadius:12,padding:"12px 18px",fontSize:13,fontWeight:500,display:"flex",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}><span>{t.type==="error"?"❌":t.type==="warning"?"⚠️":t.type==="success"?"✅":"ℹ️"}</span>{t.msg}</div>;
      })}
    </div>
  );
}

function Toggle({on,onToggle,labelOn,labelOff,C}){
  return(
    <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:0}}>
      <div style={{width:44,height:24,borderRadius:12,background:on?C.grad:C.bgElevated,position:"relative",transition:"background .25s",flexShrink:0,border:"1px solid "+(on?C.purpleBord:C.border)}}>
        <div style={{position:"absolute",top:3,left:on?21:3,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.4)",transition:"left .25s"}}/>
      </div>
      <span style={{fontSize:12,fontWeight:600,color:on?C.purple:C.textMuted,minWidth:60}}>{on?(labelOn||"Pago"):(labelOff||"Pendente")}</span>
    </button>
  );
}

function ConfirmDialog({open,msg,onConfirm,onCancel,C}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onCancel}>
      <div style={{background:C.bgCard,borderRadius:16,padding:28,maxWidth:360,width:"100%",border:"1px solid "+C.redBord,boxShadow:"0 24px 60px rgba(0,0,0,.6)"}} onClick={e=>e.stopPropagation()}>
        <p style={{fontSize:22,textAlign:"center",margin:"0 0 12px"}}>🗑️</p>
        <p style={{fontSize:14,fontWeight:600,color:C.textPrimary,textAlign:"center",margin:"0 0 20px"}}>{msg||"Tens a certeza que queres apagar?"}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,background:C.bgElevated,border:"1px solid "+C.border,borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textPrimary}}>Cancelar</button>
          <button onClick={onConfirm} style={{flex:1,background:C.red,border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff"}}>Apagar</button>
        </div>
      </div>
    </div>
  );
}

function UploadProgress({current,total,name,C}){
  if(!total)return null;
  const pct=Math.round((current/total)*100);
  return(
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.bgCard,border:"1px solid "+C.purpleBord,borderRadius:14,padding:"14px 20px",zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,.4)",minWidth:300}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:12,fontWeight:700,color:C.textPrimary}}>A processar {current} de {total}</span>
        <span style={{fontSize:12,fontWeight:700,color:C.purple}}>{pct}%</span>
      </div>
      <div style={{height:6,borderRadius:99,background:C.bgElevated,overflow:"hidden",marginBottom:6}}>
        <div style={{height:"100%",width:pct+"%",background:C.grad,borderRadius:99,transition:"width .3s"}}/>
      </div>
      {name&&<p style={{margin:0,fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📄 {name}</p>}
    </div>
  );
}

function OnboardingTour({step,onNext,onSkip,C}){
  if(step<0||step>=ONBOARDING_STEPS.length)return null;
  const s=ONBOARDING_STEPS[step];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.bgCard,borderRadius:20,padding:32,maxWidth:420,width:"100%",border:"1px solid "+C.purpleBord,boxShadow:"0 32px 80px rgba(0,0,0,.6)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>{s.icon}</div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:20}}>
          {ONBOARDING_STEPS.map((_,i)=><div key={i} style={{width:i===step?24:8,height:8,borderRadius:99,background:i===step?C.purple:C.border,transition:"width .3s"}}/>)}
        </div>
        <h3 style={{margin:"0 0 12px",fontSize:18,fontWeight:800,color:C.textPrimary}}>{s.title}</h3>
        <p style={{margin:"0 0 28px",fontSize:14,color:C.textMuted,lineHeight:1.6}}>{s.desc}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onSkip} style={{background:"none",border:"1px solid "+C.border,borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textMuted}}>Saltar</button>
          <button onClick={onNext} style={{background:C.grad,border:"none",borderRadius:10,padding:"9px 22px",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff"}}>{step===ONBOARDING_STEPS.length-1?"Começar ✓":"Próximo →"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────
function PieChart({data,C}){
  if(!data||data.length===0)return <p style={{color:C.textMuted,textAlign:"center",fontSize:13,padding:"1.5rem 0",margin:0}}>Sem dados ainda.</p>;
  const total=data.reduce((s,d)=>s+(d.value||0),0);
  if(total===0)return <p style={{color:C.textMuted,textAlign:"center",fontSize:13,padding:"1.5rem 0",margin:0}}>Sem dados ainda.</p>;
  const COLS=["#9B59F5","#22D3EE","#22C55E","#F59E0B","#EF4444","#F472B6","#60A5FA","#4ADE80"];
  let cum=0;
  const slices=data.slice(0,8).map((d,i)=>{const pct=(d.value/total)*100;const start=cum;cum+=pct;return {...d,pct,start,color:COLS[i%COLS.length]};});
  const polar=(cx,cy,r,deg)=>({x:cx+r*Math.cos((deg-90)*Math.PI/180),y:cy+r*Math.sin((deg-90)*Math.PI/180)});
  const arc=(cx,cy,r,s,e)=>{const sp=polar(cx,cy,r,s*3.6),ep=polar(cx,cy,r,e*3.6);return `M ${cx} ${cy} L ${sp.x} ${sp.y} A ${r} ${r} 0 ${e-s>50?1:0} 1 ${ep.x} ${ep.y} Z`;};
  return(
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      <svg width={110} height={110} style={{flexShrink:0}}>
        {slices.map((s,i)=><path key={i} d={arc(55,55,50,s.start,s.start+s.pct)} fill={s.color} opacity={.85} stroke={C.bgCard} strokeWidth={2}/>)}
        <circle cx={55} cy={55} r={25} fill={C.bgCard}/>
        <text x={55} y={59} textAnchor="middle" fill={C.textPrimary} fontSize={10} fontWeight={700}>{fmtK(total)}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:5,flex:1,minWidth:0}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:9,height:9,borderRadius:2,background:s.color,flexShrink:0}}/>
            <span style={{fontSize:11,color:C.textSecond,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
            <span style={{fontSize:11,fontWeight:700,color:C.textPrimary,flexShrink:0}}>{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({data,C}){
  const h=100;
  if(!data||data.length===0)return <p style={{color:C.textMuted,textAlign:"center",fontSize:13,padding:"1.5rem 0",margin:0}}>Sem dados ainda.</p>;
  const maxV=Math.max(...data.map(d=>(d.paid||0)+(d.pending||0)),1);
  return(
    <div style={{display:"flex",gap:5,alignItems:"flex-end",height:h+28}}>
      {data.map((d,i)=>{
        const pH=Math.max(((d.paid||0)/maxV)*h,0),peH=Math.max(((d.pending||0)/maxV)*h,0);
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:9,color:C.textMuted,fontWeight:600}}>{(d.paid||0)+(d.pending||0)>0?fmtK((d.paid||0)+(d.pending||0)):""}</span>
            <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:h,gap:1}}>
              {peH>0&&<div style={{width:"65%",height:peH,background:C.amberSoft,border:"1px solid "+C.amberBord,borderRadius:"4px 4px 0 0"}}/>}
              {pH>0&&<div style={{width:"65%",height:pH,background:C.grad,borderRadius:peH>0?"0":"4px 4px 0 0",opacity:.85}}/>}
            </div>
            <span style={{fontSize:9,color:C.textMuted,textAlign:"center",maxWidth:52,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({label,icon,val,sub,color,glow,C}){
  return(
    <div style={{background:C.bgCard,borderRadius:16,border:"1px solid "+C.border,padding:"16px 18px",boxShadow:glow?"0 0 24px rgba(155,89,245,.12)":"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:C.textMuted}}>{label}</span>
        <span style={{fontSize:18}}>{icon}</span>
      </div>
      <p style={{fontSize:20,fontWeight:800,margin:"0 0 4px",color:color||C.textPrimary}}>{val}</p>
      {sub&&<p style={{fontSize:11,color:C.textMuted,margin:0}}>{sub}</p>}
    </div>
  );
}

// ── Bank parser ───────────────────────────────────────────────────────────
const normDate=s=>{
  if(!s&&s!==0)return"";
  if(s instanceof Date)return`${String(s.getDate()).padStart(2,"0")}/${String(s.getMonth()+1).padStart(2,"0")}/${s.getFullYear()}`;
  const str=String(s).trim();
  if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str))return str;
  if(/^\d{4}-\d{2}-\d{2}/.test(str)){const[y,m,d]=str.slice(0,10).split("-");return`${d}/${m}/${y}`;}
  const n=Number(str);
  if(!isNaN(n)&&n>40000&&n<60000){const dt=new Date(Date.UTC(1899,11,30)+n*86400000);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;}
  return str;
};
const parseAmt=s=>{if(s===null||s===undefined||s==="")return null;if(typeof s==="number")return s;const str=String(s).replace(/\s/g,"").replace(/[€$]/g,"").replace(/\.(?=\d{3}(?:[,\s]|$))/g,"").replace(",",".");const n=parseFloat(str);return isNaN(n)?null:n;};
const genericParser=rows2d=>{
  let hi=-1;for(let i=0;i<Math.min(rows2d.length,25);i++){const ne=(rows2d[i]||[]).filter(c=>c!==null&&c!==undefined&&String(c).trim()!=="");if(ne.length>=3){hi=i;break;}}
  if(hi<0)return null;
  const h=(rows2d[hi]||[]).map(c=>String(c||"").toLowerCase().trim());
  const dC=h.findIndex(c=>/(^data$|^date$|data\s*mov)/.test(c));
  const tC=h.findIndex(c=>/(descri|movimento|hist)/.test(c));
  const debC=h.findIndex(c=>/(d[eé]bito|debit|sa[ií]da)/.test(c));
  const crC=h.findIndex(c=>/(cr[eé]dito|credit|entrada)/.test(c)&&!/(descri)/.test(c));
  const vC=h.findIndex(c=>/(^valor$|^amount$)/.test(c));
  const colDate=dC>=0?dC:0,colDesc=tC>=0?tC:(colDate===0?1:0);
  const out=[];
  for(let i=hi+1;i<rows2d.length;i++){
    const row=rows2d[i]||[];if(row.every(c=>c===null||c===undefined||String(c).trim()===""))continue;
    const dateRaw=row[colDate],desc=String(row[colDesc]||"").trim();if(!dateRaw&&!desc)continue;
    let amount=null;
    if(vC>=0){amount=parseAmt(row[vC]);}
    else if(debC>=0||crC>=0){const deb=debC>=0?parseAmt(row[debC]):null,cr=crC>=0?parseAmt(row[crC]):null;if(cr!=null&&cr!==0)amount=Math.abs(cr);else if(deb!=null&&deb!==0)amount=-Math.abs(deb);}
    else{for(let c=row.length-1;c>=0;c--){const n=parseAmt(row[c]);if(n!=null&&n!==0){amount=n;break;}}}
    if(amount===null||amount===0)continue;
    out.push({id:"bank_"+Date.now()+"_"+i,date:normDate(dateRaw),description:desc||"—",amount,matched:null});
  }
  return out.length>0?out:null;
};

// ── Dashboard sub-components ──────────────────────────────────────────────
function PieSection({pieFilter,setPieFilter,pieData,C}){
  return(
    <Card C={C}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{margin:0,fontSize:13,fontWeight:700,color:C.textPrimary}}>🍕 Distribuição</h3>
        <select value={pieFilter} onChange={e=>setPieFilter(e.target.value)} style={{fontSize:10,borderRadius:7,border:"1px solid "+(pieFilter?C.border:C.purpleBord),padding:"3px 7px",background:pieFilter?C.bgElevated:C.purpleSoft,color:pieFilter?C.textSecond:C.purple,cursor:"pointer",fontWeight:pieFilter?"400":"700"}}>
          <option value="">Escolher…</option>
          <option value="pastas">Por pasta</option>
          <option value="categoria">Por categoria</option>
          <option value="fornecedor">Por fornecedor</option>
        </select>
      </div>
      {pieFilter ? (
        <PieChart data={pieData(pieFilter)} C={C}/>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center",justifyContent:"center",minHeight:90}}>
          <p style={{margin:0,fontSize:12,color:C.textMuted,textAlign:"center"}}>Escolhe como agrupar:</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {[["pastas","📁 Pasta"],["categoria","🏷️ Cat."],["fornecedor","🏢 Forn."]].map(([v,l])=>(
              <button key={v} onClick={()=>setPieFilter(v)} style={{background:C.purpleSoft,border:"1px solid "+C.purpleBord,borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:600,color:C.purple,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function CalendarView({calMonth,setCalMonth,nonCr,clientInvs,C,setDetailInv,setDtab}){
  const {y,m}=calMonth;
  const fd=new Date(y,m,1).getDay();
  const dim=new Date(y,m+1,0).getDate();
  const now=new Date();
  const cells=[];
  for(let i=0;i<(fd===0?6:fd-1);i++)cells.push(null);
  for(let d=1;d<=dim;d++){
    const ds=String(d).padStart(2,"0")+"/"+String(m+1).padStart(2,"0")+"/"+y;
    const items=[...nonCr,...clientInvs].filter(i=>i.dueDate===ds&&i.status!=="paga"&&i.status!=="recebida");
    cells.push({d,ds,items});
  }
  return(
    <Card C={C}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={()=>setCalMonth(({y,m})=>m===0?{y:y-1,m:11}:{y,m:m-1})} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18,color:C.textSecond}}>‹</button>
        <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.textPrimary}}>{MONTH_NAMES[m]} {y}</h3>
        <button onClick={()=>setCalMonth(({y,m})=>m===11?{y:y+1,m:0}:{y,m:m+1})} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18,color:C.textSecond}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
        {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.textMuted,padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((cell,i)=>{
          if(!cell)return <div key={i}/>;
          const isToday=cell.d===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();
          return(
            <div key={i} style={{minHeight:56,borderRadius:10,border:"1px solid "+(isToday?C.purple:cell.items.length>0?C.redBord:C.border),background:isToday?C.purpleSoft:cell.items.length>0?C.redSoft:C.bgElevated,padding:"5px 7px"}}>
              <span style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?C.purple:C.textPrimary}}>{cell.d}</span>
              {cell.items.slice(0,2).map((inv,j)=>(
                <div key={j} style={{marginTop:3,background:inv.clientName?C.cyan:C.red,borderRadius:4,padding:"2px 5px",fontSize:9,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}} onClick={()=>{setDetailInv(inv);setDtab("info");}}>
                  {inv.supplier||inv.clientName}
                </div>
              ))}
              {cell.items.length>2&&<div style={{fontSize:9,color:C.red,fontWeight:700,marginTop:2}}>+{cell.items.length-2}</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

  // ── Email import ──────────────────────────────────────────────────────
  const importFromEmail=async()=>{
    if(!emailText.trim()){toast("Cola o conteúdo do email.","warning");return;}
    setEmailParsing(true);
    try{
      const raw=await callAI([{role:"user",content:`Analisa este email e extrai os dados de fatura. Responde APENAS JSON sem backticks:\n{"supplier":"","nif":null,"invoiceNum":"","date":"DD/MM/AAAA","dueDate":null,"amount":0,"amountVAT":0,"description":"","category":"","isClientInvoice":false,"clientName":""}\n\nEmail:\n${emailText.slice(0,3000)}`}]);
      const p=JSON.parse(raw.replace(/```json|```/g,"").trim());
      if(!p.amount){toast("Não foi possível extrair valor do email.","error");setEmailParsing(false);return;}
      setEmailParsing(false);
      setShowEmailImport(false);
      setEmailText("");
      const isClient=p.isClientInvoice||false;
      setManualIsClient(isClient);
      setManualForm({
        supplier:p.supplier||"",clientName:p.clientName||"",nif:p.nif||"",invoiceNum:p.invoiceNum||"",
        date:p.date?p.date.split("/").reverse().join("-"):"",
        dueDate:p.dueDate?p.dueDate.split("/").reverse().join("-"):"",
        amount:String(p.amount||""),amountVAT:String(p.amountVAT||""),
        description:p.description||"",category:p.category||"",folderId:""
      });
      setShowManualInv(true);
      toast("Dados extraídos do email! Revê e guarda.","success");
    }catch(err){toast("Erro ao analisar email: "+err.message,"error");setEmailParsing(false);}
  };

  // ── Monthly summary ───────────────────────────────────────────────────
  const getMonthlySummaryData=(y,m)=>{
    const key=`${y}-${String(m+1).padStart(2,"0")}`;
    const mName=MONTH_NAMES[m]+" "+y;
    const fInvs=nonCr.filter(i=>{const p=(i.date||"").split("/");return p.length>=3&&p[2]+"-"+p[1]===key;});
    const fCl=clientInvs.filter(i=>{const p=(i.date||"").split("/");return p.length>=3&&p[2]+"-"+p[1]===key;});
    const totalFat=fInvs.reduce((s,i)=>s+(i.amount||0),0);
    const totalPag=fInvs.filter(i=>i.status==="paga").reduce((s,i)=>s+(i.amount||0),0);
    const totalPend=fInvs.filter(i=>i.status!=="paga").reduce((s,i)=>s+(i.amount||0),0);
    const totalEmit=fCl.reduce((s,i)=>s+(i.amount||0),0);
    const totalRec=fCl.filter(i=>i.status==="recebida").reduce((s,i)=>s+(i.amount||0),0);
    const byFolder={};
    fInvs.forEach(i=>{const f=getFolder(i);const k=f?f.name:"Sem pasta";if(!byFolder[k])byFolder[k]=0;byFolder[k]+=(i.amount||0);});
    const topFolders=Object.entries(byFolder).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const byClient={};
    fCl.forEach(i=>{const k=i.clientName||"?";if(!byClient[k])byClient[k]=0;byClient[k]+=(i.amount||0);});
    const topClients=Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return{mName,fInvs,fCl,totalFat,totalPag,totalPend,totalEmit,totalRec,topFolders,topClients};
  };

  const exportMonthlySummaryPDF=()=>{
    const{mName,totalFat,totalPag,totalPend,totalEmit,totalRec,topFolders,topClients,fInvs,fCl}=getMonthlySummaryData(summaryMonth.y,summaryMonth.m);
    const fRows=fInvs.map(i=>`<tr><td>${i.supplier||""}</td><td>${i.invoiceNum||""}</td><td>${i.date||""}</td><td style="text-align:right">${fmt(i.amount)}</td><td style="color:${i.status==="paga"?"#22C55E":"#F59E0B"}">${i.status==="paga"?"Paga":"Pendente"}</td></tr>`).join("");
    const clRows=fCl.map(i=>`<tr><td>${i.clientName||""}</td><td>${i.invoiceNum||""}</td><td>${i.date||""}</td><td style="text-align:right">${fmt(i.amount)}</td><td style="color:${i.status==="recebida"?"#22C55E":"#F59E0B"}">${i.status==="recebida"?"Recebida":"Pendente"}</td></tr>`).join("");
    const now=new Date().toLocaleDateString("pt-PT");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resumo ${mName}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111;font-size:13px}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:24px 0 8px;color:#9B59F5;border-bottom:2px solid #9B59F5;padding-bottom:4px}p{color:#666;font-size:12px;margin:0 0 16px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#9B59F5;color:#fff;padding:7px 10px;text-align:left;font-size:11px}td{padding:7px 10px;border-bottom:1px solid #eee;font-size:12px}tr:nth-child(even)td{background:#f9f9f9}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}.kpi{background:#f4f4f8;border-radius:8px;padding:12px;text-align:center}.kpi-val{font-size:18px;font-weight:800;color:#9B59F5}.kpi-label{font-size:10px;color:#888;text-transform:uppercase;margin-top:4px}.footer{margin-top:32px;font-size:11px;color:#aaa;text-align:center}</style></head><body>
    <h1>Resumo Mensal — ${mName}</h1><p>${company.name||""}${company.nif?" · NIF "+company.nif:""} · Gerado em ${now}</p>
    <div class="kpis">
      <div class="kpi"><div class="kpi-val">${fmt(totalFat)}</div><div class="kpi-label">Faturado</div></div>
      <div class="kpi"><div class="kpi-val">${fmt(totalPag)}</div><div class="kpi-label">Pago</div></div>
      <div class="kpi"><div class="kpi-val">${fmt(totalPend)}</div><div class="kpi-label">Pendente</div></div>
      <div class="kpi"><div class="kpi-val">${fmt(totalEmit)}</div><div class="kpi-label">Emitido</div></div>
      <div class="kpi"><div class="kpi-val">${fmt(totalRec)}</div><div class="kpi-label">Recebido</div></div>
    </div>
    ${topFolders.length>0?`<h2>Gastos por Pasta</h2><table><thead><tr><th>Pasta</th><th style="text-align:right">Total</th></tr></thead><tbody>${topFolders.map(([k,v])=>`<tr><td>${k}</td><td style="text-align:right">${fmt(v)}</td></tr>`).join("")}</tbody></table>`:""}
    ${topClients.length>0?`<h2>Receitas por Cliente</h2><table><thead><tr><th>Cliente</th><th style="text-align:right">Total</th></tr></thead><tbody>${topClients.map(([k,v])=>`<tr><td>${k}</td><td style="text-align:right">${fmt(v)}</td></tr>`).join("")}</tbody></table>`:""}
    ${fInvs.length>0?`<h2>Faturas de Fornecedor (${fInvs.length})</h2><table><thead><tr><th>Fornecedor</th><th>Nº Fatura</th><th>Data</th><th style="text-align:right">Valor</th><th>Estado</th></tr></thead><tbody>${fRows}</tbody></table>`:""}
    ${fCl.length>0?`<h2>Faturas de Cliente (${fCl.length})</h2><table><thead><tr><th>Cliente</th><th>Nº Fatura</th><th>Data</th><th style="text-align:right">Valor</th><th>Estado</th></tr></thead><tbody>${clRows}</tbody></table>`:""}
    <div class="footer">InVoiced 2.0 · ${now}</div></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);
    toast("A abrir resumo para impressão/PDF...","success");
  };
function DueBadge({dueDate,status,C}){
  if(status==="paga"||status==="recebida"||!dueDate)return null;
  const d=parseD(dueDate);if(!d)return null;
  const now=new Date();now.setHours(0,0,0,0);
  const diff=Math.ceil((d-now)/86400000);
  if(diff>7)return null;
  const isOd=diff<0;
  const bg=isOd?C.redSoft:diff<=2?C.amberSoft:C.cyanSoft;
  const col=isOd?C.red:diff<=2?C.amber:C.cyan;
  const bord=isOd?C.redBord:diff<=2?C.amberBord:C.cyanBord;
  const label=isOd?`Venceu há ${-diff}d`:diff===0?"Vence hoje":diff===1?"Vence amanhã":`Vence em ${diff}d`;
  return <span style={{background:bg,color:col,border:"1px solid "+bord,borderRadius:99,padding:"1px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function InVoiced(){
  const [darkMode,setDarkMode]=useState(false);
  const C=useMemo(()=>getC(darkMode),[darkMode]);

  const [tab,setTab]=useState("dashboard");
  const [invoices,setInvoices]=useState([]);
  const [folders,setFolders]=useState([]);
  const [trends,setTrends]=useState({});
  const [clientInvs,setClientInvs]=useState([]);
  const [clients,setClients]=useState([]);
  const [bankRows,setBankRows]=useState([]);
  const [company,setCompany]=useState({nif:"",iban:"",name:"",address:"",email:"",alertDays:"7"});
  const [ready,setReady]=useState(false);
  const [uploadProgress,setUploadProgress]=useState({current:0,total:0,name:""});
  const [showUploadMenu,setShowUploadMenu]=useState(false);
  const [toasts,setToasts]=useState([]);

  // Fornecedores filters
  const [fStatus,setFStatus]=useState("todos");
  const [fFolder,setFFolder]=useState("todos");
  const [sortBy,setSortBy]=useState("date_desc");
  const [search,setSearch]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");

  // Clientes filters
  const [clSearch,setClSearch]=useState("");
  const [clSortBy,setClSortBy]=useState("date_desc");
  const [clStatus,setClStatus]=useState("todos");
  const [clFolder,setClFolder]=useState("todos");
  const [clDateFrom,setClDateFrom]=useState("");
  const [clDateTo,setClDateTo]=useState("");

  const [detailInv,setDetailInv]=useState(null);
  const [dtab,setDtab]=useState("info");
  const [expKey,setExpKey]=useState(null);
  const [newFolder,setNewFolder]=useState({name:"",icon:"📁",colorIdx:0});
  const [showAddFolder,setShowAddFolder]=useState(false);
  const [suggestModal,setSuggestModal]=useState(null);
  const [suggestNewName,setSuggestNewName]=useState("");
  const [newCl,setNewCl]=useState({name:"",nif:"",email:"",phone:""});
  const [showAddCl,setShowAddCl]=useState(false);
  const [pieFilter,setPieFilter]=useState("");
  const [chartFilter,setChartFilter]=useState("pastas");
  const [chatMsgs,setChatMsgs]=useState([{role:"ai",text:"Olá! Sou o assistente do InVoiced 2.0. Pergunta-me sobre faturas, clientes, pastas ou fluxo de caixa."}]);
  const [chatIn,setChatIn]=useState("");
  const [chatLoad,setChatLoad]=useState(false);
  const [editingInv,setEditingInv]=useState(null);
  const [editFields,setEditFields]=useState({});
  const [calView,setCalView]=useState(false);
  const [calMonth,setCalMonth]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  const [bankPdfRows,setBankPdfRows]=useState(null);
  const [showBankReview,setShowBankReview]=useState(false);
  const [receiptUploading,setReceiptUploading]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [settingsForm,setSettingsForm]=useState({nif:"",iban:"",name:"",address:"",email:"",alertDays:"7"});
  const [bankFilter,setBankFilter]=useState("todos");
  const [bankMonth,setBankMonth]=useState("");
  const [confirmDel,setConfirmDel]=useState(null);
  const [onboardStep,setOnboardStep]=useState(-1);
  const [showManualInv,setShowManualInv]=useState(false);
  const [manualIsClient,setManualIsClient]=useState(false);
  const [manualForm,setManualForm]=useState({supplier:"",nif:"",invoiceNum:"",date:"",dueDate:"",amount:"",amountVAT:"",description:"",category:"",folderId:"",clientName:""});
  const [noteEditId,setNoteEditId]=useState(null);
  const [noteText,setNoteText]=useState("");
  const [dupConfirm,setDupConfirm]=useState(null);
  const [showMonthlySummary,setShowMonthlySummary]=useState(false);
  const [summaryMonth,setSummaryMonth]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  const [showEmailImport,setShowEmailImport]=useState(false);
  const [emailText,setEmailText]=useState("");
  const [emailParsing,setEmailParsing]=useState(false);

  const chatEnd=useRef(),fileRef=useRef(),clFileRef=useRef(),bankFileRef=useRef();
  const foldersRef=useRef(folders),invoicesRef=useRef(invoices),clientInvsRef=useRef(clientInvs);
  useEffect(()=>{foldersRef.current=folders;},[folders]);
  useEffect(()=>{invoicesRef.current=invoices;},[invoices]);
  useEffect(()=>{clientInvsRef.current=clientInvs;},[clientInvs]);

  useEffect(()=>{
    const h=e=>{
      if(e.ctrlKey||e.metaKey){
        if(e.key==="u"){e.preventDefault();setShowUploadMenu(m=>!m);}
        if(e.key==="k"){e.preventDefault();setTab("assistente");}
        if(e.key==="d"){e.preventDefault();setDarkMode(m=>!m);}
      }
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  useEffect(()=>{
    const load=async()=>{
      try{
        const [inv,fol,tr,clinv,cl,bank,co,th,ob]=await Promise.all([safeGet(SK.invoices),safeGet(SK.folders),safeGet(SK.trends),safeGet(SK.clientInvoices),safeGet(SK.clients),safeGet(SK.bankRows),safeGet(SK.company),safeGet(SK.theme),safeGet(SK.onboarding)]);
        if(inv)setInvoices(inv);if(fol)setFolders(fol);if(tr)setTrends(tr);
        if(clinv)setClientInvs(clinv);if(cl)setClients(cl);if(bank)setBankRows(bank);
        if(co){setCompany(co);setSettingsForm({nif:co.nif||"",iban:co.iban||"",name:co.name||"",address:co.address||"",email:co.email||"",alertDays:co.alertDays||"7"});}
        if(th!==null)setDarkMode(th);else setDarkMode(false);
        if(!ob&&!inv)setTimeout(()=>setOnboardStep(0),800);
      }catch(e){console.warn(e);}finally{setReady(true);}
    };
    const t=setTimeout(()=>setReady(true),5000);
    load().then(()=>clearTimeout(t));
  },[]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[chatMsgs]);

  const toast=useCallback((msg,type)=>{const id=Date.now()+Math.random();setToasts(t=>[...t,{id,msg,type:type||"info"}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),5500);},[]);
  const getFolder=inv=>folders.find(f=>f.id===inv.folderId)||null;
  const isOD=inv=>{if(inv.status==="paga"||inv.status==="recebida")return false;const d=parseD(inv.dueDate);return d&&d<new Date();};
  const toggleTheme=async()=>{const nd=!darkMode;setDarkMode(nd);await safeSet(SK.theme,nd);};

  const nonCr=invoices.filter(i=>!i.isCredit);
  const totFat=nonCr.reduce((s,i)=>s+(i.amount||0),0);
  const totPag=nonCr.filter(i=>i.status==="paga").reduce((s,i)=>s+(i.amount||0),0);
  const totPend=nonCr.filter(i=>i.status!=="paga").reduce((s,i)=>s+(i.amount||0),0);
  const venc=nonCr.filter(i=>isOD(i));
  const paidCt=nonCr.filter(i=>i.status==="paga").length;
  const pendCt=nonCr.filter(i=>i.status!=="paga").length;
  const totEmit=clientInvs.reduce((s,i)=>s+(i.amount||0),0);
  const totRec=clientInvs.filter(i=>i.status==="recebida").reduce((s,i)=>s+(i.amount||0),0);
  const totPRec=clientInvs.filter(i=>i.status!=="recebida").reduce((s,i)=>s+(i.amount||0),0);
  const clVenc=clientInvs.filter(i=>isOD(i));
  const unmatchedInvs=nonCr.filter(i=>i.status==="paga"&&!i.bankMatched);
  const unmatchedBank=bankRows.filter(b=>!b.matched);
  const unkCt=nonCr.filter(i=>!i.folderId&&folders.length>0).length;
  const missingReceipts=nonCr.filter(i=>i.status==="paga"&&!i.receipt?.hasFile);
  const clMissingReceipts=clientInvs.filter(i=>i.status==="recebida"&&!i.receipt?.hasFile);
  const paidInvs=nonCr.filter(i=>i.status==="paga"&&i.dueDate&&i.paidAt);
  const onTime=paidInvs.filter(i=>{const pd=parseD(i.dueDate),pa=parseD(i.paidAt);return pd&&pa&&pa<=pd;});
  const onTimeRate=paidInvs.length>0?Math.round((onTime.length/paidInvs.length)*100):null;
  const alertCt=invoices.filter(i=>i.trendAlert).length;

  const cashFlow=(fromDays,toDays)=>{
    const now=new Date(),from=new Date(now),to=new Date(now);
    from.setDate(now.getDate()+fromDays);to.setDate(now.getDate()+toDays);
    const out=nonCr.filter(i=>{if(i.status==="paga")return false;const d=parseD(i.dueDate);return d&&d>=from&&d<=to;}).reduce((s,i)=>s+(i.amountToPay||i.amount||0),0);
    const inn=clientInvs.filter(i=>{if(i.status==="recebida")return false;const d=parseD(i.dueDate);return d&&d>=from&&d<=to;}).reduce((s,i)=>s+(i.amount||0),0);
    return{out,inn,net:inn-out};
  };
  const cf30=cashFlow(0,30),cf60=cashFlow(31,60),cf90=cashFlow(61,90);

  const saveInvoices=async arr=>{setInvoices(arr);await safeSet(SK.invoices,stripFiles(arr));};
  const saveClientInvs=async arr=>{setClientInvs(arr);await safeSet(SK.clientInvoices,stripFiles(arr));};

  const updInv=async(id,ch)=>{
    const now=new Date().toLocaleString("pt-PT");
    const ex=invoicesRef.current.find(i=>i.id===id);
    let history=ex?.history||[];
    if(ch.wfStatus&&ex&&ch.wfStatus!==ex.wfStatus)history=[...history,{from:ex.wfStatus||"pendente",to:ch.wfStatus,at:now}];
    const updated={...ex,...ch,history};
    const u=invoicesRef.current.map(i=>i.id===id?updated:i);
    await saveInvoices(u);
    if(detailInv?.id===id)setDetailInv(prev=>({...prev,...ch,history}));
    if(ch.status==="paga"&&!updated.bankMatched){
      const match=bankRows.find(b=>!b.matched&&Math.abs((updated.amountToPay||updated.amount||0)-Math.abs(b.amount))<0.02);
      if(match){const updB=bankRows.map(b=>b.id===match.id?{...b,matched:id}:b);const updI=u.map(i=>i.id===id?{...i,bankMatched:match.id}:i);setBankRows(updB);await safeSet(SK.bankRows,updB);await saveInvoices(updI);toast("✓ Reconciliado automaticamente!","success");}
    }
  };
  const delInv=async id=>{await saveInvoices(invoices.filter(i=>i.id!==id));toast("Removida.","info");};
  const updClInv=async(id,ch)=>{await saveClientInvs(clientInvs.map(i=>i.id===id?{...i,...ch}:i));};
  const delClInv=async id=>{await saveClientInvs(clientInvs.filter(i=>i.id!==id));toast("Removida.","info");};
  const saveEdit=async()=>{if(!editingInv)return;await updInv(editingInv.id,editFields);setEditingInv(null);setEditFields({});toast("Atualizada!","success");};

  // Duplicate invoice
  const duplicateInv=async inv=>{
    const isCl=!!inv.clientName;
    const newId=(isCl?"clinv_":"inv_")+Date.now()+"_"+Math.random().toString(36).slice(2);
    if(isCl){
      const dup={...inv,id:newId,date:todayStr(),dueDate:null,status:"não recebida",payDate:null,receipt:null,notes:"",addedAt:new Date().toISOString()};
      await saveClientInvs([dup,...clientInvsRef.current]);
      toast("Fatura de cliente duplicada!","success");
    } else {
      const dup={...inv,id:newId,date:todayStr(),dueDate:null,status:"pendente",wfStatus:"pendente",paidAt:null,bankMatched:null,receipt:null,notes:"",trendAlert:null,history:[],addedAt:new Date().toISOString()};
      await saveInvoices([dup,...invoicesRef.current]);
      toast("Fatura duplicada!","success");
    }
    setDupConfirm(null);
  };

  const callAI=async(messages,sys)=>{
    throw new Error("Funcionalidade de IA não disponível nesta versão.");
  };

  const processSingleFile=async file=>{
    const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
    const mimeType=file.type||(file.name.toLowerCase().endsWith(".pdf")?"application/pdf":"image/jpeg");
    const isImg=mimeType.startsWith("image/");
    const curFolders=foldersRef.current;
    const fList=curFolders.length>0?"PASTAS:\n"+curFolders.map(f=>`- "${f.name}"`).join("\n"):"Sem pastas.";
    const raw=await callAI([{role:"user",content:[{type:isImg?"image":"document",source:{type:"base64",media_type:mimeType,data:base64}},{type:"text",text:`Analisa esta fatura.\n${fList}\nResponde APENAS JSON sem backticks:\n{"supplier":"","nif":null,"iban":null,"invoiceNum":"","date":"DD/MM/AAAA","dueDate":null,"amount":0,"amountNet":0,"amountVAT":0,"vatRate":0,"retention":0,"amountToPay":0,"description":"","suggestedFolder":null,"isCredit":false,"category":""}`}]}]);
    const p=JSON.parse(raw.replace(/```json|```/g,"").trim());
    const dup=invoicesRef.current.find(i=>i.invoiceNum===p.invoiceNum&&(i.supplier||"").toLowerCase()===(p.supplier||"").toLowerCase()&&i.date===p.date);
    if(dup)return{error:`Duplicado: ${p.invoiceNum} (${p.supplier})`};
    const sk=(p.supplier||"unk").toLowerCase().replace(/\W+/g,"_");
    const nt={...trends};if(!nt[sk])nt[sk]={amounts:[]};nt[sk].amounts.push({amount:p.amount||0});
    setTrends(nt);await safeSet(SK.trends,nt);
    let ta=null;const hist=nt[sk].amounts;
    if(hist.length>2){const prev=hist.slice(0,-1).map(x=>x.amount);const avg=prev.reduce((s,x)=>s+x,0)/prev.length;if(avg>0&&(p.amount||0)>avg*1.15)ta=`Valor ${fmt(p.amount)} é ${Math.round(((p.amount||0)/avg-1)*100)}% acima da média`;}
    let sugFolder=p.suggestedFolder?curFolders.find(f=>f.name.toLowerCase()===p.suggestedFolder.toLowerCase()):null;
    if(!sugFolder)sugFolder=matchFolder(curFolders,{supplier:p.supplier||"",description:p.description||"",category:p.category||""});
    const inv={id:"inv_"+Date.now()+"_"+Math.random().toString(36).slice(2),base64,mimeType,fileName:file.name,supplier:p.supplier||"Desconhecido",nif:p.nif||null,iban:p.iban||null,invoiceNum:p.invoiceNum||"-",date:p.date||"-",dueDate:p.dueDate||null,amount:p.amount||0,amountNet:p.amountNet||0,amountVAT:p.amountVAT||0,vatRate:p.vatRate||null,retention:p.retention||0,amountToPay:p.amountToPay||p.amount||0,description:p.description||"-",folderId:sugFolder?sugFolder.id:null,isCredit:p.isCredit||false,status:"pendente",wfStatus:"pendente",category:p.category||"",trendAlert:ta,history:[],notes:"",tags:[],receipt:null,bankMatched:null,addedAt:new Date().toISOString()};
    storeFile(inv.id,base64,mimeType,file.name);
    await saveInvoices([inv,...invoicesRef.current]);
    return{inv,sugFolder,p};
  };

  const handleFile=async e=>{
    const files=Array.from(e.target.files||[]);if(!files.length)return;
    setShowUploadMenu(false);if(fileRef.current)fileRef.current.value="";
    toast(`A processar ${files.length} fatura(s)...`,"info");
    for(let i=0;i<files.length;i++){
      const file=files[i];
      setUploadProgress({current:i+1,total:files.length,name:file.name});
      try{
        const result=await processSingleFile(file);
        if(result.error){toast(result.error,"error");}
        else if(!result.inv.folderId&&foldersRef.current.length>0){setSuggestModal({inv:result.inv});toast(`✓ "${result.inv.supplier}" — pasta por definir`,"warning");}
        else{toast(`✓ "${result.inv.supplier}"${result.sugFolder?" → "+result.sugFolder.icon+" "+result.sugFolder.name:""}`, "success");}
      }catch(err){toast("Erro em "+file.name+": "+err.message,"error");}
    }
    setUploadProgress({current:0,total:0,name:""});setTab("fornecedores");
  };

  const handleClFile=async e=>{
    const files=Array.from(e.target.files||[]);if(!files.length)return;
    setShowUploadMenu(false);if(clFileRef.current)clFileRef.current.value="";
    toast(`A processar ${files.length} fatura(s)...`,"info");
    const myNif=nifClean(company.nif);
    for(let i=0;i<files.length;i++){
      const file=files[i];
      setUploadProgress({current:i+1,total:files.length,name:file.name});
      try{
        const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
        const mimeType=file.type||(file.name.toLowerCase().endsWith(".pdf")?"application/pdf":"image/jpeg");
        const isImg=mimeType.startsWith("image/");
        const curFolders=foldersRef.current;
        const fList=curFolders.length>0?"PASTAS:\n"+curFolders.map(f=>`- "${f.name}"`).join("\n"):"Sem pastas.";
        const raw=await callAI([{role:"user",content:[{type:isImg?"image":"document",source:{type:"base64",media_type:mimeType,data:base64}},{type:"text",text:`Analisa esta fatura de cliente.\n${fList}\nResponde APENAS JSON:\n{"clientName":"","clientNif":null,"buyerNif":null,"invoiceNum":"","date":"DD/MM/AAAA","dueDate":null,"amount":0,"amountNet":0,"amountVAT":0,"vatRate":0,"description":"","category":"","suggestedFolder":null}`}]}]);
        const p=JSON.parse(raw.replace(/```json|```/g,"").trim());
        if(myNif){const bNif=nifClean(p.buyerNif||"");if(bNif&&bNif!==myNif){toast(`❌ NIF destinatário (${p.buyerNif}) ≠ empresa`,"error");continue;}if(!bNif)toast(`⚠ "${p.clientName}": NIF não detetado.`,"warning");}
        const dup=clientInvsRef.current.find(i=>i.invoiceNum===p.invoiceNum&&i.date===p.date);if(dup){toast("Duplicado: "+p.invoiceNum,"error");continue;}
        let sugFolder=p.suggestedFolder?curFolders.find(f=>f.name.toLowerCase()===p.suggestedFolder.toLowerCase()):null;
        if(!sugFolder)sugFolder=matchFolder(curFolders,{supplier:p.clientName||"",description:p.description||"",category:p.category||""});
        const inv={id:"clinv_"+Date.now()+"_"+Math.random().toString(36).slice(2),base64,mimeType,fileName:file.name,clientName:p.clientName||"Desconhecido",clientNif:p.clientNif||null,buyerNif:p.buyerNif||null,invoiceNum:p.invoiceNum||"-",date:p.date||"-",dueDate:p.dueDate||null,payDate:null,amount:p.amount||0,amountNet:p.amountNet||0,amountVAT:p.amountVAT||0,vatRate:p.vatRate||null,description:p.description||"-",category:p.category||"",status:"não recebida",folderId:sugFolder?sugFolder.id:null,history:[],notes:"",addedAt:new Date().toISOString()};
        storeFile(inv.id,base64,mimeType,file.name);
        await saveClientInvs([inv,...clientInvsRef.current]);
        toast(`✓ "${p.clientName}"${sugFolder?" → "+sugFolder.name:""}`, "success");
      }catch(err){toast("Erro: "+err.message,"error");}
    }
    setUploadProgress({current:0,total:0,name:""});setTab("clientes");
  };

  const handleReceiptUpload=async(e,inv)=>{
    const file=e.target.files[0];if(!file)return;
    e.target.value="";setReceiptUploading(inv.id);
    const isClientInv=!!inv.clientName;
    try{
      const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const mimeType=file.type||(file.name.toLowerCase().endsWith(".pdf")?"application/pdf":"image/jpeg");
      toast("A validar comprovativo...","info");
      const raw=await callAI([{role:"user",content:[{type:mimeType.startsWith("image/")?"image":"document",source:{type:"base64",media_type:mimeType,data:base64}},{type:"text",text:`Comprovativo de pagamento. APENAS JSON:\n{"amount":0,"date":"DD/MM/AAAA"}`}]}]);
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const receiptAmt=Math.abs(parsed.amount||0),invoiceAmt=inv.amountToPay||inv.amount||0;
      const match=Math.abs(receiptAmt-invoiceAmt)<0.05;
      storeFile(inv.id+"_receipt",base64,mimeType,file.name);
      const receipt={fileName:file.name,addedAt:todayStr(),amount:receiptAmt,validated:match,date:parsed.date||todayStr(),hasFile:true};
      if(isClientInv)await updClInv(inv.id,{receipt,status:match?"recebida":inv.status,payDate:match?todayStr():inv.payDate});
      else await updInv(inv.id,{receipt,status:match?"paga":inv.status,wfStatus:match?"paga":inv.wfStatus,paidAt:match?todayStr():inv.paidAt});
      if(match)toast(`✅ Validado — ${fmt(receiptAmt)} corresponde.`,"success");
      else toast(`⚠ Guardado — ${fmt(receiptAmt)} difere de ${fmt(invoiceAmt)}.`,"warning");
    }catch(err){toast("Erro: "+err.message,"error");}
    setReceiptUploading(null);
  };

  const handleBankFile=async e=>{
    const file=e.target.files[0];if(!file)return;
    if(bankFileRef.current)bankFileRef.current.value="";
    const name=file.name.toLowerCase();
    const isPDF=name.endsWith(".pdf")||file.type.includes("pdf");
    const isXLSX=name.endsWith(".xlsx")||name.endsWith(".xls");
    const isCSV=name.endsWith(".csv")||name.endsWith(".txt");
    if(isPDF){
      toast("A ler PDF com IA...","info");
      try{
        const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
        const raw=await callAI([{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}},{type:"text",text:`Extrai TODOS os movimentos bancários. APENAS JSON array:\n[{"date":"DD/MM/AAAA","description":"","amount":0}]`}]}]);
        const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
        if(!Array.isArray(parsed)||parsed.length===0){toast("Nenhum movimento detetado.","error");return;}
        setBankPdfRows(parsed.map((r,i)=>({...r,id:"bank_"+Date.now()+"_"+i,date:normDate(r.date),matched:null})));
        setShowBankReview(true);
      }catch(err){toast("Erro: "+err.message,"error");}
    }else if(isXLSX||isCSV){
      toast("A processar ficheiro...","info");
      try{
        let rows2d=[];
        if(isXLSX){
          const loadXLSX=()=>new Promise((res,rej)=>{if(window.XLSX){res(window.XLSX);return;}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=()=>res(window.XLSX);s.onerror=()=>rej(new Error("Falha SheetJS"));document.head.appendChild(s);});
          const XL=await loadXLSX();const buf=await file.arrayBuffer();const wb=XL.read(buf,{type:"array",cellDates:true});
          let best=wb.SheetNames[0],bestCnt=0;
          for(const sn of wb.SheetNames){const ws=wb.Sheets[sn];const ref=ws["!ref"];if(!ref)continue;const range=XL.utils.decode_range(ref);const cnt=(range.e.r-range.s.r)+1;if(cnt>bestCnt){bestCnt=cnt;best=sn;}}
          rows2d=XL.utils.sheet_to_json(wb.Sheets[best],{header:1,defval:null,raw:false});
        }else{
          const text=await file.text();const sep=text.includes(";")?";":",";
          rows2d=text.split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split(sep).map(c=>c.replace(/^"|"$/g,"").trim()));
        }
        const extracted=genericParser(rows2d);
        if(!extracted||extracted.length===0){toast("Não foi possível extrair movimentos.","error");return;}
        setBankPdfRows(extracted);setShowBankReview(true);
      }catch(err){toast("Erro: "+err.message,"error");}
    }else{toast("Formato não suportado.","error");}
  };

  const confirmBankImport=async rows=>{
    const upd=[...bankRows,...rows];setBankRows(upd);await safeSet(SK.bankRows,upd);
    setShowBankReview(false);setBankPdfRows(null);
    const ui=[...invoices],ub=[...upd];let matched=0;
    ub.forEach(b=>{if(b.matched)return;const m=ui.find(i=>i.status==="paga"&&!i.bankMatched&&Math.abs((i.amountToPay||i.amount||0)-Math.abs(b.amount))<0.02);if(m){m.bankMatched=b.id;b.matched=m.id;matched++;}});
    if(matched>0){setInvoices(ui);await safeSet(SK.invoices,stripFiles(ui));setBankRows(ub);await safeSet(SK.bankRows,ub);}
    toast(rows.length+" movimentos importados"+(matched>0?` · ${matched} reconciliados`:"")+".", "success");
  };

  const openManual=(isClient)=>{
    setManualIsClient(isClient);
    setManualForm({supplier:"",nif:"",invoiceNum:"",date:"",dueDate:"",amount:"",amountVAT:"",description:"",category:"",folderId:"",clientName:""});
    setShowManualInv(true);
    setShowUploadMenu(false);
  };

  const saveManualInv=async()=>{
    const f=manualForm;
    if(!manualIsClient&&!f.supplier.trim()){toast("Preenche o fornecedor.","error");return;}
    if(manualIsClient&&!f.clientName.trim()){toast("Preenche o nome do cliente.","error");return;}
    if(!f.amount){toast("Preenche o valor.","error");return;}
    const id=(manualIsClient?"clinv_":"inv_")+Date.now()+"_"+Math.random().toString(36).slice(2);
    if(manualIsClient){
      const inv={id,clientName:f.clientName.trim(),clientNif:f.nif||null,invoiceNum:f.invoiceNum||"-",date:isoToDisplay(f.date)||todayStr(),dueDate:f.dueDate?isoToDisplay(f.dueDate):null,amount:parseFloat(f.amount)||0,amountVAT:parseFloat(f.amountVAT)||0,description:f.description||"-",category:f.category||"",status:"não recebida",folderId:f.folderId||null,history:[],notes:"",addedAt:new Date().toISOString()};
      await saveClientInvs([inv,...clientInvsRef.current]);
    }else{
      const inv={id,supplier:f.supplier.trim(),nif:f.nif||null,invoiceNum:f.invoiceNum||"-",date:isoToDisplay(f.date)||todayStr(),dueDate:f.dueDate?isoToDisplay(f.dueDate):null,amount:parseFloat(f.amount)||0,amountVAT:parseFloat(f.amountVAT)||0,amountToPay:parseFloat(f.amount)||0,description:f.description||"-",category:f.category||"",folderId:f.folderId||null,status:"pendente",wfStatus:"pendente",isCredit:false,trendAlert:null,history:[],notes:"",receipt:null,bankMatched:null,addedAt:new Date().toISOString()};
      await saveInvoices([inv,...invoicesRef.current]);
    }
    setShowManualInv(false);
    toast("Fatura adicionada!","success");
    setTab(manualIsClient?"clientes":"fornecedores");
  };

  const addFolder=async nameOverride=>{
    const name=(nameOverride||newFolder.name).trim();if(!name)return null;
    const col=FOLDER_COLORS[newFolder.colorIdx]||FOLDER_COLORS[0];
    const newF={id:Date.now(),name,icon:newFolder.icon,color:col};
    const upd=[...foldersRef.current,newF];setFolders(upd);await safeSet(SK.folders,upd);
    setNewFolder({name:"",icon:"📁",colorIdx:0});setShowAddFolder(false);
    toast(`Pasta "${name}" criada!`,"success");return newF;
  };
  const deleteFolder=async id=>{
    await saveInvoices(invoices.map(i=>i.folderId===id?{...i,folderId:null}:i));
    await saveClientInvs(clientInvs.map(i=>i.folderId===id?{...i,folderId:null}:i));
    const upd=folders.filter(f=>f.id!==id);setFolders(upd);await safeSet(SK.folders,upd);toast("Pasta removida.","info");
  };
  const confirmSuggestFolder=async folderId=>{
    if(!suggestModal)return;
    await saveInvoices(invoices.map(i=>i.id===suggestModal.inv.id?{...i,folderId}:i));
    setSuggestModal(null);setSuggestNewName("");toast("Fatura organizada!","success");
  };
  const createAndAssign=async()=>{
    if(!suggestNewName.trim())return;
    const newF=await addFolder(suggestNewName);
    if(newF&&suggestModal)await saveInvoices(invoices.map(i=>i.id===suggestModal.inv.id?{...i,folderId:newF.id}:i));
    setSuggestModal(null);setSuggestNewName("");toast("Pasta criada e fatura associada!","success");
  };
  const addCl=async()=>{if(!newCl.name.trim())return;const upd=[...clients,{id:Date.now(),...newCl}];setClients(upd);await safeSet(SK.clients,upd);setNewCl({name:"",nif:"",email:"",phone:""});setShowAddCl(false);toast("Cliente adicionado!","success");};
  const saveSettings=async()=>{const co={...settingsForm,nif:settingsForm.nif.trim()};setCompany(co);await safeSet(SK.company,co);setShowSettings(false);toast("Definições guardadas!","success");};
  const saveNote=async()=>{
    if(!noteEditId)return;
    if(clientInvs.some(i=>i.id===noteEditId))await updClInv(noteEditId,{notes:noteText});
    else await updInv(noteEditId,{notes:noteText});
    setNoteEditId(null);setNoteText("");toast("Nota guardada!","success");
  };

  const exportPDF=()=>{
    const now=new Date().toLocaleDateString("pt-PT");
    const rows=[["Tipo","Entidade","Nº Fatura","Data","Vencimento","Valor","IVA","Pasta","Estado"]];
    nonCr.forEach(i=>{const f=getFolder(i);rows.push(["Fornecedor",i.supplier||"",i.invoiceNum||"",i.date||"",i.dueDate||"",fmt(i.amount),fmt(i.amountVAT),f?f.name:"",WF_LABELS[i.wfStatus]||"",]);});
    clientInvs.forEach(i=>{const f=folders.find(f=>f.id===i.folderId);rows.push(["Cliente",i.clientName||"",i.invoiceNum||"",i.date||"",i.dueDate||"",fmt(i.amount),fmt(i.amountVAT),f?f.name:"",i.status||""]);});
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>InVoiced — Relatório ${now}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:22px;margin-bottom:4px}p{color:#666;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#9B59F5;color:#fff;padding:8px 10px;text-align:left;font-size:11px}td{padding:8px 10px;border-bottom:1px solid #eee;font-size:11px}tr:nth-child(even)td{background:#f9f9f9}.totals{font-weight:bold;font-size:13px;margin-top:16px;padding:12px;background:#f4f4f8;border-radius:8px;display:flex;gap:24px}</style></head><body><h1>InVoiced — Relatório</h1><p>${company.name||""} ${company.nif?"· NIF "+company.nif:""} · ${now}</p><div class="totals"><span>Faturado: ${fmt(totFat)}</span><span>Pago: ${fmt(totPag)}</span><span>Pendente: ${fmt(totPend)}</span><span>Emitido: ${fmt(totEmit)}</span><span>Recebido: ${fmt(totRec)}</span></div><table><thead><tr>${rows[0].map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);
    toast("A abrir para impressão...","success");
  };

  const sendChat=async()=>{
    if(!chatIn.trim()||chatLoad)return;
    const q=chatIn.trim();setChatIn("");
    setChatMsgs(m=>[...m,{role:"user",text:q},{role:"ai",text:"O assistente de IA será adicionado em breve. Por agora podes consultar os dados diretamente nos separadores."}]);
  };

  // ── Filter helpers ─────────────────────────────────────────────────────
  const sortFn=(arr,sb,nameKey="supplier")=>{
    const a=[...arr];
    if(sb==="date_desc")return a.sort((x,y)=>(y.date||"").localeCompare(x.date||""));
    if(sb==="date_asc")return a.sort((x,y)=>(x.date||"").localeCompare(y.date||""));
    if(sb==="amount_desc")return a.sort((x,y)=>(y.amount||0)-(x.amount||0));
    if(sb==="amount_asc")return a.sort((x,y)=>(x.amount||0)-(y.amount||0));
    if(sb==="alpha")return a.sort((x,y)=>(x[nameKey]||"").localeCompare(y[nameKey]||""));
    return a;
  };

  const filtered=sortFn(invoices.filter(inv=>{
    if(fStatus==="paga"&&inv.status!=="paga")return false;
    if(fStatus==="pendente"&&inv.status==="paga")return false;
    if(fStatus==="aguarda_aprovacao"&&inv.wfStatus!=="aguarda_aprovacao")return false;
    if(fStatus==="aprovada"&&inv.wfStatus!=="aprovada")return false;
    if(fStatus==="credito"&&!inv.isCredit)return false;
    if(fStatus==="vencida"&&!isOD(inv))return false;
    if(fStatus==="alerta"&&!inv.trendAlert)return false;
    if(fFolder!=="todos"){if(fFolder==="sem"&&inv.folderId)return false;if(fFolder!=="sem"&&String(inv.folderId)!==fFolder)return false;}
    if(search){const q=search.toLowerCase();const f=getFolder(inv);if(!((inv.supplier||"").toLowerCase().includes(q)||(inv.invoiceNum||"").toLowerCase().includes(q)||(inv.description||"").toLowerCase().includes(q)||(f?.name||"").toLowerCase().includes(q)))return false;}
    if(dateFrom){const d=parseD(inv.date);if(!d||d<new Date(dateFrom))return false;}
    if(dateTo){const d=parseD(inv.date);if(!d||d>new Date(dateTo))return false;}
    return true;
  }),sortBy);

  const filteredCl=sortFn(clientInvs.filter(inv=>{
    if(clStatus==="recebida"&&inv.status!=="recebida")return false;
    if(clStatus==="pendente"&&inv.status==="recebida")return false;
    if(clStatus==="vencida"&&!isOD(inv))return false;
    if(clFolder!=="todos"){if(clFolder==="sem"&&inv.folderId)return false;if(clFolder!=="sem"&&String(inv.folderId)!==clFolder)return false;}
    if(clSearch){const q=clSearch.toLowerCase();if(!((inv.clientName||"").toLowerCase().includes(q)||(inv.invoiceNum||"").toLowerCase().includes(q)||(inv.description||"").toLowerCase().includes(q)))return false;}
    if(clDateFrom){const d=parseD(inv.date);if(!d||d<new Date(clDateFrom))return false;}
    if(clDateTo){const d=parseD(inv.date);if(!d||d>new Date(clDateTo))return false;}
    return true;
  }),clSortBy,"clientName");

  // group filtered clients by clientName
  const clGroupsFiltered=()=>{
    const map={};
    filteredCl.forEach(inv=>{
      const k=(inv.clientName||"?").toLowerCase().replace(/\s+/g,"_");
      if(!map[k])map[k]={key:k,label:inv.clientName||"?",nif:inv.clientNif||null,items:[],received:0,pending:0,total:0};
      map[k].items.push(inv);map[k].total+=(inv.amount||0);
      if(inv.status==="recebida")map[k].received+=(inv.amount||0);else map[k].pending+=(inv.amount||0);
    });
    return Object.values(map).sort((a,b)=>b.total-a.total);
  };

  const sel=(val,onChange,opts)=><select value={val} onChange={e=>onChange(e.target.value)} style={{fontSize:12,borderRadius:9,border:"1px solid "+C.border,padding:"7px 9px",background:C.bgElevated,outline:"none",color:C.textSecond,cursor:"pointer"}}>{opts}</select>;

  const TABS=[["dashboard","Dashboard"],["fornecedores","Fornecedores"],["clientes","Clientes"],["pastas","Pastas"],["reconciliacao","Reconciliação"],["assistente","Assistente ✦"]];
  const noNif=!company.nif;

  const pieData=groupBy=>{
    if(!groupBy)return[];
    if(groupBy==="pastas"){const map={};nonCr.forEach(inv=>{const f=getFolder(inv);const key=f?String(f.id):"sem";if(!map[key])map[key]={label:f?f.icon+" "+f.name:"Sem pasta",value:0};map[key].value+=(inv.amount||0);});return Object.values(map).sort((a,b)=>b.value-a.value);}
    if(groupBy==="categoria"){const map={};nonCr.forEach(inv=>{const key=inv.category||"Outra";if(!map[key])map[key]={label:key,value:0};map[key].value+=(inv.amount||0);});return Object.values(map).sort((a,b)=>b.value-a.value);}
    if(groupBy==="fornecedor"){const map={};nonCr.forEach(inv=>{const key=inv.supplier||"?";if(!map[key])map[key]={label:key,value:0};map[key].value+=(inv.amount||0);});return Object.values(map).sort((a,b)=>b.value-a.value);}
    return[];
  };
  const barData=groupBy=>{
    if(groupBy==="pastas"){const map={};nonCr.forEach(inv=>{const f=getFolder(inv);const key=f?String(f.id):"sem";if(!map[key])map[key]={label:f?f.icon+" "+f.name:"Sem pasta",paid:0,pending:0};if(inv.status==="paga")map[key].paid+=(inv.amount||0);else map[key].pending+=(inv.amount||0);});return Object.values(map).sort((a,b)=>(b.paid+b.pending)-(a.paid+a.pending)).slice(0,8);}
    if(groupBy==="fornecedores"){const map={};nonCr.forEach(inv=>{const key=(inv.supplier||"?").toLowerCase().replace(/\s+/g,"_");if(!map[key])map[key]={label:inv.supplier||"?",paid:0,pending:0};if(inv.status==="paga")map[key].paid+=(inv.amount||0);else map[key].pending+=(inv.amount||0);});return Object.values(map).sort((a,b)=>(b.paid+b.pending)-(a.paid+a.pending)).slice(0,8);}
    if(groupBy==="clientes"){const map={};clientInvs.forEach(inv=>{const key=(inv.clientName||"?").toLowerCase().replace(/\s+/g,"_");if(!map[key])map[key]={label:inv.clientName||"?",paid:0,pending:0};if(inv.status==="recebida")map[key].paid+=(inv.amount||0);else map[key].pending+=(inv.amount||0);});return Object.values(map).sort((a,b)=>(b.paid+b.pending)-(a.paid+a.pending)).slice(0,8);}
    return[];
  };
  const monthChart=()=>{const months=[];const now=new Date();for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");const label=d.toLocaleDateString("pt-PT",{month:"short"}).replace(".","");months.push({key,label,paid:0,pending:0});}nonCr.forEach(inv=>{const parts=(inv.date||"").split("/");if(parts.length<3)return;const key=parts[2]+"-"+parts[1];const m=months.find(x=>x.key===key);if(!m)return;if(inv.status==="paga")m.paid+=(inv.amount||0);else m.pending+=(inv.amount||0);});return months;};

  const bankMonths=[...new Set(bankRows.map(b=>{const p=(b.date||"").split("/");return p.length>=3?p[2]+"-"+p[1]:null;}).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
  const mLabel=m=>{const[y,mo]=m.split("-");return(MONTH_NAMES[parseInt(mo)-1]||"")+" "+y;};
  const filteredBank=bankRows.filter(b=>{if(bankFilter==="por_reconciliar"&&b.matched)return false;if(bankFilter==="reconciliado"&&!b.matched)return false;if(bankMonth){const p=(b.date||"").split("/");if(p.length<3||p[2]+"-"+p[1]!==bankMonth)return false;}return true;});
  const totalMatched=bankRows.filter(b=>b.matched).length;
  const reconRate=bankRows.length>0?Math.round((totalMatched/bankRows.length)*100):0;
  const suggestions=[];
  const usedInv=new Set(),usedBank=new Set();
  for(const b of bankRows.filter(x=>!x.matched)){const amt=Math.abs(b.amount);const inv=unmatchedInvs.find(i=>!usedInv.has(i.id)&&Math.abs((i.amountToPay||i.amount||0)-amt)<0.02);if(inv){suggestions.push({b,inv,confidence:"exact",diff:0});usedInv.add(inv.id);usedBank.add(b.id);}}
  for(const b of bankRows.filter(x=>!x.matched&&!usedBank.has(x.id))){const amt=Math.abs(b.amount);const inv=unmatchedInvs.find(i=>!usedInv.has(i.id)&&Math.abs((i.amountToPay||i.amount||0)-amt)<2);if(inv){const diff=Math.abs((inv.amountToPay||inv.amount||0)-amt);suggestions.push({b,inv,confidence:"approx",diff});usedInv.add(inv.id);usedBank.add(b.id);}}
  const doReconcile=(bankId,invId)=>{const updB=bankRows.map(b=>b.id===bankId?{...b,matched:invId}:b);const updI=invoices.map(i=>i.id===invId?{...i,bankMatched:bankId}:i);setBankRows(updB);safeSet(SK.bankRows,updB);saveInvoices(updI);toast("✓ Reconciliado!","success");};
  const undoReconcile=(bankId,invId)=>{const updB=bankRows.map(b=>b.id===bankId?{...b,matched:null}:b);const updI=invoices.map(i=>i.id===invId?{...i,bankMatched:null}:i);setBankRows(updB);safeSet(SK.bankRows,updB);saveInvoices(updI);toast("Desfeito.","info");};

  const now=new Date();
  const in7=new Date(now);in7.setDate(now.getDate()+7);
  const in30=new Date(now);in30.setDate(now.getDate()+30);
  const dueSoonAlerts=[
    ...nonCr.filter(i=>{if(i.status==="paga")return false;const d=parseD(i.dueDate);return d&&d<=in30;}).map(i=>({...i,_type:"forn",_daysLeft:Math.ceil((parseD(i.dueDate)-now)/86400000)})),
    ...clientInvs.filter(i=>{if(i.status==="recebida")return false;const d=parseD(i.dueDate);return d&&d<=in30;}).map(i=>({...i,_type:"cli",_daysLeft:Math.ceil((parseD(i.dueDate)-now)/86400000)})),
  ].sort((a,b)=>a._daysLeft-b._daysLeft).slice(0,8);
  const upcoming=[...nonCr,...clientInvs].filter(i=>{if(i.status==="paga"||i.status==="recebida")return false;const dd=parseD(i.dueDate);return dd&&dd>=now&&dd<=in7;}).sort((a,b)=>(a.dueDate||"").localeCompare(b.dueDate||""));
  const awaitingApproval=invoices.filter(i=>i.wfStatus==="aguarda_aprovacao");

  const inputStyle={width:"100%",fontSize:13,borderRadius:10,border:"1px solid "+C.border,padding:"10px 13px",background:C.bgElevated,color:C.textPrimary,outline:"none"};
  const miniBtn=(label,onClick,bg,col)=><button onClick={onClick} style={{background:bg,border:"none",borderRadius:5,padding:"3px 7px",fontSize:9,fontWeight:600,color:col,cursor:"pointer"}}>{label}</button>;

  if(!ready)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:16,fontFamily:"-apple-system,sans-serif",background:C.bg}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{width:48,height:48,borderRadius:"50%",background:C.grad,animation:"spin 1s linear infinite",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:36,height:36,borderRadius:"50%",background:C.bg}}/></div>
      <p style={{color:C.textPrimary,fontSize:18,margin:0,fontWeight:800}}>InVoiced</p>
      <p style={{color:C.textMuted,fontSize:13,margin:0}}>A carregar...</p>
    </div>
  );

  return(
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",background:C.bg,minHeight:"100vh",color:C.textPrimary}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} button,select,input,textarea{font-family:inherit} ::placeholder{color:"+C.textMuted+"}"}</style>
      <Toast toasts={toasts} C={C}/>
      <UploadProgress current={uploadProgress.current} total={uploadProgress.total} name={uploadProgress.name} C={C}/>
      <OnboardingTour step={onboardStep} C={C} onNext={()=>{if(onboardStep>=ONBOARDING_STEPS.length-1){setOnboardStep(-1);safeSet(SK.onboarding,true);}else setOnboardStep(s=>s+1);}} onSkip={()=>{setOnboardStep(-1);safeSet(SK.onboarding,true);}}/>
      <ConfirmDialog open={!!confirmDel} msg={confirmDel?.msg} C={C} onCancel={()=>setConfirmDel(null)} onConfirm={()=>{confirmDel?.fn();setConfirmDel(null);}}/>

      {/* Duplicate confirm */}
      {dupConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setDupConfirm(null)}>
          <div style={{background:C.bgCard,borderRadius:16,padding:28,maxWidth:360,width:"100%",border:"1px solid "+C.purpleBord}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:22,textAlign:"center",margin:"0 0 12px"}}>📋</p>
            <p style={{fontSize:14,fontWeight:700,color:C.textPrimary,textAlign:"center",margin:"0 0 8px"}}>Duplicar fatura?</p>
            <p style={{fontSize:12,color:C.textMuted,textAlign:"center",margin:"0 0 20px"}}>Será criada uma cópia com data de hoje e estado pendente.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDupConfirm(null)} style={{flex:1,background:C.bgElevated,border:"1px solid "+C.border,borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textPrimary}}>Cancelar</button>
              <button onClick={()=>duplicateInv(dupConfirm)} style={{flex:1,background:C.grad,border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff"}}>Duplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{background:darkMode?"rgba(22,22,30,.95)":"rgba(255,255,255,.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid "+C.border,position:"sticky",top:0,zIndex:200,padding:"0 20px"}}>
        <div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:32,height:32,borderRadius:9,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:16,fontWeight:900,fontStyle:"italic"}}>N</span></div>
            <div style={{lineHeight:1}}>
              <div style={{fontWeight:900,fontSize:14,background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>InVoiced 2.0</div>
              <div style={{fontSize:9,color:company.nif?C.green:C.textMuted,fontWeight:600,marginTop:2}}>{company.name||company.nif?(company.name||"NIF "+company.nif):"⚠ Configure a empresa"}</div>
            </div>
          </div>
          <nav style={{display:"flex",gap:1,background:C.bgElevated,padding:3,borderRadius:12,border:"1px solid "+C.border}}>
            {TABS.map(([key,label])=>(
              <button key={key} onClick={()=>{setTab(key);setCalView(false);}} style={{background:tab===key?C.bgCard:"transparent",border:tab===key?"1px solid "+C.border:"1px solid transparent",borderRadius:9,padding:"5px 10px",fontSize:11,fontWeight:tab===key?700:500,color:tab===key?C.textPrimary:C.textMuted,cursor:"pointer",whiteSpace:"nowrap",position:"relative",boxShadow:tab===key?"0 1px 4px rgba(0,0,0,.1)":"none"}}>
                {label}
                {key==="fornecedores"&&(unkCt+alertCt+missingReceipts.length)>0&&<span style={{position:"absolute",top:0,right:2,background:C.red,color:"#fff",borderRadius:99,minWidth:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,padding:"0 3px"}}>{unkCt+alertCt+missingReceipts.length}</span>}
                {key==="clientes"&&(clVenc.length+clMissingReceipts.length)>0&&<span style={{position:"absolute",top:0,right:2,background:C.amber,color:"#fff",borderRadius:99,minWidth:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,padding:"0 3px"}}>{clVenc.length+clMissingReceipts.length}</span>}
                {key==="reconciliacao"&&unmatchedBank.length>0&&<span style={{position:"absolute",top:0,right:2,background:C.cyan,color:"#fff",borderRadius:99,minWidth:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,padding:"0 3px"}}>{unmatchedBank.length}</span>}
              </button>
            ))}
          </nav>
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
            <button onClick={toggleTheme} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:9,padding:"6px 10px",fontSize:13,cursor:"pointer",color:C.textSecond}} title="Ctrl+D">{darkMode?"☀️":"🌙"}</button>
            <button onClick={()=>setShowSettings(true)} style={{background:noNif?C.amberSoft:C.bgElevated,border:"1px solid "+(noNif?C.amberBord:C.border),borderRadius:9,padding:"6px 10px",fontSize:13,cursor:"pointer",color:noNif?C.amber:C.textSecond}}>⚙️</button>
            <button onClick={()=>{setCalView(v=>!v);setTab("dashboard");}} style={{background:calView?C.purpleSoft:C.bgElevated,border:"1px solid "+(calView?C.purpleBord:C.border),borderRadius:9,padding:"6px 10px",fontSize:13,cursor:"pointer",color:calView?C.purple:C.textSecond}}>📅</button>
            <button onClick={exportPDF} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:9,padding:"6px 10px",fontSize:13,cursor:"pointer",color:C.textSecond}} title="Exportar PDF">📋</button>
            <button onClick={()=>setShowMonthlySummary(true)} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:9,padding:"6px 10px",fontSize:13,cursor:"pointer",color:C.textSecond}} title="Resumo mensal">📅</button>
            {/* UPLOAD MENU — includes Manual */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowUploadMenu(m=>!m)} style={{background:C.grad,color:"#fff",borderRadius:9,padding:"7px 16px",fontSize:13,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,border:"none",boxShadow:"0 2px 16px rgba(155,89,245,.4)",cursor:"pointer"}} title="Ctrl+U">
                <span>↑</span>Carregar<span style={{fontSize:9,opacity:.7}}>▼</span>
              </button>
              {showUploadMenu&&(
                <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:C.bgCard,border:"1px solid "+C.border,borderRadius:14,boxShadow:"0 16px 48px rgba(0,0,0,.4)",overflow:"hidden",zIndex:9998,minWidth:260}}>
                  {/* Fornecedor PDF */}
                  <button onClick={()=>{setShowUploadMenu(false);fileRef.current?.click();}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer",width:"100%",background:"none",border:"none",borderBottom:"1px solid "+C.border,textAlign:"left"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:C.purpleSoft,border:"1px solid "+C.purpleBord,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🏢</div>
                    <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.textPrimary}}>Faturas de Fornecedor</p><p style={{margin:0,fontSize:11,color:C.textMuted}}>PDF ou imagem · múltiplas de uma vez</p></div>
                  </button>
                  {/* Cliente PDF */}
                  <button onClick={()=>{setShowUploadMenu(false);clFileRef.current?.click();}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer",width:"100%",background:"none",border:"none",borderBottom:"1px solid "+C.border,textAlign:"left"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:C.cyanSoft,border:"1px solid "+C.cyanBord,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🏷️</div>
                    <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.textPrimary}}>Faturas de Cliente</p><p style={{margin:0,fontSize:11,color:C.textMuted}}>Validação de NIF automática</p></div>
                  </button>
                  {/* Email import */}
                  <button onClick={()=>{setShowUploadMenu(false);setShowEmailImport(true);}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",cursor:"pointer",width:"100%",background:"none",border:"none",borderBottom:"1px solid "+C.border,textAlign:"left"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:C.purpleSoft,border:"1px solid "+C.purpleBord,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📧</div>
                    <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.textPrimary}}>Importar de Email</p><p style={{margin:0,fontSize:11,color:C.textMuted}}>Cola o texto do email · IA extrai os dados</p></div>
                  </button>
                  {/* Divider */}
                  <div style={{padding:"6px 16px",background:C.bgElevated}}>
                    <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:C.textMuted}}>Ou preenche manualmente</span>
                  </div>
                  {/* Manual fornecedor */}
                  <button onClick={()=>openManual(false)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",cursor:"pointer",width:"100%",background:"none",border:"none",borderBottom:"1px solid "+C.border,textAlign:"left"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:C.amberSoft,border:"1px solid "+C.amberBord,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✏️</div>
                    <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.textPrimary}}>Manual — Fornecedor</p><p style={{margin:0,fontSize:11,color:C.textMuted}}>Preenche os dados sem ficheiro</p></div>
                  </button>
                  {/* Manual cliente */}
                  <button onClick={()=>openManual(true)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",cursor:"pointer",width:"100%",background:"none",border:"none",textAlign:"left"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:C.greenSoft,border:"1px solid "+C.greenBord,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✏️</div>
                    <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.textPrimary}}>Manual — Cliente</p><p style={{margin:0,fontSize:11,color:C.textMuted}}>Preenche os dados sem ficheiro</p></div>
                  </button>
                </div>
              )}
              {showUploadMenu&&<div style={{position:"fixed",inset:0,zIndex:9997}} onClick={()=>setShowUploadMenu(false)}/>}
              <input ref={clFileRef} type="file" accept="application/pdf,image/*" multiple onChange={handleClFile} style={{display:"none"}}/>
              <input ref={fileRef} type="file" accept="application/pdf,image/*" multiple onChange={handleFile} style={{display:"none"}}/>
            </div>
          </div>
        </div>
      </header>

      {/* SHORTCUT BAR */}
      <div style={{background:C.purpleSoft,borderBottom:"1px solid "+C.purpleBord,padding:"3px 20px",display:"flex",gap:20,justifyContent:"center"}}>
        {[["Ctrl+U","Carregar"],["Ctrl+K","Assistente"],["Ctrl+D","Tema"],["Esc","Fechar modal"]].map(([k,v])=>(
          <span key={k} style={{fontSize:10,color:C.purple,fontWeight:600}}>
            <kbd style={{background:C.purpleSoft,border:"1px solid "+C.purpleBord,borderRadius:4,padding:"1px 5px",fontSize:10,fontFamily:"monospace"}}>{k}</kbd> {v}
          </span>
        ))}
      </div>

      {/* ALERT BANNER */}
      {(noNif||unkCt>0||clVenc.length>0||missingReceipts.length>0)&&(
        <div style={{background:"rgba(245,158,11,.08)",borderBottom:"1px solid "+C.amberBord,padding:"5px 20px"}}>
          <div style={{maxWidth:1180,margin:"0 auto",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
            {noNif&&<span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.amber,fontWeight:600}}>⚙️ NIF não definido <button onClick={()=>setShowSettings(true)} style={{background:C.amber,color:"#fff",border:"none",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Definir</button></span>}
            {missingReceipts.length>0&&<span style={{fontSize:12,color:C.amber,fontWeight:600}}>🧾 {missingReceipts.length} sem comprovativo</span>}
            {unkCt>0&&<span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.amber,fontWeight:600}}>📁 {unkCt} sem pasta <button onClick={()=>{setFFolder("sem");setTab("fornecedores");}} style={{background:C.amber,color:"#fff",border:"none",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Ver</button></span>}
            {clVenc.length>0&&<span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.amber,fontWeight:600}}>⏰ {clVenc.length} cliente{clVenc.length>1?"s":""} em atraso <button onClick={()=>setTab("clientes")} style={{background:C.amber,color:"#fff",border:"none",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Ver</button></span>}
          </div>
        </div>
      )}

      <main style={{maxWidth:1180,margin:"0 auto",padding:"22px 20px"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&calView&&(
          <CalendarView calMonth={calMonth} setCalMonth={setCalMonth} nonCr={nonCr} clientInvs={clientInvs} C={C} setDetailInv={setDetailInv} setDtab={setDtab}/>
        )}
        {tab==="dashboard"&&!calView&&(
          <DashboardPage
            C={C} nonCr={nonCr} clientInvs={clientInvs} folders={folders} invoices={invoices} company={company}
            venc={venc} clVenc={clVenc} cf30={cf30} cf60={cf60} cf90={cf90}
            totFat={totFat} totPag={totPag} totPend={totPend} totEmit={totEmit} totRec={totRec} totPRec={totPRec}
            paidCt={paidCt} pendCt={pendCt} awaitingApproval={awaitingApproval}
            updInv={updInv} updClInv={updClInv}
            setShowSettings={setShowSettings} setTab={setTab} setDetailInv={setDetailInv} setDtab={setDtab}
            setShowUploadMenu={setShowUploadMenu} setOnboardStep={setOnboardStep}
          />
        )}

        {/* ── FORNECEDORES ── */}
        {tab==="fornecedores"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:8,marginBottom:14}}>
              {[
                {label:"Total",val:nonCr.length,color:C.textPrimary,icon:"📄"},
                {label:"Pendentes",val:nonCr.filter(i=>!i.wfStatus||i.wfStatus==="pendente").length,color:C.amber,icon:"⏳"},
                {label:"Ag. Aprovação",val:nonCr.filter(i=>i.wfStatus==="aguarda_aprovacao").length,color:C.cyan,icon:"🔔"},
                {label:"Aprovadas",val:nonCr.filter(i=>i.wfStatus==="aprovada").length,color:C.purple,icon:"✓"},
                {label:"Pagas",val:paidCt,color:C.green,icon:"✅"},
              ].map(m=>(
                <div key={m.label} style={{background:C.bgCard,borderRadius:12,border:"1px solid "+C.border,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,color:C.textMuted}}>{m.label}</span><span style={{fontSize:13}}>{m.icon}</span></div>
                  <p style={{fontSize:20,fontWeight:800,margin:0,color:m.color}}>{m.val}</p>
                </div>
              ))}
            </div>
            <div style={{background:C.bgCard,borderRadius:12,border:"1px solid "+C.border,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{position:"relative",flex:1,minWidth:140}}>
                <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.textMuted}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar..." style={{width:"100%",fontSize:12,borderRadius:8,border:"1px solid "+C.border,padding:"7px 10px 7px 28px",outline:"none",background:C.bgElevated,color:C.textPrimary}}/>
              </div>
              {sel(fFolder,setFFolder,<><option value="todos">Todas as pastas</option><option value="sem">Sem pasta</option>{folders.map(f=><option key={f.id} value={String(f.id)}>{f.icon} {f.name}</option>)}</>)}
              {sel(fStatus,setFStatus,<><option value="todos">Todos</option><option value="pendente">Pendentes</option><option value="aguarda_aprovacao">Ag. Aprovação</option><option value="aprovada">Aprovadas</option><option value="paga">Pagas</option><option value="vencida">Vencidas</option><option value="credito">Notas crédito</option><option value="alerta">Alertas</option></>)}
              {sel(sortBy,setSortBy,<><option value="date_desc">Data ↓</option><option value="date_asc">Data ↑</option><option value="amount_desc">Valor ↓</option><option value="amount_asc">Valor ↑</option><option value="alpha">A-Z</option></>)}
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:12,borderRadius:8,border:"1px solid "+C.border,padding:"7px 9px",background:C.bgElevated,color:C.textSecond,outline:"none"}}/>
              <span style={{fontSize:11,color:C.textMuted}}>a</span>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:12,borderRadius:8,border:"1px solid "+C.border,padding:"7px 9px",background:C.bgElevated,color:C.textSecond,outline:"none"}}/>
              {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{background:C.redSoft,border:"none",borderRadius:7,padding:"5px 9px",fontSize:11,color:C.red,cursor:"pointer",fontWeight:600}}>✕</button>}
              <span style={{fontSize:12,color:C.textMuted,marginLeft:"auto"}}>{filtered.length} resultado{filtered.length!==1?"s":""}</span>
            </div>
            {filtered.length===0?(
              <Card C={C} sx={{textAlign:"center",padding:"3rem 2rem"}}>
                <p style={{fontSize:36,margin:"0 0 12px"}}>📄</p>
                {invoices.length===0?(
                  <div>
                    <p style={{fontSize:15,fontWeight:700,marginBottom:12,color:C.textPrimary}}>Nenhuma fatura ainda</p>
                    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                      <button onClick={()=>openManual(false)} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textPrimary}}>✏️ Adicionar manualmente</button>
                      <button onClick={()=>fileRef.current?.click()} style={{background:C.grad,border:"none",borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff"}}>↑ Carregar PDF</button>
                    </div>
                  </div>
                ):(
                  <p style={{fontSize:13,color:C.textMuted,margin:0}}>Sem resultados para este filtro.</p>
                )}
              </Card>
            ):(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 210px",padding:"6px 16px",marginBottom:4}}>
                  {["Fornecedor","Nº Fatura","Data","Pasta","Valor","Estado"].map(h=><span key={h} style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.7,color:C.textMuted}}>{h}</span>)}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {filtered.map(inv=>{
                    const od=isOD(inv);
                    return(
                      <div key={inv.id} style={{background:C.bgCard,borderRadius:12,border:"1px solid "+C.border,borderLeft:"3px solid "+(od?C.red:inv.isCredit?C.purple:inv.trendAlert?C.amber:"transparent")}}>
                        {od&&<div style={{background:C.redSoft,padding:"3px 16px",borderBottom:"1px solid "+C.redBord,borderRadius:"10px 10px 0 0"}}><span style={{fontSize:10,color:C.red,fontWeight:600}}>⚠ Vencida em {inv.dueDate}</span></div>}
                        {inv.trendAlert&&<div style={{background:C.amberSoft,padding:"3px 16px",borderBottom:"1px solid "+C.amberBord}}><span style={{fontSize:10,color:C.amber,fontWeight:600}}>📈 {inv.trendAlert}</span></div>}
                        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 210px",padding:"11px 16px",alignItems:"center",gap:4}}>
                          <div style={{minWidth:0,display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:32,height:32,borderRadius:9,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{(inv.supplier||"?")[0].toUpperCase()}</div>
                            <div style={{minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                <p style={{margin:0,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textPrimary}}>{inv.supplier}</p>
                                <DueBadge dueDate={inv.dueDate} status={inv.status} C={C}/>
                              </div>
                              <p style={{margin:0,fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.description}</p>
                              {inv.notes&&<p style={{margin:"2px 0 0",fontSize:10,color:C.purple,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📝 {inv.notes}</p>}
                            </div>
                          </div>
                          <div>
                            <p style={{margin:0,fontSize:12,fontWeight:600,color:C.textSecond}}>{inv.invoiceNum}</p>
                            {inv.nif&&<p style={{margin:0,fontSize:10,color:C.textMuted}}>NIF {inv.nif}</p>}
                          </div>
                          <div>
                            <p style={{margin:0,fontSize:12,color:C.textSecond}}>{inv.date}</p>
                            {inv.dueDate&&<p style={{margin:0,fontSize:10,color:od?C.red:C.textMuted}}>Vence {inv.dueDate}</p>}
                          </div>
                          <FolderPicker C={C} inv={inv} folders={folders} onAssign={fid=>updInv(inv.id,{folderId:fid})}/>
                          <div>
                            <p style={{margin:0,fontSize:14,fontWeight:800,color:C.textPrimary}}>{fmt(inv.amount)}</p>
                            {inv.status==="paga"&&inv.receipt?.hasFile&&<span style={{fontSize:9,color:inv.receipt.validated?C.green:C.amber,fontWeight:700}}>{inv.receipt.validated?"✅ Validado":"⚠ Diverge"}</span>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            <StatusPicker C={C} inv={inv} onUpdate={ch=>updInv(inv.id,ch)}/>
                            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                              <label style={{background:C.greenSoft,border:"none",borderRadius:5,padding:"3px 6px",fontSize:9,fontWeight:600,color:C.green,cursor:"pointer",display:"inline-flex",alignItems:"center"}}>
                                {receiptUploading===inv.id?"⏳":"🧾"}
                                <input type="file" accept="application/pdf,image/*" onChange={e=>handleReceiptUpload(e,inv)} style={{display:"none"}} disabled={receiptUploading===inv.id}/>
                              </label>
                              {miniBtn("📝",()=>{setNoteEditId(inv.id);setNoteText(inv.notes||"");},C.purpleSoft,C.purple)}
                              {miniBtn("📋",()=>setDupConfirm(inv),C.cyanSoft,C.cyan)}
                              {miniBtn("✎",()=>{setEditingInv(inv);setEditFields({supplier:inv.supplier||"",invoiceNum:inv.invoiceNum||"",date:inv.date||"",dueDate:inv.dueDate||"",amount:inv.amount||0,amountToPay:inv.amountToPay||0,description:inv.description||""});},C.amberSoft,C.amber)}
                              {miniBtn("ℹ",()=>{setDetailInv(inv);setDtab("info");},C.bgElevated,C.textSecond)}
                              {miniBtn("✕",()=>setConfirmDel({msg:`Apagar fatura de "${inv.supplier}"?`,fn:()=>delInv(inv.id)}),C.redSoft,C.red)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTES ── */}
        {tab==="clientes"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8}}>
              <KpiCard C={C} label="Total Emitido" icon="📤" val={fmt(totEmit)} sub={clientInvs.length+" faturas"}/>
              <KpiCard C={C} label="Recebido" icon="↓" val={fmt(totRec)} sub={clientInvs.filter(i=>i.status==="recebida").length+" faturas"} color={C.green}/>
              <KpiCard C={C} label="Por Receber" icon="⏳" val={fmt(totPRec)} sub={clientInvs.filter(i=>i.status!=="recebida").length+" faturas"} color={C.amber}/>
              <KpiCard C={C} label="Em Atraso" icon="⚠" val={fmt(clVenc.reduce((s,i)=>s+(i.amount||0),0))} sub={clVenc.length+" faturas"} color={C.red}/>
            </div>

            {/* Filtros clientes — idênticos aos de fornecedores */}
            <div style={{background:C.bgCard,borderRadius:12,border:"1px solid "+C.border,padding:"10px 14px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{position:"relative",flex:1,minWidth:140}}>
                <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.textMuted}}>🔍</span>
                <input value={clSearch} onChange={e=>setClSearch(e.target.value)} placeholder="Pesquisar cliente..." style={{width:"100%",fontSize:12,borderRadius:8,border:"1px solid "+C.border,padding:"7px 10px 7px 28px",outline:"none",background:C.bgElevated,color:C.textPrimary}}/>
              </div>
              {sel(clFolder,setClFolder,<><option value="todos">Todas as pastas</option><option value="sem">Sem pasta</option>{folders.map(f=><option key={f.id} value={String(f.id)}>{f.icon} {f.name}</option>)}</>)}
              {sel(clStatus,setClStatus,<><option value="todos">Todos</option><option value="pendente">Por receber</option><option value="recebida">Recebidas</option><option value="vencida">Vencidas</option></>)}
              {sel(clSortBy,setClSortBy,<><option value="date_desc">Data ↓</option><option value="date_asc">Data ↑</option><option value="amount_desc">Valor ↓</option><option value="amount_asc">Valor ↑</option><option value="alpha">A-Z</option></>)}
              <input type="date" value={clDateFrom} onChange={e=>setClDateFrom(e.target.value)} style={{fontSize:12,borderRadius:8,border:"1px solid "+C.border,padding:"7px 9px",background:C.bgElevated,color:C.textSecond,outline:"none"}}/>
              <span style={{fontSize:11,color:C.textMuted}}>a</span>
              <input type="date" value={clDateTo} onChange={e=>setClDateTo(e.target.value)} style={{fontSize:12,borderRadius:8,border:"1px solid "+C.border,padding:"7px 9px",background:C.bgElevated,color:C.textSecond,outline:"none"}}/>
              {(clDateFrom||clDateTo)&&<button onClick={()=>{setClDateFrom("");setClDateTo("");}} style={{background:C.redSoft,border:"none",borderRadius:7,padding:"5px 9px",fontSize:11,color:C.red,cursor:"pointer",fontWeight:600}}>✕</button>}
              {/* Upload buttons inline */}
              <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                <button onClick={()=>clFileRef.current?.click()} style={{background:C.cyanSoft,border:"1px solid "+C.cyanBord,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:C.cyan,cursor:"pointer"}}>↑ PDF</button>
                <button onClick={()=>openManual(true)} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:C.textPrimary,cursor:"pointer"}}>✏️ Manual</button>
                <button onClick={()=>setShowAddCl(true)} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:C.textPrimary,cursor:"pointer"}}>+ Cliente</button>
              </div>
              <span style={{fontSize:12,color:C.textMuted}}>{filteredCl.length} resultado{filteredCl.length!==1?"s":""}</span>
            </div>

            {clGroupsFiltered().length===0?(
              <Card C={C} sx={{textAlign:"center",padding:"3rem 2rem"}}>
                <p style={{fontSize:36,margin:"0 0 12px"}}>🏷️</p>
                {clientInvs.length===0?(
                  <div>
                    <p style={{fontSize:14,fontWeight:700,marginBottom:12,color:C.textPrimary}}>Nenhuma fatura de cliente ainda</p>
                    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                      <button onClick={()=>openManual(true)} style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textPrimary}}>✏️ Adicionar manualmente</button>
                      <button onClick={()=>clFileRef.current?.click()} style={{background:C.grad,border:"none",borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff"}}>↑ Carregar PDF</button>
                    </div>
                  </div>
                ):(
                  <p style={{fontSize:13,color:C.textMuted,margin:0}}>Sem resultados para este filtro.</p>
                )}
              </Card>
            ):(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 210px",padding:"6px 16px",marginBottom:4}}>
                  {["Cliente","Nº Fatura","Data","Pasta","Valor","Estado"].map(h=><span key={h} style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.7,color:C.textMuted}}>{h}</span>)}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {filteredCl.map(inv=>{
                    const od=isOD(inv);
                    return(
                      <div key={inv.id} style={{background:C.bgCard,borderRadius:12,border:"1px solid "+C.border,borderLeft:"3px solid "+(od?C.red:"transparent")}}>
                        {od&&<div style={{background:C.redSoft,padding:"3px 16px",borderBottom:"1px solid "+C.redBord,borderRadius:"10px 10px 0 0"}}><span style={{fontSize:10,color:C.red,fontWeight:600}}>⚠ Vencida em {inv.dueDate}</span></div>}
                        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 210px",padding:"11px 16px",alignItems:"center",gap:4}}>
                          <div style={{minWidth:0,display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:32,height:32,borderRadius:9,background:C.cyanSoft,border:"1px solid "+C.cyanBord,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:C.cyan,flexShrink:0}}>{(inv.clientName||"?")[0].toUpperCase()}</div>
                            <div style={{minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                <p style={{margin:0,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textPrimary}}>{inv.clientName}</p>
                                <DueBadge dueDate={inv.dueDate} status={inv.status} C={C}/>
                              </div>
                              <p style={{margin:0,fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.description}</p>
                              {inv.notes&&<p style={{margin:"2px 0 0",fontSize:10,color:C.purple,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📝 {inv.notes}</p>}
                            </div>
                          </div>
                          <div>
                            <p style={{margin:0,fontSize:12,fontWeight:600,color:C.textSecond}}>{inv.invoiceNum}</p>
                            {inv.clientNif&&<p style={{margin:0,fontSize:10,color:C.textMuted}}>NIF {inv.clientNif}</p>}
                          </div>
                          <div>
                            <p style={{margin:0,fontSize:12,color:C.textSecond}}>{inv.date}</p>
                            {inv.dueDate&&<p style={{margin:0,fontSize:10,color:od?C.red:C.textMuted}}>Vence {inv.dueDate}</p>}
                          </div>
                          <FolderPicker C={C} inv={inv} folders={folders} onAssign={fid=>updClInv(inv.id,{folderId:fid})}/>
                          <div>
                            <p style={{margin:0,fontSize:14,fontWeight:800,color:C.textPrimary}}>{fmt(inv.amount)}</p>
                            {inv.receipt?.hasFile&&<span style={{fontSize:9,color:inv.receipt.validated?C.green:C.amber,fontWeight:700}}>{inv.receipt.validated?"✅ Validado":"⚠ Diverge"}</span>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            <Toggle C={C} on={inv.status==="recebida"} onToggle={()=>{const nr=inv.status==="recebida"?"não recebida":"recebida";updClInv(inv.id,{status:nr,payDate:nr==="recebida"?todayStr():null});}} labelOn="Recebido" labelOff="Pendente"/>
                            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                              <label style={{background:C.greenSoft,border:"none",borderRadius:5,padding:"3px 6px",fontSize:9,fontWeight:600,color:C.green,cursor:"pointer",display:"inline-flex",alignItems:"center"}}>
                                {receiptUploading===inv.id?"⏳":"🧾"}
                                <input type="file" accept="application/pdf,image/*" onChange={e=>handleReceiptUpload(e,inv)} style={{display:"none"}} disabled={receiptUploading===inv.id}/>
                              </label>
                              {miniBtn("📝",()=>{setNoteEditId(inv.id);setNoteText(inv.notes||"");},C.purpleSoft,C.purple)}
                              {miniBtn("📋",()=>setDupConfirm(inv),C.cyanSoft,C.cyan)}
                              {miniBtn("ℹ",()=>{setDetailInv(inv);setDtab("info");},C.bgElevated,C.textSecond)}
                              {miniBtn("✕",()=>setConfirmDel({msg:`Apagar fatura de "${inv.clientName}"?`,fn:()=>delClInv(inv.id)}),C.redSoft,C.red)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASTAS ── */}
        {tab==="pastas"&&(
          <PastasPage
            C={C} folders={folders} nonCr={nonCr} clientInvs={clientInvs}
            setConfirmDel={setConfirmDel} deleteFolder={deleteFolder}
            setShowAddFolder={setShowAddFolder} setTab={setTab} setFFolder={setFFolder}
            newFolder={newFolder} setNewFolder={setNewFolder} addFolder={addFolder}
          />
        )}

        {/* ── RECONCILIAÇÃO ── */}
        {tab==="reconciliacao"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Card C={C}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:bankRows.length>0?C.greenSoft:C.purpleSoft,border:"1px solid "+(bankRows.length>0?C.greenBord:C.purpleBord),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{bankRows.length>0?"✅":"1️⃣"}</div>
                <div style={{flex:1}}>
                  <p style={{margin:"0 0 2px",fontWeight:700,fontSize:14,color:C.textPrimary}}>Importar extrato do banco</p>
                  <p style={{margin:0,fontSize:12,color:C.textMuted}}>{bankRows.length>0?`${bankRows.length} movimentos · ${totalMatched} reconciliados`:"Excel, PDF ou CSV do teu banco."}</p>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  {bankRows.length>0&&<button onClick={async()=>{setBankRows([]);await safeSet(SK.bankRows,[]);}} style={{background:C.redSoft,border:"1px solid "+C.redBord,borderRadius:9,padding:"7px 12px",fontSize:12,fontWeight:600,color:C.red,cursor:"pointer"}}>🗑 Limpar</button>}
                  <label style={{cursor:"pointer",background:bankRows.length>0?C.bgElevated:C.grad,color:bankRows.length>0?C.textPrimary:"#fff",border:"1px solid "+(bankRows.length>0?C.border:"transparent"),borderRadius:9,padding:"7px 14px",fontSize:13,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6}}>
                    {bankRows.length>0?"↺ Substituir":"↑ Importar"}
                    <input ref={bankFileRef} type="file" accept=".csv,.txt,.pdf,.xlsx,.xls" onChange={handleBankFile} style={{display:"none"}}/>
                  </label>
                </div>
              </div>
              {bankRows.length>0&&(
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.textMuted}}>{totalMatched} de {bankRows.length} reconciliados</span><span style={{fontSize:13,fontWeight:800,color:reconRate===100?C.green:reconRate>60?C.amber:C.red}}>{reconRate}%</span></div>
                  <div style={{height:6,borderRadius:99,background:C.bgElevated,overflow:"hidden"}}><div style={{height:"100%",width:reconRate+"%",background:reconRate===100?"linear-gradient(90deg,#22C55E,#4ADE80)":C.grad,borderRadius:99,transition:"width .4s"}}/></div>
                </div>
              )}
            </Card>
            {bankRows.length>0&&suggestions.length>0&&(
              <Card C={C} sx={{border:"1px solid "+C.purpleBord,background:C.purpleSoft}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <span style={{fontSize:20}}>2️⃣</span>
                  <div style={{flex:1}}><p style={{margin:"0 0 2px",fontWeight:700,fontSize:14,color:C.textPrimary}}>Sugestões automáticas</p><p style={{margin:0,fontSize:12,color:C.textMuted}}>{suggestions.length} correspondência{suggestions.length!==1?"s":""}.</p></div>
                  <button onClick={()=>suggestions.forEach(s=>doReconcile(s.b.id,s.inv.id))} style={{background:C.grad,color:"#fff",border:"none",borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>✓ Confirmar todas</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {suggestions.map((s,idx)=>(
                    <div key={idx} style={{background:C.bgCard,borderRadius:12,border:"1px solid "+(s.confidence==="exact"?C.greenBord:C.amberBord),padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:120}}>
                        <p style={{margin:"0 0 2px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase"}}>Movimento</p>
                        <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.b.description}</p>
                        <p style={{margin:0,fontSize:11,color:C.textMuted}}>{s.b.date} · <span style={{color:C.red,fontWeight:700}}>{fmt(s.b.amount)}</span></p>
                      </div>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <div style={{fontSize:14}}>↔</div>
                        <span style={{fontSize:10,fontWeight:700,color:s.confidence==="exact"?C.green:C.amber,background:s.confidence==="exact"?C.greenSoft:C.amberSoft,borderRadius:99,padding:"1px 7px"}}>{s.confidence==="exact"?"Exato":"≈ "+fmt(s.diff)}</span>
                      </div>
                      <div style={{flex:1,minWidth:120}}>
                        <p style={{margin:"0 0 2px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase"}}>Fatura</p>
                        <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.inv.supplier}</p>
                        <p style={{margin:0,fontSize:11,color:C.textMuted}}>{s.inv.invoiceNum} · <span style={{color:C.purple,fontWeight:700}}>{fmt(s.inv.amountToPay||s.inv.amount)}</span></p>
                      </div>
                      <button onClick={()=>doReconcile(s.b.id,s.inv.id)} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓</button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {bankRows.length>0&&(
              <Card C={C} sx={{padding:0}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <span style={{fontSize:18}}>3️⃣</span>
                  <div style={{flex:1}}><p style={{margin:"0 0 2px",fontWeight:700,fontSize:14,color:C.textPrimary}}>Todos os movimentos</p></div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {[["todos","Todos"],["por_reconciliar","Por reconciliar"],["reconciliado","✓ Feitos"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setBankFilter(v)} style={{background:bankFilter===v?C.bgHover:C.bgElevated,border:"1px solid "+(bankFilter===v?C.purple:C.border),borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:bankFilter===v?700:400,color:bankFilter===v?C.purple:C.textMuted,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
                    ))}
                    {bankMonths.length>1&&<select value={bankMonth} onChange={e=>setBankMonth(e.target.value)} style={{fontSize:11,borderRadius:7,border:"1px solid "+C.border,padding:"4px 8px",background:C.bgElevated,color:C.textSecond,cursor:"pointer",outline:"none"}}><option value="">Todos os meses</option>{bankMonths.map(m=><option key={m} value={m}>{mLabel(m)}</option>)}</select>}
                  </div>
                </div>
                <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:5}}>
                  {filteredBank.length===0&&<p style={{textAlign:"center",color:C.textMuted,fontSize:13,padding:"1.5rem 0",margin:0}}>Nenhum movimento para este filtro.</p>}
                  {filteredBank.map(b=>{
                    const isDebit=b.amount<0;
                    const matchedInv=b.matched?invoices.find(i=>i.id===b.matched):null;
                    return(
                      <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,background:b.matched?C.greenSoft:C.bgElevated,border:"1px solid "+(b.matched?C.greenBord:C.border),flexWrap:"wrap"}}>
                        <div style={{width:26,height:26,borderRadius:6,background:isDebit?C.redSoft:C.greenSoft,border:"1px solid "+(isDebit?C.redBord:C.greenBord),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{isDebit?"↑":"↓"}</div>
                        <div style={{flex:1,minWidth:100}}>
                          <p style={{margin:0,fontSize:12,fontWeight:600,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.description}</p>
                          <p style={{margin:0,fontSize:11,color:C.textMuted}}>{b.date}</p>
                        </div>
                        <span style={{fontSize:13,fontWeight:800,color:isDebit?C.red:C.green,flexShrink:0}}>{b.amount>0?"+":""}{fmt(b.amount)}</span>
                        {b.matched?(
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <span style={{fontSize:11,color:C.green,fontWeight:600}}>✓ {matchedInv?.supplier||"Reconciliado"}</span>
                            <button onClick={()=>undoReconcile(b.id,b.matched)} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"2px 7px",fontSize:10,color:C.textMuted,cursor:"pointer"}}>Desfazer</button>
                          </div>
                        ):(
                          <select onChange={e=>{if(e.target.value)doReconcile(b.id,e.target.value);}} style={{fontSize:11,borderRadius:7,border:"1px solid "+C.border,padding:"5px 8px",background:C.bgCard,color:C.textMuted,outline:"none",maxWidth:180,cursor:"pointer"}}>
                            <option value="">Associar fatura...</option>
                            {unmatchedInvs.map(i=><option key={i.id} value={i.id}>{(i.supplier||"").slice(0,20)} · {fmt(i.amountToPay||i.amount)}</option>)}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── ASSISTENTE ── */}
        {tab==="assistente"&&(
          <AssistentePage
            C={C} chatMsgs={chatMsgs} chatIn={chatIn} setChatIn={setChatIn}
            chatLoad={chatLoad} sendChat={sendChat} chatEnd={chatEnd}
            totFat={totFat} totPag={totPag} totEmit={totEmit} totRec={totRec}
            cf30={cf30} onTimeRate={onTimeRate}
          />
        )}
      </main>

      {/* ── MODAIS ── */}
      <Modal C={C} open={showSettings} onClose={()=>setShowSettings(false)} title="⚙️ Definições da empresa">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"Nome da empresa",key:"name",placeholder:"Empresa Lda."},{label:"NIF",key:"nif",placeholder:"123456789"},{label:"IBAN",key:"iban",placeholder:"PT50..."},{label:"Endereço",key:"address",placeholder:"Rua..."},{label:"Email (alertas)",key:"email",placeholder:"financeiro@empresa.pt"},{label:"Alertas (dias antes)",key:"alertDays",placeholder:"7"}].map(({label,key,placeholder})=>(
            <div key={key}><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>{label}</label><input value={settingsForm[key]||""} onChange={e=>setSettingsForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} style={inputStyle}/></div>
          ))}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}><Btn C={C} v="ghost" onClick={()=>setShowSettings(false)}>Cancelar</Btn><Btn C={C} v="primary" onClick={saveSettings}>Guardar</Btn></div>
        </div>
      </Modal>

      <Modal C={C} open={showAddFolder} onClose={()=>setShowAddFolder(false)} title="📁 Nova pasta">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Nome</label><input value={newFolder.name} onChange={e=>setNewFolder(f=>({...f,name:e.target.value}))} placeholder="Ex: EDP, Contabilidade..." style={inputStyle}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:7}}>Ícone</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{FOLDER_ICONS.map(ic=><button key={ic} onClick={()=>setNewFolder(f=>({...f,icon:ic}))} style={{width:34,height:34,borderRadius:8,border:"2px solid "+(newFolder.icon===ic?C.purple:C.border),background:newFolder.icon===ic?C.purpleSoft:C.bgElevated,fontSize:16,cursor:"pointer"}}>{ic}</button>)}</div></div>
          <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:7}}>Cor</label><div style={{display:"flex",gap:8}}>{FOLDER_COLORS.map((col,i)=><button key={i} onClick={()=>setNewFolder(f=>({...f,colorIdx:i}))} style={{width:30,height:30,borderRadius:"50%",border:"3px solid "+(newFolder.colorIdx===i?col.text:"transparent"),background:col.bg,cursor:"pointer",outline:"none"}}/>)}</div></div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn C={C} v="ghost" onClick={()=>setShowAddFolder(false)}>Cancelar</Btn><Btn C={C} v="primary" onClick={()=>addFolder()}>Criar</Btn></div>
        </div>
      </Modal>

      <Modal C={C} open={showAddCl} onClose={()=>setShowAddCl(false)} title="+ Novo cliente">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"Nome",key:"name",placeholder:"Cliente Lda."},{label:"NIF",key:"nif",placeholder:"123456789"},{label:"Email",key:"email",placeholder:"cliente@empresa.pt"},{label:"Telefone",key:"phone",placeholder:"+351..."}].map(({label,key,placeholder})=>(
            <div key={key}><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>{label}</label><input value={newCl[key]||""} onChange={e=>setNewCl(c=>({...c,[key]:e.target.value}))} placeholder={placeholder} style={inputStyle}/></div>
          ))}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn C={C} v="ghost" onClick={()=>setShowAddCl(false)}>Cancelar</Btn><Btn C={C} v="primary" onClick={addCl}>Adicionar</Btn></div>
        </div>
      </Modal>

      <Modal C={C} open={!!editingInv} onClose={()=>setEditingInv(null)} title="✎ Editar fatura">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"Fornecedor",key:"supplier"},{label:"Nº Fatura",key:"invoiceNum"},{label:"Data (DD/MM/AAAA)",key:"date"},{label:"Vencimento (DD/MM/AAAA)",key:"dueDate"},{label:"Valor (€)",key:"amount",type:"number"},{label:"A Pagar (€)",key:"amountToPay",type:"number"},{label:"Descrição",key:"description"}].map(({label,key,type})=>(
            <div key={key}><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>{label}</label><input type={type||"text"} value={editFields[key]||""} onChange={e=>setEditFields(f=>({...f,[key]:type==="number"?parseFloat(e.target.value)||0:e.target.value}))} style={inputStyle}/></div>
          ))}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn C={C} v="ghost" onClick={()=>setEditingInv(null)}>Cancelar</Btn><Btn C={C} v="primary" onClick={saveEdit}>Guardar</Btn></div>
        </div>
      </Modal>

      <Modal C={C} open={!!noteEditId} onClose={()=>setNoteEditId(null)} title="📝 Nota">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Escreve uma nota sobre esta fatura..." rows={5} style={{...inputStyle,resize:"vertical"}}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn C={C} v="ghost" onClick={()=>setNoteEditId(null)}>Cancelar</Btn><Btn C={C} v="primary" onClick={saveNote}>Guardar</Btn></div>
        </div>
      </Modal>

      <Modal C={C} open={showManualInv} onClose={()=>setShowManualInv(false)} title={`✏️ Fatura manual — ${manualIsClient?"Cliente":"Fornecedor"}`} wide>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {manualIsClient?(
              <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Cliente *</label><input value={manualForm.clientName} onChange={e=>setManualForm(f=>({...f,clientName:e.target.value}))} placeholder="Nome do cliente" style={inputStyle}/></div>
            ):(
              <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Fornecedor *</label><input value={manualForm.supplier} onChange={e=>setManualForm(f=>({...f,supplier:e.target.value}))} placeholder="Nome do fornecedor" style={inputStyle}/></div>
            )}
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>NIF</label><input value={manualForm.nif} onChange={e=>setManualForm(f=>({...f,nif:e.target.value}))} placeholder="123456789" style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Nº Fatura</label><input value={manualForm.invoiceNum} onChange={e=>setManualForm(f=>({...f,invoiceNum:e.target.value}))} placeholder="FT2025/001" style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Data *</label><input type="date" value={manualForm.date} onChange={e=>setManualForm(f=>({...f,date:e.target.value}))} style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Vencimento</label><input type="date" value={manualForm.dueDate} onChange={e=>setManualForm(f=>({...f,dueDate:e.target.value}))} style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Valor Total (€) *</label><input type="number" step="0.01" value={manualForm.amount} onChange={e=>setManualForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>IVA (€)</label><input type="number" step="0.01" value={manualForm.amountVAT} onChange={e=>setManualForm(f=>({...f,amountVAT:e.target.value}))} placeholder="0.00" style={inputStyle}/></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Descrição</label><input value={manualForm.description} onChange={e=>setManualForm(f=>({...f,description:e.target.value}))} placeholder="Descrição do serviço/produto" style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Categoria</label><input value={manualForm.category} onChange={e=>setManualForm(f=>({...f,category:e.target.value}))} placeholder="Ex: Serviços, Materiais..." style={inputStyle}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:5}}>Pasta</label><select value={manualForm.folderId} onChange={e=>setManualForm(f=>({...f,folderId:e.target.value}))} style={inputStyle}><option value="">Sem pasta</option>{folders.map(f=><option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}><Btn C={C} v="ghost" onClick={()=>setShowManualInv(false)}>Cancelar</Btn><Btn C={C} v="primary" onClick={saveManualInv}>Adicionar fatura</Btn></div>
        </div>
      </Modal>

      <Modal C={C} open={!!suggestModal} onClose={()=>setSuggestModal(null)} title="📁 Organizar fatura">
        {suggestModal&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:C.bgElevated,borderRadius:10,padding:"12px 14px"}}>
              <p style={{margin:0,fontWeight:700,fontSize:13,color:C.textPrimary}}>{suggestModal.inv.supplier}</p>
              <p style={{margin:0,fontSize:12,color:C.textMuted}}>{suggestModal.inv.invoiceNum} · {fmt(suggestModal.inv.amount)}</p>
            </div>
            <div><p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.textMuted}}>Escolhe uma pasta:</p><div style={{display:"flex",flexDirection:"column",gap:5}}>{folders.map(f=>{const col=f.color||FOLDER_COLORS[0];return<button key={f.id} onClick={()=>confirmSuggestFolder(f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:col.bg,border:"1px solid "+col.border,borderRadius:10,cursor:"pointer",textAlign:"left"}}><span style={{fontSize:18}}>{f.icon}</span><span style={{fontWeight:600,color:col.text,fontSize:13}}>{f.name}</span></button>;})}</div></div>
            <div style={{borderTop:"1px solid "+C.border,paddingTop:12}}><p style={{margin:"0 0 7px",fontSize:12,fontWeight:600,color:C.textMuted}}>Ou cria uma nova:</p><div style={{display:"flex",gap:8}}><input value={suggestNewName} onChange={e=>setSuggestNewName(e.target.value)} placeholder="Nome da nova pasta..." style={{...inputStyle,flex:1}}/><Btn C={C} v="primary" onClick={createAndAssign}>Criar</Btn></div></div>
            <button onClick={()=>setSuggestModal(null)} style={{background:"none",border:"none",fontSize:12,color:C.textMuted,cursor:"pointer",padding:0}}>Ignorar por agora</button>
          </div>
        )}
      </Modal>

      <Modal C={C} open={!!detailInv} onClose={()=>setDetailInv(null)} title={detailInv?.supplier||detailInv?.clientName||"Detalhe"} wide>
        {detailInv&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["info","ℹ Info"],["history","📋 Histórico"]].map(([k,l])=>(
                <button key={k} onClick={()=>setDtab(k)} style={{background:dtab===k?C.purpleSoft:"transparent",border:"1px solid "+(dtab===k?C.purpleBord:C.border),borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:dtab===k?700:400,color:dtab===k?C.purple:C.textSecond,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            {dtab==="info"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Fornecedor/Cliente",detailInv.supplier||detailInv.clientName],["Nº Fatura",detailInv.invoiceNum],["Data",detailInv.date],["Vencimento",detailInv.dueDate||"—"],["Valor",fmt(detailInv.amount)],["IVA",fmt(detailInv.amountVAT)],["NIF",detailInv.nif||detailInv.clientNif||"—"],["Descrição",detailInv.description],["Categoria",detailInv.category||"—"],["Notas",detailInv.notes||"—"]].map(([k,v])=>(
                  <div key={k} style={{background:C.bgElevated,borderRadius:10,padding:"12px 14px"}}>
                    <p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase"}}>{k}</p>
                    <p style={{margin:0,fontSize:13,fontWeight:600,color:C.textPrimary}}>{v}</p>
                  </div>
                ))}
              </div>
            )}
            {dtab==="history"&&(
              <div>
                {(detailInv.history||[]).length===0?(
                  <p style={{color:C.textMuted,fontSize:13}}>Sem histórico de alterações.</p>
                ):(
                  (detailInv.history||[]).map((h,i)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid "+C.border,alignItems:"center"}}>
                      <WfPill C={C} status={h.from}/><span style={{color:C.textMuted}}>→</span><WfPill C={C} status={h.to}/><span style={{fontSize:11,color:C.textMuted,marginLeft:"auto"}}>{h.at}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── RESUMO MENSAL ── */}
      {showMonthlySummary&&(()=>{
        const sd=getMonthlySummaryData(summaryMonth.y,summaryMonth.m);
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}} onClick={()=>setShowMonthlySummary(false)}>
            <div style={{background:C.bgCard,borderRadius:20,padding:28,maxWidth:640,width:"100%",maxHeight:"92vh",overflowY:"auto",border:"1px solid "+C.border,boxShadow:"0 32px 80px rgba(0,0,0,.6)"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <h3 style={{margin:0,fontSize:18,fontWeight:700,color:C.textPrimary}}>📅 Resumo Mensal</h3>
                  <p style={{margin:"4px 0 0",fontSize:12,color:C.textMuted}}>Para enviar ao contabilista</p>
                </div>
                <button onClick={()=>setShowMonthlySummary(false)} style={{background:C.bgElevated,border:"1px solid "+C.border,width:34,height:34,borderRadius:8,fontSize:18,cursor:"pointer",color:C.textSecond}}>×</button>
              </div>
              {/* Month selector */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,background:C.bgElevated,borderRadius:12,padding:"10px 14px"}}>
                <button onClick={()=>setSummaryMonth(({y,m})=>m===0?{y:y-1,m:11}:{y,m:m-1})} style={{background:C.bgCard,border:"1px solid "+C.border,borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:16,color:C.textSecond}}>‹</button>
                <span style={{flex:1,textAlign:"center",fontWeight:700,fontSize:15,color:C.textPrimary}}>{sd.mName}</span>
                <button onClick={()=>setSummaryMonth(({y,m})=>m===11?{y:y+1,m:0}:{y,m:m+1})} style={{background:C.bgCard,border:"1px solid "+C.border,borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:16,color:C.textSecond}}>›</button>
              </div>
              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:18}}>
                {[{l:"Faturado",v:fmt(sd.totalFat),c:C.textPrimary},{l:"Pago",v:fmt(sd.totalPag),c:C.green},{l:"Pendente",v:fmt(sd.totalPend),c:C.amber},{l:"Emitido",v:fmt(sd.totalEmit),c:C.cyan},{l:"Recebido",v:fmt(sd.totalRec),c:C.green}].map(m=>(
                  <div key={m.l} style={{background:C.bgElevated,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <p style={{margin:0,fontSize:14,fontWeight:800,color:m.c}}>{m.v}</p>
                    <p style={{margin:"3px 0 0",fontSize:10,color:C.textMuted,textTransform:"uppercase",fontWeight:600}}>{m.l}</p>
                  </div>
                ))}
              </div>
              {sd.topFolders.length>0&&(
                <div style={{marginBottom:14}}>
                  <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.6}}>Gastos por pasta</p>
                  {sd.topFolders.map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border}}>
                      <span style={{fontSize:13,color:C.textSecond}}>{k}</span>
                      <span style={{fontSize:13,fontWeight:700,color:C.textPrimary}}>{fmt(v)}</span>
                    </div>
                  ))}
                </div>
              )}
              {sd.topClients.length>0&&(
                <div style={{marginBottom:18}}>
                  <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.6}}>Receitas por cliente</p>
                  {sd.topClients.map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border}}>
                      <span style={{fontSize:13,color:C.textSecond}}>{k}</span>
                      <span style={{fontSize:13,fontWeight:700,color:C.green}}>{fmt(v)}</span>
                    </div>
                  ))}
                </div>
              )}
              {sd.fInvs.length===0&&sd.fCl.length===0&&(
                <p style={{textAlign:"center",color:C.textMuted,fontSize:13,padding:"2rem 0"}}>Sem faturas neste mês.</p>
              )}
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <Btn C={C} v="ghost" onClick={()=>setShowMonthlySummary(false)}>Fechar</Btn>
                <Btn C={C} v="primary" onClick={exportMonthlySummaryPDF}>📋 Exportar PDF</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── IMPORTAR DE EMAIL ── */}
      <Modal C={C} open={showEmailImport} onClose={()=>setShowEmailImport(false)} title="📧 Importar fatura de Email">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.bgElevated,borderRadius:10,padding:"12px 14px",fontSize:12,color:C.textMuted,lineHeight:1.6}}>
            <p style={{margin:"0 0 6px",fontWeight:600,color:C.textPrimary}}>Como funciona:</p>
            <p style={{margin:0}}>1. Abre o email com a fatura no teu cliente de email<br/>2. Seleciona todo o texto do email (Ctrl+A)<br/>3. Copia (Ctrl+C) e cola aqui em baixo<br/>4. A IA extrai os dados automaticamente</p>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:C.textMuted,display:"block",marginBottom:6}}>Conteúdo do email</label>
            <textarea value={emailText} onChange={e=>setEmailText(e.target.value)} placeholder="Cola aqui o texto do email com a fatura..." rows={10} style={{width:"100%",fontSize:13,borderRadius:10,border:"1px solid "+C.border,padding:"12px 14px",background:C.bgElevated,color:C.textPrimary,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.5}}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn C={C} v="ghost" onClick={()=>{setShowEmailImport(false);setEmailText("");}}>Cancelar</Btn>
            <Btn C={C} v="primary" onClick={importFromEmail} disabled={emailParsing}>{emailParsing?"⏳ A analisar...":"✨ Extrair dados com IA"}</Btn>
          </div>
        </div>
      </Modal>

      {/* Bank Review Modal */}
      {showBankReview&&bankPdfRows&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
          <div style={{background:C.bgCard,borderRadius:20,padding:28,maxWidth:720,width:"100%",maxHeight:"92vh",overflowY:"auto",border:"1px solid "+C.border}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:700,color:C.textPrimary}}>Rever movimentos extraídos</h3>
              <button onClick={()=>{setShowBankReview(false);setBankPdfRows(null);}} style={{background:C.bgElevated,border:"1px solid "+C.border,width:34,height:34,borderRadius:8,fontSize:18,cursor:"pointer",color:C.textSecond}}>×</button>
            </div>
            <p style={{fontSize:13,color:C.textMuted,margin:"0 0 14px"}}>{bankPdfRows.length} movimentos. Desmarca os que não quiseres importar.</p>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:18}}>
              {bankPdfRows.map((r,idx)=>(
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:r._skip?C.bgElevated:C.bgCard,border:"1px solid "+(r._skip?C.border:r.amount<0?C.redBord:C.greenBord),borderRadius:9,padding:"9px 12px",opacity:r._skip?.5:1}}>
                  <input type="checkbox" checked={!r._skip} onChange={()=>setBankPdfRows(rows=>rows.map((x,i)=>i===idx?{...x,_skip:!x._skip}:x))} style={{width:15,height:15,cursor:"pointer",flexShrink:0}}/>
                  <span style={{width:100,fontSize:12,color:C.textSecond}}>{r.date}</span>
                  <span style={{flex:1,fontSize:12,color:C.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description}</span>
                  <span style={{fontSize:13,fontWeight:700,color:r.amount<0?C.red:C.green,flexShrink:0}}>{r.amount>0?"+":""}{fmt(r.amount)}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn C={C} v="ghost" onClick={()=>{setShowBankReview(false);setBankPdfRows(null);}}>Cancelar</Btn>
              <Btn C={C} v="primary" onClick={()=>confirmBankImport(bankPdfRows.filter(r=>!r._skip))}>Importar {bankPdfRows.filter(r=>!r._skip).length} movimentos</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
