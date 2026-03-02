/**
 * USEPROJECTAPI HOOK
 * React hook for project data fetching and management
 */

import { useEffect, useState, useCallback } from 'react';
import { projectAPI } from '../services/api/projectAPI.js';

/**
 * Hook for fetching all projects
 */
export function useProjectList(options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await projectAPI.getAll(options);
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  return { data, loading, error, refetch: fetchProjects };
}

/**
 * Hook for fetching a single project
 */
export function useProject(projectId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!projectId) {
      setData(null);
      return;
    }
    
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await projectAPI.getById(projectId);
        setData(result);
      } catch (err) {
        setError(err);
        console.error('Failed to fetch project:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);
  
  return { data, loading, error };
}

/**
 * Hook for project members
 */
export function useProjectMembers(projectId, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchMembers = useCallback(async () => {
    if (!projectId) {
      setData(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await projectAPI.getMembers(projectId, options);
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, options]);
  
  const addMember = useCallback(
    async (userId, role) => {
      try {
        setLoading(true);
        setError(null);
        const result = await projectAPI.addMember(projectId, userId, role);
        await fetchMembers(); // Refresh list
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, fetchMembers]
  );
  
  const removeMember = useCallback(
    async (userId) => {
      try {
        setLoading(true);
        setError(null);
        await projectAPI.removeMember(projectId, userId);
        await fetchMembers(); // Refresh list
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, fetchMembers]
  );
  
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchMembers,
    addMember,
    removeMember,
  };
}

/**
 * Hook for project statistics
 */
export function useProjectStats(projectId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchStats = useCallback(async () => {
    if (!projectId) {
      setData(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await projectAPI.getStats(projectId);
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  return { data, loading, error, refetch: fetchStats };
}
