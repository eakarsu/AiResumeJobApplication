import { Router } from 'express';
// @ts-ignore wave50c.cjs is a plain-JS offline module (no provider calls)
const svc = require('../wave50c.cjs');
const router = Router();
const ownerOf=(req:any)=>String(req.user?.userId||req.user?.id||req.userId||'unknown');
const own=(req:any)=>svc.store.list(ownerOf(req));
router.get('/tasks',(req:any,res:any)=>res.json({tasks:svc.filterTasks(own(req),req.query),sections:own(req).map((t:any)=>svc.labelledSections(t))}));
router.post('/tasks',(req:any,res:any)=>{try{res.status(201).json(svc.store.create(ownerOf(req),req.body||{}));}catch(e:any){res.status(400).json({error:e.message});}});
router.patch('/tasks/:id',(req:any,res:any)=>{const t=svc.store.update(ownerOf(req),req.params.id,req.body||{});return t?res.json(t):res.status(404).json({error:'task not found'});});
router.get('/export.csv',(req:any,res:any)=>res.type('text/csv').send(svc.toCSV(svc.filterTasks(own(req),req.query))));
router.get('/export.json',(req:any,res:any)=>res.type('application/json').send(svc.toJSON(svc.filterTasks(own(req),req.query))));
router.get('/ai/resume-match',(_q:any,res:any)=>res.json(svc.aiResumeMatch(own(_q))));
router.get('/ai/cover-outline',(_q:any,res:any)=>res.json(svc.aiCoverOutline(own(_q))));
router.get('/ai/interview-prep',(_q:any,res:any)=>res.json(svc.aiInterviewPrep(own(_q))));
export default router;
