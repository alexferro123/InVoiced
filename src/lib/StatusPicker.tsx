import { useState, useRef, useEffect } from "react";
import WfPill from "./WfPill";
import { WF_STATES, todayStr } from "../lib/utils";

function PortalDD({triggerRef,open,onClose,children,minW=180}: any){
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
      <div style={{position:"absolute",top:pos.top,left:pos.left,minWidth:pos.minWidth,transform:`translateY(${pos.translateY})`,background:"#1E1E2A",border:"1px solid #2E2E40",borderRadius:12,boxShadow:"0 16px 48px rgba(0,0,0,.6)",overflow:"hidden",maxHeight:300,overflowY:"auto"}} onClick={(e: any)=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function StatusPicker({inv,onUpdate,C}: any){
  const [open,setOpen]=useState(false);
  const ref=useRef<any>();
  return(
    <div ref={ref}>
      <button onClick={()=>setOpen((o: boolean)=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4}}>
        <WfPill status={inv.wfStatus||"pendente"} C={C}/><span style={{fontSize:9,color:C.textMuted}}>▼</span>
      </button>
      <PortalDD triggerRef={ref} open={open} onClose={()=>setOpen(false)}>
        {WF_STATES.map((s: string)=>(
          <button key={s} onClick={()=>{const isPaga=s==="paga";onUpdate({wfStatus:s,status:isPaga?"paga":"pendente",...(isPaga?{paidAt:todayStr()}:{})});setOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",width:"100%",background:inv.wfStatus===s?C.purpleSoft:"transparent",border:"none",borderBottom:"1px solid #2E2E40",cursor:"pointer"}}>
            <WfPill status={s} C={C}/>{inv.wfStatus===s&&<span style={{color:C.purple,fontSize:12}}>✓</span>}
          </button>
        ))}
      </PortalDD>
    </div>
  );
}
