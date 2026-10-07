import { searchArticles, getArticle, citeArticle } from "./content";
import { ACTIVITY, select } from "./activity";
export type Name = "search_articles" | "get_article" | "cite_article";
export const schemas = {
 search_articles:{type:"object",properties:{query:{type:"string",minLength:1,maxLength:300},limit:{type:"integer",minimum:1,maximum:10}},required:["query"],additionalProperties:false},
 get_article:{type:"object",properties:{id:{type:"string",minLength:1}},required:["id"],additionalProperties:false},
 cite_article:{type:"object",properties:{id:{type:"string",minLength:1},format:{type:"string",enum:["APA","MLA","Chicago"]}},required:["id","format"],additionalProperties:false}
};
export const names = Object.keys(schemas) as Name[];
export function invoke(name:Name, input:unknown) {
 if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Arguments must be an object");
 const a = input as Record<string,unknown>;
 const allowed = name === "search_articles" ? ["query","limit"] : name === "get_article" ? ["id"] : ["id","format"];
 if(Object.keys(a).some(k=>!allowed.includes(k))) throw new Error("Unexpected argument");
 if(name === "search_articles") {
  if(typeof a.query !== "string" || !a.query.trim() || a.query.length>300) throw new Error("Query must contain 1–300 characters");
  if(a.limit !== undefined && (typeof a.limit !== "number" || !Number.isInteger(a.limit) || a.limit<1 || a.limit>10)) throw new Error("Limit must be an integer from 1 to 10");
  return {results:searchArticles(a.query,a.limit as number|undefined)};
 }
 if(typeof a.id !== "string" || !a.id) throw new Error("ID is required");
 if(name === "get_article") return getArticle(a.id);
 if(!["APA","MLA","Chicago"].includes(a.format as string)) throw new Error("Invalid citation format");
 return citeArticle(a.id,a.format as string);
}
export async function run(name:Name,input:unknown,mode:string,signal?:AbortSignal) {
 const start=performance.now();
 let success=false, error:string|undefined, count:number|undefined;
 try {
  if(signal?.aborted) throw new Error("Execution cancelled");
  const result=invoke(name,input);
  if("results" in result) { count=result.results.length; select(result.results.map(a=>a.id)); }
  else if(name === "get_article") select([result.id]);
  success=true; return result;
 } catch(e) { error=e instanceof Error?e.message:"Execution failed"; throw e; }
 finally { window.dispatchEvent(new CustomEvent(ACTIVITY,{detail:{tool:name,timestamp:new Date().toISOString(),input,durationMs:performance.now()-start,success,count,error,mode}})); }
}
