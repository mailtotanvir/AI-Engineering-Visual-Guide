import { names, schemas, run, type Name } from "./tools";
export type Registered = {name:string;[key:string]:unknown};
export type Context = { registerTool:(tool:unknown, options:{signal:AbortSignal})=>Promise<void>; getTools?:()=>Promise<Registered[]>; executeTool?:(tool:Registered,input:object)=>Promise<string> };
export function context():Context|undefined { return (document as Document & {modelContext?:Context}).modelContext; }
export async function register(ctx:Context,signal:AbortSignal,onRegistered:(name:Name)=>void) {
 for(const name of names) {
  if(signal.aborted) return;
  await ctx.registerTool({name,description:name === "search_articles" ? "Search real CUDA and Inference Atlas entries. Highlights matches in the active Atlas; does not change content." : name === "get_article" ? "Retrieve a real Atlas entry. Reveals it in the active Atlas without navigating." : "Cite a real Atlas entry using verified title and URL; author and publication date are unavailable.",inputSchema:schemas[name],execute:(input:unknown,options:{signal:AbortSignal})=>run(name,input,"native",options.signal)}, {signal});
  if(!signal.aborted) onRegistered(name);
 }
}
