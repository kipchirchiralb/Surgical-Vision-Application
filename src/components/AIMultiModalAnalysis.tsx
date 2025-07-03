import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Eye, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Layers, 
  BarChart3, 
  Cpu, 
  Microscope,
  Heart,
  Waves,
  Dna
} from 'lucide-react';

interface AIAnalysisResult {
  id: string;
  modelName: string;
  confidence: number;
  diagnosis: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: string[];
  recommendations: string[];
  processingTime: number;
}

interface MultiModalAnalysisProps {
  scanId: string;
  scanTypes: string[];
  onAnalysisComplete?: (results: AIAnalysisResult[]) => void;
}

const AIMultiModalAnalysis: React.FC<MultiModalAnalysisProps> = ({
  scanId,
  scanTypes,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModel, setCurrentModel] = useState('');
  const [results, setResults] = useState<AIAnalysisResult[]>([]);
  const [fusionMode, setFusionMode] = useState<'ct-mri' | 'pet-ct' | 'fmri-dti' | 'all'>('ct-mri');
  const [selectedModels, setSelectedModels] = useState({
    deepMind: true,
    ibmWatson: true,
    googleMedAI: true,
    surgicalVisionAI: true,
    radiologyGPT: true
  });

  const aiModels = [
    {
      id: 'deepmind',
      name: 'DeepMind Medical AI',
      specialty: 'Tumor Detection',
      accuracy: 97.2,
      icon: Brain,
      color: 'text-blue-600'
    },
    {
      id: 'watson',
      name: 'IBM Watson Oncology',
      specialty: 'Cancer Analysis',
      accuracy: 94.8,
      icon: Microscope,
      color: 'text-purple-600'
    },
    {
      id: 'google',
      name: 'Google Med-AI',
      specialty: 'Multi-Modal Fusion',
      accuracy: 96.1,
      icon: Layers,
      color: 'text-green-600'
    },
    {
      id: 'surgical',
      name: 'Surgical Vision AI',
      specialty: 'Surgical Planning',
      accuracy: 95.7,
      icon: Target,
      color: 'text-red-600'
    },
    {
      id: 'radiology',
      name: 'Radiology GPT',
      specialty: 'Diagnostic Reporting',
      accuracy: 93.4,
      icon: Activity,
      color: 'text-orange-600'
    }
  ];

  const startMultiModalAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setResults([]);

    const selectedModelsList = aiModels.filter(model => 
      selectedModels[model.id as keyof typeof selectedModels]
    );

    for (let i = 0; i < selectedModelsList.length; i++) {
      const model = selectedModelsList[i];
      setCurrentModel(model.name);
      
      // Simulate AI processing
      await simulateAIAnalysis(model, i, selectedModelsList.length);
    }

    setIsAnalyzing(false);
    setCurrentModel('');
  };

  const simulateAIAnalysis = async (model: any, index: number, total: number) => {
    const startTime = Date.now();
    
    // Simulate processing time
    for (let step = 0; step <= 100; step += 5) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const overallProgress = ((index * 100) + step) / total;
      setProgress(overallProgress);
    }

    const processingTime = Date.now() - startTime;

    // Generate realistic AI results
    const result: AIAnalysisResult = {
      id: `${model.id}-${Date.now()}`,
      modelName: model.name,
      confidence: model.accuracy + (Math.random() * 4 - 2), // Slight variation
      diagnosis: generateDiagnosis(model.specialty),
      riskLevel: generateRiskLevel(),
      findings: generateFindings(model.specialty),
      recommendations: generateRecommendations(model.specialty),
      processingTime
    };

    setResults(prev => [...prev, result]);
  };

  const generateDiagnosis = (specialty: string) => {
    const diagnoses = {
      'Tumor Detection': [
        'Glioblastoma multiforme (Grade IV)',
        'Meningioma (Grade I)',
        'Metastatic lesion',
        'Low-grade glioma',
        'Acoustic neuroma'
      ],
      'Cancer Analysis': [
        'Primary brain tumor with high proliferation index',
        'Secondary metastatic disease',
        'Benign space-occupying lesion',
        'Inflammatory process',
        'Vascular malformation'
      ],
      'Multi-Modal Fusion': [
        'Heterogeneous enhancing mass with necrosis',
        'Infiltrative tumor with edema',
        'Well-circumscribed lesion',
        'Multifocal disease process',
        'Post-treatment changes'
      ],
      'Surgical Planning': [
        'Resectable tumor with clear margins',
        'Complex lesion near eloquent cortex',
        'Deep-seated tumor requiring staged approach',
        'Superficial lesion amenable to minimal access',
        'Inoperable due to location'
      ],
      'Diagnostic Reporting': [
        'Findings consistent with high-grade glioma',
        'Imaging suggests benign etiology',
        'Indeterminate lesion requiring biopsy',
        'Multiple differential diagnoses',
        'Clear pathological process identified'
      ]
    };

    const options = diagnoses[specialty] || diagnoses['Tumor Detection'];
    return options[Math.floor(Math.random() * options.length)];
  };

  const generateRiskLevel = (): 'low' | 'medium' | 'high' | 'critical' => {
    const rand = Math.random();
    if (rand < 0.2) return 'critical';
    if (rand < 0.4) return 'high';
    if (rand < 0.7) return 'medium';
    return 'low';
  };

  const generateFindings = (specialty: string) => {
    const findings = [
      'Heterogeneous signal intensity',
      'Surrounding vasogenic edema',
      'Mass effect on adjacent structures',
      'Enhancement pattern suggests high vascularity',
      'Restricted diffusion in core region',
      'Elevated choline/creatine ratio',
      'Increased cerebral blood volume',
      'Disrupted blood-brain barrier'
    ];

    return findings.slice(0, Math.floor(Math.random() * 4) + 2);
  };

  const generateRecommendations = (specialty: string) => {
    const recommendations = [
      'Consider stereotactic biopsy for tissue diagnosis',
      'Functional MRI to map eloquent cortex',
      'Intraoperative neuromonitoring recommended',
      'Multidisciplinary team consultation',
      'Consider neoadjuvant therapy',
      'Plan for awake craniotomy if near speech areas',
      'Postoperative imaging in 24-48 hours',
      'Genetic testing for targeted therapy'
    ];

    return recommendations.slice(0, Math.floor(Math.random() * 3) + 2);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getConsensusAnalysis = () => {
    if (results.length === 0) return null;

    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const riskCounts = results.reduce((acc, r) => {
      acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const consensusRisk = Object.entries(riskCounts).reduce((a, b) => 
      riskCounts[a[0]] > riskCounts[b[0]] ? a : b
    )[0];

    return {
      confidence: avgConfidence,
      consensusRisk,
      agreement: Math.max(...Object.values(riskCounts)) / results.length * 100
    };
  };

  const consensus = getConsensusAnalysis();

  return (
    <div className="space-y-6">
      {/* Multi-Modal Analysis Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Cpu className="h-6 w-6 mr-2 text-blue-600" />
                AI Multi-Modal Analysis Engine
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Advanced AI consensus analysis using multiple world-class models
              </p>
            </div>
            
            {!isAnalyzing && results.length === 0 && (
              <button
                onClick={startMultiModalAnalysis}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start AI Analysis
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fusion Mode Selection */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Fusion Mode</h4>
              <div className="space-y-2">
                {[
                  { id: 'ct-mri', label: 'CT + MRI Fusion', desc: 'Structural analysis' },
                  { id: 'pet-ct', label: 'PET + CT Fusion', desc: 'Metabolic mapping' },
                  { id: 'fmri-dti', label: 'fMRI + DTI Fusion', desc: 'Functional tracts' },
                  { id: 'all', label: 'All Modalities', desc: 'Complete fusion' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setFusionMode(mode.id as any)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      fusionMode === mode.id
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{mode.label}</div>
                    <div className="text-xs text-slate-500">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Selection */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">AI Models</h4>
              <div className="space-y-2">
                {aiModels.map(model => {
                  const Icon = model.icon;
                  return (
                    <label key={model.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedModels[model.id as keyof typeof selectedModels]}
                        onChange={(e) => setSelectedModels(prev => ({
                          ...prev,
                          [model.id]: e.target.checked
                        }))}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <Icon className={`h-4 w-4 ${model.color}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{model.name}</div>
                        <div className="text-xs text-slate-500">{model.specialty} • {model.accuracy}% accuracy</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Processing Status */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Analysis Status</h4>
              
              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Cpu className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-medium text-slate-900">Processing...</p>
                    <p className="text-xs text-slate-600">{currentModel}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Overall Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">Analysis Complete</p>
                    <p className="text-xs text-slate-600">{results.length} models analyzed</p>
                  </div>
                  
                  {consensus && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-slate-900 mb-2">AI Consensus</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-medium">{consensus.confidence.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className={`font-medium capitalize ${getRiskColor(consensus.consensusRisk).split(' ')[0]}`}>
                            {consensus.consensusRisk}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Agreement:</span>
                          <span className="font-medium">{consensus.agreement.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Ready to analyze</p>
                  <p className="text-xs text-slate-400">Select models and start analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              AI Analysis Results ({results.length})
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={result.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Brain className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{result.modelName}</h4>
                        <p className="text-sm text-slate-600">
                          {result.confidence.toFixed(1)}% confidence • {result.processingTime}ms
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(result.riskLevel)}`}>
                      {result.riskLevel} risk
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Diagnosis</h5>
                      <p className="text-sm text-slate-700">{result.diagnosis}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Key Findings</h5>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {result.findings.map((finding, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Recommendations</h5>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Consensus Analysis */}
      {consensus && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            AI Consensus Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">{consensus.confidence.toFixed(1)}%</div>
              <div className="text-sm text-blue-700">Average Confidence</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold capitalize ${getRiskColor(consensus.consensusRisk).split(' ')[0]}`}>
                {consensus.consensusRisk}
              </div>
              <div className="text-sm text-blue-700">Consensus Risk Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">{consensus.agreement.toFixed(0)}%</div>
              <div className="text-sm text-blue-700">Model Agreement</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Clinical Interpretation:</strong> {results.length} AI models have analyzed this case with 
              {consensus.agreement > 80 ? ' high' : consensus.agreement > 60 ? ' moderate' : ' low'} agreement. 
              The consensus indicates <strong>{consensus.consensusRisk} risk</strong> with an average confidence of 
              <strong> {consensus.confidence.toFixed(1)}%</strong>. 
              {consensus.agreement > 80 && ' This high agreement suggests reliable AI assessment.'}
              {consensus.agreement <= 60 && ' Consider additional imaging or expert consultation due to model disagreement.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMultiModalAnalysis;