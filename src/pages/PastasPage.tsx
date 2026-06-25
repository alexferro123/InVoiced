import Card from "../components/Card";
import Btn from "../components/Btn";
import { fmt, FOLDER_COLORS, FOLDER_ICONS } from "../lib/utils";

export default function PastasPage({C,folders,nonCr,clientInvs,setConfirmDel,deleteFolder,setShowAddFolder,setTab,setFFolder,newFolder,setNewFolder,addFolder}: any){
  return(
    <Card C={C}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.textPrimary}}>As tuas pastas</h3>
          <p style={{margin:"4px 0 0",fontSize:12,color:C.textMuted}}>Os nomes são usados para associar faturas automaticamente.</p>
        </div>
        <Btn C={C} v="primary" onClick={()=>setShowAddFolder(true)}>+ Nova pasta</Btn>
      </div>
      {folders.length===0?(
        <div style={{textAlign:"center",padding:"2rem",background:C.bgElevated,borderRadius:12,border:"2px dashed "+C.border}}>
          <p style={{fontSize:32,margin:"0 0 8px"}}>📁</p>
          <p style={{fontSize:14,fontWeight:600,color:C.textPrimary,margin:"0 0 4px"}}>Ainda não tens pastas</p>
          <p style={{fontSize:12,color:C.textMuted,margin:0}}>Ex: "Contabilidade", "EDP", "Obras 2025"</p>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {folders.map((f: any)=>{
            const fInvs=nonCr.filter((i: any)=>i.folderId===f.id),fCl=clientInvs.filter((i: any)=>i.folderId===f.id);
            const total=[...fInvs,...fCl].reduce((s: number,i: any)=>s+(i.amount||0),0);
            const paid=fInvs.filter((i: any)=>i.status==="paga").reduce((s: number,i: any)=>s+(i.amount||0),0)+fCl.filter((i: any)=>i.status==="recebida").reduce((s: number,i: any)=>s+(i.amount||0),0);
            const col=f.color||FOLDER_COLORS[0],cnt=fInvs.length+fCl.length;
            return(
              <div key={f.id} style={{background:col.bg,border:"1px solid "+col.border,borderRadius:14,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <span style={{fontSize:26}}>{f.icon}</span>
                  <button onClick={()=>setConfirmDel({msg:`Apagar pasta "${f.name}"?`,fn:()=>deleteFolder(f.id)})} style={{background:"rgba(0,0,0,.15)",border:"none",cursor:"pointer",fontSize:12,color:col.text,padding:"3px 7px",borderRadius:6}}>✕</button>
                </div>
                <div>
                  <p style={{margin:"0 0 3px",fontWeight:700,fontSize:14,color:col.text}}>{f.name}</p>
                  <p style={{margin:0,fontSize:11,color:col.text,opacity:.7}}>{cnt} fatura{cnt!==1?"s":""} · {fmt(total)}</p>
                </div>
                {total>0&&<div style={{fontSize:10,display:"flex",gap:8}}><span style={{color:"#4ADE80",fontWeight:600}}>{fmt(paid)}</span>{total-paid>0&&<span style={{color:"#F59E0B",fontWeight:600}}>pend. {fmt(total-paid)}</span>}</div>}
                <div style={{display:"flex",gap:6}}>
                  {fInvs.length>0&&<button onClick={()=>{setFFolder(String(f.id));setTab("fornecedores");}} style={{flex:1,background:"rgba(0,0,0,.15)",border:"none",borderRadius:7,padding:"5px",fontSize:11,fontWeight:600,color:col.text,cursor:"pointer"}}>🏢 {fInvs.length}</button>}
                  {fCl.length>0&&<button onClick={()=>setTab("clientes")} style={{flex:1,background:"rgba(0,0,0,.15)",border:"none",borderRadius:7,padding:"5px",fontSize:11,fontWeight:600,color:col.text,cursor:"pointer"}}>🏷️ {fCl.length}</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
