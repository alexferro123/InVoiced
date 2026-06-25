import { useState, useRef, useEffect } from "react";
import { FOLDER_COLORS } from "../lib/utils";

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

export default function FolderPicker({inv,folders,onAssign,C}: any){
  const [open,setOpen]=useState(false);
  const ref=useRef<any>();
  const folder=folders.find((f: any)=>f.id===inv.folderId)||null;
  const col=folder?.color||FOLDER_COLORS[0];
  return(
    <div ref={ref}>
      <button onClick={()=>setOpen((o: boolean)=>!o)} style={{background:folder?col.bg:C.bgElevated,border:"1px solid "+(folder?col.border:C.border),borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600,color:folder?col.text:C.textMuted,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
        {folder?folder.icon+" "+folder.name:"+ Pasta"}<span style={{fontSize:9,opacity:.6}}>▼</span>
      </button>
      <PortalDD triggerRef={ref} open={open} onClose={()=>setOpen(false)}>
        {folders.map((f: any)=>{
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
