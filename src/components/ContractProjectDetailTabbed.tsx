import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ContractProject } from '../types';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitBranch,
  TrendingUp,
  BarChart3,
  Minus,
  Info
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';
import ContractSummaryTab from './summary/ContractSummaryTab';
import { useDocuments } from '../hooks/useDocuments';

interface ContractProjectDetailTabbedProps {
  project: ContractProject;
  onBack: () => void;
  onAddDocument?: () => void;
}

const ContractProjectDetailTabbed: React.FC<ContractProjectDetailTabbedProps> = ({ 
  project, 
  onBack, 
  onAddDocument 
}) => {
  const [showFullContract, setShowFullContract] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [changeLogView, setChangeLogView] = useState<'by-document' | 'by-section'>('by-document');
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set());
  const [expandedClauseSections, setExpandedClauseSections] = useState<Set<string>>(new Set(['financial-terms', 'performance-standards']));
  const [expandedClauseDetails, setExpandedClauseDetails] = useState<Set<string>>(new Set());

  // Fetch real documents for this project
  const { documents, loading: documentsLoading } = useDocuments(project.id);

  // Calculate amendments count dynamically based on real document count
  const amendmentsCount = Math.max(0, documents.length - 1);

  // Project statistics based on real data
  const projectStats = {
    totalClauses: 24, // This would come from document analysis in a real app
    amendmentsApplied: amendmentsCount,
    changesDetected: amendmentsCount === 0 ? 0 : amendmentsCount * 2 + 2, // Mock calculation
    lastProcessed: documents.length > 0 ? documents[0].creation_date : project.lastUpdated
  };

  // Helper function to safely format dates
  const safeFormatDate = (dateValue: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    return format(date, formatString);
  };
  
  // Generate enhanced timeline data with descriptions and clause details based on real documents
  const generateTimelineData = () => {
    if (documents.length === 0) {
      return [{
        id: 'no-docs',
        title: 'No Documents',
        date: project.uploadDate,
        type: 'base' as const,
        description: 'No documents have been uploaded to this project yet.',
        clausesImpacted: [] as string[],
        summary: 'Project created but no documents uploaded'
      }];
    }

    // Sort documents by creation date
    const sortedDocs = [...documents].sort((a, b) => 
      new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()
    );

    return sortedDocs.map((doc, index) => {
      const isBase = doc.type === 'base' || index === 0;
      
      return {
        id: doc.document_id,
        title: isBase ? 'Base Contract' : `Amendment ${index}`,
        date: doc.creation_date,
        type: isBase ? 'base' as const : 'amendment' as const,
        description: isBase 
          ? `Base contract document: ${doc.name}. This establishes the foundational terms and conditions for the agreement.`
          : `Amendment document: ${doc.name}. This modifies or adds to the terms established in the base contract.`,
        clausesImpacted: isBase ? [] : [`Section ${index + 2}.1 - Modified Terms`, `Section ${index + 2}.2 - Additional Clauses`],
        summary: isBase ? 'Initial contract established' : `Amendment ${index} applied`
      };
    });
  };

  const timelineData = generateTimelineData();

  // Enhanced change summary based on real document count
  const finalContractSummary = documents.length === 0 
    ? `This project has been created but no documents have been uploaded yet. Upload your base contract and any amendments to begin contract analysis and see how terms evolve over time. The system will automatically detect changes and provide detailed summaries of modifications between document versions.`
    : documents.length === 1
    ? `This project contains the base contract document: "${documents[0].name}". This establishes the foundational terms and conditions for the agreement with ${project.client}. Upload additional amendment documents to see how the contract evolves and to generate change analysis between versions.`
    : `The final unified contract represents the complete agreement between ${project.client} and the service provider, incorporating all ${amendmentsCount} amendment${amendmentsCount > 1 ? 's' : ''} into a single comprehensive document. The contract has evolved through ${documents.length} document versions, with the most recent update on ${safeFormatDate(documents[0].creation_date)}. This consolidated version provides a clear, authoritative reference for all contractual obligations.`;

  // Generate "By Document" data with GitHub-style diffs
  const generateByDocumentData = () => {
    if (amendmentsCount === 0) return [];

    const documentChanges = [];
    
    if (amendmentsCount >= 1) {
      documentChanges.push({
        id: 'amend-1',
        title: 'Amendment 1',
        date: timelineData.find(t => t.id === 'amend-1')?.date || '',
        author: 'Legal Team',
        sha: 'a1b2c3d',
        description: 'Modified payment terms and added penalty structures',
        stats: { additions: 8, deletions: 3, filesChanged: 2 },
        files: [
          {
            fileName: 'Section_3_Payment_Terms.md',
            changeType: 'modified' as const,
            additions: 5,
            deletions: 2,
            chunks: [
              {
                header: '@@ -12,7 +12,10 @@ ## Payment Schedule',
                oldStart: 12,
                oldLines: 7,
                newStart: 12,
                newLines: 10,
                lines: [
                  { type: 'unchanged' as const, content: '## Payment Schedule', lineNumber: { old: 12, new: 12 } },
                  { type: 'unchanged' as const, content: '', lineNumber: { old: 13, new: 13 } },
                  { type: 'removed' as const, content: 'Payment shall be made quarterly within 30 days of invoice receipt.', lineNumber: { old: 14 } },
                  { type: 'removed' as const, content: 'All payments are due in US dollars.', lineNumber: { old: 15 } },
                  { type: 'added' as const, content: 'Payment shall be made monthly within 15 days of invoice receipt.', lineNumber: { new: 14 } },
                  { type: 'added' as const, content: 'All payments are due in US dollars and shall be made via wire transfer or ACH.', lineNumber: { new: 15 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 16 } },
                  { type: 'added' as const, content: '### Late Payment Penalties', lineNumber: { new: 17 } },
                  { type: 'added' as const, content: 'Late payment penalty of 1.5% per month applies after grace period.', lineNumber: { new: 18 } },
                  { type: 'unchanged' as const, content: '', lineNumber: { old: 16, new: 19 } },
                  { type: 'unchanged' as const, content: '## Payment Methods', lineNumber: { old: 17, new: 20 } }
                ]
              }
            ]
          },
          {
            fileName: 'Section_9_Definitions.md',
            changeType: 'modified' as const,
            additions: 3,
            deletions: 1,
            chunks: [
              {
                header: '@@ -45,4 +45,6 @@ ## Definitions',
                oldStart: 45,
                oldLines: 4,
                newStart: 45,
                newLines: 6,
                lines: [
                  { type: 'unchanged' as const, content: '- **Agreement**: This contract and all amendments', lineNumber: { old: 45, new: 45 } },
                  { type: 'unchanged' as const, content: '- **Client**: The contracting party receiving services', lineNumber: { old: 46, new: 46 } },
                  { type: 'removed' as const, content: '- **Payment Period**: Quarterly billing cycle', lineNumber: { old: 47 } },
                  { type: 'added' as const, content: '- **Payment Period**: Monthly billing cycle', lineNumber: { new: 47 } },
                  { type: 'added' as const, content: '- **Grace Period**: 5 business days after payment due date', lineNumber: { new: 48 } },
                  { type: 'added' as const, content: '- **Late Fee**: 1.5% monthly penalty on overdue amounts', lineNumber: { new: 49 } },
                  { type: 'unchanged' as const, content: '- **Provider**: GitHub, Inc.', lineNumber: { old: 48, new: 50 } }
                ]
              }
            ]
          }
        ]
      });
    }

    if (amendmentsCount >= 2) {
      documentChanges.push({
        id: 'amend-2',
        title: 'Amendment 2',
        date: timelineData.find(t => t.id === 'amend-2')?.date || '',
        author: 'Legal Team',
        sha: 'e4f5g6h',
        description: 'Added SLA requirements and updated termination procedures',
        stats: { additions: 12, deletions: 2, filesChanged: 3 },
        files: [
          {
            fileName: 'Section_5_Service_Levels.md',
            changeType: 'added' as const,
            additions: 8,
            deletions: 0,
            chunks: [
              {
                header: '@@ -0,0 +1,8 @@',
                oldStart: 0,
                oldLines: 0,
                newStart: 1,
                newLines: 8,
                lines: [
                  { type: 'added' as const, content: '# Section 5: Service Level Agreement', lineNumber: { new: 1 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 2 } },
                  { type: 'added' as const, content: '## Uptime Requirements', lineNumber: { new: 3 } },
                  { type: 'added' as const, content: 'Provider shall maintain 99.9% monthly uptime for all services.', lineNumber: { new: 4 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 5 } },
                  { type: 'added' as const, content: '## Response Times', lineNumber: { new: 6 } },
                  { type: 'added' as const, content: '- Critical issues: Maximum 2 hours', lineNumber: { new: 7 } },
                  { type: 'added' as const, content: '- High priority: Maximum 4 hours', lineNumber: { new: 8 } }
                ]
              }
            ]
          },
          {
            fileName: 'Section_7_Termination.md',
            changeType: 'modified' as const,
            additions: 4,
            deletions: 2,
            chunks: [
              {
                header: '@@ -8,6 +8,8 @@ ## Termination Notice',
                oldStart: 8,
                oldLines: 6,
                newStart: 8,
                newLines: 8,
                lines: [
                  { type: 'unchanged' as const, content: '## Termination Notice', lineNumber: { old: 8, new: 8 } },
                  { type: 'unchanged' as const, content: '', lineNumber: { old: 9, new: 9 } },
                  { type: 'removed' as const, content: 'Either party may terminate with 30 days written notice.', lineNumber: { old: 10 } },
                  { type: 'removed' as const, content: 'Termination is effective immediately upon notice.', lineNumber: { old: 11 } },
                  { type: 'added' as const, content: 'Either party may terminate with 60 days written notice.', lineNumber: { new: 10 } },
                  { type: 'added' as const, content: 'Termination requires transition assistance plan.', lineNumber: { new: 11 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 12 } },
                  { type: 'added' as const, content: '### Transition Assistance', lineNumber: { new: 13 } },
                  { type: 'added' as const, content: 'Terminating party must provide reasonable assistance during transition.', lineNumber: { new: 14 } },
                  { type: 'unchanged' as const, content: '', lineNumber: { old: 12, new: 15 } },
                  { type: 'unchanged' as const, content: '## Post-Termination', lineNumber: { old: 13, new: 16 } }
                ]
              }
            ]
          }
        ]
      });
    }

    return documentChanges;
  };

  // Generate "By Section" data with GitHub-style diffs
  const generateBySectionData = () => {
    if (amendmentsCount === 0) return [];

    const sectionEvolution = [
      {
        id: 'section-3',
        sectionName: 'Section 3: Payment Terms',
        totalChanges: 2,
        files: [
          {
            fileName: 'Section_3_Payment_Terms.md',
            changeType: 'modified' as const,
            amendedBy: 'Amendment 1',
            date: timelineData.find(t => t.id === 'amend-1')?.date || '',
            additions: 5,
            deletions: 2,
            chunks: [
              {
                header: '@@ -12,7 +12,10 @@ ## Payment Schedule',
                oldStart: 12,
                oldLines: 7,
                newStart: 12,
                newLines: 10,
                lines: [
                  { type: 'unchanged' as const, content: '## Payment Schedule', lineNumber: { old: 12, new: 12 } },
                  { type: 'removed' as const, content: 'Payment shall be made quarterly within 30 days of invoice receipt.', lineNumber: { old: 14 } },
                  { type: 'added' as const, content: 'Payment shall be made monthly within 15 days of invoice receipt.', lineNumber: { new: 14 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 16 } },
                  { type: 'added' as const, content: '### Late Payment Penalties', lineNumber: { new: 17 } },
                  { type: 'added' as const, content: 'Late payment penalty of 1.5% per month applies after grace period.', lineNumber: { new: 18 } }
                ]
              }
            ]
          }
        ]
      }
    ];

    if (amendmentsCount >= 2) {
      sectionEvolution.push({
        id: 'section-5',
        sectionName: 'Section 5: Service Level Agreement',
        totalChanges: 1,
        files: [
          {
            fileName: 'Section_5_Service_Levels.md',
            changeType: 'added' as const,
            amendedBy: 'Amendment 2',
            date: timelineData.find(t => t.id === 'amend-2')?.date || '',
            additions: 8,
            deletions: 0,
            chunks: [
              {
                header: '@@ -0,0 +1,8 @@',
                oldStart: 0,
                oldLines: 0,
                newStart: 1,
                newLines: 8,
                lines: [
                  { type: 'added' as const, content: '# Section 5: Service Level Agreement', lineNumber: { new: 1 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 2 } },
                  { type: 'added' as const, content: '## Uptime Requirements', lineNumber: { new: 3 } },
                  { type: 'added' as const, content: 'Provider shall maintain 99.9% monthly uptime for all services.', lineNumber: { new: 4 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 5 } },
                  { type: 'added' as const, content: '## Response Times', lineNumber: { new: 6 } },
                  { type: 'added' as const, content: '- Critical issues: Maximum 2 hours', lineNumber: { new: 7 } },
                  { type: 'added' as const, content: '- High priority: Maximum 4 hours', lineNumber: { new: 8 } }
                ]
              }
            ]
          }
        ]
      });

      sectionEvolution.push({
        id: 'section-7',
        sectionName: 'Section 7: Termination',
        totalChanges: 1,
        files: [
          {
            fileName: 'Section_7_Termination.md',
            changeType: 'modified' as const,
            amendedBy: 'Amendment 2',
            date: timelineData.find(t => t.id === 'amend-2')?.date || '',
            additions: 4,
            deletions: 2,
            chunks: [
              {
                header: '@@ -8,6 +8,8 @@ ## Termination Notice',
                oldStart: 8,
                oldLines: 6,
                newStart: 8,
                newLines: 8,
                lines: [
                  { type: 'unchanged' as const, content: '## Termination Notice', lineNumber: { old: 8, new: 8 } },
                  { type: 'removed' as const, content: 'Either party may terminate with 30 days written notice.', lineNumber: { old: 10 } },
                  { type: 'added' as const, content: 'Either party may terminate with 60 days written notice.', lineNumber: { new: 10 } },
                  { type: 'added' as const, content: '', lineNumber: { new: 12 } },
                  { type: 'added' as const, content: '### Transition Assistance', lineNumber: { new: 13 } },
                  { type: 'added' as const, content: 'Terminating party must provide reasonable assistance during transition.', lineNumber: { new: 14 } }
                ]
              }
            ]
          }
        ]
      });
    }

    return sectionEvolution;
  };

  const byDocumentData = generateByDocumentData();
  const bySectionData = generateBySectionData();

  // Generate documents data from real database documents
  const generateDocumentsData = () => {
    return documents.map(doc => ({
      id: doc.document_id,
      name: doc.name,
      uploadDate: doc.creation_date,
      type: doc.mime_type.includes('pdf') ? 'PDF' : 'DOCX',
      size: `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`,
      status: doc.upload_status as 'complete' | 'processing' | 'error'
    }));
  };

  const documentsData = generateDocumentsData();

  const finalContract = `
ENTERPRISE LICENSE AGREEMENT

This Enterprise License Agreement ("Agreement") is entered into on January 15, 2024, between ${project.client} ("Client") and GitHub, Inc. ("Provider").

1. PAYMENT TERMS
${documents.length > 1
  ? 'Payment shall be made monthly within 15 days of invoice receipt. Late payment penalty of 1.5% per month applies after grace period.'
  : 'Payment shall be made according to the terms specified in the base contract.'
}

2. SERVICE LEVEL AGREEMENT
${documents.length > 1
  ? 'Provider shall maintain system uptime guarantee of 99.9% monthly availability. Response time for critical issues: Maximum 2 hours. Planned maintenance windows: Maximum 4 hours per month.'
  : 'Service levels as specified in the base contract terms.'
}

3. TERMINATION
Either party may terminate this Agreement with ${documents.length > 1 ? '60' : '30'} days written notice. ${documents.length > 1 ? 'Termination must include transition assistance plan.' : ''}

4. SCOPE OF SERVICES
Provider shall provide enterprise GitHub services including repository management, CI/CD pipeline configuration, and ongoing technical support.

[Contract continues...]
  `.trim();

  const tabs = [
    { name: '📋 Summary', id: 'summary' },
    { name: '📊 Change Log', id: 'changelog' },
    { name: '📄 Source Documents', id: 'documents' },
    { name: '📘 Final Contract', id: 'contract' }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDiff = (diffId: string) => {
    const newExpanded = new Set(expandedDiffs);
    if (newExpanded.has(diffId)) {
      newExpanded.delete(diffId);
    } else {
      newExpanded.add(diffId);
    }
    setExpandedDiffs(newExpanded);
  };

  const getChangeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'added': return 'text-green-600 bg-green-50 border-green-200';
      case 'modified': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'removed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'added': return <Plus className="w-3 h-3" />;
      case 'modified': return <RefreshCw className="w-3 h-3" />;
      case 'removed': return <Minus className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'status-complete';
      case 'processing': return 'status-processing';
      case 'error': return 'status-error';
      default: return 'status-pending';
    }
  };

  const renderDiffLine = (line: any, index: number) => {
    const getLineStyle = () => {
      switch (line.type) {
        case 'added':
          return 'bg-green-50 border-l-4 border-green-400';
        case 'removed':
          return 'bg-red-50 border-l-4 border-red-400';
        case 'unchanged':
          return 'bg-white';
        default:
          return 'bg-white';
      }
    };

    const getLinePrefix = () => {
      switch (line.type) {
        case 'added': return '+';
        case 'removed': return '-';
        default: return ' ';
      }
    };

    const getTextColor = () => {
      switch (line.type) {
        case 'added': return 'text-green-800';
        case 'removed': return 'text-red-800';
        default: return 'text-gray-800';
      }
    };

    return (
      <div key={index} className={`flex text-sm font-mono ${getLineStyle()}`}>
        <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 select-none">
          <div className="flex space-x-1">
            <span className="w-6 text-right">
              {line.lineNumber?.old || ''}
            </span>
            <span className="w-6 text-right">
              {line.lineNumber?.new || ''}
            </span>
          </div>
        </div>
        <div className={`flex-1 px-3 py-1 ${getTextColor()}`}>
          <span className="select-none mr-2 opacity-60">{getLinePrefix()}</span>
          <span>{line.content}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 legal-heading">{project.name}</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">{project.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Effective: {safeFormatDate(project.contractEffectiveStart)} - {safeFormatDate(project.contractEffectiveEnd)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{project.documentCount} documents</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Download Final Contract
          </button>
        </div>
      </div>

      {/* Mock Data Notice */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Development Notice</h3>
            <p className="text-sm text-amber-700">
              The "Amendment History" and "Key Clause-Level Changes" sections currently display mock data for demonstration purposes. 
              In the production version, this would show real AI-powered analysis of your uploaded documents.
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tab.Group>
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 mb-8 rounded-t-xl">
          <Tab.List className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  clsx(
                    'py-4 px-1 border-b-2 font-semibold text-sm transition-colors focus:outline-none',
                    selected
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
        </div>

        <Tab.Panels>
          {/* 📋 Summary Tab */}
          <Tab.Panel>
            <ContractSummaryTab
              project={project}
              stats={projectStats}
              changeSummary={finalContractSummary}
              timeline={timelineData}
            />
          </Tab.Panel>

          {/* 📊 Change Log Tab */}
          <Tab.Panel className="space-y-6">
            <div className="card p-6">
              {/* Header with subtitle */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 legal-heading">Change Log</h2>
                <p className="text-sm text-gray-600 font-medium">GitHub-style change log showing detailed contract changes</p>
              </div>

              {/* View Toggle Tabs */}
              <div className="mb-8">
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setChangeLogView('by-document')}
                    className={clsx(
                      'px-6 py-3 rounded-md font-bold text-sm transition-all duration-200 flex items-center space-x-2',
                      changeLogView === 'by-document'
                        ? 'bg-primary-600 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    )}
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>By Document</span>
                  </button>
                  <button
                    onClick={() => setChangeLogView('by-section')}
                    className={clsx(
                      'px-6 py-3 rounded-md font-bold text-sm transition-all duration-200 flex items-center space-x-2',
                      changeLogView === 'by-section'
                        ? 'bg-success-600 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span>By Section</span>
                  </button>
                </div>
              </div>

              {/* Conditional View Panel */}
              <div className="min-h-[400px]">
                {changeLogView === 'by-document' ? (
                  /* By Document View - GitHub-style commits */
                  <div className="space-y-6">
                    <div className="mb-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <GitBranch className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-primary-900">By Document View</h3>
                      </div>
                      <p className="text-sm text-primary-800 font-medium">
                        Shows detailed line-by-line changes for each amendment, similar to GitHub commits
                      </p>
                    </div>
                    
                    {byDocumentData.length === 0 ? (
                      <div className="bg-primary-50 border border-gray-200 rounded-lg p-8 text-center">
                        <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-bold mb-2">No amendments to display</p>
                        <p className="text-sm text-gray-500 font-medium">Upload amendments to see detailed change logv</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {byDocumentData.map((commit) => (
                          <div key={commit.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Commit Header */}
                            <div className="border-b border-gray-200">
                              <button
                                onClick={() => toggleDiff(commit.id)}
                                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-4 flex-1">
                                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                                      <GitBranch className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{commit.title}</h3>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 font-mono">
                                          {commit.sha}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 mb-3">{commit.description}</p>
                                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                                        <div className="flex items-center space-x-2">
                                          <Calendar className="w-4 h-4" />
                                          <span className="font-medium">{safeFormatDate(commit.date)}</span>
                                        </div>
                                        <span className="font-medium">by {commit.author}</span>
                                        <div className="flex items-center space-x-4">
                                          <span className="text-green-600 font-medium">+{commit.stats.additions}</span>
                                          <span className="text-red-600 font-medium">-{commit.stats.deletions}</span>
                                          <span className="text-gray-600 font-medium">{commit.stats.filesChanged} file{commit.stats.filesChanged !== 1 ? 's' : ''}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 ml-4">
                                    {expandedDiffs.has(commit.id) ? 
                                      <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                                      <ChevronRight className="w-5 h-5 text-gray-500" />
                                    }
                                  </div>
                                </div>
                              </button>
                            </div>

                            {/* Commit Files */}
                            {expandedDiffs.has(commit.id) && (
                              <div className="divide-y divide-gray-200">
                                {commit.files.map((file, fileIndex) => {
                                  const fileKey = `${commit.id}-${fileIndex}`;
                                  return (
                                    <div key={fileIndex} className="bg-gray-50">
                                      {/* File Header */}
                                      <button
                                        onClick={() => toggleDiff(fileKey)}
                                        className="w-full p-4 text-left hover:bg-gray-100 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(file.changeType)}`}>
                                              {getChangeTypeIcon(file.changeType)}
                                              <span className="ml-1 capitalize">{file.changeType}</span>
                                            </span>
                                            <span className="font-mono text-sm font-medium text-gray-900">
                                              {file.fileName}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2 text-sm">
                                              <span className="text-green-600 font-medium">+{file.additions}</span>
                                              <span className="text-red-600 font-medium">-{file.deletions}</span>
                                            </div>
                                            {expandedDiffs.has(fileKey) ? 
                                              <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                                              <ChevronRight className="w-4 h-4 text-gray-500" />
                                            }
                                          </div>
                                        </div>
                                      </button>
                                      {/* File Diff */}
                                      {expandedDiffs.has(fileKey) && (
                                        <div className="bg-white border-t border-gray-200">
                                          {file.chunks.map((chunk, chunkIndex) => (
                                            <div key={chunkIndex}>
                                              {/* Chunk Header */}
                                              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                                                <span className="text-sm font-mono text-blue-800">
                                                  {chunk.header}
                                                </span>
                                              </div>
                                              {/* Chunk Lines */}
                                              <div className="divide-y divide-gray-100">
                                                {chunk.lines.map((line, lineIndex) => 
                                                  renderDiffLine(line, lineIndex)
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* By Section View - GitHub-style change log grouped by section */
                  <div className="space-y-6">
                    <div className="mb-4 bg-success-50 border border-success-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-success-600" />
                        <h3 className="font-bold text-success-900">By Section View</h3>
                      </div>
                      <p className="text-sm text-success-800 font-medium">
                        Shows how each contract section evolved with detailed line-by-line changes
                      </p>
                    </div>
                    
                    {bySectionData.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-bold mb-2">No section changes to display</p>
                        <p className="text-sm text-gray-500 font-medium">Upload amendments to see section evolution</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {bySectionData.map((section) => (
                          <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="border-b border-gray-200">
                              <button
                                onClick={() => toggleDiff(section.id)}
                                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-bold text-gray-900">{section.sectionName}</h3>
                                      <p className="text-sm text-gray-600 font-medium">
                                        {section.totalChanges} change{section.totalChanges !== 1 ? 's' : ''} across amendments
                                      </p>
                                    </div>
                                  </div>
                                  {expandedDiffs.has(section.id) ? 
                                    <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                  }
                                </div>
                              </button>
                            </div>

                            {/* Section Files */}
                            {expandedDiffs.has(section.id) && (
                              <div className="divide-y divide-gray-200">
                                {section.files.map((file, fileIndex) => {
                                  const fileKey = `${section.id}-${fileIndex}`;
                                  return (
                                    <div key={fileIndex} className="bg-gray-50">
                                      {/* File Header */}
                                      <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getChangeTypeColor(file.changeType)}`}>
                                              {getChangeTypeIcon(file.changeType)}
                                              <span className="ml-1 capitalize">{file.changeType}</span>
                                            </span>
                                            <span className="font-mono text-sm font-medium text-gray-900">
                                              {file.fileName}
                                            </span>
                                            <span className="text-xs text-gray-600 font-medium">
                                              by {file.amendedBy} on {safeFormatDate(file.date)}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2 text-sm">
                                            <span className="text-green-600 font-medium">+{file.additions}</span>
                                            <span className="text-red-600 font-medium">-{file.deletions}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* File Diff */}
                                      <div className="bg-white">
                      {file.chunks.map((chunk, chunkIndex) => (
                                          <div key={chunkIndex}>
                                            {/* Chunk Header */}
                                            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                                              <span className="text-sm font-mono text-blue-800">
                                                {chunk.header}
                                              </span>
                                            </div>
                                            {/* Chunk Lines */}
                                            <div className="divide-y divide-gray-100">
                                              {chunk.lines.map((line, lineIndex) => 
                                                renderDiffLine(line, lineIndex)
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>

          {/* 📄 Source Documents Tab */}
          <Tab.Panel className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 legal-heading">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span>Source Documents ({project.documentCount} files)</span>
                </h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={onAddDocument}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </button>
                  <button className="btn-secondary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reprocess Documents
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Upload Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documentsData.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {safeFormatDate(doc.uploadDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{doc.size}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                            {doc.status === 'complete' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {doc.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button className="text-primary-600 hover:text-primary-700 transition-colors" title="Preview">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-primary-600 hover:text-primary-700 transition-colors" title="Reprocess">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button className="text-error-600 hover:text-error-700 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>

          {/* 📘 Final Contract Tab */}
          <Tab.Panel className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 legal-heading">
                  <FileText className="w-5 h-5 text-success-600" />
                  <span>Unified Contract Preview</span>
                </h2>
                
                <div className="flex items-center space-x-3">
                  <button className="btn-outline text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </button>
                  <button className="btn-outline text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    DOCX
                  </button>
                  <button
                    onClick={() => setShowFullContract(!showFullContract)}
                    className="btn-secondary text-sm"
                  >
                    {showFullContract ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    {showFullContract ? 'Collapse' : 'Expand'} Contract
                  </button>
                </div>
              </div>
              
              {/* Contract Preview */}
              {showFullContract ? (
                <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto mb-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {finalContract}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Contract Preview</span>
                    <span className="text-xs text-gray-500">(first 300 characters)</span>
                  </div>
                  <p className="text-sm text-gray-700 font-mono leading-relaxed mb-4">
                    {finalContract.substring(0, 300)}...
                  </p>
                  <button
                    onClick={() => setShowFullContract(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-bold"
                  >
                    Click to view full contract
                  </button>
                </div>
              )}

              {/* Contract Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-2xl font-bold text-primary-900">12</p>
                  <p className="text-xs text-primary-700 font-semibold">Pages</p>
                </div>
                
                <div className="bg-success-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <p className="text-2xl font-bold text-success-900">24</p>
                  <p className="text-xs text-success-700 font-semibold">Clauses</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{amendmentsCount}</p>
                  <p className="text-xs text-gray-700 font-semibold">Amendments</p>
                </div>
              </div>
              {/* Full Download Button */}
              <div className="flex justify-center pt-4 border-t border-gray-200">
                <button className="btn-primary px-8 py-3 font-bold">
                  <Download className="w-5 h-5 mr-2" />
                  Download Final Contract
                </button>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ContractProjectDetailTabbed;