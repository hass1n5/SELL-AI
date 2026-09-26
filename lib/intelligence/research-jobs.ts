import type {ResearchJob} from '../types';

const jobs=new Map<string,ResearchJob>();
export function createResearchJob(query:string,region:string,actorId?:string):ResearchJob{
 const job:ResearchJob={id:`research-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,provider:'apify',query,region,actorId,status:'queued',createdAt:new Date().toISOString(),evidenceCount:0}; jobs.set(job.id,job); return job;
}
export function updateResearchJob(job:ResearchJob){jobs.set(job.id,job);return job;}
export function getResearchJob(id:string){return jobs.get(id);}
export function listResearchJobs(){return [...jobs.values()];}
