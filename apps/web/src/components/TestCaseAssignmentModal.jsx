/**
 * TEST CASE ASSIGNMENT MODAL
 * Assign test cases to milestones with search and multi-select
 */

/* eslint-disable react/jsx-uses-react */
import { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import Button from './common/Button';
import axios from 'axios';

export default function TestCaseAssignmentModal({
  projectId,
  milestoneId: _milestoneId,
  currentTestCases = [],
  onClose,
  onAssign,
}) {
  const [availableTestCases, setAvailableTestCases] = useState([]);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available test cases
  useEffect(() => {
    const fetchTestCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/test-cases`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // Filter out test cases that are already assigned
        const currentIds = currentTestCases.map(tc => tc.id);
        const available = response.data.data.filter(
          tc => !currentIds.includes(tc.id),
        );
        setAvailableTestCases(available);
      } catch (err) {
        setError('Failed to load test cases');
        // eslint-disable-next-line no-console
        console.error('Error fetching test cases:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTestCases();
    }
  }, [projectId, currentTestCases]);

  // Filter test cases based on search
  const filteredTestCases = availableTestCases.filter(tc =>
    tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.testCaseId?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Toggle test case selection
  const toggleTestCase = (testCaseId) => {
    setSelectedTestCases(prev =>
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId],
    );
  };

  // Handle assignment
  const handleAssign = async () => {
    if (selectedTestCases.length === 0) {
      setError('Please select at least one test case');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAssign(selectedTestCases);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign test cases');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Assign Test Cases to Milestone
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search test cases by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading test cases...
            </div>
          ) : filteredTestCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'No test cases match your search'
                : 'No test cases available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTestCases.map(tc => (
                <div
                  key={tc.id}
                  onClick={() => toggleTestCase(tc.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTestCases.includes(tc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {tc.testCaseId || `TC-${tc.id}`}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            tc.priority === 'P0'
                              ? 'bg-red-100 text-red-800'
                              : tc.priority === 'P1'
                              ? 'bg-orange-100 text-orange-800'
                              : tc.priority === 'P2'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tc.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{tc.name}</p>
                      {tc.type && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                          {tc.type}
                        </span>
                      )}
                    </div>
                    {selectedTestCases.includes(tc.id) && (
                      <div className="ml-3 flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {selectedTestCases.length} test case(s) selected
          </span>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={submitting || selectedTestCases.length === 0}
              variant="primary"
            >
              {submitting ? 'Assigning...' : 'Assign Selected'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
