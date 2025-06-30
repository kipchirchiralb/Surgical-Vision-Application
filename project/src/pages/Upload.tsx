import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileImage, AlertCircle, CheckCircle, Loader, Brain, Zap } from 'lucide-react';

interface UploadResult {
  success: boolean;
  message: string;
  scanId?: string;
  riskAssessment?: {
    level: string;
    details: string;
    confidence: number;
    factors: string[];
    recommendations: string[];
  };
}

// Enhanced Upload component with improved UX and error handling
const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [patientName, setPatientName] = useState('');
  const [scanType, setScanType] = useState('CT');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const isDicom = selectedFile.name.toLowerCase().endsWith('.dcm');
      
      if (!validTypes.includes(selectedFile.type) && !isDicom) {
        alert('Please select a valid medical image file (JPEG, PNG, GIF, or DICOM)');
        return;
      }
      
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file || !patientName.trim()) {
      alert('Please select a file and enter patient name');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      console.log('Starting upload process...');
      
      const formData = new FormData();
      formData.append('scan', file);
      formData.append('patientName', patientName.trim());
      formData.append('scanType', scanType);

      console.log('Sending request to /api/scans...');

      const response = await fetch('/api/scans', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        setResult({
          success: true,
          message: 'Scan uploaded and analyzed successfully!',
          scanId: data.scanId,
          riskAssessment: data.riskAssessment
        });
        
        // Reset form
        setFile(null);
        setPatientName('');
        setScanType('CT');
        
        // Clear file input
        const fileInput = document.getElementById('scan-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Upload Medical Scan</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload patient scans for AI-powered analysis and 3D visualization. 
          Our advanced algorithms provide instant risk assessment and surgical planning insights.
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-8">
          <form onSubmit={handleUpload} className="space-y-8">
            {/* Patient Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                Patient Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="patient-name" className="block text-sm font-medium text-slate-700 mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    id="patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter patient full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="scan-type" className="block text-sm font-medium text-slate-700 mb-2">
                    Scan Type *
                  </label>
                  <select
                    id="scan-type"
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="CT">CT Scan</option>
                    <option value="MRI">MRI Scan</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="PET">PET Scan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                Medical Image File
              </h3>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors bg-slate-50">
                <input
                  type="file"
                  id="scan-file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.dcm,.dicom"
                  className="hidden"
                  required
                />
                <label
                  htmlFor="scan-file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {file ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <FileImage className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900 mb-1">{file.name}</p>
                      <p className="text-sm text-slate-600 mb-2">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-green-600 font-medium">✓ File ready for upload</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <UploadIcon className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900 mb-1">
                        Click to upload medical scan
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        or drag and drop your file here
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                        <span>JPEG, PNG, GIF, DICOM</span>
                        <span>•</span>
                        <span>Up to 50MB</span>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Button */}
            <div className="pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={uploading || !file || !patientName.trim()}
                className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-3" />
                    Processing Scan & Running AI Analysis...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-3" />
                    Upload and Analyze with AI
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Upload Result */}
      {result && (
        <div className={`rounded-xl border p-6 ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 mr-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-4 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold text-lg mb-2 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              
              {result.success && result.riskAssessment && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 border border-green-200">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-blue-600" />
                      AI Risk Assessment Results
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-600">Risk Level:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                            getRiskColor(result.riskAssessment.level)
                          }`}>
                            {result.riskAssessment.level} Risk
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-600">AI Confidence:</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {result.riskAssessment.confidence}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {result.riskAssessment.details}
                        </p>
                      </div>
                    </div>

                    {result.riskAssessment.factors && result.riskAssessment.factors.length > 0 && (
                      <div className="mt-6">
                        <h5 className="font-medium text-slate-900 mb-3">Risk Factors Identified:</h5>
                        <ul className="space-y-2">
                          {result.riskAssessment.factors.map((factor, index) => (
                            <li key={index} className="flex items-start">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span className="text-sm text-slate-700">{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.riskAssessment.recommendations && result.riskAssessment.recommendations.length > 0 && (
                      <div className="mt-6">
                        <h5 className="font-medium text-slate-900 mb-3">Recommendations:</h5>
                        <ul className="space-y-2">
                          {result.riskAssessment.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                              <span className="text-sm text-slate-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      View in Dashboard
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                    >
                      Upload Another Scan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">!</div>
          Upload Guidelines & AI Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Supported Formats</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                JPEG, PNG, GIF images
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                DICOM medical files (.dcm)
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Maximum file size: 50MB
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                High-resolution preferred
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-3">AI Analysis Features</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Instant risk assessment
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Vessel proximity detection
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                3D model generation
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Surgical recommendations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;