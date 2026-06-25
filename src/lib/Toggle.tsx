export default function Toggle({on,onToggle,labelOn,labelOff,C}: any){
  return(
    <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:0}}>
      <div style={{width:44,height:24,borderRadius:12,background:on?C.grad:C.bgElevated,position:"relative",transition:"background .25s",flexShrink:0,border:"1px solid "+(on?C.purpleBord:C.border)}}>
        <div style={{position:"absolute",top:3,left:on?21:3,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.4)",transition:"left .25s"}}/>
      </div>
      <span style={{fontSize:12,fontWeight:600,color:on?C.purple:C.textMuted,minWidth:60}}>{on?(labelOn||"Pago"):(labelOff||"Pendente")}</span>
    </button>
  );
}
