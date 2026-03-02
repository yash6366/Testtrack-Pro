/**
 * BUG API SERVICE
 * All bug-related API calls
 * Provides a clean interface for frontend to interact with bug endpoints
 */

import client from './client.js';

const BASE_PATH = '/projects';

export const bugAPI = {
  /**
   * Get all bugs for a project with optional filters
   */
  async getByProject(projectId, options = {}) {
    const { skip = 0, take = 20, status, priority, assigneeId } = options;
    
    const params = {
      skip,
      take,
    };
    
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (assigneeId) params.assigneeId = assigneeId;
    
    const response = await client.get(`${BASE_PATH}/${projectId}/bugs`, { params });
    return response.data;
  },
  
  /**
   * Get single bug details with full information
   */
  async getById(projectId, bugId) {
    const response = await client.get(`${BASE_PATH}/${projectId}/bugs/${bugId}`);
    return response.data;
  },
  
  /**
   * Create new bug from test execution or manual entry
   */
  async create(projectId, data) {
    const response = await client.post(`${BASE_PATH}/${projectId}/bugs`, data);
    return response.data;
  },
  
  /**
   * Update bug details
   */
  async update(projectId, bugId, data) {
    const response = await client.patch(
      `${BASE_PATH}/${projectId}/bugs/${bugId}`,
      data
    );
    return response.data;
  },
  
  /**
   * Change bug status (OPEN → IN_PROGRESS → CLOSED, etc)
   */
  async changeStatus(projectId, bugId, newStatus) {
    return this.update(projectId, bugId, { status: newStatus });
  },
  
  /**
   * Assign bug to a team member
   */
  async assign(projectId, bugId, assigneeId) {
    return this.update(projectId, bugId, { assigneeId });
  },
  
  /**
   * Reassign bug from one user to another
   */
  async reassign(projectId, bugId, newAssigneeId) {
    return this.update(projectId, bugId, { assigneeId: newAssigneeId });
  },
  
  /**
   * Add comment/discussion on bug
   */
  async addComment(projectId, bugId, text) {
    const response = await client.post(
      `${BASE_PATH}/${projectId}/bugs/${bugId}/comments`,
      { text }
    );
    return response.data;
  },
  
  /**
   * Update existing comment
   */
  async updateComment(projectId, bugId, commentId, text) {
    const response = await client.patch(
      `${BASE_PATH}/${projectId}/bugs/${bugId}/comments/${commentId}`,
      { text }
    );
    return response.data;
  },
  
  /**
   * Delete comment
   */
  async deleteComment(projectId, bugId, commentId) {
    await client.delete(
      `${BASE_PATH}/${projectId}/bugs/${bugId}/comments/${commentId}`
    );
  },
  
  /**
   * Delete bug
   */
  async delete(projectId, bugId) {
    await client.delete(`${BASE_PATH}/${projectId}/bugs/${bugId}`);
  },
  
  /**
   * Get bug activity/history
   */
  async getHistory(projectId, bugId, options = {}) {
    const { skip = 0, take = 50 } = options;
    const response = await client.get(
      `${BASE_PATH}/${projectId}/bugs/${bugId}/history`,
      { params: { skip, take } }
    );
    return response.data;
  },
  
  /**
   * Export bugs as CSV or PDF
   */
  async export(projectId, format = 'csv', filters = {}) {
    const response = await client.get(
      `${BASE_PATH}/${projectId}/bugs/export`,
      {
        params: { format, ...filters },
        responseType: format === 'pdf' ? 'blob' : 'json',
      }
    );
    return response.data;
  },
};
