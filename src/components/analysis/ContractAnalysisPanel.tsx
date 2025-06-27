import React, { useState } from 'react';
import { Brain, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useContractAnalysis } from '../../hooks/useContractAnalysis';

interface ContractAnalysisPanelProps {
  baseContract?: string;
  amendmentContract?: string;
  contractType?: string;
  projectName?: string;
  onAnalysisComplete?: (result: any) => void;
}

const ContractAnalysisPanel: React.FC<ContractAnalysisPanelProps> = ({
  baseContract = '',
  amendmentContract = '',
  contractType = 'general',
  projectName = 'Contract Project',
  onAnalysisComplete
}) => {
  const [contractTexts, setContractTexts] = useState({
    base: baseContract,
    amendment: amendmentContract
  });

  const {
    isAnalyzing,
    analysisResult,
    error,
    analyzeContracts,
    generateSummary,
    clearResults
  } = useContractAnalysis();

  const handleAnalyze = async () => {
    if (!contractTexts.base.trim()) {
      alert('Please provide the base contract text');
      return;
    }

    if (!contractTexts.amendment.trim()) {
      alert('Please provide the amendment contract text');
      return;
    }

    try {
      const result = await analyzeContracts(
        contractTexts.base,
        contractTexts.amendment,
        contractType
      );
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleGenerateSummary = async () => {
    if (!contractTexts.base.trim()) {
      alert('Please provide contract text to summarize');
      return;
    }

    try {
      const summary = await generateSummary(
        contractTexts.base,
        contractType,
        projectName
      );
      
      console.log('Generated summary:', summary);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Contract Analysis</h2>
          <p className="text-sm text-gray-600">Analyze contract changes and generate summaries using OpenAI</p>
        </div>
      </div>

      {/* Contract Input Areas */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Contract Text
          </label>
          <textarea
            value={contractTexts.base}
            onChange={(e) => setContractTexts(prev => ({ ...prev, base: e.target.value }))}
            placeholder="Paste your base contract text here..."
            className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isAnalyzing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amendment/Updated Contract Text
          </label>
          <textarea
            value={contractTexts.amendment}
            onChange={(e) => setContractTexts(prev => ({ ...prev, amendment: e.target.value }))}
            placeholder="Paste your amendment or updated contract text here..."
            className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isAnalyzing}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !contractTexts.base.trim() || !contractTexts.amendment.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            <span>Analyze Changes</span>
          </button>

          <button
            onClick={handleGenerateSummary}
            disabled={isAnalyzing || !contractTexts.base.trim()}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Summary</span>
          </button>

          {(analysisResult || error) && (
            <button
              onClick={clearResults}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isAnalyzing && (
          <div className="flex items-center space-x-2 text-purple-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Analyzing contracts with AI...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Analysis completed successfully</span>
            </div>

            {/* Analysis Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">AI-Generated Summary</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.summary}</p>
            </div>

            {/* Sections Analysis */}
            {analysisResult.sections && analysisResult.sections.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Detected Changes by Section</h3>
                {analysisResult.sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{section.title}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          section.changeType === 'added' ? 'bg-green-100 text-green-800' :
                          section.changeType === 'modified' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {section.changeType}
                        </span>
                        <span className="text-xs text-gray-500">{section.confidence}% confidence</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractAnalysisPanel;