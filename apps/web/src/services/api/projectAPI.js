/**
 * PROJECT API SERVICE
 * All project management API calls
 */

import client from './client.js';

const BASE_PATH = '/projects';

export const projectAPI = {
  /**
   * Get all projects for current user
   */
  async getAll(options = {}) {
    const { skip = 0, take = 20 } = options;
    const response = await client.get(BASE_PATH, {
      params: { skip, take },
    });
    return response.data;
  },
  
  /**
   * Get single project details
   */
  async getById(projectId) {
    const response = await client.get(`${BASE_PATH}/${projectId}`);
    return response.data;
  },
  
  /**
   * Create new project
   */
  async create(data) {
    const response = await client.post(BASE_PATH, data);
    return response.data;
  },
  
  /**
   * Update project
   */
  async update(projectId, data) {
    const response = await client.patch(`${BASE_PATH}/${projectId}`, data);
    return response.data;
  },
  
  /**
   * Delete project
   */
  async delete(projectId) {
    await client.delete(`${BASE_PATH}/${projectId}`);
  },
  
  /**
   * Get project members
   */
  async getMembers(projectId, options = {}) {
    const { skip = 0, take = 50 } = options;
    const response = await client.get(
      `${BASE_PATH}/${projectId}/members`,
      { params: { skip, take } }
    );
    return response.data;
  },
  
  /**
   * Add member to project
   */
  async addMember(projectId, userId, role) {
    const response = await client.post(
      `${BASE_PATH}/${projectId}/members`,
      { userId, role }
    );
    return response.data;
  },
  
  /**
   * Update member role in project
   */
  async updateMemberRole(projectId, userId, role) {
    const response = await client.patch(
      `${BASE_PATH}/${projectId}/members/${userId}`,
      { role }
    );
    return response.data;
  },
  
  /**
   * Remove member from project
   */
  async removeMember(projectId, userId) {
    await client.delete(`${BASE_PATH}/${projectId}/members/${userId}`);
  },
  
  /**
   * Get project statistics
   */
  async getStats(projectId) {
    const response = await client.get(`${BASE_PATH}/${projectId}/stats`);
    return response.data;
  },
};
