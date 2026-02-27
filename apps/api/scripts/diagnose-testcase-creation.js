/**
 * Test Case Creation Diagnostics
 * 
 * This script helps diagnose issues with test case creation
 */

import { getPrismaClient } from '../src/lib/prisma.js';

const prisma = getPrismaClient();

async function runDiagnostics() {
  console.log('🔍 Running Test Case Creation Diagnostics...\n');
  
  try {
    // 1. Check if TestCaseCounter table exists
    console.log('1. Checking TestCaseCounter table...');
    try {
      const counters = await prisma.testCaseCounter.findMany();
      console.log(`   ✅ TestCaseCounter table exists with ${counters.length} records`);
      if (counters.length > 0) {
        console.log('   Sample records:', counters.slice(0, 3));
      }
    } catch (error) {
      console.log('   ❌ Error accessing TestCaseCounter:', error.message);
    }
    
    // 2. Check if there are any projects
    console.log('\n2. Checking projects...');
    const projects = await prisma.project.findMany({
      take: 5,
      select: { id: true, name: true, key: true }
    });
    console.log(`   ✅ Found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log('   Sample projects:', projects);
    }
    
    // 3. Check existing test cases
    console.log('\n3. Checking existing test cases...');
    const testCases = await prisma.testCase.findMany({
      take: 5,
      select: {
        id: true,
        testCaseId: true,
        name: true,
        projectId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`   ✅ Found ${testCases.length} test cases (showing most recent)`);
    if (testCases.length > 0) {
      testCases.forEach(tc => {
        console.log(`   - ${tc.testCaseId || 'NO-ID'}: ${tc.name} (Project ${tc.projectId})`);
      });
    }
    
    // 4. Try to simulate test case ID generation
    console.log('\n4. Testing generateTestCaseId logic...');
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`   Testing with project: ${project.name} (${project.key})`);
      
      try {
        // This simulates what generateTestCaseId does
        const counter = await prisma.testCaseCounter.upsert({
          where: { projectId: project.id },
          create: { projectId: project.id, nextNumber: 1 },
          update: { nextNumber: { increment: 1 } },
        });
        
        const number = counter.nextNumber.toString().padStart(3, '0');
        const testCaseId = `${project.key}-TC-${number}`;
        
        console.log(`   ✅ Generated test case ID: ${testCaseId}`);
        console.log(`   Counter state: nextNumber=${counter.nextNumber}`);
      } catch (error) {
        console.log(`   ❌ Error generating ID: ${error.message}`);
      }
    }
    
    // 5. Check user permissions
    console.log('\n5. Checking users with TESTER role...');
    const testers = await prisma.user.findMany({
      where: { role: 'TESTER', isActive: true },
      take: 3,
      select: { id: true, name: true, email: true, role: true }
    });
    console.log(`   ✅ Found ${testers.length} active testers`);
    if (testers.length > 0) {
      testers.forEach(t => {
        console.log(`   - ${t.name} (${t.email})`);
      });
    }
    
    // 6. Check recent audit logs for test case creation attempts
    console.log('\n6. Checking recent test case creation attempts...');
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        action: 'TESTCASE_CREATED'
      },
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true,
        resourceName: true,
        description: true,
        user: { select: { name: true } }
      }
    });
    if (recentLogs.length > 0) {
      console.log(`   ✅ Found ${recentLogs.length} recent creations`);
      recentLogs.forEach(log => {
        console.log(`   - ${log.timestamp.toISOString()}: ${log.resourceName} by ${log.user.name}`);
      });
    } else {
      console.log('   ⚠️  No recent test case creation attempts found in audit logs');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 Diagnostics Summary');
    console.log('='.repeat(60));
    console.log('If all checks passed, the issue might be:');
    console.log('  - Permission/authentication issues in the frontend');
    console.log('  - Missing projectId in API request');
    console.log('  - Validation errors not being displayed');
    console.log('  - Check browser console for JavaScript errors');
    console.log('  - Check API logs for detailed error messages');
    
  } catch (error) {
    console.error('\n❌ Diagnostics failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics()
  .catch((error) => {
    console.error('Diagnostics failed:', error);
    process.exit(1);
  });
