import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MedicalWorkstation from '../components/MedicalWorkstation';
import { 
  ArrowLeft, 
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  FileText,
  User,
  Calendar
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

const ProfessionalVisualizer: React.FC = () => {
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

  const handleMeasurement = (measurement: any) => {
    console.log('New measurement:', measurement);
    // Save measurement to backend
  };

  const handleAnnotation = (annotation: any) => {
    console.log('New annotation:', annotation);
    // Save annotation to backend
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="font-mono">Loading DICOM data...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Study Not Found</h2>
          <p className="mb-6">{error || 'The requested study could not be found.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Generate realistic patient data for medical workstation
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
    <div className="h-screen bg-black">
      {/* Medical Workstation Header */}
      <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 text-green-400 text-xs font-mono">
        <div className="flex items-center space-x-4">
          <span>SURGICAL VISION PACS v2.1.0</span>
          <span>|</span>
          <span>Study ID: {scanId}</span>
          <span>|</span>
          <span>Series: Axial T1</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{new Date().toLocaleString()}</span>
          <span>|</span>
          <span>User: {scan.uploaded_by}</span>
          <Link
            to="/dashboard"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Exit Viewer
          </Link>
        </div>
      </div>

      {/* Medical Workstation */}
      <MedicalWorkstation
        scanId={scanId!}
        patientData={patientData}
        onMeasurement={handleMeasurement}
        onAnnotation={handleAnnotation}
      />
    </div>
  );
};

export default ProfessionalVisualizer;