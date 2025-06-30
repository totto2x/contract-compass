import React from 'react';
import { Contract } from '../types';
import { FileText, Upload, TrendingUp, Calendar, Eye, FolderOpen, FolderPlus, Plus, Clock, Download, Trash2 } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { format } from 'date-fns';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';
import { DatabaseService } from '../lib/database';
import { DocumentGenerator } from '../lib/documentGenerator';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface DashboardProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onNavigate?: (view: 'dashboard' | 'contracts' | 'all-projects' | 'contract-summaries' | 'upload' | 'analytics' | 'clients' | 'settings') => void;
  onViewProject?: (project: any) => void;
  onAddDocumentToProject?: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  contracts, 
  onViewContract, 
  onNavigate, 
  onViewProject,
  onAddDocumentToProject 
}) => {
  const { user } = useAuth();
  const { projects, loading: projectsLoading, deleteProject } = useProjects();
  const [stats, setStats] = useState({
    projectsUploaded: 0,
    documentsUploaded: 0,
    amendmentsDetected: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [downloadingProjects, setDownloadingProjects] = useState<Set<string>>(new Set());
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Fetch user-specific statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        const userStats = await DatabaseService.getUserStats(user.id);
        
        // Calculate amendments detected (mock calculation based on projects)
        const amendmentsDetected = Math.floor(userStats.projectCount * 1.5); // Rough estimate
        
        setStats({
          projectsUploaded: userStats.projectCount,
          documentsUploaded: userStats.documentCount,
          amendmentsDetected
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        // Fallback to zero stats
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
  }, [user, projects]); // Refetch when projects change

  // Create a default contract object to prevent undefined errors
  const defaultContract: Contract = {
    id: 'default-contract',
    title: 'Default Contract',
    type: 'license',
    status: 'active',
    client: 'Unknown',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Default contract',
    tags: [],
    projectId: 'default-project'
  };

  // Convert database projects to display format for recent activity
  const recentProjects = projects.slice(0, 5).map(project => ({
    id: project.id,
    name: project.project_name,
    counterparty: project.counterparty || 'No counterparty specified',
    lastUpload: project.updated_at,
    documentCount: project.document_count || 0,
    client: project.counterparty || 'Unknown',
    uploadDate: project.created_at,
    contractEffectiveStart: project.created_at,
    contractEffectiveEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    tags: project.tags || [],
    baseContract: contracts.find(c => c.projectId === project.id) || contracts[0] || defaultContract,
    amendments: [],
    totalDocuments: project.document_count || 0,
    status: 'complete' as const
  }));

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMM dd, yyyy');
    const end = format(new Date(endDate), 'MMM dd, yyyy');
    return `${start} – ${end}`;
  };

  const handleViewProject = (project: any) => {
    // Convert to ContractProject format for compatibility
    const contractProject = {
      id: project.id,
      name: project.name,
      client: project.client,
      documentCount: project.documentCount,
      uploadDate: project.uploadDate,
      lastUpdated: project.lastUpload,
      contractEffectiveStart: project.contractEffectiveStart,
      contractEffectiveEnd: project.contractEffectiveEnd,
      tags: project.tags,
      baseContract: project.baseContract,
      amendments: project.amendments,
      totalDocuments: project.totalDocuments,
      status: project.status
    };

    if (onViewProject) {
      onViewProject(contractProject);
    } else {
      onNavigate?.('all-projects');
    }
  };

  const handleAddDocuments = (project: any) => {
    if (onAddDocumentToProject) {
      onAddDocumentToProject(project.id);
    }
  };

  const handleDeleteProject = async (project: any) => {
    try {
      setDeletingProjects(prev => new Set(prev).add(project.id));
      await deleteProject(project.id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeletingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    }
  };

  const handleDownloadFinal = async (project: any, format: 'txt' | 'pdf' | 'docx') => {
    try {
      // Check if project has documents
      if (project.documentCount === 0) {
        toast.error('No documents found in this project to download');
        return;
      }

      // Add project to downloading set
      setDownloadingProjects(prev => new Set(prev).add(project.id));

      // Try to get the merged contract result from the database
      const mergeResult = await DatabaseService.getMergedContractResult(project.id);
      
      if (!mergeResult || !mergeResult.final_contract) {
        toast.error('No merged contract available for this project. Please process the documents first.');
        return;
      }

      // Generate the document using the stored final contract and document incorporation log
      const filename = `${project.name}-unified`;
      const documentIncorporationLog = mergeResult.document_incorporation_log || [];
      
      switch (format) {
        case 'txt':
          DocumentGenerator.generateTXT(mergeResult.final_contract, filename, documentIncorporationLog);
          toast.success('Contract downloaded as TXT file');
          break;

        case 'pdf':
          toast('Generating PDF document...');
          await DocumentGenerator.generatePDF(mergeResult.final_contract, filename, documentIncorporationLog);
          toast.success('Contract downloaded as PDF file');
          break;

        case 'docx':
          toast('Generating DOCX document...');
          await DocumentGenerator.generateDOCX(mergeResult.final_contract, filename, documentIncorporationLog);
          toast.success('Contract downloaded as DOCX file');
          break;

        default:
          toast.error('Unsupported download format');
          break;
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${format.toUpperCase()} contract`);
    } finally {
      // Remove project from downloading set
      setDownloadingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    }
  };

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

  // Show loading state while fetching data
  if (projectsLoading || statsLoading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Loading your contract projects and activity...</p>
        </div>
        
        {/* Loading skeleton */}
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">
          {user ? `Welcome back, ${user.user_metadata?.name || user.email}! ` : ''}
          Overview of your contract projects and document processing activity
        </p>
      </div>

      {/* Stats Grid - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleStatClick('projects')}
          className="card p-6 text-left group hover:shadow-legal-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projects Created</p>
              <p className="text-2xl font-bold text-gray-900">{stats.projectsUploaded}</p>
            </div>
            <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <FolderOpen className="w-7 h-7 text-primary-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => handleStatClick('documents')}
          className="card p-6 text-left group hover:shadow-legal-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Documents Uploaded</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.documentsUploaded}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Total files processed</p>
            </div>
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Upload className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => handleStatClick('amendments')}
          className="card p-6 text-left group hover:shadow-legal-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Changes Detected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.amendmentsDetected}</p>
            </div>
            <div className="w-14 h-14 bg-success-50 rounded-xl flex items-center justify-center group-hover:bg-success-100 transition-colors">
              <FileText className="w-7 h-7 text-success-600" />
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activity - Updated to Match List View */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            <button 
              onClick={() => onNavigate?.('all-projects')}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors"
            >
              View all projects →
            </button>
          </div>
        </div>
        
        {recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Doc Count
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contract Effective Range
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProjects.map((project) => {
                  const isDownloading = downloadingProjects.has(project.id);
                  const isDeleting = deletingProjects.has(project.id);
                  
                  return (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{project.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{project.counterparty}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {project.tags.length > 2 && (
                                <span 
                                  className="text-xs text-gray-500 cursor-help font-medium"
                                  title={`Additional tags: ${project.tags.slice(2).join(', ')}`}
                                >
                                  +{project.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {project.documentCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatDateRange(project.contractEffectiveStart, project.contractEffectiveEnd)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{format(new Date(project.lastUpload), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewProject(project)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-bold transition-colors"
                          >
                            View Details
                          </button>
                          
                          {/* Add Documents Button - Blue Style to Match List View */}
                          {onAddDocumentToProject && (
                            <button
                              onClick={() => handleAddDocuments(project)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title="Add more documents"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}

                          {/* Download Menu */}
                          <Menu as="div" className="relative">
                            <Menu.Button 
                              className="btn-outline text-sm px-3 py-1 flex items-center space-x-1"
                              disabled={isDownloading}
                            >
                              <Download className="w-4 h-4" />
                              <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                            </Menu.Button>
                            
                            {!isDownloading && (
                              <Menu.Items className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDownloadFinal(project, 'pdf')}
                                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Download as PDF</span>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDownloadFinal(project, 'docx')}
                                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Download as DOCX</span>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDownloadFinal(project, 'txt')}
                                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm transition-colors ${
                                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>Download as TXT</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </Menu.Items>
                            )}
                          </Menu>

                          {/* Delete Button */}
                          <button
                            onClick={() => setShowDeleteConfirm(project.id)}
                            disabled={isDeleting}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Create your first contract project to get started</p>
            <button
              onClick={() => onNavigate?.('upload')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-success-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 legal-heading">Analytics</h3>
          </div>
          <p className="text-gray-700 text-sm mb-6 font-medium">View detailed contract performance metrics and amendment trends</p>
          <button 
            onClick={() => onNavigate?.('analytics')}
            className="bg-success-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-success-700 transition-colors shadow-sm"
          >
            View Reports
          </button>
        </div>

        <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 legal-heading">Create New Project</h3>
          </div>
          <p className="text-gray-700 text-sm mb-6 font-medium">Start a new contract project and upload your documents for analysis</p>
          <button 
            onClick={() => onNavigate?.('upload')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            Create Project
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this project? This will permanently remove:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• All uploaded documents</li>
                <li>• Contract analysis results</li>
                <li>• Project metadata and settings</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const project = recentProjects.find(p => p.id === showDeleteConfirm);
                  if (project) {
                    handleDeleteProject(project);
                  }
                }}
                disabled={deletingProjects.has(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingProjects.has(showDeleteConfirm) ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;