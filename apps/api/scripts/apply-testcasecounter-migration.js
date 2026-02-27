#!/usr/bin/env node

/**
 * Manual Migration Script for TestCaseCounter Table
 * 
 * This script manually applies the TestCaseCounter migration
 * when Prisma migrate commands have connectivity issues.
 */

import { getPrismaClient } from '../src/lib/prisma.js';

const prisma = getPrismaClient();

async function applyMigration() {
  console.log('🔧 Applying TestCaseCounter migration...\n');
  
  try {
    // Check if table already exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'TestCaseCounter'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ TestCaseCounter table already exists!');
      return;
    }
    
    console.log('Creating TestCaseCounter table...');
    
    // Create the table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TestCaseCounter" (
        "id" SERIAL NOT NULL,
        "projectId" INTEGER NOT NULL,
        "nextNumber" INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT "TestCaseCounter_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('Creating unique index on projectId...');
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "TestCaseCounter_projectId_key" 
      ON "TestCaseCounter"("projectId");
    `;
    
    console.log('Creating index on projectId...');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "TestCaseCounter_projectId_idx" 
      ON "TestCaseCounter"("projectId");
    `;
    
    // Mark migration as applied
    console.log('Recording migration in _prisma_migrations...');
    
    const migrationName = '20260227000000_add_test_case_counter';
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" 
      ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (
        gen_random_uuid()::text,
        'migration_checksum',
        NOW(),
        ${migrationName},
        NULL,
        NULL,
        NOW(),
        1
      )
      ON CONFLICT DO NOTHING;
    `;
    
    console.log('\n✅ Migration applied successfully!');
    console.log('🎉 TestCaseCounter table is now ready.');
    console.log('\nYou can now create test cases without errors.');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
