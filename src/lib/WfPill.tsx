import { WF_LABELS } from "../lib/utils";
export default function WfPill({status,C}: any){
  const s=status||"pendente";
  const map: any={pendente:[C.amberSoft,C.amber,C.amberBord],aguarda_aprovacao:[C.cyanSoft,C.cyan,C.cyanBord],aprovada:[C.purpleSoft,C.purple,C.purpleBord],paga:[C.greenSoft,C.green,C.greenBord]};
  const [bg,text,border]=map[s]||map.pendente;
  return <span style={{background:bg,color:text,border:"1px solid "+border,borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{WF_LABELS[s]||s}</span>;
}
