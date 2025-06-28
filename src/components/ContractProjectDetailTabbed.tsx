import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Building2,
  Plus,
  Download,
  Eye,
  GitBranch,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Minus,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ContractProject } from '../types';
import ContractSummaryTab from './summary/ContractSummaryTab';
import { useDocumentMerging } from '../hooks/useDocumentMerging';
import { useDocuments } from '../hooks/useDocuments';

interface ContractProjectDetailTabbedProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatString: string = 'MMMM dd, yyyy'): string => {
  if (!dateString) return 'Not available';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return format(date, formatString);
};

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({ 
  project, 
  onBack, 
  onAddDocument 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'changes' | 'final'>('summary');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFullContract, setShowFullContract] = useState(false);

  const { documents } = useDocuments(project.id);
  const {
    mergeResult,
    isMerging,
    loadMergeResultFromDatabase,
    mergeDocumentsFromProject,
    downloadFinalContract
  } = useDocumentMerging();

  // Load merge result when component mounts
  useEffect(() => {
    const loadExistingResult = async () => {
      try {
        await loadMergeResultFromDatabase(project.id);
      } catch (error) {
        console.error('Failed to load existing merge result:', error);
      }
    };

    loadExistingResult();
  }, [project.id, loadMergeResultFromDatabase]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Use real data from OpenAI API if available, otherwise fall back to mock data
  const getRealOrMockStats = () => {
    if (mergeResult) {
      return {
        totalClauses: mergeResult.clause_change_log?.length || 0,
        amendmentsApplied: mergeResult.amendment_summaries?.length || 0,
        changesDetected: mergeResult.clause_change_log?.filter(change => 
          change.change_type === 'modified' || change.change_type === 'added'
        ).length || 0,
        lastProcessed: project.lastUpdated
      };
    }
    
    // Fallback to mock data
    return {
      totalClauses: 47,
      amendmentsApplied: project.amendments?.length || 2,
      changesDetected: 8,
      lastProcessed: project.lastUpdated
    };
  };

  const getRealOrMockChangeSummary = () => {
    if (mergeResult?.base_summary) {
      return mergeResult.base_summary;
    }
    
    // Fallback to mock data
    return project.baseContract.type === 'license' 
      ? "This enterprise license agreement has undergone significant modifications to payment terms and service level commitments. The billing cycle has been adjusted from quarterly to monthly payments, and new performance metrics have been established for system uptime and response times. The termination clause has also been updated to provide extended notice periods for better transition planning."
      : project.baseContract.type === 'consulting'
      ? "The consulting agreement has been amended to expand the scope of work and adjust project timelines. New deliverables have been added including additional training sessions and extended support periods. Payment milestones have been restructured to align with the revised project phases."
      : "This service level agreement has been updated with enhanced performance metrics and revised penalty structures. Response time requirements have been tightened, and new escalation procedures have been implemented for critical incidents.";
  };

  const getRealOrMockTimeline = () => {
    if (mergeResult?.document_incorporation_log && mergeResult.document_incorporation_log.length > 0) {
      return mergeResult.document_incorporation_log.map((doc, index) => {
        // Parse the document incorporation log entry
        // Format: "filename (role, date)"
        const match = doc.match(/^(.+?)\s*\((.+?),\s*(.+?)\)$/);
        if (match) {
          const [, filename, role, date] = match;
          return {
            id: `doc-${index}`,
            title: filename.trim(),
            date: date.trim(),
            type: role.trim().toLowerCase().includes('base') ? 'base' as const : 'amendment' as const,
            description: `${role.trim()} document processed`
          };
        }
        
        // Fallback parsing
        return {
          id: `doc-${index}`,
          title: doc,
          date: project.contractEffectiveStart,
          type: index === 0 ? 'base' as const : 'amendment' as const,
          description: `Document ${index + 1}`
        };
      });
    }
    
    // Fallback to mock data
    return [
      {
        id: 'base',
        title: 'Base Contract',
        date: project.contractEffectiveStart,
        type: 'base' as const,
        description: `Initial ${project.baseContract.type} agreement`
      },
      {
        id: 'amend-1',
        title: 'Amendment 1',
        date: '2024-03-01',
        type: 'amendment' as const,
        description: project.baseContract.type === 'license' ? 'Payment terms modification' : 'Scope expansion'
      },
      {
        id: 'amend-2',
        title: 'Amendment 2',
        date: '2024-05-15',
        type: 'amendment' as const,
        description: project.baseContract.type === 'license' ? 'SLA updates and termination changes' : 'Timeline and milestone adjustments'
      }
    ];
  };

  const getRealOrMockChangeAnalysis = () => {
    if (mergeResult?.clause_change_log && mergeResult.clause_change_log.length > 0) {
      return {
        summary: getRealOrMockChangeSummary(),
        sections: mergeResult.clause_change_log.map((change, index) => ({
          id: `change-${index}`,
          title: change.section,
          changeType: change.change_type as 'added' | 'modified' | 'deleted',
          confidence: 95, // We don't have confidence in the merge result, so use a default
          description: change.summary,
          details: [
            ...(change.old_text ? [{ type: 'deleted' as const, text: change.old_text }] : []),
            ...(change.new_text ? [{ type: 'added' as const, text: change.new_text }] : [])
          ]
        }))
      };
    }
    
    // Fallback to mock data
    return {
      summary: getRealOrMockChangeSummary(),
      sections: project.baseContract.type === 'license' ? [
        {
          id: 'payment-terms',
          title: 'Payment Terms',
          changeType: 'modified' as const,
          confidence: 95,
          description: 'Payment schedule changed from quarterly to monthly billing with adjusted terms',
          details: [
            { type: 'deleted', text: 'Payment shall be made quarterly within 30 days of invoice receipt' },
            { type: 'added', text: 'Payment shall be made monthly within 15 days of invoice receipt' },
            { type: 'added', text: 'Late payment penalty of 1.5% per month applies after grace period' }
          ]
        },
        {
          id: 'sla-metrics',
          title: 'Service Level Agreement',
          changeType: 'added' as const,
          confidence: 98,
          description: 'New performance metrics and uptime requirements established',
          details: [
            { type: 'added', text: 'System uptime guarantee: 99.9% monthly availability' },
            { type: 'added', text: 'Response time for critical issues: Maximum 2 hours' },
            { type: 'added', text: 'Planned maintenance windows: Maximum 4 hours per month' }
          ]
        },
        {
          id: 'termination',
          title: 'Termination Clause',
          changeType: 'modified' as const,
          confidence: 92,
          description: 'Notice period extended and termination procedures clarified',
          details: [
            { type: 'deleted', text: 'Either party may terminate with 30 days written notice' },
            { type: 'added', text: 'Either party may terminate with 60 days written notice' },
            { type: 'added', text: 'Termination must include transition assistance plan' }
          ]
        }
      ] : [
        {
          id: 'scope-expansion',
          title: 'Scope of Work',
          changeType: 'modified' as const,
          confidence: 96,
          description: 'Project scope expanded with additional deliverables and timeline adjustments',
          details: [
            { type: 'added', text: 'Additional training sessions: 3 workshops for development team' },
            { type: 'added', text: 'Extended support period: 6 months post-implementation' },
            { type: 'modified', text: 'Project timeline extended from 4 months to 6 months' }
          ]
        },
        {
          id: 'payment-milestones',
          title: 'Payment Milestones',
          changeType: 'modified' as const,
          confidence: 94,
          description: 'Payment structure restructured to align with revised project phases',
          details: [
            { type: 'deleted', text: 'Payment in 3 equal installments' },
            { type: 'added', text: 'Payment in 5 milestone-based installments' },
            { type: 'added', text: 'Final payment contingent on successful user acceptance testing' }
          ]
        }
      ]
    };
  };

  const getRealOrMockFinalContract = () => {
    if (mergeResult?.final_contract) {
      return mergeResult.final_contract;
    }
    
    // Fallback to mock data
    return `
${project.name.toUpperCase()}

This ${project.baseContract.type} agreement ("Agreement") is entered into on ${format(new Date(project.contractEffectiveStart), 'MMMM dd, yyyy')}, between ${project.client} ("Client") and GitHub, Inc. ("Provider").

1. PAYMENT TERMS
${project.baseContract.type === 'license' 
  ? 'Payment shall be made monthly within 15 days of invoice receipt. Late payment penalty of 1.5% per month applies after grace period.'
  : 'Payment shall be made according to milestone-based installments. Final payment contingent on successful user acceptance testing.'
}

2. SERVICE LEVEL AGREEMENT
${project.baseContract.type === 'license'
  ? 'Provider shall maintain system uptime guarantee of 99.9% monthly availability. Response time for critical issues: Maximum 2 hours. Planned maintenance windows: Maximum 4 hours per month.'
  : 'Provider shall deliver all services according to agreed timeline with quality assurance checkpoints at each milestone.'
}

3. TERMINATION
Either party may terminate this Agreement with 60 days written notice. Termination must include transition assistance plan.

4. SCOPE OF SERVICES
${project.baseContract.description}
${project.baseContract.type === 'consulting' ? 'Additional training sessions: 3 workshops for development team. Extended support period: 6 months post-implementation.' : ''}

[Contract continues...]
  `.trim();
  };

  // Get the actual data (real or mock)
  const stats = getRealOrMockStats();
  const changeSummary = getRealOrMockChangeSummary();
  const timeline = getRealOrMockTimeline();
  const changeAnalysis = getRealOrMockChangeAnalysis();
  const finalContract = getRealOrMockFinalContract();

  const getChangeTypeColor = (type: 'added' | 'modified' | 'deleted') => {
    switch (type) {
      case 'added': return 'text-green-700 bg-green-50 border-green-200';
      case 'modified': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'deleted': return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getChangeTypeIcon = (type: 'added' | 'modified' | 'deleted') => {
    switch (type) {
      case 'added': return <Plus className="w-4 h-4" />;
      case 'modified': return <RefreshCw className="w-4 h-4" />;
      case 'deleted': return <Minus className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600 bg-green-50';
    if (confidence >= 85) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleProcessDocuments = async () => {
    try {
      await mergeDocumentsFromProject(project.id);
    } catch (error) {
      console.error('Failed to process documents:', error);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Contract Summary', icon: FileText },
    { id: 'timeline', label: 'Amendment History', icon: GitBranch },
    { id: 'changes', label: 'Key Clause-Level Changes', icon: AlertCircle },
    { id: 'final', label: 'Final Contract', icon: CheckCircle }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-6">
            {/* Data Source Indicator */}
            <div className={`p-3 rounded-lg border ${
              mergeResult ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2 text-sm">
                <Info className={`w-4 h-4 ${mergeResult ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className={`font-medium ${mergeResult ? 'text-green-800' : 'text-yellow-800'}`}>
                  {mergeResult 
                    ? '✅ Displaying real OpenAI analysis results from your uploaded documents'
                    : '⚠️ Displaying mock data - upload and process documents to see real AI analysis'
                  }
                </span>
              </div>
            </div>

            <ContractSummaryTab
              project={project}
              stats={stats}
              changeSummary={changeSummary}
              timeline={timeline}
            />
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            {/* Data Source Indicator */}
            <div className={`p-3 rounded-lg border ${
              mergeResult ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2 text-sm">
                <Info className={`w-4 h-4 ${mergeResult ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className={`font-medium ${mergeResult ? 'text-green-800' : 'text-yellow-800'}`}>
                  {mergeResult 
                    ? '✅ Displaying real document timeline from OpenAI processing'
                    : '⚠️ Displaying mock timeline - upload and process documents to see real timeline'
                  }
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                <span>Amendment History & Document Timeline</span>
              </h2>
              
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                        item.type === 'base' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-purple-50 border-purple-200'
                      }`}>
                        <div className={`w-4 h-4 rounded-full ${
                          item.type === 'base' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'base' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{safeFormatDate(item.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'changes':
        return (
          <div className="space-y-6">
            {/* Data Source Indicator */}
            <div className={`p-3 rounded-lg border ${
              mergeResult ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2 text-sm">
                <Info className={`w-4 h-4 ${mergeResult ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className={`font-medium ${mergeResult ? 'text-green-800' : 'text-yellow-800'}`}>
                  {mergeResult 
                    ? `✅ Displaying ${changeAnalysis.sections.length} real clause-level changes detected by OpenAI`
                    : '⚠️ Displaying mock changes - upload and process documents to see real AI-detected changes'
                  }
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span>Key Clause-Level Changes Analysis</span>
              </h2>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed">{changeAnalysis.summary}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Detailed Change Log</h3>
                
                {changeAnalysis.sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(section.changeType)}`}>
                          {getChangeTypeIcon(section.changeType)}
                          <span className="ml-1 capitalize">{section.changeType}</span>
                        </span>
                        <span className="font-medium text-gray-900">{section.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(section.confidence)}`}>
                          {section.confidence}% confidence
                        </span>
                      </div>
                      {expandedSections.has(section.id) ? 
                        <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      }
                    </button>
                    
                    {expandedSections.has(section.id) && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                        <div className="space-y-2">
                          {section.details.map((detail, index) => (
                            <div key={index} className={`p-3 rounded-lg text-sm ${
                              detail.type === 'added' ? 'bg-green-50 border-l-4 border-green-400' :
                              detail.type === 'deleted' ? 'bg-red-50 border-l-4 border-red-400' :
                              'bg-blue-50 border-l-4 border-blue-400'
                            }`}>
                              <div className="flex items-start space-x-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  detail.type === 'added' ? 'bg-green-100 text-green-800' :
                                  detail.type === 'deleted' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {detail.type === 'added' ? '+' : detail.type === 'deleted' ? '-' : '~'}
                                </span>
                                <span className="text-gray-700">{detail.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>Show source document</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'final':
        return (
          <div className="space-y-6">
            {/* Data Source Indicator */}
            <div className={`p-3 rounded-lg border ${
              mergeResult ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2 text-sm">
                <Info className={`w-4 h-4 ${mergeResult ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className={`font-medium ${mergeResult ? 'text-green-800' : 'text-yellow-800'}`}>
                  {mergeResult 
                    ? '✅ Displaying real merged contract generated by OpenAI'
                    : '⚠️ Displaying mock contract - upload and process documents to see real merged contract'
                  }
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Final Merged Contract</span>
                </h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => downloadFinalContract(`${project.name}-merged.txt`)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Contract</span>
                  </button>
                  <button
                    onClick={() => setShowFullContract(!showFullContract)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    {showFullContract ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span>{showFullContract ? 'Collapse' : 'View Full Contract'}</span>
                  </button>
                </div>
              </div>
              
              {showFullContract ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {finalContract}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Contract preview (first 300 characters):</p>
                  <p className="text-sm text-gray-700 font-mono">
                    {finalContract.substring(0, 300)}...
                  </p>
                  <button
                    onClick={() => setShowFullContract(true)}
                    className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Click to view full contract
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 legal-heading">{project.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{project.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{project.documentCount} Document{project.documentCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Created {safeFormatDate(project.uploadDate, 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {onAddDocument && (
            <button 
              onClick={onAddDocument}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}
          
          {documents.length > 0 && !mergeResult && (
            <button 
              onClick={handleProcessDocuments}
              disabled={isMerging}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isMerging ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              <span>{isMerging ? 'Processing...' : 'Process Documents'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ContractProjectDetailTabbed;