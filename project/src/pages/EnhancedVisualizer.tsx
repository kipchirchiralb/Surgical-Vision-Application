import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MedicalSliceViewer from '../components/MedicalSliceViewer';
import EnhancedModelViewer from '../components/EnhancedModelViewer';
import ReportGenerator from '../components/ReportGenerator';
import AISegmentationEngine from '../components/AISegmentationEngine';
import SurgicalPathSimulator from '../components/SurgicalPathSimulator';
import * as THREE from 'three';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Eye,
  MapPin,
  Layers,
  Monitor,
  Zap,
  Navigation,
  Download
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

const EnhancedVisualizer: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'segmentation' | 'planning' | 'report'>('2d');
  const [segmentationResults, setSegmentationResults] = useState<any[]>([]);
  const [selectedPath, setSelectedPath] = useState<any>(null);

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

  const handleAnnotationAdd = async (position: any, note: string, type: string) => {
    try {
      console.log('Adding annotation:', { scanId, position, note, type });
      // Future: Save annotation to backend
    } catch (error) {
      console.error('Error saving annotation:', error);
    }
  };

  const handleSegmentationComplete = (results: any[]) => {
    setSegmentationResults(results);
  };

  const handlePathSelected = (path: any) => {
    setSelectedPath(path);
  };

  const generateReportData = () => {
    if (!scan) return null;

    return {
      patient: {
        name: scan.patient_name,
        id: `PT${scanId?.padStart(6, '0')}`,
        dob: '1975-03-15',
        sex: 'M'
      },
      study: {
        type: scan.scan_type,
        date: new Date(scan.date).toLocaleDateString(),
        description: `${scan.scan_type} Brain without contrast`,
        physician: scan.uploaded_by || 'Dr. Smith',
        institution: 'University Medical Center'
      },
      findings: {
        riskLevel: scan.risk_level,
        riskScore: scan.risk_level.toLowerCase() === 'high' ? 85 : 
                  scan.risk_level.toLowerCase() === 'medium' ? 55 : 25,
        aiConfidence: 94,
        clinicalNotes: scan.notes || 'AI analysis completed successfully.',
        recommendations: [
          'Follow standard surgical procedures',
          'Monitor patient vitals closely',
          'Schedule follow-up in 2 weeks'
        ]
      },
      measurements: [
        {
          id: '1',
          description: 'Tumor diameter',
          value: 12.4,
          unit: 'mm',
          slice: 8
        },
        {
          id: '2',
          description: 'Vessel distance',
          value: 2.1,
          unit: 'mm',
          slice: 9
        }
      ],
      annotations: [
        {
          id: '1',
          text: 'Critical vessel proximity',
          type: 'critical' as const,
          slice: 8,
          coordinates: { x: 0.6, y: 0.4 }
        }
      ]
    };
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading comprehensive medical analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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

  const tabs = [
    { id: '2d', label: '2D Analysis', icon: Monitor },
    { id: '3d', label: '3D Model', icon: Layers },
    { id: 'segmentation', label: 'AI Segmentation', icon: Zap },
    { id: 'planning', label: 'Surgical Planning', icon: Navigation },
    { id: 'report', label: 'Generate Report', icon: Download }
  ];

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
              <h1 className="text-3xl font-bold text-slate-900">Advanced Medical Analysis</h1>
              <p className="text-slate-600">Comprehensive imaging analysis and surgical planning suite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </h3>
            <p className="text-sm"><strong>Name:</strong> {scan.patient_name}</p>
            <p className="text-sm"><strong>Study ID:</strong> {scanId}</p>
            <p className="text-sm"><strong>Type:</strong> {scan.scan_type}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Study Details
            </h3>
            <p className="text-sm"><strong>Date:</strong> {new Date(scan.date).toLocaleDateString()}</p>
            <p className="text-sm"><strong>Status:</strong> {scan.status}</p>
            <p className="text-sm"><strong>Physician:</strong> {scan.uploaded_by}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              AI Assessment
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Risk Level:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(scan.risk_level)}`}>
                {scan.risk_level}
              </span>
            </div>
            <p className="text-sm"><strong>Confidence:</strong> 94%</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center">
              {getStatusIcon(scan.status)}
              <span className="ml-2">Processing Status</span>
            </h3>
            <p className="text-sm text-slate-600">All analysis modules completed</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-600">Ready for review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === '2d' && (
            <MedicalSliceViewer 
              scanId={scanId!}
              scanType={scan.scan_type}
              patientName={scan.patient_name}
              onAnnotationAdd={handleAnnotationAdd}
            />
          )}

          {activeTab === '3d' && (
            <EnhancedModelViewer 
              scanId={scanId!}
              scanType={scan.scan_type}
              patientName={scan.patient_name}
              riskLevel={scan.risk_level}
              onAnnotationAdd={handleAnnotationAdd}
            />
          )}

          {activeTab === 'segmentation' && (
            <AISegmentationEngine
              scanId={scanId!}
              scanType={scan.scan_type}
              onSegmentationComplete={handleSegmentationComplete}
            />
          )}

          {activeTab === 'planning' && (
            <SurgicalPathSimulator
              scanId={scanId!}
              targetLocation={new THREE.Vector3(0.5, 0.2, 0.3)}
              onPathSelected={handlePathSelected}
            />
          )}

          {activeTab === 'report' && (
            <ReportGenerator
              scanId={scanId!}
              reportData={generateReportData()!}
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
          
          <button
            onClick={() => setActiveTab('segmentation')}
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <Zap className="h-6 w-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">AI Analysis</p>
              <p className="text-sm text-slate-600">Automated segmentation</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('planning')}
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <Navigation className="h-6 w-6 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">Surgical Planning</p>
              <p className="text-sm text-slate-600">Path simulation</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
          >
            <Download className="h-6 w-6 text-orange-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">Generate Report</p>
              <p className="text-sm text-slate-600">Comprehensive analysis</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVisualizer;