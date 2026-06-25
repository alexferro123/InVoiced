import { fmtK } from "../lib/utils";
export default function BarChart({data,C}: any){
  const h=100;
  if(!data||data.length===0)return <p style={{color:C.textMuted,textAlign:"center",fontSize:13,padding:"1.5rem 0",margin:0}}>Sem dados ainda.</p>;
  const maxV=Math.max(...data.map((d: any)=>(d.paid||0)+(d.pending||0)),1);
  return(
    <div style={{display:"flex",gap:5,alignItems:"flex-end",height:h+28}}>
      {data.map((d: any,i: number)=>{
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
