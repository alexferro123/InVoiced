export default function KpiCard({label,icon,val,sub,color,glow,C}: any){
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
