import { useRef } from "react";
import Card from "../components/Card";
import Btn from "../components/Btn";
import { fmt } from "../lib/utils";

export default function AssistentePage({C,chatMsgs,chatIn,setChatIn,chatLoad,sendChat,totFat,totPag,totEmit,totRec,cf30,onTimeRate,chatEnd}: any){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:14,alignItems:"start"}}>
      <Card C={C} sx={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,rgba(155,89,245,.1),rgba(34,211,238,.1))"}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:17,fontWeight:900,fontStyle:"italic"}}>N</span></div>
          <div>
            <p style={{margin:0,fontWeight:800,fontSize:14,background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Assistente InVoiced</p>
            <p style={{margin:0,fontSize:11,color:C.green}}>● Online · Ctrl+K</p>
          </div>
        </div>
        <div style={{height:380,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"16px 20px"}}>
          {chatMsgs.map((m: any,i: number)=>{
            const u=m.role==="user";
            return(
              <div key={i} style={{display:"flex",justifyContent:u?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
                {!u&&<div style={{width:26,height:26,borderRadius:7,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:700,color:"#fff"}}>N</div>}
                <div style={{borderRadius:u?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",maxWidth:"78%",fontSize:13,lineHeight:"1.6",background:u?C.grad:C.bgElevated,color:u?"#fff":C.textPrimary,border:u?"none":"1px solid "+C.border}}>{m.text}</div>
              </div>
            );
          })}
          {chatLoad&&(
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{width:26,height:26,borderRadius:7,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff"}}>N</div>
              <div style={{background:C.bgElevated,border:"1px solid "+C.border,borderRadius:"18px 18px 18px 4px",padding:"10px 14px",fontSize:13,color:C.textMuted}}>A pensar...</div>
            </div>
          )}
          <div ref={chatEnd}/>
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid "+C.border,display:"flex",gap:8}}>
          <input value={chatIn} onChange={(e: any)=>setChatIn(e.target.value)} onKeyDown={(e: any)=>e.key==="Enter"&&sendChat()} placeholder="Escreve a tua pergunta..." style={{flex:1,fontSize:13,borderRadius:10,border:"1px solid "+C.border,padding:"10px 14px",outline:"none",background:C.bgElevated,color:C.textPrimary}}/>
          <Btn C={C} v="primary" onClick={sendChat} disabled={chatLoad} sx={{padding:"10px 18px"}}>Enviar</Btn>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Card C={C} sx={{padding:"14px 16px"}}>
          <p style={{margin:"0 0 10px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,color:C.textMuted}}>Sugestões rápidas</p>
          {["Saldo projetado a 60 dias?","Clientes em atraso?","Faturas por aprovar?","Pasta com mais valor?","Taxa de pagamento a tempo?","Onde estou a gastar mais?"].map((s: string)=>(
            <button key={s} onClick={()=>setChatIn(s)} style={{display:"block",width:"100%",textAlign:"left",background:C.bgElevated,border:"1px solid "+C.border,borderRadius:8,padding:"7px 11px",fontSize:12,color:C.textSecond,cursor:"pointer",marginBottom:5,fontFamily:"inherit"}}>{s}</button>
          ))}
        </Card>
        <Card C={C} sx={{padding:"14px 16px"}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,color:C.textMuted}}>Resumo</p>
          {[{l:"Faturado",v:fmt(totFat)},{l:"Pago",v:fmt(totPag),c:C.purple},{l:"Emitido",v:fmt(totEmit)},{l:"Recebido",v:fmt(totRec),c:C.green},{l:"CF 30d",v:(cf30.net>=0?"+":"")+fmt(cf30.net),c:cf30.net>=0?C.green:C.red},{l:"Pontualidade",v:onTimeRate!=null?onTimeRate+"%":"—",c:onTimeRate!=null&&onTimeRate>=80?C.green:onTimeRate!=null?C.amber:C.textMuted}].map((m: any)=>(
            <div key={m.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+C.border}}>
              <span style={{fontSize:12,color:C.textMuted}}>{m.l}</span>
              <span style={{fontSize:12,fontWeight:700,color:m.c||C.textPrimary}}>{m.v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
