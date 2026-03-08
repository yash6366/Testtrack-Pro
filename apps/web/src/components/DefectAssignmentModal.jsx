/**
 * DEFECT ASSIGNMENT MODAL
 * Assign defects/bugs to milestones with search and multi-select
 */

 
import { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle } from 'lucide-react';
import Button from './common/Button';
import axios from 'axios';
import { logError } from '../lib/errorLogger';

export default function DefectAssignmentModal({
  projectId,
  milestoneId: _milestoneId,
  currentDefects = [],
  onClose,
  onAssign,
}) {
  const [availableDefects, setAvailableDefects] = useState([]);
  const [selectedDefects, setSelectedDefects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available defects
  useEffect(() => {
    const fetchDefects = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/bugs`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // Filter out defects that are already assigned
        const currentIds = currentDefects.map(defect => defect.id);
        const available = response.data.data.filter(
          bug => !currentIds.includes(bug.id),
        );
        setAvailableDefects(available);
      } catch (err) {
        setError('Failed to load defects');
        logError(err, 'Error fetching defects');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchDefects();
    }
  }, [projectId, currentDefects]);

  // Filter defects based on search
  const filteredDefects = availableDefects.filter(bug =>
    bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bug.bugNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Toggle defect selection
  const toggleDefect = (defectId) => {
    setSelectedDefects(prev =>
      prev.includes(defectId)
        ? prev.filter(id => id !== defectId)
        : [...prev, defectId],
    );
  };

  // Handle assignment
  const handleAssign = async () => {
    if (selectedDefects.length === 0) {
      setError('Please select at least one defect');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAssign(selectedDefects);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign defects');
    } finally {
      setSubmitting(false);
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800',
      MAJOR: 'bg-orange-100 text-orange-800',
      MINOR: 'bg-yellow-100 text-yellow-800',
      TRIVIAL: 'bg-gray-100 text-gray-800',
    };
    return colors[severity] || colors.MINOR;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      NEW: 'bg-red-100 text-red-800',
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      FIXED: 'bg-green-100 text-green-800',
      VERIFIED: 'bg-emerald-100 text-emerald-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.OPEN;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Assign Defects to Milestone
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
              placeholder="Search defects by title or bug number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Defects List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading defects...
            </div>
          ) : filteredDefects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'No defects match your search'
                : 'No defects available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDefects.map(bug => (
                <div
                  key={bug.id}
                  onClick={() => toggleDefect(bug.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDefects.includes(bug.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {bug.bugNumber}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(
                            bug.severity,
                          )}`}
                        >
                          {bug.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            bug.status,
                          )}`}
                        >
                          {bug.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{bug.title}</p>
                      {bug.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {bug.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {bug.priority && (
                          <span className="text-xs text-gray-500">
                            Priority: <span className="font-medium">{bug.priority}</span>
                          </span>
                        )}
                        {bug.assignee && (
                          <span className="text-xs text-gray-500">
                            Assigned to: <span className="font-medium">{bug.assignee.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedDefects.includes(bug.id) && (
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
            {selectedDefects.length} defect(s) selected
          </span>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={submitting || selectedDefects.length === 0}
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
