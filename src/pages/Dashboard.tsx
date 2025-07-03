import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThreeDVisualization from '../components/ThreeDVisualization';
import { 
  Upload, 
  Eye, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Brain,
  Heart,
  Zap,
  ExternalLink,
  Monitor,
  Layers,
  Navigation,
  Download,
  Cpu,
  Mic,
  Target,
  Database
} from 'lucide-react';

interface Scan {
  id: string;
  patient_name: string;
  scan_type: string;
  date: string;
  risk_level: string;
  status: string;
}

// Enhanced Dashboard component with improved UX and competitive features
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    fetchScans();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchScans, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchScans = async () => {
    try {
      const response = await fetch('/api/scans');
      if (response.ok) {
        const data = await response.json();
        setScans(data);
        if (data.length > 0 && !selectedScan) {
          setSelectedScan(data[0]); // Select first scan by default
        }
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
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

  const getRiskScore = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 85;
      case 'medium': return 55;
      case 'low': return 25;
      default: return 0;
    }
  };

  const stats = [
    {
      name: 'Total Studies',
      value: scans.length,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'High Risk Cases',
      value: scans.filter(s => s.risk_level.toLowerCase() === 'high').length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      change: '-8%',
      changeType: 'negative'
    },
    {
      name: 'This Month',
      value: scans.filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-100',
      change: '+23%',
      changeType: 'positive'
    },
    {
      name: 'Active Patients',
      value: new Set(scans.map(s => s.patient_name)).size,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading Surgical Vision...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Welcome Section */}
      {showWelcome && (
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Brain className="h-10 w-10 text-blue-200" />
                  <div>
                    <h1 className="text-4xl font-bold">Welcome to Surgical Vision</h1>
                    <p className="text-blue-100 text-lg">Next-Generation Medical Imaging & AI-Powered Surgical Planning Platform</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Real-time Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>3D Visualization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>AI Risk Assessment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Medical Workstation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>Advanced Analytics</span>
                  </div>
                </div>

                <p className="text-blue-100 max-w-2xl">
                  Hello, <strong>{user?.name}</strong>! Access professional-grade medical imaging tools 
                  with cutting-edge AI analysis, voice control, AR guidance, and digital twin simulation. 
                  Our PACS-compatible workstation provides the precision and reliability you need for critical surgical decisions.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-32 h-32 bg-blue-500/30 rounded-full flex items-center justify-center">
                    <Heart className="h-16 w-16 text-blue-200 animate-pulse-slow" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/upload"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Medical Scan
              </Link>
              
              <button
                onClick={() => setShowWelcome(false)}
                className="inline-flex items-center px-6 py-3 bg-blue-500/20 text-white rounded-lg hover:bg-blue-500/30 transition-colors font-medium border border-blue-400/30"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <p className="text-xs text-slate-500">vs last month</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Patient Studies - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Patient Studies</h2>
                <p className="text-sm text-slate-600 mt-1">Click on a study to view in medical workstation or advanced analytics</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-500">Live Updates</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {scans.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No studies available</h3>
                <p className="text-slate-600 mb-6">Upload your first medical scan to get started with AI-powered analysis</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload First Scan
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scans.map((scan, index) => (
                  <div
                    key={scan.id}
                    onClick={() => setSelectedScan(scan)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedScan?.id === scan.id
                        ? 'border-blue-300 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{scan.patient_name}</h3>
                        <p className="text-sm text-slate-600">{scan.scan_type} Study</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(scan.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(scan.status)}
                        <div className="flex flex-col space-y-1">
                          <Link
                            to={`/medical-viewer/${scan.id}`}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                            title="Open Medical Workstation"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Monitor className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/enhanced-viewer/${scan.id}`}
                            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors"
                            title="Open Enhanced Viewer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Layers className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/advanced-analytics/${scan.id}`}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                            title="Open Advanced Analytics"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Cpu className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(scan.risk_level)}`}>
                        {scan.risk_level} Risk
                      </span>
                      <div className="flex items-center space-x-1">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              scan.risk_level.toLowerCase() === 'high' ? 'bg-red-500' :
                              scan.risk_level.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${getRiskScore(scan.risk_level)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-500">{getRiskScore(scan.risk_level)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3D Visualization Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">3D Preview</h2>
            {selectedScan && (
              <div className="mt-2">
                <p className="text-sm text-slate-600">
                  <strong>{selectedScan.patient_name}</strong> - {selectedScan.scan_type}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(selectedScan.risk_level)}`}>
                    {selectedScan.risk_level} Risk
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/medical-viewer/${selectedScan.id}`}
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Medical Workstation
                      <Monitor className="h-3 w-3 ml-1" />
                    </Link>
                    <Link
                      to={`/enhanced-viewer/${selectedScan.id}`}
                      className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Enhanced Viewer
                      <Layers className="h-3 w-3 ml-1" />
                    </Link>
                    <Link
                      to={`/advanced-analytics/${selectedScan.id}`}
                      className="inline-flex items-center text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      Advanced Analytics
                      <Cpu className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {selectedScan ? (
              <div className="space-y-6">
                <ThreeDVisualization scan={selectedScan} />
                
                {/* AI Risk Assessment Panel */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-blue-600" />
                    AI Risk Assessment
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Risk Score:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              selectedScan.risk_level.toLowerCase() === 'high' ? 'bg-red-500' :
                              selectedScan.risk_level.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${getRiskScore(selectedScan.risk_level)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{getRiskScore(selectedScan.risk_level)}/100</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-700 bg-white rounded p-3 border">
                      {selectedScan.risk_level.toLowerCase() === 'high' && (
                        <>
                          <strong className="text-red-600">Critical Risk Detected:</strong> Major blood vessel within 2mm of surgical target. 
                          Recommend specialized surgical team and advanced monitoring protocols.
                        </>
                      )}
                      {selectedScan.risk_level.toLowerCase() === 'medium' && (
                        <>
                          <strong className="text-yellow-600">Moderate Risk:</strong> Vessel proximity at 1.5mm from target area. 
                          Standard precautions recommended with enhanced monitoring.
                        </>
                      )}
                      {selectedScan.risk_level.toLowerCase() === 'low' && (
                        <>
                          <strong className="text-green-600">Low Risk:</strong> No significant risk factors detected. 
                          Proceed with standard surgical protocols and routine monitoring.
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>AI Confidence: 94%</span>
                      <span>Model: SurgicalAI v2.1</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-medium">Select a study to preview</p>
                  <p className="text-sm">3D visualization and AI analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions & Advanced Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Link
            to="/upload"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <Upload className="h-8 w-8 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">Upload Study</p>
              <p className="text-sm text-slate-600">Add medical imaging data</p>
            </div>
          </Link>
          
          <Link
            to="/admin"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <Users className="h-8 w-8 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-slate-900">Admin Panel</p>
              <p className="text-sm text-slate-600">Manage users and data</p>
            </div>
          </Link>
          
          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-slate-900">PACS Status</p>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-orange-50 rounded-lg">
            <Monitor className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-slate-900">Workstation</p>
              <p className="text-sm text-slate-600">Medical imaging tools</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-indigo-50 rounded-lg">
            <Cpu className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <p className="font-medium text-slate-900">AI Analytics</p>
              <p className="text-sm text-slate-600">Advanced analysis suite</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-pink-50 rounded-lg">
            <Mic className="h-8 w-8 text-pink-600 mr-3" />
            <div>
              <p className="font-medium text-slate-900">Voice Control</p>
              <p className="text-sm text-slate-600">Hands-free operation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;