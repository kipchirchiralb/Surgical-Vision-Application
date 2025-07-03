import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ModelViewer from '../components/ModelViewer';
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
  MapPin
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

const Visualizer: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // Future: Save annotation to backend
      console.log('Adding annotation:', { scanId, position, note, type });
      
      // For now, just log the annotation
      // In the future, this would POST to /api/annotations
    } catch (error) {
      console.error('Error saving annotation:', error);
    }
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
          <p className="text-slate-600">Loading scan data...</p>
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

  // Generate model URL based on scan ID
  const modelUrl = `/uploads/models/${scanId}.glb`;

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
              <h1 className="text-3xl font-bold text-slate-900">3D Medical Visualizer</h1>
              <p className="text-slate-600">Interactive 3D model viewer and annotation tool</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Information Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient & Scan Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Scan Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Patient Name</p>
                    <p className="font-semibold text-slate-900">{scan.patient_name}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Scan Type</p>
                    <p className="font-semibold text-slate-900">{scan.scan_type}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm text-slate-600">Scan Date</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(scan.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="mr-3">
                    {getStatusIcon(scan.status)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="font-semibold text-slate-900 capitalize">{scan.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {scan.uploaded_by && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">Uploaded by</p>
                <p className="font-medium text-slate-900">{scan.uploaded_by}</p>
              </div>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Risk Level:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(scan.risk_level)}`}>
                    {scan.risk_level} Risk
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">AI Confidence:</span>
                  <span className="text-sm font-semibold text-slate-900">94%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      scan.risk_level.toLowerCase() === 'high' ? 'bg-red-500' :
                      scan.risk_level.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${
                        scan.risk_level.toLowerCase() === 'high' ? 85 :
                        scan.risk_level.toLowerCase() === 'medium' ? 55 : 25
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {scan.notes && (
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Clinical Notes</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{scan.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3D Model Viewer */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">3D Medical Model</h2>
          <p className="text-slate-600">
            Interactive 3D visualization of the medical scan. Use mouse controls to rotate, zoom, and pan. 
            Enable annotation mode to add surgical notes directly on the model.
          </p>
        </div>

        <ModelViewer 
          modelUrl={modelUrl}
          scanId={scanId!}
          onAnnotationAdd={handleAnnotationAdd}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          3D Viewer Instructions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Navigation Controls</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Left click + drag to rotate model
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Right click + drag to pan view
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Mouse wheel to zoom in/out
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Reset button to return to default view
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Annotation Features</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                Toggle annotation mode to add notes
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                Click on model surface to place markers
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                Add surgical notes and warnings
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                View all annotations in the list below
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;