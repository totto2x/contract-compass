import React, { useState } from 'react';
import { Contract, ContractProject } from '../types';
import { Search, Filter, Calendar, Github, FileText, Download, Eye, FolderOpen, Tag, Grid, List, X, ChevronDown, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useProjects } from '../hooks/useProjects';
import { useDocuments } from '../hooks/useDocuments';

interface ContractsListProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onViewProject: (project: ContractProject) => void;
  viewMode?: 'all-projects' | 'contract-summaries';
}

const ContractsList: React.FC<ContractsListProps> = ({ 
  contracts, 
  onViewContract, 
  onViewProject,
  viewMode = 'all-projects'
}) => {
  const { projects, loading: projectsLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [displayMode, setDisplayMode] = useState<'card' | 'list'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [projectDocumentCounts, setProjectDocumentCounts] = useState<Record<string, number>>({});
  
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    documentCount: { min: 0, max: 10 },
    counterparties: [] as string[],
    tags: [] as string[],
    status: [] as string[]
  });

  // Create a default contract object to prevent undefined errors
  const defaultContract: Contract = {
    id: 'default-contract',
    title: 'Default Contract',
    type: 'license',
    status: 'active',
    client: 'Unknown',
    githubOrg: 'unknown',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Default contract',
    tags: [],
    projectId: 'default-project'
  };

  // Convert real database projects to ContractProject format
  const contractProjects: ContractProject[] = projects.map(project => ({
    id: project.id,
    name: project.project_name,
    client: project.counterparty || 'No counterparty specified',
    documentCount: project.document_count || 0, // Use the actual document count from database
    uploadDate: project.created_at,
    lastUpdated: project.updated_at,
    contractEffectiveStart: project.created_at,
    contractEffectiveEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    tags: project.tags || [],
    baseContract: contracts.find(c => c.projectId === project.id) || defaultContract,
    amendments: [],
    totalDocuments: project.document_count || 0, // Use the actual document count
    status: 'complete' as const
  }));

  // Extract unique values for filter options
  const allCounterparties = Array.from(new Set(contractProjects.map(p => p.client))).sort();
  const allTags = Array.from(new Set(contractProjects.flatMap(p => p.tags))).sort();
  const allStatuses = Array.from(new Set(contractProjects.map(p => p.status || 'complete'))).sort();

  // Count active filters
  const activeFilterCount = [
    filters.dateRange.start || filters.dateRange.end ? 1 : 0,
    filters.documentCount.min !== 0 || filters.documentCount.max !== 10 ? 1 : 0,
    filters.counterparties.length,
    filters.tags.length,
    filters.status.length
  ].reduce((sum, count) => sum + count, 0);

  const filteredProjects = contractProjects.filter(project => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Date range filter (using contract effective dates)
    const effectiveStart = new Date(project.contractEffectiveStart);
    const effectiveEnd = new Date(project.contractEffectiveEnd);
    const matchesDateRange = (!filters.dateRange.start || effectiveEnd >= new Date(filters.dateRange.start)) &&
                            (!filters.dateRange.end || effectiveStart <= new Date(filters.dateRange.end));
    
    // Document count filter
    const matchesDocCount = project.documentCount >= filters.documentCount.min && 
                           project.documentCount <= filters.documentCount.max;
    
    // Counterparty filter
    const matchesCounterparty = filters.counterparties.length === 0 || 
                               filters.counterparties.includes(project.client);
    
    // Tags filter
    const matchesTags = filters.tags.length === 0 || 
                       filters.tags.some(tag => project.tags.includes(tag));
    
    // Status filter
    const matchesStatus = filters.status.length === 0 || 
                         filters.status.includes(project.status || 'complete');
    
    return matchesSearch && matchesDateRange && matchesDocCount && 
           matchesCounterparty && matchesTags && matchesStatus;
  });

  const handleViewDetails = (project: ContractProject) => {
    onViewProject(project);
  };

  const handleDownloadFinal = (project: ContractProject) => {
    console.log(`Downloading unified contract for ${project.name}`);
  };

  const clearAllFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      documentCount: { min: 0, max: 10 },
      counterparties: [],
      tags: [],
      status: []
    });
  };

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'dateRange':
        setFilters(prev => ({ ...prev, dateRange: { start: '', end: '' } }));
        break;
      case 'documentCount':
        setFilters(prev => ({ ...prev, documentCount: { min: 0, max: 10 } }));
        break;
      case 'counterparty':
        setFilters(prev => ({ 
          ...prev, 
          counterparties: prev.counterparties.filter(c => c !== value) 
        }));
        break;
      case 'tag':
        setFilters(prev => ({ 
          ...prev, 
          tags: prev.tags.filter(t => t !== value) 
        }));
        break;
      case 'status':
        setFilters(prev => ({ 
          ...prev, 
          status: prev.status.filter(s => s !== value) 
        }));
        break;
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMM dd, yyyy');
    const end = format(new Date(endDate), 'MMM dd, yyyy');
    return `${start} – ${end}`;
  };

  // Show loading state
  if (projectsLoading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Projects</h2>
          <p className="text-gray-600">Loading your contract projects...</p>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <div
          key={project.id}
          className="card p-6 hover:shadow-legal-lg transition-all duration-200 hover:-translate-y-1"
        >
          {/* Project Title and Counterparty */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight legal-heading">
              {project.name}
            </h3>
            <p className="text-gray-600 text-sm font-semibold">
              {project.client}
            </p>
          </div>

          {/* Document Count in Color Box */}
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
              <FileText className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-bold text-primary-800">
                {project.documentCount} Document{project.documentCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Created Date */}
          <div className="mb-3">
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-semibold">Contract Effective:</span>
              <span className="ml-2 font-medium">{formatDateRange(project.contractEffectiveStart, project.contractEffectiveEnd)}</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-medium">Updated {format(new Date(project.lastUpdated), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 2 && (
                <span 
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 cursor-help border border-gray-200"
                  title={`Additional tags: ${project.tags.slice(2).join(', ')}`}
                >
                  +{project.tags.length - 2} more
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Button - Full Width */}
            <button
              onClick={() => handleViewDetails(project)}
              className="btn-primary w-full py-3 font-semibold"
            >
              View Details
            </button>
            
            {/* Secondary Button - Subdued */}
            <button
              onClick={() => handleDownloadFinal(project)}
              className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Unified Contract</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="card overflow-hidden">
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
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{project.client}</p>
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
                    <span className="font-medium">{format(new Date(project.lastUpdated), 'MMM dd, yyyy')}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleViewDetails(project)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-bold transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownloadFinal(project)}
                      className="btn-outline text-sm px-3 py-1 flex items-center space-x-1"
                      title="Download unified contract"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 legal-heading mb-2">All Projects</h2>
        <p className="text-gray-600 font-medium">
          Manage your contract projects with document analysis, summaries, and unified contract access
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects, counterparties, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            {/* Filters Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filters Dropdown */}
              {showFilters && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-legal-lg z-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contract Effective Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, start: e.target.value } 
                          }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                        />
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, end: e.target.value } 
                          }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Number of Documents */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Number of Documents: {filters.documentCount.min} - {filters.documentCount.max}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={filters.documentCount.min}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            documentCount: { ...prev.documentCount, min: parseInt(e.target.value) } 
                          }))}
                          className="w-full"
                        />
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={filters.documentCount.max}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            documentCount: { ...prev.documentCount, max: parseInt(e.target.value) } 
                          }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Counterparty */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Counterparty
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {allCounterparties.map((counterparty) => (
                          <label key={counterparty} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.counterparties.includes(counterparty)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    counterparties: [...prev.counterparties, counterparty] 
                                  }));
                                } else {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    counterparties: prev.counterparties.filter(c => c !== counterparty) 
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">{counterparty}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {allTags.map((tag) => (
                          <label key={tag} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.tags.includes(tag)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    tags: [...prev.tags, tag] 
                                  }));
                                } else {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    tags: prev.tags.filter(t => t !== tag) 
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="space-y-2">
                        {allStatuses.map((status) => (
                          <label key={status} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.status.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    status: [...prev.status, status] 
                                  }));
                                } else {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    status: prev.status.filter(s => s !== status) 
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 font-medium capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="btn-primary text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg">
              <button
                onClick={() => setDisplayMode('card')}
                className={`p-1.5 rounded ${displayMode === 'card' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`p-1.5 rounded ${displayMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {(filters.dateRange.start || filters.dateRange.end) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 font-medium">
                  Effective: {filters.dateRange.start || 'Any'} - {filters.dateRange.end || 'Any'}
                  <button
                    onClick={() => removeFilter('dateRange')}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.documentCount.min !== 0 || filters.documentCount.max !== 10) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 font-medium">
                  Docs: {filters.documentCount.min}-{filters.documentCount.max}
                  <button
                    onClick={() => removeFilter('documentCount')}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.counterparties.map((counterparty) => (
                <span key={counterparty} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 font-medium">
                  {counterparty}
                  <button
                    onClick={() => removeFilter('counterparty', counterparty)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 font-medium">
                  {tag}
                  <button
                    onClick={() => removeFilter('tag', tag)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.status.map((status) => (
                <span key={status} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 font-medium">
                  {status}
                  <button
                    onClick={() => removeFilter('status', status)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Projects Display */}
      {displayMode === 'card' ? renderCardView() : renderListView()}

      {/* Empty State */}
      {filteredProjects.length === 0 && !projectsLoading && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No contract projects found</h3>
          <p className="text-gray-600 font-medium">Try adjusting your search or filter criteria.</p>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="mt-4 text-primary-600 hover:text-primary-700 font-bold"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {filteredProjects.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="font-medium">Showing {filteredProjects.length} of {contractProjects.length} projects</span>
            <span className="font-medium">Total documents: {filteredProjects.reduce((sum, p) => sum + p.documentCount, 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsList;