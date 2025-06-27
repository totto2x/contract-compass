import React from 'react';
import { 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Building2
} from 'lucide-react';
import { format, isValid } from 'date-fns';

interface ContractSummaryTabProps {
  project: {
    name: string;
    client: string;
    uploadDate: string;
    documentCount: number;
    tags: string[];
    contractEffectiveStart: string;
    contractEffectiveEnd: string;
    lastUpdated: string;
  };
  stats: {
    totalClauses: number;
    amendmentsApplied: number;
    changesDetected: number;
    lastProcessed: string;
  };
  changeSummary: string;
  timeline: Array<{
    id: string;
    title: string;
    date: string;
    type: 'base' | 'amendment';
    description: string;
  }>;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string, formatString: string = 'MMMM dd, yyyy'): string => {
  if (!dateString) return 'Not available';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid date';
  
  return format(date, formatString);
};

const ContractSummaryTab: React.FC<ContractSummaryTabProps> = ({ 
  project, 
  stats, 
  changeSummary, 
  timeline 
}) => {
  return (
    <div className="space-y-8">
      {/* 1. Essentials Overview - 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agreement Parties */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Agreement Parties</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Client:</p>
              <p className="text-gray-900">{project.client}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Provider:</p>
              <p className="text-gray-900">GitHub Inc.</p>
            </div>
          </div>
        </div>

        {/* Agreement Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Agreement Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Contract Type:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Start Date:</p>
              <p className="text-gray-900">{safeFormatDate(project.contractEffectiveStart)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Modified:</p>
              <p className="text-gray-900">{safeFormatDate(project.lastUpdated)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated: {safeFormatDate(stats.lastProcessed, 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Contract Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Contract Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Clauses</span>
              <span className="text-lg font-bold text-gray-900">{stats.totalClauses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Changes Detected</span>
              <span className="text-lg font-bold text-gray-900">{stats.changesDetected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Documents Uploaded</span>
              <span className="text-lg font-bold text-gray-900">{project.documentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Final Contract Summary - Plain Text Block */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Contract Summary</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed text-base">
            {changeSummary}
          </p>
        </div>
      </div>

      {/* 3. Mini Timeline - Simplified Horizontal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Contract Timeline</h2>
        
        {/* Horizontal milestone dots */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200"></div>
          
          {/* Timeline items */}
          <div className="flex justify-between items-start relative">
            {timeline.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex flex-col items-center group cursor-pointer">
                {/* Milestone dot */}
                <div className={`w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center z-10 transition-all duration-200 group-hover:scale-110 ${
                  item.type === 'base' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-400 bg-gray-50'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    item.type === 'base' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center max-w-20">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden group-hover:block absolute bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-20 -translate-x-1/2 left-1/2 top-12 w-48">
                    {safeFormatDate(item.date, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline footer */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Hover over milestones to see dates • {timeline.length > 5 ? `Showing first 5 of ${timeline.length} documents` : `${timeline.length} document${timeline.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContractSummaryTab;