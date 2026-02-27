import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import apiClient from '@/lib/apiClient';
import BackButton from '@/components/ui/BackButton';

/**
 * TestCaseTemplateManagement Component
 * Manage reusable test case templates
 */
export default function TestCaseTemplateManagement() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'FUNCTIONAL',
    priority: 'P2',
    severity: 'MINOR',
    preconditions: '',
    testData: '',
    environment: '',
    moduleArea: '',
    tags: '',
    templateSteps: [],
  });

  const [useFormData, setUseFormData] = useState({
    testCaseName: '',
  });

  useEffect(() => {
    loadTemplates();
  }, [projectId]);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get(
        `/api/tester/projects/${projectId}/templates?isActive=true`,
      );
      // Handle empty or invalid responses
      if (data && typeof data === 'object') {
        setTemplates(Array.isArray(data.templates) ? data.templates : []);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const templateData = {
        ...formData,
        templateSteps: parseSteps(formData.templateSteps),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      await apiClient.post(
        `/api/tester/projects/${projectId}/templates`,
        templateData,
      );

      setSuccess('Template created successfully');
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
    } catch (err) {
      setError(err.message || 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const templateData = {
        ...formData,
        templateSteps: parseSteps(formData.templateSteps),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      await apiClient.patch(
        `/api/tester/templates/${editingTemplate.id}`,
        templateData,
      );

      setSuccess('Template updated successfully');
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (err) {
      setError(err.message || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/tester/templates/${id}`);
      setSuccess('Template deleted successfully');
      loadTemplates();
    } catch (err) {
      setError(err.message || 'Failed to delete template');
    }
  };

  const handleUseTemplate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await apiClient.post(
        `/api/tester/templates/${selectedTemplate.id}/create-test-case`,
        {
          projectId: Number(projectId),
          testCaseName: useFormData.testCaseName,
        },
      );

      setSuccess('Test case created from template successfully');
      setShowUseModal(false);
      setUseFormData({ testCaseName: '' });
    } catch (err) {
      setError(err.message || 'Failed to create test case from template');
    }
  };

  const parseSteps = (stepsText) => {
    if (!stepsText) return [];
    return stepsText
      .split('\n\n')
      .filter(step => step.trim())
      .map(step => {
        const lines = step.trim().split('\n');
        return {
          action: lines[0] || '',
          expectedResult: lines[1] || '',
          notes: lines[2] || '',
        };
      });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      type: 'FUNCTIONAL',
      priority: 'P2',
      severity: 'MINOR',
      preconditions: '',
      testData: '',
      environment: '',
      moduleArea: '',
      tags: '',
      templateSteps: '',
    });
  };

  const openEditModal = (template) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      type: template.type,
      priority: template.priority,
      severity: template.severity,
      preconditions: template.preconditions || '',
      testData: template.testData || '',
      environment: template.environment || '',
      moduleArea: template.moduleArea || '',
      tags: template.tags?.join(', ') || '',
      templateSteps: formatStepsForEdit(template.templateSteps),
    });
    setEditingTemplate(template);
  };

  const formatStepsForEdit = (steps) => {
    if (!steps) return '';
    return steps
      .map(
        s =>
          `${s.action}\n${s.expectedResult}${s.notes ? '\n' + s.notes : ''}`,
      )
      .join('\n\n');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton label="Back to Test Cases" fallback="/dashboard" />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Test Case Templates</h1>
              <p className="text-[var(--muted)] mt-2">Create and manage reusable test case templates</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap mt-4">
            <button
              onClick={() => {
                resetForm();
                setEditingTemplate(null);
                setShowCreateModal(true);
              }}
              className="tt-btn tt-btn-primary"
            >
              + Create Template
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right hover:opacity-70"
            >
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
            {success}
            <button
              onClick={() => setSuccess('')}
              className="float-right hover:opacity-70"
            >
              ✕
            </button>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-[var(--muted)] py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="col-span-full text-center text-[var(--muted)] py-8">
              <p className="text-lg mb-2">No templates yet</p>
              <p className="text-sm">Create one to get started!</p>
            </div>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                className="tt-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">
                      {template.name}
                    </h3>
                    {template.category && (
                      <p className="text-sm text-[var(--muted)] mt-1">
                        📁 {template.category}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      template.type === 'FUNCTIONAL'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : template.type === 'REGRESSION'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                    }`}
                  >
                    {template.type}
                  </span>
                </div>

                <p className="text-sm text-[var(--muted)] mb-3">
                  {template.description}
                </p>

                {template.templateSteps?.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-3 mb-3">
                    <p className="text-xs font-semibold text-[var(--foreground)] mb-2">
                      {template.templateSteps.length} Steps
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {template.templateSteps[0]?.action}
                    </p>
                  </div>
                )}

                {template.tags?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex gap-2 flex-wrap">
                      {template.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-[var(--muted)]">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setUseFormData({ testCaseName: '' });
                      setShowUseModal(true);
                    }}
                    className="flex-1 tt-btn tt-btn-success text-sm"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="tt-btn tt-btn-outline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="tt-btn tt-btn-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingTemplate) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="tt-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-[var(--border)]">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {editingTemplate
                    ? 'Edit Template'
                    : 'Create Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] text-2xl"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={
                  editingTemplate
                    ? handleUpdateTemplate
                    : handleCreateTemplate
                }
                className="p-6"
              >
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Template Name *"
                    value={formData.name}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />

                  <input
                    type="text"
                    placeholder="Category (e.g., Smoke, Regression)"
                    value={formData.category}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <textarea
                    placeholder="Preconditions"
                    value={formData.preconditions}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        preconditions: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />

                  <textarea
                    placeholder="Test Data (JSON format)"
                    value={formData.testData}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        testData: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />

                  <input
                    type="text"
                    placeholder="Environment"
                    value={formData.environment}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        environment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.type}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          type: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FUNCTIONAL">Functional</option>
                      <option value="REGRESSION">Regression</option>
                      <option value="SMOKE">Smoke</option>
                    </select>

                    <select
                      value={formData.priority}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          priority: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="P0">P0 - Critical</option>
                      <option value="P1">P1 - High</option>
                      <option value="P2">P2 - Medium</option>
                      <option value="P3">P3 - Low</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Template Steps (Each step on new line with action, expected result separated by newline. Steps separated by blank line)"
                    value={formData.templateSteps}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        templateSteps: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                  />

                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={formData.tags}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        tags: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 tt-btn tt-btn-primary"
                  >
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="flex-1 tt-btn tt-btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Use Template Modal */}
        {showUseModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="tt-card max-w-md w-full">
              <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-[var(--border)]">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Create Test Case from Template
                </h2>
                <button
                  onClick={() => setShowUseModal(false)}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUseTemplate} className="p-6">
                <div className="space-y-4">
                  <p className="text-[var(--muted)]">
                    Template: <span className="font-bold text-[var(--foreground)]">
                      {selectedTemplate.name}
                    </span>
                  </p>

                  <input
                    type="text"
                    placeholder="Enter test case name *"
                    value={useFormData.testCaseName}
                    onChange={e =>
                      setUseFormData({
                        ...useFormData,
                        testCaseName: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 tt-btn tt-btn-success"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUseModal(false)}
                    className="flex-1 tt-btn tt-btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
