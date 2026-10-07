import { TOPICS, DOMAINS } from "@/content/cuda/atlas";
import { INF_TOPICS, INF_DOMAINS } from "@/content/inference/atlas";
export const SITE = "AI Engineering Visual Encyclopedia";
export const ORIGIN = "https://mailtotanvir.github.io/AI-Engineering-Visual-Guide";
export const articles = [
  ...TOPICS.map(t => ({ ...t, world: "CUDA", domainTitle: DOMAINS.find(d => d.id === t.domain)!.name, scene: t.journey ?? null, id: `cuda:atlas:${t.id}`, sourceId: t.id, path: `/atlas/?entry=${encodeURIComponent(t.id)}` })),
  ...INF_TOPICS.map(t => ({ ...t, world: "Inference", domainTitle: INF_DOMAINS.find(d => d.id === t.domain)!.name, scene: t.scene ?? null, id: `inference:atlas:${t.id}`, sourceId: t.id, path: `/inference/atlas/?entry=${encodeURIComponent(t.id)}` }))
].map(t => ({ ...t, url: ORIGIN + t.path }));
export function getArticle(id: string) {
  const article = articles.find(a => a.id === id);
  if (!article) throw new Error("Unknown article ID");
  return article;
}
export function searchArticles(query: string, limit = 5) {
  const terms = query.toLowerCase().trim().split(/\s+/);
  return articles.map(a => {
    const title = (a.title + " " + a.domainTitle).toLowerCase();
    const text = (a.summary + " " + a.points.join(" ")).toLowerCase();
    const score = terms.reduce((s, term) => s + (title.includes(term) ? 4 : 0) + (text.includes(term) ? 1 : 0), 0);
    return { a, score };
  }).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.a.id.localeCompare(b.a.id)).slice(0,limit).map(({ a }) => ({ id:a.id,title:a.title,world:a.world,scene:a.scene,summary:a.summary,path:a.path,url:a.url }));
}
export function citeArticle(id: string, format: string) {
  const a = getArticle(id);
  const citation = format === "APA" ? `${a.title}. (n.d.). ${SITE}. ${a.url}` : format === "MLA" ? `“${a.title}.” ${SITE}, ${a.url}.` : `“${a.title}.” ${SITE}. Access date not recorded. ${a.url}.`;
  return { id, title:a.title, format, citation, url:a.url, metadataConvention:"Title-first; author and publication date unavailable. No access date invented." };
}
