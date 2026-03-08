import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import ProjectSelector from '@/components/ProjectSelector';
import NotificationCenter from '@/components/NotificationCenter';
import { useProject } from '@/hooks';

export default function DashboardLayout({
  user,
  dashboardLabel,
  headerTitle,
  headerSubtitle,
  onLogout,
  children,
}) {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProject();
  const isTester = String(user?.role || '').toUpperCase() === 'TESTER';
  const isDeveloper = String(user?.role || '').toUpperCase() === 'DEVELOPER';
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  const showProjectSelector = projectsLoading || projects.length > 1;

  const handleExecuteNewTest = () => {
    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      navigate('/dashboard');
      return;
    }
    navigate(`/projects/${projectId}/test-runs/create`);
  };

  const handleViewTestCases = () => {
    const projectId = localStorage.getItem('selectedProjectId');
    if (!projectId) {
      alert('Please select a project first');
      return;
    }
    navigate(`/projects/${projectId}/test-cases`);
  };
  
  const navLinks = [
    { to: '/reports', label: 'Reports' },
    { to: '/chat', label: 'Chat' },
  ];

  if (isAdmin) {
    navLinks.splice(0, navLinks.length);
  } else {
    navLinks.unshift({ to: '/projects-assigned', label: 'My Projects' });
    navLinks.splice(2, 0, { to: '/test-suites', label: 'Test Suites' });
    navLinks.splice(3, 0, { to: '/bugs', label: 'Bugs' });
  }

  if (isDeveloper) {
    navLinks.push({ to: '/analytics', label: 'Analytics' });
    // ...existing code...
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--surface-strong)] border border-[var(--border)] flex items-center justify-center font-bold">
              TT
            </div>
            <div>
              <h1 className="text-lg font-semibold">TestTrack Pro</h1>
              <p className="text-xs text-[var(--muted)]">{dashboardLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isTester ? (
              <>
                <Link
                  to="/projects-assigned"
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  My Projects
                </Link>
                <button
                  onClick={handleExecuteNewTest}
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Create New Test
                </button>
                <Link
                  to="/reports"
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Reports
                </Link>
                <button
                  onClick={handleViewTestCases}
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  View Test Cases
                </button>
                <Link
                  to="/test-suites"
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Test Suites
                </Link>
                <Link
                  to="/bugs"
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Bugs
                </Link>
                <Link
                  to="/chat"
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Chat
                </Link>
              </>
            ) : (
              navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>
          <div className="flex items-center gap-4">
            {showProjectSelector && <ProjectSelector />}
            {isAdmin && (
              <Link
                to="/chat"
                className="tt-btn tt-btn-outline px-2 py-2"
                aria-label="Chat"
                title="Chat"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            )}
            <NotificationCenter />
            <Link to="/profile" className="text-right hover:opacity-80 transition-opacity">
              <p className="text-xs text-[var(--muted)]">Welcome back</p>
              <p className="text-sm font-semibold">{user.name}</p>
            </Link>
            <button
              onClick={onLogout}
              className="tt-btn tt-btn-danger px-4 py-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">{headerTitle}</h2>
          <p className="text-[var(--muted)] mt-2">{headerSubtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
