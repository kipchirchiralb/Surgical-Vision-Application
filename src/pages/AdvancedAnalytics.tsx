import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AIMultiModalAnalysis from '../components/AIMultiModalAnalysis';
import VoiceControlInterface from '../components/VoiceControlInterface';
import ARSurgicalGuidance from '../components/ARSurgicalGuidance';
import DigitalTwinSimulator from '../components/DigitalTwinSimulator';
import { 
  ArrowLeft, 
  Brain, 
  Cpu, 
  Mic, 
  Eye, 
  Users, 
  Zap, 
  Target, 
  Activity,
  Settings,
  Monitor,
  Layers,
  Navigation,
  Database
} from 'lucide-react';

interface Scan {
  id: string;
  patient_name: string;
  scan_type: string;
  date: string;
  risk_level: string;
  status: string;
  notes?: string;
  uploaded_by?: string;
}

const AdvancedAnalytics: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<'ai-analysis' | 'voice-control' | 'ar-guidance' | 'digital-twin'>('ai-analysis');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    if (scanId) {
      fetchScanData(scanId);
    }
  }, [scanId]);

  const fetchScanData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scans/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setScan(data);
      } else {
        setError('Scan not found');
      }
    } catch (error) {
      console.error('Error fetching scan:', error);
      setError('Failed to load scan data');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCommand = (command: string, action: string) => {
    console.log('Voice command received:', command, action);
    
    // Handle voice commands
    switch (action) {
      case 'navigate_dashboard':
        window.location.href = '/dashboard';
        break;
      case 'start_ai_analysis':
        setActiveModule('ai-analysis');
        break;
      case 'show_ar_guidance':
        setActiveModule('ar-guidance');
        break;
      case 'open_digital_twin':
        setActiveModule('digital-twin');
        break;
      // Add more command handlers as needed
    }
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Not Found</h2>
        <p className="text-slate-600 mb-6">{error || 'The requested scan could not be found.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const modules = [
    { 
      id: 'ai-analysis', 
      label: 'AI Multi-Modal Analysis', 
      icon: Cpu,
      description: 'Advanced AI consensus analysis using multiple world-class models'
    },
    { 
      id: 'voice-control', 
      label: 'Voice Control Interface', 
      icon: Mic,
      description: 'Hands-free medical imaging control with natural language processing'
    },
    { 
      id: 'ar-guidance', 
      label: 'AR Surgical Guidance', 
      icon: Eye,
      description: 'Real-time augmented reality overlay for surgical navigation'
    },
    { 
      id: 'digital-twin', 
      label: 'Digital Twin Simulator', 
      icon: Users,
      description: 'Physics-based patient simulation for surgical planning and training'
    }
  ];

  const patientData = {
    name: scan.patient_name,
    id: `PT${scanId?.padStart(6, '0')}`,
    dob: '1975-03-15',
    sex: 'M',
    scanType: scan.scan_type,
    scanDate: new Date(scan.date).toLocaleDateString('en-US'),
    studyDescription: `${scan.scan_type} Brain without contrast`,
    seriesNumber: '3/7',
    institution: 'University Medical Center',
    physician: scan.uploaded_by || 'Dr. Smith'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="flex items-center px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics Suite</h1>
              <p className="text-slate-600">Next-generation medical imaging analysis and surgical planning</p>
            </div>
          </div>
        </div>

        {voiceEnabled && (
          <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Voice Control Active</span>
          </div>
        )}
      </div>

      {/* Patient Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Patient Information
            </h3>
            <p className="text-sm"><strong>Name:</strong> {scan.patient_name}</p>
            <p className="text-sm"><strong>Study ID:</strong> {scanId}</p>
            <p className="text-sm"><strong>Type:</strong> {scan.scan_type}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Study Details
            </h3>
            <p className="text-sm"><strong>Date:</strong> {new Date(scan.date).toLocaleDateString()}</p>
            <p className="text-sm"><strong>Status:</strong> {scan.status}</p>
            <p className="text-sm"><strong>Physician:</strong> {scan.uploaded_by}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Risk Assessment
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Risk Level:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                scan.risk_level.toLowerCase() === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                scan.risk_level.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                'bg-green-100 text-green-700 border border-green-200'
              }`}>
                {scan.risk_level}
              </span>
            </div>
            <p className="text-sm"><strong>AI Confidence:</strong> 94%</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Available Modules
            </h3>
            <p className="text-sm text-blue-800">
              {modules.length} advanced analysis modules ready
            </p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-blue-700">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id as any)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeModule === module.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {module.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Module Description */}
          <div className="mb-6">
            {modules.map(module => (
              activeModule === module.id && (
                <div key={module.id} className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2 flex items-center">
                    <module.icon className="h-5 w-5 mr-2 text-blue-600" />
                    {module.label}
                  </h3>
                  <p className="text-sm text-slate-600">{module.description}</p>
                </div>
              )
            ))}
          </div>

          {/* Module Content */}
          {activeModule === 'ai-analysis' && (
            <AIMultiModalAnalysis
              scanId={scanId!}
              scanTypes={[scan.scan_type]}
            />
          )}

          {activeModule === 'voice-control' && (
            <VoiceControlInterface
              onCommand={handleVoiceCommand}
              onVoiceToggle={handleVoiceToggle}
            />
          )}

          {activeModule === 'ar-guidance' && (
            <ARSurgicalGuidance
              scanId={scanId!}
              patientData={patientData}
            />
          )}

          {activeModule === 'digital-twin' && (
            <DigitalTwinSimulator
              patientId={scanId!}
              scanData={scan}
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to={`/medical-viewer/${scanId}`}
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <Monitor className="h-6 w-6 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">PACS Viewer</p>
              <p className="text-sm text-slate-600">Professional workstation</p>
            </div>
          </Link>
          
          <Link
            to={`/enhanced-viewer/${scanId}`}
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <Layers className="h-6 w-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">Enhanced Viewer</p>
              <p className="text-sm text-slate-600">Multi-modal analysis</p>
            </div>
          </Link>
          
          <button
            onClick={() => setActiveModule('ar-guidance')}
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <Eye className="h-6 w-6 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">AR Guidance</p>
              <p className="text-sm text-slate-600">Surgical navigation</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveModule('digital-twin')}
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
          >
            <Users className="h-6 w-6 text-orange-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">Digital Twin</p>
              <p className="text-sm text-slate-600">Patient simulation</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;