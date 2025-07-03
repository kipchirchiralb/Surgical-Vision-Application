import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Calendar,
  User,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Ruler,
  Eye,
  Activity
} from 'lucide-react';

interface ReportData {
  patient: {
    name: string;
    id: string;
    dob: string;
    sex: string;
  };
  study: {
    type: string;
    date: string;
    description: string;
    physician: string;
    institution: string;
  };
  findings: {
    riskLevel: string;
    riskScore: number;
    aiConfidence: number;
    clinicalNotes: string;
    recommendations: string[];
  };
  measurements: Array<{
    id: string;
    description: string;
    value: number;
    unit: string;
    slice: number;
  }>;
  annotations: Array<{
    id: string;
    text: string;
    type: 'info' | 'warning' | 'critical';
    slice: number;
    coordinates: { x: number; y: number; z?: number };
  }>;
}

interface ReportGeneratorProps {
  scanId: string;
  reportData: ReportData;
  onGenerate?: (format: 'pdf' | 'html' | 'dicom') => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  scanId,
  reportData,
  onGenerate
}) => {
  const [selectedSections, setSelectedSections] = useState({
    patientInfo: true,
    studyDetails: true,
    aiAnalysis: true,
    measurements: true,
    annotations: true,
    recommendations: true,
    images: true,
    signature: true
  });
  
  const [reportFormat, setReportFormat] = useState<'pdf' | 'html' | 'dicom'>('pdf');
  const [includeImages, setIncludeImages] = useState(true);
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low'>('high');

  const generateReport = () => {
    if (onGenerate) {
      onGenerate(reportFormat);
    }
    
    // Generate the actual report
    const reportContent = createReportContent();
    
    if (reportFormat === 'pdf') {
      generatePDFReport(reportContent);
    } else if (reportFormat === 'html') {
      generateHTMLReport(reportContent);
    } else {
      generateDICOMReport(reportContent);
    }
  };

  const createReportContent = () => {
    return {
      header: {
        title: 'SURGICAL VISION - MEDICAL IMAGING REPORT',
        reportId: `RPT-${scanId}-${Date.now()}`,
        generatedDate: new Date().toISOString(),
        generatedBy: reportData.study.physician
      },
      sections: selectedSections,
      data: reportData,
      metadata: {
        softwareVersion: 'Surgical Vision v2.1.0',
        aiModelVersion: 'SurgicalAI v2.1.0',
        processingTime: '2.3 seconds',
        qualityScore: 'A+'
      }
    };
  };

  const generatePDFReport = (content: any) => {
    // In a real implementation, this would use a PDF library like jsPDF or PDFKit
    console.log('Generating PDF report:', content);
    
    // Simulate PDF generation
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surgical-vision-report-${scanId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateHTMLReport = (content: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surgical Vision Medical Report</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .risk-high { color: #dc2626; font-weight: bold; }
            .risk-medium { color: #d97706; font-weight: bold; }
            .risk-low { color: #059669; font-weight: bold; }
            .measurements-table { width: 100%; border-collapse: collapse; }
            .measurements-table th, .measurements-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SURGICAL VISION</h1>
            <h2>Medical Imaging Analysis Report</h2>
            <p>Report ID: ${content.header.reportId}</p>
            <p>Generated: ${new Date(content.header.generatedDate).toLocaleString()}</p>
          </div>
          
          ${selectedSections.patientInfo ? `
          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="patient-info">
              <div>
                <strong>Name:</strong> ${reportData.patient.name}<br>
                <strong>Patient ID:</strong> ${reportData.patient.id}<br>
                <strong>Date of Birth:</strong> ${reportData.patient.dob}<br>
                <strong>Sex:</strong> ${reportData.patient.sex}
              </div>
              <div>
                <strong>Study Type:</strong> ${reportData.study.type}<br>
                <strong>Study Date:</strong> ${reportData.study.date}<br>
                <strong>Physician:</strong> ${reportData.study.physician}<br>
                <strong>Institution:</strong> ${reportData.study.institution}
              </div>
            </div>
          </div>
          ` : ''}
          
          ${selectedSections.aiAnalysis ? `
          <div class="section">
            <div class="section-title">AI Risk Assessment</div>
            <p><strong>Risk Level:</strong> <span class="risk-${reportData.findings.riskLevel.toLowerCase()}">${reportData.findings.riskLevel.toUpperCase()}</span></p>
            <p><strong>Risk Score:</strong> ${reportData.findings.riskScore}/100</p>
            <p><strong>AI Confidence:</strong> ${reportData.findings.aiConfidence}%</p>
            <p><strong>Clinical Notes:</strong> ${reportData.findings.clinicalNotes}</p>
          </div>
          ` : ''}
          
          ${selectedSections.recommendations ? `
          <div class="section">
            <div class="section-title">Recommendations</div>
            <ul>
              ${reportData.findings.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${selectedSections.measurements && reportData.measurements.length > 0 ? `
          <div class="section">
            <div class="section-title">Measurements</div>
            <table class="measurements-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Slice</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.measurements.map(m => `
                  <tr>
                    <td>${m.description}</td>
                    <td>${m.value}</td>
                    <td>${m.unit}</td>
                    <td>${m.slice}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated by ${content.metadata.softwareVersion} | AI Model: ${content.metadata.aiModelVersion}</p>
            <p>This report was generated automatically and should be reviewed by a qualified medical professional.</p>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surgical-vision-report-${scanId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateDICOMReport = (content: any) => {
    // DICOM Structured Report generation would go here
    console.log('Generating DICOM SR:', content);
    alert('DICOM Structured Report generation requires specialized libraries. HTML/PDF reports are available.');
  };

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Medical Imaging Report
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Comprehensive analysis report for {reportData.patient.name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">Report ID:</span>
              <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                RPT-{scanId}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Report Content Preview */}
          <div className="space-y-6">
            {/* Patient Information */}
            {selectedSections.patientInfo && (
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Patient Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {reportData.patient.name}</p>
                    <p><strong>Patient ID:</strong> {reportData.patient.id}</p>
                    <p><strong>Date of Birth:</strong> {reportData.patient.dob}</p>
                    <p><strong>Sex:</strong> {reportData.patient.sex}</p>
                  </div>
                  <div>
                    <p><strong>Study Type:</strong> {reportData.study.type}</p>
                    <p><strong>Study Date:</strong> {reportData.study.date}</p>
                    <p><strong>Physician:</strong> {reportData.study.physician}</p>
                    <p><strong>Institution:</strong> {reportData.study.institution}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {selectedSections.aiAnalysis && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Risk Assessment
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Risk Level:</span>
                    <span className={`font-semibold ${getRiskColor(reportData.findings.riskLevel)}`}>
                      {reportData.findings.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risk Score:</span>
                    <span className="font-semibold">{reportData.findings.riskScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Confidence:</span>
                    <span className="font-semibold">{reportData.findings.aiConfidence}%</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-700">{reportData.findings.clinicalNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Measurements */}
            {selectedSections.measurements && reportData.measurements.length > 0 && (
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Ruler className="h-4 w-4 mr-2" />
                  Measurements ({reportData.measurements.length})
                </h4>
                <div className="space-y-2">
                  {reportData.measurements.slice(0, 3).map((measurement, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                      <span>{measurement.description}</span>
                      <span className="font-mono">{measurement.value} {measurement.unit}</span>
                    </div>
                  ))}
                  {reportData.measurements.length > 3 && (
                    <p className="text-xs text-slate-500">
                      + {reportData.measurements.length - 3} more measurements
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Annotations */}
            {selectedSections.annotations && reportData.annotations.length > 0 && (
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Surgical Annotations ({reportData.annotations.length})
                </h4>
                <div className="space-y-2">
                  {reportData.annotations.slice(0, 3).map((annotation, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm bg-slate-50 p-2 rounded">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        annotation.type === 'critical' ? 'bg-red-500' :
                        annotation.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p>{annotation.text}</p>
                        <p className="text-xs text-slate-500">Slice {annotation.slice}</p>
                      </div>
                    </div>
                  ))}
                  {reportData.annotations.length > 3 && (
                    <p className="text-xs text-slate-500">
                      + {reportData.annotations.length - 3} more annotations
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {selectedSections.recommendations && (
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Clinical Recommendations
                </h4>
                <ul className="space-y-1 text-sm">
                  {reportData.findings.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-600 mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Report Configuration</h3>
          <p className="text-sm text-slate-600 mt-1">Customize report content and format</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section Selection */}
            <div>
              <h4 className="font-medium text-slate-900 mb-4">Include Sections</h4>
              <div className="space-y-3">
                {Object.entries(selectedSections).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleSection(key as keyof typeof selectedSections)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Options */}
            <div>
              <h4 className="font-medium text-slate-900 mb-4">Export Options</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Format
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="html">HTML Report</option>
                    <option value="dicom">DICOM Structured Report</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Include medical images</span>
                  </label>
                </div>

                {includeImages && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Image Quality
                    </label>
                    <select
                      value={imageQuality}
                      onChange={(e) => setImageQuality(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="high">High (300 DPI)</option>
                      <option value="medium">Medium (150 DPI)</option>
                      <option value="low">Low (72 DPI)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-slate-900">Ready to Generate Report</h4>
            <p className="text-sm text-slate-600">
              Report will include {Object.values(selectedSections).filter(Boolean).length} sections
              in {reportFormat.toUpperCase()} format
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generateReport}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="h-5 w-5 mr-2" />
              Generate Report
            </button>
            
            <button className="flex items-center px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
              <Printer className="h-5 w-5 mr-2" />
              Print
            </button>
            
            <button className="flex items-center px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;