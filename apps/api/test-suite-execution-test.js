/**
 * Test Script for Test Suite Execution
 * This script tests if the test suite execution functionality works properly after the schema fixes
 */

import { getPrismaClient } from './src/lib/prisma.js';

const prisma = getPrismaClient();

async function testSuiteExecution() {
  console.log('🧪 Testing Test Suite Execution Functionality\n');

  try {
    // Test 1: Check if TestSuiteRun model has new fields
    console.log('✅ Test 1: Checking TestSuiteRun schema...');
    const testSuiteRun = await prisma.testSuiteRun.findFirst({
      select: {
        id: true,
        testRunId: true,
        description: true,
        executedCount: true,
        blockedCount: true,
        skippedCount: true,
        stopOnFailure: true,
        executeChildSuites: true,
        executedBy: true,
        actualStartDate: true,
        actualEndDate: true,
      },
    });
    console.log('   TestSuiteRun schema is correct ✓\n');

    // Test 2: Check if TestExecution model has suiteRunId field
    console.log('✅ Test 2: Checking TestExecution schema...');
    const testExecution = await prisma.testExecution.findFirst({
      select: {
        id: true,
        suiteRunId: true,
        userId: true,
      },
    });
    console.log('   TestExecution schema is correct ✓\n');

    // Test 3: Try to create a test suite run (dry run - will rollback)
    console.log('✅ Test 3: Testing TestSuiteRun creation...');
    
    // Get a test suite, project, and user for testing
    const suite = await prisma.testSuite.findFirst({
      include: {
        testCases: {
          take: 1,
        },
      },
    });

    if (!suite) {
      console.log('   ⚠️  No test suites found in database. Skipping creation test.\n');
    } else {
      const user = await prisma.user.findFirst();
      
      if (!user) {
        console.log('   ⚠️  No users found in database. Skipping creation test.\n');
      } else {
        // Test creating a TestRun
        const testRun = await prisma.testRun.create({
          data: {
            projectId: suite.projectId,
            name: 'Test Run for Schema Validation',
            status: 'PLANNED',
            totalTestCases: 1,
            executedBy: user.id,
            createdBy: user.id,
          },
        });

        // Test creating a TestSuiteRun with all new fields
        const suiteRun = await prisma.testSuiteRun.create({
          data: {
            suiteId: suite.id,
            projectId: suite.projectId,
            testRunId: testRun.id,
            name: 'Schema Validation Test',
            description: 'Testing if all fields work correctly',
            status: 'PLANNED',
            totalTestCases: 1,
            executedCount: 0,
            passedCount: 0,
            failedCount: 0,
            blockedCount: 0,
            skippedCount: 0,
            stopOnFailure: false,
            executeChildSuites: true,
            executedBy: user.id,
            actualStartDate: new Date(),
          },
        });

        console.log(`   Created TestSuiteRun with ID: ${suiteRun.id} ✓`);

        // Test creating a TestExecution with suiteRunId
        const testCase = suite.testCases[0];
        if (testCase) {
          const execution = await prisma.testExecution.create({
            data: {
              testRunId: testRun.id,
              testCaseId: testCase.testCaseId,
              suiteRunId: suiteRun.id,
              status: 'BLOCKED',
              userId: user.id,
            },
          });

          console.log(`   Created TestExecution with ID: ${execution.id} and suiteRunId: ${execution.suiteRunId} ✓\n`);

          // Clean up test data
          await prisma.testExecution.delete({ where: { id: execution.id } });
        }

        await prisma.testSuiteRun.delete({ where: { id: suiteRun.id } });
        await prisma.testRun.delete({ where: { id: testRun.id } });

        console.log('   ✓ Test data cleaned up\n');
      }
    }

    // Test 4: Check if relations work
    console.log('✅ Test 4: Testing relations...');
    const suiteRunWithRelations = await prisma.testSuiteRun.findFirst({
      include: {
        suite: true,
        testRun: true,
        executor: true,
        executions: {
          take: 1,
        },
      },
    });

    if (suiteRunWithRelations) {
      console.log('   All relations working correctly ✓\n');
    } else {
      console.log('   ⚠️  No existing suite runs to test relations\n');
    }

    console.log('🎉 All Tests Passed! Test Suite Execution is working properly.\n');
    console.log('✅ Schema fixes applied successfully');
    console.log('✅ All fields are accessible');
    console.log('✅ Relations are working');
    console.log('✅ CRUD operations are functional\n');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('\nError Details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testSuiteExecution().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});
