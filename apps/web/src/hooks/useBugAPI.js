/**
 * USEBUGAPI HOOK
 * React hook for bug data fetching and management using bugAPI service
 * Handles loading states, error handling, and caching
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { bugAPI } from '../services/api/bugAPI.js';

/**
 * Hook for fetching a list of bugs with pagination and filters
 */
export function useBugList(projectId, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});
  
  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create cache key based on parameters
      const cacheKey = JSON.stringify({ projectId, ...options });
      
      // Check cache first
      if (cacheRef.current[cacheKey]) {
        setData(cacheRef.current[cacheKey]);
        setLoading(false);
        return;
      }
      
      const result = await bugAPI.getByProject(projectId, options);
      cacheRef.current[cacheKey] = result;
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch bugs:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, options]);
  
  useEffect(() => {
    if (projectId) {
      fetchBugs();
    }
  }, [projectId, fetchBugs]);
  
  // Function to clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);
  
  return {
    data,
    loading,
    error,
    refetch: fetchBugs,
    clearCache,
  };
}

/**
 * Hook for fetching a single bug
 */
export function useBug(projectId, bugId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!projectId || !bugId) {
      setData(null);
      return;
    }
    
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await bugAPI.getById(projectId, bugId);
        setData(result);
      } catch (err) {
        setError(err);
        console.error('Failed to fetch bug:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, bugId]);
  
  return { data, loading, error };
}

/**
 * Hook for creating a bug
 */
export function useCreateBug(projectId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const create = useCallback(
    async (bugData) => {
      try {
        setLoading(true);
        setError(null);
        const result = await bugAPI.create(projectId, bugData);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );
  
  return { create, loading, error };
}

/**
 * Hook for updating a bug
 */
export function useUpdateBug(projectId, bugId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const update = useCallback(
    async (updates) => {
      try {
        setLoading(true);
        setError(null);
        const result = await bugAPI.update(projectId, bugId, updates);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, bugId]
  );
  
  return { update, loading, error };
}

/**
 * Hook for bug comments
 */
export function useBugComments(projectId, bugId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const addComment = useCallback(
    async (text) => {
      try {
        setLoading(true);
        setError(null);
        const result = await bugAPI.addComment(projectId, bugId, text);
        setComments((prev) => [...prev, result]);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, bugId]
  );
  
  const updateComment = useCallback(
    async (commentId, text) => {
      try {
        setLoading(true);
        setError(null);
        const result = await bugAPI.updateComment(projectId, bugId, commentId, text);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? result : c))
        );
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, bugId]
  );
  
  const deleteComment = useCallback(
    async (commentId) => {
      try {
        setLoading(true);
        setError(null);
        await bugAPI.deleteComment(projectId, bugId, commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, bugId]
  );
  
  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
  };
}
