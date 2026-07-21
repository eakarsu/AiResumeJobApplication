'use strict';
function evaluate(input = {}, context = {}) {
  const errors=[];
  if (String(input.ownerId||'') !== context.actor) errors.push('ownerId must match the signed actor');
  if (!String(input.targetRole||'').trim()) errors.push('targetRole required');
  if (!String(input.progressionPolicyVersion||'').trim()) errors.push('progressionPolicyVersion required');
  if (input.consent !== true) errors.push('affirmative processing consent required');
  if (!Array.isArray(input.assessments) || !input.assessments.length) errors.push('at least one assessment required');
  if (!Array.isArray(input.workItems) || !input.workItems.length) errors.push('at least one work item required');
  const forbidden=['age','race','ethnicity','gender','religion','disability','maritalStatus'];
  if (forbidden.some((field)=>Object.prototype.hasOwnProperty.call(input,field))) errors.push('protected traits must not be used for progression recommendations');
  const assessments=(input.assessments||[]).map((item,index)=>{
    const score=Number(item.score); if (!String(item.skill||'').trim()) errors.push(`assessments[${index}].skill required`); if (!Number.isFinite(score)||score<0||score>100) errors.push(`assessments[${index}].score invalid`); return { skill:String(item.skill||''), score };
  });
  const work=(input.workItems||[]).map((item,index)=>{ if (!String(item.id||'').trim()||!String(item.status||'').trim()) errors.push(`workItems[${index}] invalid`); return { id:String(item.id||''),status:String(item.status||'') }; });
  const gaps=assessments.filter((a)=>a.score<70).sort((a,b)=>a.skill.localeCompare(b.skill));
  return { errors, result:{ schemaVersion:1,targetRole:String(input.targetRole||''),progressionPolicyVersion:String(input.progressionPolicyVersion||''),skillGaps:gaps,nextWorkItems:work.filter((w)=>w.status!=='complete').map((w)=>w.id).sort(),predictionMade:false,humanReviewRequired:true,appealAndCorrectionAvailable:true,accessibilityMode:String(input.accessibilityMode||'standard') }, assumptions:['Assessment scores are user-supplied and are not employment decisions.'], uncertainty:{ outcomePrediction:'not_performed', dataCompleteness:input.dataComplete===true?'declared_complete':'incomplete' } };
}
module.exports={evaluate};
