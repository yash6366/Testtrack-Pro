/**
 * TEST CASE API SERVICE
 * All test case management API calls
 */

import client from './client.js';

const BASE_PATH = '/projects';

export const testCaseAPI = {
  /**
   * Get all test cases for a project/test plan
   */
  async getByProject(projectId, testPlanId = null, options = {}) {
    const { skip = 0, take = 20, status } = options;
    
    let url = `${BASE_PATH}/${projectId}/testcases`;
    if (testPlanId) {
      url = `${BASE_PATH}/${projectId}/testplans/${testPlanId}/testcases`;
    }
    
    const params = { skip, take };
    if (status) params.status = status;
    
    const response = await client.get(url, { params });
    return response.data;
  },
  
  /**
   * Get single test case details
   */
  async getById(projectId, testCaseId) {
    const response = await client.get(
      `${BASE_PATH}/${projectId}/testcases/${testCaseId}`
    );
    return response.data;
  },
  
  /**
   * Create new test case
   */
  async create(projectId, data) {
    const response = await client.post(
      `${BASE_PATH}/${projectId}/testcases`,
      data
    );
    return response.data;
  },
  
  /**
   * Update test case
   */
  async update(projectId, testCaseId, data) {
    const response = await client.patch(
      `${BASE_PATH}/${projectId}/testcases/${testCaseId}`,
      data
    );
    return response.data;
  },
  
  /**
   * Delete test case
   */
  async delete(projectId, testCaseId) {
    await client.delete(
      `${BASE_PATH}/${projectId}/testcases/${testCaseId}`
    );
  },
  
  /**
   * Duplicate test case
   */
  async duplicate(projectId, testCaseId, newName) {
    const response = await client.post(
      `${BASE_PATH}/${projectId}/testcases/${testCaseId}/duplicate`,
      { name: newName }
    );
    return response.data;
  },
};
