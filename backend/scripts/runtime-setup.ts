import path from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import prisma from '../src/services/prisma';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function psql(args: string[], input?: string) {
  const result = spawnSync('psql', [process.env.DATABASE_URL!, '-v', 'ON_ERROR_STOP=1', ...args], { encoding: 'utf8', input });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'psql failed').trim());
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  psql(['-f', path.join(__dirname, '..', 'migrations', '001_governed_workflows.sql')]);
  psql(['-f', '-'], `
    BEGIN;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS "User"(
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,
      "firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,phone TEXT,location TEXT,"linkedinUrl" TEXT,"portfolioUrl" TEXT,"avatarUrl" TEXT,
      "isPremium" BOOLEAN NOT NULL DEFAULT FALSE,"premiumTier" TEXT,role TEXT NOT NULL DEFAULT 'user',"isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
      "emailVerificationToken" TEXT,"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),"updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS "ActivityLog"(
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      action TEXT NOT NULL,"entityType" TEXT,"entityId" TEXT,metadata JSONB,"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS resume_ai_interactions(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"userId" TEXT NOT NULL REFERENCES "User"(id),input JSONB NOT NULL,output JSONB NOT NULL,model TEXT NOT NULL,"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS resume_ai_interactions_user_idx ON resume_ai_interactions("userId","createdAt" DESC);
    COMMIT;
  `);
  const email=String(process.env.PROVISION_ADMIN_EMAIL||process.env.ADMIN_EMAIL||'').trim().toLowerCase();
  const password=String(process.env.PROVISION_ADMIN_PASSWORD||process.env.ADMIN_PASSWORD||'');
  if(!email||password.length<12)throw new Error('Runtime administrator credentials are required');
  await prisma.user.upsert({where:{email},create:{email,password:await bcrypt.hash(password,12),firstName:'Runtime',lastName:'Administrator',role:'admin',isEmailVerified:true},update:{password:await bcrypt.hash(password,12),role:'admin',isEmailVerified:true}});
  console.log('Runtime schema and administrator reconciled.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
