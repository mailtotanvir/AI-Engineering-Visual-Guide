"use client";
import {useEffect,useState} from "react";
import {SELECTION,type Selection} from "@/lib/webmcp/activity";
export function useAtlasSelection(world:string,topics:{id:string;domain:string}[],setDomain:(s:string)=>void,setOpen:(s:string|null)=>void){
 const [matches,setMatches]=useState<string[]>([]);
 useEffect(()=>{
  function reveal(ids:string[]){const prefix=world+":atlas:";const local=ids.filter(id=>id.startsWith(prefix)).map(id=>id.slice(prefix.length));setMatches(local);const first=topics.find(t=>t.id===local[0]);if(first){setDomain(first.domain);setOpen(first.id);}}
  const initial=new URLSearchParams(window.location.search).get("entry");if(initial)reveal([world+":atlas:"+initial]);
  const listener=(e:Event)=>reveal((e as CustomEvent<Selection>).detail.ids);window.addEventListener(SELECTION,listener);return()=>window.removeEventListener(SELECTION,listener);
 },[world,topics,setDomain,setOpen]);return matches;
}
