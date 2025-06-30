import React, { useState } from 'react';
import { AuthUser } from '../lib/auth';
import Header from './Header';
import Sidebar from './Sidebar';
import EnhancedDashboard from './enhanced/EnhancedDashboard';
import ContractsList from './ContractsList';
import ContractDetail from './ContractDetail';
import ContractProjectDetailTabbed from './ContractProjectDetailTabbed';
import UploadPage from '../pages/Upload';
import Settings from '../pages/Settings';
import { useProjects } from '../hooks/useProjects';
import { Contract, ContractProject } from '../types';

interface MainAppProps {
  user: AuthUser;
}

const MainApp: React.FC<MainAppProps> = ({ user }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'contracts' | 'all-projects' | 'contract-summaries' | 'upload' | 'detail' | 'project-detail' | 'analytics' | 'clients' | 'settings'>('dashboard');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedProject, setSelectedProject] = useState<ContractProject | null>(null);
  const [uploadContext, setUploadContext] = useState<{ type: 'new-project' | 'add-to-project'; projectId?: string }>({ type: 'new-project' });

  const { projects, loading: projectsLoading } = useProjects();

  // Convert database projects to legacy contract format for compatibility
  const contracts: Contract[] = projects.map(project => ({
    id: project.id,
    title: project.project_name,
    type: 'license' as const,
    status: 'active' as const,
    client: project.counterparty || 'Unknown',
    githubOrg: project.counterparty?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
    startDate: project.created_at,
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    description: `Contract project for ${project.counterparty || 'client'}`,
    tags: project.tags,
    projectId: project.id
  }));

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setActiveView('detail');
  };

  const handleViewProject = (project: ContractProject) => {
    setSelectedProject(project);
    setActiveView('project-detail');
  };

  const handleQuickSearch = (query: string) => {
    setActiveView('all-projects');
  };

  const handleCreateNewProject = () => {
    setUploadContext({ type: 'new-project' });
    setActiveView('upload');
  };

  const handleAddDocumentToProject = (projectId: string) => {
    setUploadContext({ type: 'add-to-project', projectId });
    setActiveView('upload');
  };

  const renderContent = () => {
    if (projectsLoading) {
      return (
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your projects...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <EnhancedDashboard 
          contracts={contracts} 
          onViewContract={handleViewContract} 
          onNavigate={setActiveView}
          onViewProject={handleViewProject}
          onAddDocumentToProject={handleAddDocumentToProject}
        />;
      case 'contracts':
      case 'all-projects':
        return <ContractsList 
          contracts={contracts} 
          onViewContract={handleViewContract} 
          onViewProject={handleViewProject}
          onAddDocumentToProject={handleAddDocumentToProject}
          viewMode="all-projects"
        />;
      case 'contract-summaries':
        return <ContractsList 
          contracts={contracts} 
          onViewContract={handleViewContract} 
          onViewProject={handleViewProject}
          onAddDocumentToProject={handleAddDocumentToProject}
          viewMode="contract-summaries"
        />;
      case 'upload':
        return <UploadPage 
          onGoToDashboard={() => setActiveView('dashboard')} 
          uploadContext={uploadContext}
          selectedProject={uploadContext.type === 'add-to-project' ? selectedProject : undefined}
          onViewProject={handleViewProject}
        />;
      case 'detail':
        return selectedContract ? 
          <ContractDetail contract={selectedContract} onBack={() => setActiveView('all-projects')} /> : 
          <EnhancedDashboard contracts={contracts} onViewContract={handleViewContract} onNavigate={setActiveView} onViewProject={handleViewProject} onAddDocumentToProject={handleAddDocumentToProject} />;
      case 'project-detail':
        return selectedProject ?
          <ContractProjectDetailTabbed 
            project={selectedProject} 
            onBack={() => setActiveView('all-projects')}
            onAddDocument={() => handleAddDocumentToProject(selectedProject.id)}
          /> :
          <ContractsList contracts={contracts} onViewContract={handleViewContract} onViewProject={handleViewProject} onAddDocumentToProject={handleAddDocumentToProject} />;
      case 'analytics':
        return (
          <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 legal-heading">Analytics</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Get insights into your contract portfolio, amendment patterns, and processing efficiency with detailed analytics and reporting.
                </p>
              </div>
            </div>
          </div>
        );
      case 'clients':
        return (
          <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 legal-heading">Client Management</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Client Management Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Manage your client relationships, track contract history, and organize projects by counterparty with advanced client management tools.
                </p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <EnhancedDashboard contracts={contracts} onViewContract={handleViewContract} onNavigate={setActiveView} onViewProject={handleViewProject} onAddDocumentToProject={handleAddDocumentToProject} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onQuickSearch={handleQuickSearch} user={user} />
      <div className="flex">
        <Sidebar activeView={activeView} onNavigate={(view) => {
          if (view === 'upload') {
            handleCreateNewProject();
          } else {
            setActiveView(view);
          }
        }} />
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainApp;