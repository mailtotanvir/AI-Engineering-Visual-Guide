export type Activity = { tool:string; timestamp:string; input:unknown; durationMs:number; success:boolean; count?:number; error?:string; mode:string };
export type Selection = { ids:string[] };
export const ACTIVITY = "webmcp:activity";
export const SELECTION = "webmcp:selection";
export function select(ids:string[]) { window.dispatchEvent(new CustomEvent(SELECTION,{detail:{ids}})); }
