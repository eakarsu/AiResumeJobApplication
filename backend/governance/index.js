'use strict';
const jwt=require('jsonwebtoken');
const { PrismaClient }=require('@prisma/client');
const { createRouter }=require('./router');
const { evaluate }=require('./domain');
const prisma=new PrismaClient();
const db={ async query(text,params=[]){ const rows=await prisma.$queryRawUnsafe(text,...params); const normalized=JSON.parse(JSON.stringify(rows,(_,v)=>typeof v==='bigint'?Number(v):v)); return {rows:normalized,rowCount:normalized.length}; } };
function auth(req,res,next){ const secret=process.env.JWT_SECRET||''; const token=req.headers.authorization&&req.headers.authorization.match(/^Bearer (.+)$/)?.[1]; if(secret.length<32)return res.status(503).json({error:'secure JWT configuration required'}); if(!token)return res.status(401).json({error:'bearer token required'}); try{req.user=jwt.verify(token,secret,{algorithms:['HS256']});}catch(_){return res.status(401).json({error:'invalid token'});} next(); }
module.exports=createRouter({db,auth,evaluate,workflow:'career-application-plan',providers:['lms','hris','ats','calendar','content-provider','communications','webhook'],approverRoles:['career_reviewer','employment_counselor','accessibility_reviewer','admin']});
