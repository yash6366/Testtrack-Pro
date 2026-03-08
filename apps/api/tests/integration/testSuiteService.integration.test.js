// testSuiteService.integration.test.js
// Integration test for suite hierarchy API validation

const request = require('supertest');
const app = require('../src/server'); // Adjust if your Fastify app is exported differently

// Helper to create suites
async function createSuite(name, parentId = null) {
  return request(app)
    .post('/api/test-suites')
    .send({ name, parentId })
    .set('Authorization', 'Bearer test-token'); // Use a valid token in real tests
}

// Helper to move suite
async function moveSuite(suiteId, newParentId) {
  return request(app)
    .put(`/api/test-suites/${suiteId}`)
    .send({ parentId: newParentId })
    .set('Authorization', 'Bearer test-token');
}

describe('Test Suite Hierarchy Integration', () => {
  let suiteA, suiteB, suiteC;

  beforeAll(async () => {
    // Create Suite A
    const resA = await createSuite('Suite A');
    suiteA = resA.body.id;
    // Create Suite B (child of A)
    const resB = await createSuite('Suite B', suiteA);
    suiteB = resB.body.id;
    // Create Suite C (child of B)
    const resC = await createSuite('Suite C', suiteB);
    suiteC = resC.body.id;
  });

  it('should block moving Suite A under Suite C (circular)', async () => {
    const res = await moveSuite(suiteA, suiteC);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/circular/i);
  });

  it('should allow moving Suite C to root', async () => {
    const res = await moveSuite(suiteC, null);
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(null);
  });

  it('should block moving Suite B to itself', async () => {
    const res = await moveSuite(suiteB, suiteB);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own parent/i);
  });

  it('should block moving Suite C to non-existent parent', async () => {
    const res = await moveSuite(suiteC, 'non-existent-id');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });
});
