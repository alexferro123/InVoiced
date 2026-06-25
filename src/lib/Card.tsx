export default function Card({children,sx,C}: any){
  return <div style={{background:C.bgCard,borderRadius:16,border:"1px solid "+C.border,padding:"20px 22px",...(sx||{})}}>{children}</div>;
}
