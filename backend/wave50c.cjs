'use strict';

const LABEL="Offline deterministic summary (not AI-generated)";
function esc(v){const s=String(v??"");return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function labelledSections(r){return [["Title",r.title??""],["Status",r.status??""],["Priority",r.priority??""],["Done",r.done??false],["Progress",r.progress??0],["Notes",r.notes??""]].map(([label,value])=>({label,value}));}
function renderSections(r){return labelledSections(r).map(s=>`${s.label}: ${s.value===""?"(empty)":String(s.value)}`).join("\n");}
function filterTasks(tasks,{q="",status="",priority=""}={}){const n=String(q).toLowerCase();return tasks.filter(t=>(!n||`${t.title} ${t.notes||""}`.toLowerCase().includes(n))&&(!status||t.status===status)&&(!priority||t.priority===priority));}
function toCSV(tasks){const cols=["id","title","status","priority","done","progress","notes","createdAt","updatedAt"];return [cols.join(","),...tasks.map(t=>cols.map(c=>esc(t[c])).join(","))].join("\n");}
function toJSON(tasks){return JSON.stringify({tasks,count:tasks.length},null,2);}
function createStore(){const byOwner=new Map();let n=0;
 const list=(owner)=>[...(byOwner.get(owner)||[])];
 const create=(owner,input={})=>{const title=String(input.title||"").trim();if(!title)throw new Error("title required");const t={id:`task-${++n}`,owner,title,status:input.status||"todo",priority:input.priority||"normal",done:Boolean(input.done),progress:Number(input.progress||0),notes:String(input.notes||""),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(!byOwner.has(owner))byOwner.set(owner,[]);byOwner.get(owner).push(t);return t;};
 const update=(owner,id,patch={})=>{const t=list(owner).find(x=>x.id===id);if(!t)return null;for(const k of["title","status","priority","notes"])if(patch[k]!==undefined)t[k]=String(patch[k]);if(patch.done!==undefined)t.done=Boolean(patch.done);if(patch.progress!==undefined)t.progress=Number(patch.progress);t.updatedAt=new Date().toISOString();return t;};
 return{list,create,update};}
const store=createStore();
function words(s){return String(s||"").toLowerCase().match(/[a-z0-9]+/g)||[];}
function aiResumeMatch(records){const text=records.map(r=>`${r.title} ${r.notes||""}`).join(" ");const w=words(text);return{aiGenerated:false,label:LABEL,feature:"resume-match",keywordCount:new Set(w).size,suggestion:w.length?"Keep quantified achievements and mirror job keywords.":"Add a target role and achievements to a task first."};}
function aiCoverOutline(records){return{aiGenerated:false,label:LABEL,feature:"cover-letter-outline",outline:["Opening: role and company","Evidence: two quantified achievements","Close: interview request"],basedOn:records.length};}
function aiInterviewPrep(records){const open=records.filter(r=>r.status!=="done");return{aiGenerated:false,label:LABEL,feature:"interview-prep",openTasks:open.length,checklist:["Research company","Prepare STAR stories","Prepare questions"]};}

module.exports={store,filterTasks,toCSV,toJSON,labelledSections,renderSections,aiResumeMatch,aiCoverOutline,aiInterviewPrep};
