import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/apiClient';
import BackButton from '@/components/ui/BackButton';
import { 
  FolderKanban, 
  Search, 
  ChevronRight, 
  Calendar, 
  Users, 
  Tag,
  Clock,
} from 'lucide-react';

export default function ProjectsAssignedPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError('');

        // Load projects assigned to the user (for developers and testers)
        const response = await apiClient.get('/api/tester/projects?take=100');

        if (isMounted) {
          setProjects(response.projects || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load assigned projects');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProjectClick = (projectId) => {
    // Store selected project
    localStorage.setItem('selectedProjectId', projectId);
    navigate(`/projects/${projectId}`);
  };

  const filteredProjects = projects.filter((project) =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toUpperCase()) {
      case 'DEVELOPER':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'TESTER':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'LEAD':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'ADMIN':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <DashboardLayout
      user={user}
      dashboardLabel="Projects"
      headerTitle="Projects Assigned"
      headerSubtitle="View projects you have been assigned to"
      onLogout={handleLogout}
    >
      <div className="mb-4">
        <BackButton label="Back to Dashboard" fallback="/dashboard" />
      </div>

      {/* Search */}
      <div className="tt-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, key, or description..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="text-sm text-[var(--muted)]">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} assigned
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="tt-card border-[var(--danger)] text-[var(--danger)] p-4 mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            Loading assigned projects...
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <>
          {filteredProjects.length === 0 ? (
            <div className="tt-card p-12 text-center">
              <FolderKanban className="h-16 w-16 text-[var(--muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No projects found' : 'No projects assigned yet'}
              </h3>
              <p className="text-[var(--muted)] mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Contact an administrator to get assigned to projects'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const allocation = project.userAllocations?.[0];
                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="tt-card p-6 text-left hover:shadow-lg transition group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300">
                        <FolderKanban className="h-6 w-6" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition" />
                    </div>

                    <h3 className="text-lg font-semibold mb-2 truncate">
                      {project.name}
                    </h3>

                    {project.description && (
                      <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Project Key */}
                    {project.key && (
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="h-4 w-4 text-[var(--muted)]" />
                        <span className="text-xs font-medium text-[var(--muted)] px-2 py-1 rounded bg-[var(--bg-elevated)]">
                          {project.key}
                        </span>
                      </div>
                    )}

                    {/* Allocation Info */}
                    {allocation && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--muted)]" />
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(allocation.projectRole)}`}>
                            {allocation.projectRole || 'Member'}
                          </span>
                        </div>
                        {allocation.allocatedAt && (
                          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                            <Clock className="h-4 w-4" />
                            <span>Assigned {formatDate(allocation.allocatedAt)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Project Meta */}
                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {project.createdAt
                            ? formatDate(project.createdAt)
                            : 'N/A'}
                        </span>
                      </div>
                      {project._count && (
                        <span>{project._count.testCases || 0} test cases</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Summary */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="mt-6 text-center text-sm text-[var(--muted)]">
          Showing {filteredProjects.length} of {projects.length} assigned project
          {projects.length !== 1 ? 's' : ''}
        </div>
      )}
    </DashboardLayout>
  );
}
