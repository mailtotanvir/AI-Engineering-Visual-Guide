import {describe,it,expect} from "vitest";
import {articles,getArticle,citeArticle} from "../lib/webmcp/content";
import {invoke} from "../lib/webmcp/tools";
import {register} from "../lib/webmcp/register";
describe("WebMCP real-content contracts",()=>{
 it("has unique real IDs and canonical entry destinations",()=>{expect(new Set(articles.map(a=>a.id)).size).toBe(articles.length);expect(articles.length).toBeGreaterThan(50);for(const a of articles){expect(a.summary.length).toBeGreaterThan(0);expect(a.url).toContain('?entry=');expect(getArticle(a.id)).toBe(a);}});
 it("finds GPU memory and caps output",()=>{const r=invoke("search_articles",{query:"GPU memory",limit:3});expect("results" in r&&r.results.length).toBe(3);expect(invoke("search_articles",{query:"zxqvnonexistent"})).toEqual({results:[]});});
 it("rejects malformed input without coercion",()=>{for(const input of [null,[],{}, {query:" "},{query:"memory",limit:0},{query:"memory",limit:1.5},{query:"memory",extra:true}])expect(()=>invoke("search_articles",input)).toThrow();expect(()=>invoke("get_article",{id:"missing"})).toThrow();expect(()=>invoke("cite_article",{id:articles[0].id,format:"IEEE"})).toThrow();});
 it("cites deterministically without invented author or date",()=>{for(const format of ["APA","MLA","Chicago"]){const c=citeArticle(articles[0].id,format);expect(c).toEqual(citeArticle(articles[0].id,format));expect(c.citation).toContain(articles[0].url);}expect(citeArticle(articles[0].id,"APA").citation).toContain("n.d.");});
 it("registers three tools with one lifetime signal",async()=>{const controller=new AbortController();const calls:unknown[]=[];const registered:string[]=[];await register({registerTool:async(tool,options)=>{expect(options.signal).toBe(controller.signal);calls.push(tool);}},controller.signal,n=>registered.push(n));expect(calls.length).toBe(3);expect(registered).toEqual(["search_articles","get_article","cite_article"]);});
 it("does not register after cancellation and propagates failures",async()=>{const c=new AbortController();c.abort();await register({registerTool:async()=>{throw Error("unexpected");}},c.signal,()=>{});await expect(register({registerTool:async()=>{throw Error("registration rejected");}},new AbortController().signal,()=>{})).rejects.toThrow("registration rejected");});
});
