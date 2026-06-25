import { useState } from "react";
import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import BarChart from "../components/BarChart";
import Toggle from "../components/Toggle";
import { fmt, fmtK, parseD, todayStr, MONTH_NAMES, DAY_NAMES, FOLDER_COLORS } from "../lib/utils";

function PieChart({data,C}: any){
  if(!data||data.length===0)return <p style={{color:C.textMuted,textAlign:"center",fontSize:13,padding:"1.5rem 0",margin:0}}>Sem dados ainda.</p>;
  const total=data.reduce((s: number,d: any)=>s+(d.value||0),0);
  if(total===0)return <p style={{color:C.textMuted,textAlign:"center",fontSize:13,padding:"1.5rem 0",margin:0}}>Sem dados ainda.</p>;
  const COLS=["#9B59F5","#22D3EE","#22C55E","#F59E0B","#EF4444","#F472B6","#60A5FA","#4ADE80"];
  let cum=0;
  const slices=data.slice(0,8).map((d: any,i: number)=>{const pct=(d.value/total)*100;const start=cum;cum+=pct;return {...d,pct,start,color:COLS[i%COLS.length]};});
  const polar=(cx: number,cy: number,r: number,deg: number)=>({x:cx+r*Math.cos((deg-90)*Math.PI/180),y:cy+r*Math.sin((deg-90)*Math.PI/180)});
  const arc=(cx: number,cy: number,r: number,s: number,e: number)=>{const sp=polar(cx,cy,r,s*3.6),ep=polar(cx,cy,r,e*3.6);return `M ${cx} ${cy} L ${sp.x} ${sp.y} A ${r} ${r} 0 ${e-s>50?1:0} 1 ${ep.x} ${ep.y} Z`;};
  return(
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      <svg width={110} height={110} style={{flexShrink:0}}>
        {slices.map((s: any,i: number)=><path key={i} d={arc(55,55,50,s.start,s.start+s.pct)} fill={s.color} opacity={.85} stroke={C.bgCard} strokeWidth={2}/>)}
        <circle cx={55} cy={55} r={25} fill={C.bgCard}/>
        <text x={55} y={59} textAnchor="middle" fill={C.textPrimary} fontSize={10} fontWeight={700}>{fmtK(total)}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:5,flex:1,minWidth:0}}>
        {slices.map((s: any,i: number)=>(
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

function PieSection({pieFilter,setPieFilter,pieData,C}: any){
  return(
    <Card C={C}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{margin:0,fontSize:13,fontWeight:700,color:C.textPrimary}}>🍕 Distribuição</h3>
        <select value={pieFilter} onChange={(e: any)=>setPieFilter(e.target.value)} style={{fontSize:10,borderRadius:7,border:"1px solid "+(pieFilter?C.border:C.purpleBord),padding:"3px 7px",background:pieFilter?C.bgElevated:C.purpleSoft,color:pieFilter?C.textSecond:C.purple,cursor:"pointer",fontWeight:pieFilter?"400":"700"}}>
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

export default function DashboardPage({C,nonCr,clientInvs,folders,invoices,company,venc,clVenc,cf30,cf60,cf90,totFat,totPag,totPend,totEmit,totRec,totPRec,paidCt,pendCt,awaitingApproval,updInv,updClInv,setShowSettings,setTab,setDetailInv,setDtab,setShowUploadMenu,setOnboardStep}: any){
  const [pieFilter,setPieFilter]=useState("");
  const [chartFilter,setChartFilter]=useState("pastas");
  const getFolder=(inv: any)=>folders.find((f: any)=>f.id===inv.folderId)||null;
  const now=new Date();
  const in7=new Date(now);in7.setDate(now.getDate()+7);
  const in30=new Date(now);in30.setDate(now.getDate()+30);

  const upcoming=[...nonCr,...clientInvs].filter((i: any)=>{
    if(i.status==="paga"||i.status==="recebida")return false;
    const dd=parseD(i.dueDate);return dd&&dd>=now&&dd<=in7;
  }).sort((a: any,b: any)=>(a.dueDate||"").localeCompare(b.dueDate||""));

  const dueSoonAlerts=[
    ...nonCr.filter((i: any)=>{if(i.status==="paga")return false;const d=parseD(i.dueDate);return d&&d<=in30;}).map((i: any)=>({...i,_type:"forn",_daysLeft:Math.ceil((parseD(i.dueDate)!.getTime()-now.getTime())/86400000)})),
    ...clientInvs.filter((i: any)=>{if(i.status==="recebida")return false;const d=parseD(i.dueDate);return d&&d<=in30;}).map((i: any)=>({...i,_type:"cli",_daysLeft:Math.ceil((parseD(i.dueDate)!.getTime()-now.getTime())/86400000)})),
  ].sort((a: any,b: any)=>a._daysLeft-b._daysLeft).slice(0,8);

  const pieData=(groupBy: string)=>{
    if(groupBy==="pastas"){const map: any={};nonCr.forEach((inv: any)=>{const f=getFolder(inv);const key=f?String(f.id):"sem";if(!map[key])map[key]={label:f?f.icon+" "+f.name:"Sem pasta",value:0};map[key].value+=(inv.amount||0);});return Object.values(map).sort((a: any,b: any)=>b.value-a.value);}
    if(groupBy==="categoria"){const map: any={};nonCr.forEach((inv: any)=>{const key=inv.category||"Outra";if(!map[key])map[key]={label:key,value:0};map[key].value+=(inv.amount||0);});return Object.values(map).sort((a: any,b: any)=>b.value-a.value);}
    if(groupBy==="fornecedor"){const map: any={};nonCr.forEach((inv: any)=>{const key=inv.supplier||"?";if(!map[key])map[key]={label:key,value:0};map[key].value+=(inv.amount||0);});return Object.values(map).sort((a: any,b: any)=>b.value-a.value);}
    return[];
  };
  const barData=(groupBy: string)=>{
    if(groupBy==="pastas"){const map: any={};nonCr.forEach((inv: any)=>{const f=getFolder(inv);const key=f?String(f.id):"sem";if(!map[key])map[key]={label:f?f.icon+" "+f.name:"Sem pasta",paid:0,pending:0};if(inv.status==="paga")map[key].paid+=(inv.amount||0);else map[key].pending+=(inv.amount||0);});return Object.values(map).sort((a: any,b: any)=>(b as any).paid+(b as any).pending-(a as any).paid-(a as any).pending).slice(0,8);}
    if(groupBy==="fornecedores"){const map: any={};nonCr.forEach((inv: any)=>{const key=(inv.supplier||"?").toLowerCase().replace(/\s+/g,"_");if(!map[key])map[key]={label:inv.supplier||"?",paid:0,pending:0};if(inv.status==="paga")map[key].paid+=(inv.amount||0);else map[key].pending+=(inv.amount||0);});return Object.values(map).sort((a: any,b: any)=>(b as any).paid+(b as any).pending-(a as any).paid-(a as any).pending).slice(0,8);}
    if(groupBy==="clientes"){const map: any={};clientInvs.forEach((inv: any)=>{const key=(inv.clientName||"?").toLowerCase().replace(/\s+/g,"_");if(!map[key])map[key]={label:inv.clientName||"?",paid:0,pending:0};if(inv.status==="recebida")map[key].paid+=(inv.amount||0);else map[key].pending+=(inv.amount||0);});return Object.values(map).sort((a: any,b: any)=>(b as any).paid+(b as any).pending-(a as any).paid-(a as any).pending).slice(0,8);}
    return[];
  };
  const monthChart=()=>{
    const months: any[]=[];
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");const label=d.toLocaleDateString("pt-PT",{month:"short"}).replace(".","");months.push({key,label,paid:0,pending:0});}
    nonCr.forEach((inv: any)=>{const parts=(inv.date||"").split("/");if(parts.length<3)return;const key=parts[2]+"-"+parts[1];const m=months.find((x: any)=>x.key===key);if(!m)return;if(inv.status==="paga")m.paid+=(inv.amount||0);else m.pending+=(inv.amount||0);});
    return months;
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {invoices.length===0&&clientInvs.length===0&&(
        <div style={{background:"linear-gradient(135deg,rgba(155,89,245,.1),rgba(34,211,238,.1))",border:"1px solid "+C.purpleBord,borderRadius:20,padding:"32px"}}>
          <p style={{margin:"0 0 4px",fontWeight:900,fontSize:20,background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Bem-vindo ao InVoiced 2.0</p>
          <p style={{margin:"0 0 20px",fontSize:13,color:C.textMuted}}>Gestão de faturas. Começa em 3 passos:</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {[{step:"1",icon:"⚙️",title:"Define o teu NIF",desc:"Para validar faturas de clientes.",action:()=>setShowSettings(true),cta:"Definir NIF"},{step:"2",icon:"📁",title:"Cria pastas",desc:"Organiza as tuas faturas por categoria.",action:()=>setTab("pastas"),cta:"Criar pasta"},{step:"3",icon:"📄",title:"Adiciona faturas",desc:"Carrega PDFs ou preenche manualmente.",action:()=>setShowUploadMenu(true),cta:"Adicionar"},].map(s=>(
              <div key={s.step} style={{background:C.bgCard,borderRadius:14,padding:"18px",border:"1px solid "+C.border}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.grad,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{s.step}</div>
                  <span style={{fontSize:20}}>{s.icon}</span>
                </div>
                <p style={{margin:"0 0 6px",fontWeight:700,fontSize:13,color:C.textPrimary}}>{s.title}</p>
                <p style={{margin:"0 0 14px",fontSize:12,color:C.textMuted,lineHeight:1.5}}>{s.desc}</p>
                <button onClick={s.action} style={{background:C.grad,color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{s.cta}</button>
              </div>
            ))}
          </div>
          <button onClick={()=>setOnboardStep(0)} style={{marginTop:14,background:"none",border:"1px solid "+C.purpleBord,borderRadius:8,padding:"6px 16px",fontSize:12,color:C.purple,fontWeight:600,cursor:"pointer"}}>🎯 Iniciar tour guiado</button>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.7,color:C.textMuted,margin:"0 0 10px"}}>💸 Fornecedores</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <KpiCard C={C} label="Total Faturado" icon="€" val={fmt(totFat)} sub={nonCr.length+" faturas"} glow/>
            <KpiCard C={C} label="Total Pago" icon="↑" val={fmt(totPag)} sub={paidCt+" faturas"} color={C.purple}/>
            <KpiCard C={C} label="Pendente" icon="⏳" val={fmt(totPend)} sub={pendCt+" faturas"} color={C.amber}/>
            <KpiCard C={C} label="Vencidas" icon="⚠" val={fmt(venc.reduce((s: number,i: any)=>s+(i.amount||0),0))} sub={venc.length+" faturas"} color={C.red}/>
          </div>
        </div>
        <div>
          <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.7,color:C.textMuted,margin:"0 0 10px"}}>💰 Clientes</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <KpiCard C={C} label="Total Emitido" icon="📤" val={fmt(totEmit)} sub={clientInvs.length+" faturas"}/>
            <KpiCard C={C} label="Recebido" icon="↓" val={fmt(totRec)} sub={clientInvs.filter((i: any)=>i.status==="recebida").length+" faturas"} color={C.green}/>
            <KpiCard C={C} label="Por Receber" icon="⏳" val={fmt(totPRec)} sub={clientInvs.filter((i: any)=>i.status!=="recebida").length+" faturas"} color={C.amber}/>
            <KpiCard C={C} label="Em Atraso" icon="⚠" val={fmt(clVenc.reduce((s: number,i: any)=>s+(i.amount||0),0))} sub={clVenc.length+" faturas"} color={C.red}/>
          </div>
        </div>
      </div>
      <Card C={C}>
        <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.textPrimary}}>💰 Cash flow projetado</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[{label:"Próximos 30d",cf:cf30},{label:"Dias 31-60",cf:cf60},{label:"Dias 61-90",cf:cf90}].map(({label,cf})=>(
            <div key={label} style={{background:cf.net>=0?C.greenSoft:C.redSoft,borderRadius:12,padding:"14px 16px",border:"1px solid "+(cf.net>=0?C.greenBord:C.redBord)}}>
              <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase"}}>{label}</p>
              <p style={{margin:"0 0 4px",fontSize:20,fontWeight:800,color:cf.net>=0?C.green:C.red}}>{cf.net>=0?"+":""}{fmt(cf.net)}</p>
              <div style={{fontSize:11,color:C.textMuted}}><div>Saídas: {fmt(cf.out)}</div><div>Entradas: {fmt(cf.inn)}</div></div>
            </div>
          ))}
        </div>
      </Card>
      {upcoming.length>0&&(
        <Card C={C}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <h3 style={{margin:0,fontSize:13,fontWeight:700,color:C.textPrimary}}>🗓️ A vencer esta semana</h3>
            <span style={{marginLeft:"auto",background:C.amberSoft,color:C.amber,border:"1px solid "+C.amberBord,borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700}}>{upcoming.length}</span>
          </div>
          {upcoming.map((inv: any)=>{
            const isCl=!!inv.clientName;
            const dd=parseD(inv.dueDate);
            const dl=dd?Math.ceil((dd.getTime()-now.getTime())/86400000):null;
            const dlColor=dl===0?C.red:dl!=null&&dl<=2?C.amber:C.textMuted;
            return(
              <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border,gap:10}}>
                <div style={{minWidth:0}}>
                  <p style={{margin:0,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textPrimary}}>{isCl?inv.clientName:inv.supplier}</p>
                  <p style={{margin:0,fontSize:11,color:C.textMuted}}>{inv.invoiceNum} · {inv.dueDate}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:dlColor}}>{dl===0?"Hoje":dl===1?"Amanhã":"em "+dl+"d"}</span>
                  <span style={{fontSize:14,fontWeight:800,color:C.textPrimary}}>{fmt(inv.amount)}</span>
                  <Toggle C={C} on={false} onToggle={()=>isCl?updClInv(inv.id,{status:"recebida",payDate:todayStr()}):updInv(inv.id,{status:"paga",wfStatus:"paga",paidAt:todayStr()})} labelOn={isCl?"Recebido":"Pago"} labelOff={isCl?"Receber":"Pagar"}/>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {awaitingApproval.length>0&&(
        <Card C={C} sx={{border:"1px solid "+C.cyanBord,background:C.cyanSoft}}>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:C.cyan}}>🔔 Aguardam aprovação ({awaitingApproval.length})</h3>
          {awaitingApproval.map((inv: any)=>(
            <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.cyanBord,gap:10}}>
              <div>
                <p style={{margin:0,fontSize:13,fontWeight:600,color:C.textPrimary}}>{inv.supplier}</p>
                <p style={{margin:0,fontSize:11,color:C.textMuted}}>{inv.invoiceNum} · {fmt(inv.amount)}</p>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>updInv(inv.id,{wfStatus:"aprovada",status:"aprovada"})} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Aprovar</button>
                <button onClick={()=>updInv(inv.id,{wfStatus:"pendente",status:"pendente"})} style={{background:C.redSoft,color:C.red,border:"1px solid "+C.redBord,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕ Rejeitar</button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <PieSection pieFilter={pieFilter} setPieFilter={setPieFilter} pieData={pieData} C={C}/>
        <Card C={C}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{margin:0,fontSize:13,fontWeight:700,color:C.textPrimary}}>📊 Entradas/Saídas</h3>
            <select value={chartFilter} onChange={(e: any)=>setChartFilter(e.target.value)} style={{fontSize:10,borderRadius:7,border:"1px solid "+C.border,padding:"3px 7px",background:C.bgElevated,color:C.textSecond,cursor:"pointer"}}>
              <option value="pastas">Por pasta</option><option value="fornecedores">Por fornecedor</option><option value="clientes">Por cliente</option>
            </select>
          </div>
          <BarChart data={barData(chartFilter)} C={C}/>
        </Card>
        <Card C={C}>
          <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:C.textPrimary}}>📅 Últimos 6 meses</h3>
          <BarChart data={monthChart()} C={C}/>
        </Card>
      </div>
    </div>
  );
}
