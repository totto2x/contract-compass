import React, { useState } from 'react';
import { Contract } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  Share,
  ChevronDown, 
  ChevronRight,
  Plus,
  RefreshCw,
  Eye,
  GitBranch,
  AlertCircle,
  Minus,
  CheckCircle,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';

interface ContractDetailProps {
  contract: Contract;
  onBack: () => void;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contract, onBack }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<string>('base');
  const [showFullContract, setShowFullContract] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const StatusBadge: React.FC<{ status: Contract['status'] }> = ({ status }) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Mock change analysis data based on contract type
  const changeAnalysis = {
    summary: contract.type === 'license' 
      ? "This enterprise license agreement has undergone significant modifications to payment terms and service level commitments. The billing cycle has been adjusted from quarterly to monthly payments, and new performance metrics have been established for system uptime and response times. The termination clause has also been updated to provide extended notice periods for better transition planning."
      : contract.type === 'consulting'
      ? "The consulting agreement has been amended to expand the scope of work and adjust project timelines. New deliverables have been added including additional training sessions and extended support periods. Payment milestones have been restructured to align with the revised project phases."
      : "This service level agreement has been updated with enhanced performance metrics and revised penalty structures. Response time requirements have been tightened, and new escalation procedures have been implemented for critical incidents.",
    sections: contract.type === 'license' ? [
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

  const timeline = [
    {
      id: 'base',
      title: 'Base Contract',
      date: contract.startDate,
      type: 'base' as const,
      description: `Initial ${contract.type} agreement`
    },
    {
      id: 'amend-1',
      title: 'Amendment 1',
      date: '2024-03-01',
      type: 'amendment' as const,
      description: contract.type === 'license' ? 'Payment terms modification' : 'Scope expansion'
    },
    {
      id: 'amend-2',
      title: 'Amendment 2',
      date: '2024-05-15',
      type: 'amendment' as const,
      description: contract.type === 'license' ? 'SLA updates and termination changes' : 'Timeline and milestone adjustments'
    }
  ];

  const finalContract = `
${contract.title.toUpperCase()}

This ${contract.type} agreement ("Agreement") is entered into on ${format(new Date(contract.startDate), 'MMMM dd, yyyy')}, between ${contract.client} ("Client") and the Service Provider ("Provider").

1. PAYMENT TERMS
${contract.type === 'license' 
  ? 'Payment shall be made monthly within 15 days of invoice receipt. Late payment penalty of 1.5% per month applies after grace period.'
  : 'Payment shall be made according to milestone-based installments. Final payment contingent on successful user acceptance testing.'
}

2. SERVICE LEVEL AGREEMENT
${contract.type === 'license'
  ? 'Provider shall maintain system uptime guarantee of 99.9% monthly availability. Response time for critical issues: Maximum 2 hours. Planned maintenance windows: Maximum 4 hours per month.'
  : 'Provider shall deliver all services according to agreed timeline with quality assurance checkpoints at each milestone.'
}

3. TERMINATION
Either party may terminate this Agreement with 60 days written notice. Termination must include transition assistance plan.

4. SCOPE OF SERVICES
${contract.description}
${contract.type === 'consulting' ? 'Additional training sessions: 3 workshops for development team. Extended support period: 6 months post-implementation.' : ''}

[Contract continues...]
  `.trim();

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

  return (
    <div className="p-8 space-y-8">
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
              <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{contract.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(contract.startDate), 'MMM dd, yyyy')} - {format(new Date(contract.endDate), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                <Tag className="w-3 h-3 mr-1" />
                {contract.type}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4" />
            <span>Change Log</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Contract</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Plain-English Change Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span>AI-Generated Change Summary</span>
            </h2>
            
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed">{changeAnalysis.summary}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Section-by-Section Change Log</h3>
              
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

          {/* Final Merged Contract */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>Final Merged Contract</span>
              </h2>
              <div className="flex items-center space-x-3">
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>Export DOCX</span>
                </button>
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => setShowFullContract(!showFullContract)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  {showFullContract ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>{showFullContract ? 'Collapse' : 'Expand'}</span>
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
                <p className="text-sm text-gray-600 mb-2">Contract preview (first 200 characters):</p>
                <p className="text-sm text-gray-700 font-mono">
                  {finalContract.substring(0, 200)}...
                </p>
                <button
                  onClick={() => setShowFullContract(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Click to view full contract
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <span>Document Timeline</span>
            </h3>
            
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <button
                    onClick={() => setSelectedTimelineItem(item.id)}
                    className={`w-4 h-4 rounded-full border-2 mt-1 transition-colors ${
                      selectedTimelineItem === item.id
                        ? 'bg-blue-600 border-blue-600'
                        : item.type === 'base'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-purple-500 border-purple-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedTimelineItem(item.id)}
                      className="text-left w-full"
                    >
                      <p className={`text-sm font-medium ${
                        selectedTimelineItem === item.id ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(item.date), 'MMM dd, yyyy')}
                      </p>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Click timeline items to view version diffs</p>
            </div>
          </div>

          {/* Processing Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Stats</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documents Applied</span>
                <span className="text-sm font-medium text-gray-900">{timeline.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Changes Detected</span>
                <span className="text-sm font-medium text-gray-900">{changeAnalysis.sections.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Confidence</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(changeAnalysis.sections.reduce((sum, s) => sum + s.confidence, 0) / changeAnalysis.sections.length)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Processed</span>
                <span className="text-sm font-medium text-gray-900">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Amendment</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Reprocess</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;