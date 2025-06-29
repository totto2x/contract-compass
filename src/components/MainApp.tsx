import React, { useState } from 'react';
import { AuthUser } from '../lib/auth';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
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
        return <Dashboard 
          contracts={contracts} 
          onViewContract={handleViewContract} 
          onNavigate={setActiveView}
          onViewProject={handleViewProject}
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
          <Dashboard contracts={contracts} onViewContract={handleViewContract} onNavigate={setActiveView} onViewProject={handleViewProject} />;
      case 'project-detail':
        return selectedProject ?
          <ContractProjectDetailTabbed 
            project={selectedProject} 
            onBack={() => setActiveView('all-projects')}
            onAddDocument={() => handleAddDocumentToProject(selectedProject.id)}
          /> :
          <ContractsList contracts={contracts} onViewContract={handleViewContract} onViewProject={handleViewProject} onAddDocumentToProject={handleAddDocumentToProject} />;
      case 'analytics':
        return <div className="p-8"><h2 className="text-2xl font-bold text-gray-900">Analytics</h2><p className="text-gray-600 mt-2">Contract analytics and reporting coming soon...</p></div>;
      case 'clients':
        return <div className="p-8"><h2 className="text-2xl font-bold text-gray-900">Clients</h2><p className="text-gray-600 mt-2">Client management coming soon...</p></div>;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard contracts={contracts} onViewContract={handleViewContract} onNavigate={setActiveView} onViewProject={handleViewProject} />;
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