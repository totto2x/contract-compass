import React from 'react';
import { FolderOpen, Upload, FileText, TrendingUp } from 'lucide-react';
import { Contract, ContractProject } from '../../types';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { DatabaseService } from '../../lib/database';
import { useState, useEffect } from 'react';
import StatsCard from '../dashboard/StatsCard';
import QuickActions from '../dashboard/QuickActions';
import RecentActivity from '../dashboard/RecentActivity';
import Card from '../common/Card';

interface EnhancedDashboardProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onNavigate?: (view: 'dashboard' | 'contracts' | 'all-projects' | 'contract-summaries' | 'upload' | 'analytics' | 'clients' | 'settings') => void;
  onViewProject?: (project: any) => void;
  onAddDocumentToProject?: (projectId: string) => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  contracts,
  onViewContract,
  onNavigate,
  onViewProject,
  onAddDocumentToProject
}) => {
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const [stats, setStats] = useState({
    projectsUploaded: 0,
    documentsUploaded: 0,
    amendmentsDetected: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Mock recent activity data
  const recentActivities = [
    {
      id: '1',
      type: 'upload' as const,
      title: 'Documents uploaded',
      description: 'Base contract and 2 amendments uploaded',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      projectName: 'Enterprise License Agreement'
    },
    {
      id: '2',
      type: 'analysis' as const,
      title: 'Contract analysis completed',
      description: 'AI analysis detected 5 key changes',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      projectName: 'Service Level Agreement'
    },
    {
      id: '3',
      type: 'merge' as const,
      title: 'Contract merged',
      description: 'Final unified contract generated',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      projectName: 'Consulting Agreement'
    },
    {
      id: '4',
      type: 'download' as const,
      title: 'Contract downloaded',
      description: 'PDF version downloaded',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      projectName: 'Maintenance Contract'
    }
  ];

  // Fetch user-specific statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        const userStats = await DatabaseService.getUserStats(user.id);
        
        const amendmentsDetected = Math.floor(userStats.projectCount * 1.5);
        
        setStats({
          projectsUploaded: userStats.projectCount,
          documentsUploaded: userStats.documentCount,
          amendmentsDetected
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setStats({
          projectsUploaded: 0,
          documentsUploaded: 0,
          amendmentsDetected: 0
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user, projects]);

  const handleStatClick = (statType: 'projects' | 'documents' | 'amendments') => {
    switch (statType) {
      case 'projects':
        onNavigate?.('all-projects');
        break;
      case 'documents':
        onNavigate?.('all-projects');
        break;
      case 'amendments':
        onNavigate?.('analytics');
        break;
    }
  };

  if (projectsLoading || statsLoading) {
    return (
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Loading your contract projects and activity...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 legal-heading">Dashboard</h2>
        <p className="text-gray-600 text-lg">
          {user ? `Welcome back, ${user.user_metadata?.name || user.email}! ` : ''}
          Overview of your contract projects and document processing activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Projects Created"
          value={stats.projectsUploaded}
          icon={FolderOpen}
          color="blue"
          trend={{
            value: 12,
            label: 'vs last month',
            isPositive: true
          }}
          onClick={() => handleStatClick('projects')}
        />
        
        <StatsCard
          title="Documents Processed"
          value={stats.documentsUploaded}
          icon={Upload}
          color="green"
          trend={{
            value: 8,
            label: 'vs last month',
            isPositive: true
          }}
          onClick={() => handleStatClick('documents')}
        />
        
        <StatsCard
          title="Changes Detected"
          value={stats.amendmentsDetected}
          icon={FileText}
          color="purple"
          trend={{
            value: 15,
            label: 'vs last month',
            isPositive: true
          }}
          onClick={() => handleStatClick('amendments')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions
            onCreateProject={() => onNavigate?.('upload')}
            onUploadDocuments={() => onNavigate?.('upload')}
            onViewAnalytics={() => onNavigate?.('analytics')}
            onOpenSettings={() => onNavigate?.('settings')}
          />
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity
            activities={recentActivities}
            onViewAll={() => onNavigate?.('all-projects')}
          />
        </div>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            <button
              onClick={() => onNavigate?.('all-projects')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              View all projects →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => {
                  const contractProject = {
                    id: project.id,
                    name: project.project_name,
                    client: project.counterparty || 'Unknown',
                    documentCount: project.document_count || 0,
                    uploadDate: project.created_at,
                    lastUpdated: project.updated_at,
                    contractEffectiveStart: project.created_at,
                    contractEffectiveEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    tags: project.tags || [],
                    baseContract: contracts[0] || {
                      id: 'default-contract',
                      title: 'Default Contract',
                      type: 'license' as const,
                      status: 'active' as const,
                      client: 'Unknown',
                      startDate: new Date().toISOString(),
                      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                      description: 'Default contract',
                      tags: [],
                      projectId: project.id
                    },
                    amendments: [],
                    totalDocuments: project.document_count || 0,
                    status: 'complete' as const
                  };
                  onViewProject?.(contractProject);
                }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.project_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {project.counterparty || 'No counterparty'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{project.document_count || 0} documents</span>
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{project.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State for New Users */}
      {projects.length === 0 && !projectsLoading && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Contract Compass</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by creating your first contract project. Upload your documents and let our AI analyze and merge them for you.
          </p>
          <button
            onClick={() => onNavigate?.('upload')}
            className="btn-primary"
          >
            Create Your First Project
          </button>
        </Card>
      )}
    </div>
  );
};

export default EnhancedDashboard;