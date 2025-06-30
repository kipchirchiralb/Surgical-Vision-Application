import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Layers, 
  Target, 
  Navigation, 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Video,
  Crosshair,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Smartphone
} from 'lucide-react';

interface ARMarker {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'tumor' | 'vessel' | 'critical' | 'safe' | 'entry' | 'target';
  label: string;
  confidence: number;
  visible: boolean;
}

interface SurgicalPath {
  id: string;
  points: { x: number; y: number; z: number }[];
  riskLevel: 'low' | 'medium' | 'high';
  distance: number;
  active: boolean;
}

interface ARSurgicalGuidanceProps {
  scanId: string;
  patientData: any;
  onPathUpdate?: (path: SurgicalPath) => void;
  onMarkerAdd?: (marker: ARMarker) => void;
}

const ARSurgicalGuidance: React.FC<ARSurgicalGuidanceProps> = ({
  scanId,
  patientData,
  onPathUpdate,
  onMarkerAdd
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [arMarkers, setArMarkers] = useState<ARMarker[]>([]);
  const [surgicalPaths, setSurgicalPaths] = useState<SurgicalPath[]>([]);
  const [trackingQuality, setTrackingQuality] = useState(0);
  const [calibrationStatus, setCalibrationStatus] = useState<'pending' | 'calibrating' | 'calibrated' | 'failed'>('pending');
  const [arMode, setArMode] = useState<'overlay' | 'mixed' | 'holographic'>('overlay');
  const [showDepthMap, setShowDepthMap] = useState(false);
  const [instrumentTracking, setInstrumentTracking] = useState(false);

  useEffect(() => {
    initializeARMarkers();
    initializeSurgicalPaths();
  }, [scanId]);

  const initializeARMarkers = () => {
    const markers: ARMarker[] = [
      {
        id: 'tumor-1',
        position: { x: 0.2, y: 0.3, z: 0.5 },
        type: 'tumor',
        label: 'Primary Tumor (2.3cm)',
        confidence: 94,
        visible: true
      },
      {
        id: 'vessel-1',
        position: { x: 0.1, y: 0.4, z: 0.6 },
        type: 'vessel',
        label: 'Middle Cerebral Artery',
        confidence: 97,
        visible: true
      },
      {
        id: 'critical-1',
        position: { x: 0.25, y: 0.35, z: 0.55 },
        type: 'critical',
        label: 'Critical Zone - Motor Cortex',
        confidence: 91,
        visible: true
      },
      {
        id: 'entry-1',
        position: { x: 0.0, y: 0.8, z: 0.2 },
        type: 'entry',
        label: 'Optimal Entry Point',
        confidence: 89,
        visible: true
      },
      {
        id: 'target-1',
        position: { x: 0.2, y: 0.3, z: 0.5 },
        type: 'target',
        label: 'Surgical Target',
        confidence: 96,
        visible: true
      }
    ];

    setArMarkers(markers);
  };

  const initializeSurgicalPaths = () => {
    const paths: SurgicalPath[] = [
      {
        id: 'path-1',
        points: [
          { x: 0.0, y: 0.8, z: 0.2 },
          { x: 0.1, y: 0.6, z: 0.35 },
          { x: 0.15, y: 0.4, z: 0.45 },
          { x: 0.2, y: 0.3, z: 0.5 }
        ],
        riskLevel: 'low',
        distance: 45.2,
        active: true
      },
      {
        id: 'path-2',
        points: [
          { x: 0.3, y: 0.7, z: 0.1 },
          { x: 0.25, y: 0.5, z: 0.3 },
          { x: 0.22, y: 0.35, z: 0.45 },
          { x: 0.2, y: 0.3, z: 0.5 }
        ],
        riskLevel: 'medium',
        distance: 52.8,
        active: false
      }
    ];

    setSurgicalPaths(paths);
  };

  const startARSession = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Use back camera if available
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraStream(stream);
      setIsARActive(true);
      
      // Start calibration process
      startCalibration();
      
      // Start AR rendering loop
      startARRendering();

    } catch (error) {
      console.error('Error starting AR session:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopARSession = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    setIsARActive(false);
    setCalibrationStatus('pending');
    setTrackingQuality(0);
  };

  const startCalibration = () => {
    setCalibrationStatus('calibrating');
    
    // Simulate calibration process
    let progress = 0;
    const calibrationInterval = setInterval(() => {
      progress += 10;
      setTrackingQuality(progress);
      
      if (progress >= 100) {
        clearInterval(calibrationInterval);
        setCalibrationStatus('calibrated');
        setTrackingQuality(95 + Math.random() * 5); // Maintain high tracking quality
      }
    }, 200);
  };

  const startARRendering = () => {
    const renderLoop = () => {
      if (!isARActive || !canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw AR overlays
      drawARMarkers(ctx);
      drawSurgicalPaths(ctx);
      
      if (instrumentTracking) {
        drawInstrumentTracking(ctx);
      }

      if (showDepthMap) {
        drawDepthMap(ctx);
      }

      // Continue rendering loop
      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  const drawARMarkers = (ctx: CanvasRenderingContext2D) => {
    arMarkers.filter(marker => marker.visible).forEach(marker => {
      // Convert 3D position to 2D screen coordinates
      const screenPos = project3DTo2D(marker.position);
      
      // Draw marker based on type
      const colors = {
        tumor: '#ff4444',
        vessel: '#ff0000',
        critical: '#ff8800',
        safe: '#00ff00',
        entry: '#0088ff',
        target: '#ff00ff'
      };

      const color = colors[marker.type];
      
      // Draw marker circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw marker ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 15, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = 'white';
      ctx.fillRect(screenPos.x + 20, screenPos.y - 10, 150, 20);
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText(marker.label, screenPos.x + 25, screenPos.y + 5);
      
      // Draw confidence
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.fillText(`${marker.confidence}%`, screenPos.x + 25, screenPos.y + 15);
    });
  };

  const drawSurgicalPaths = (ctx: CanvasRenderingContext2D) => {
    surgicalPaths.filter(path => path.active).forEach(path => {
      const color = path.riskLevel === 'low' ? '#00ff00' : 
                   path.riskLevel === 'medium' ? '#ffaa00' : '#ff4444';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      path.points.forEach((point, index) => {
        const screenPos = project3DTo2D(point);
        if (index === 0) {
          ctx.moveTo(screenPos.x, screenPos.y);
        } else {
          ctx.lineTo(screenPos.x, screenPos.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  const drawInstrumentTracking = (ctx: CanvasRenderingContext2D) => {
    // Simulate instrument position
    const instrumentPos = { x: 400, y: 300 };
    
    // Draw instrument crosshair
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(instrumentPos.x - 20, instrumentPos.y);
    ctx.lineTo(instrumentPos.x + 20, instrumentPos.y);
    ctx.moveTo(instrumentPos.x, instrumentPos.y - 20);
    ctx.lineTo(instrumentPos.x, instrumentPos.y + 20);
    ctx.stroke();
    
    // Instrument label
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.fillRect(instrumentPos.x + 25, instrumentPos.y - 15, 100, 30);
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText('Surgical Tool', instrumentPos.x + 30, instrumentPos.y - 5);
    ctx.fillText('Depth: 12.5mm', instrumentPos.x + 30, instrumentPos.y + 10);
  };

  const drawDepthMap = (ctx: CanvasRenderingContext2D) => {
    // Create depth visualization overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)'); // Far (red)
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)'); // Medium (yellow)
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0.3)'); // Near (green)
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const project3DTo2D = (pos3D: { x: number; y: number; z: number }) => {
    // Simple projection - in real AR this would use camera calibration
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: (pos3D.x + 0.5) * canvas.width,
      y: (1 - (pos3D.y + 0.5)) * canvas.height
    };
  };

  const toggleMarkerVisibility = (markerId: string) => {
    setArMarkers(prev => prev.map(marker => 
      marker.id === markerId 
        ? { ...marker, visible: !marker.visible }
        : marker
    ));
  };

  const switchSurgicalPath = (pathId: string) => {
    setSurgicalPaths(prev => prev.map(path => ({
      ...path,
      active: path.id === pathId
    })));
  };

  const getCalibrationColor = () => {
    switch (calibrationStatus) {
      case 'calibrated': return 'text-green-600';
      case 'calibrating': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getTrackingQualityColor = () => {
    if (trackingQuality >= 80) return 'text-green-600';
    if (trackingQuality >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* AR Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-blue-600" />
                AR Surgical Guidance System
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Real-time augmented reality overlay for surgical navigation and guidance
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isARActive ? (
                <button
                  onClick={startARSession}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Start AR Session
                </button>
              ) : (
                <button
                  onClick={stopARSession}
                  className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Stop AR Session
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* AR Status */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">AR Status</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">Session:</span>
                  <div className="flex items-center">
                    {isARActive ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-slate-500">Inactive</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">Calibration:</span>
                  <span className={`text-sm font-medium capitalize ${getCalibrationColor()}`}>
                    {calibrationStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">Tracking:</span>
                  <span className={`text-sm font-medium ${getTrackingQualityColor()}`}>
                    {trackingQuality.toFixed(0)}%
                  </span>
                </div>

                {isARActive && trackingQuality > 0 && (
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Quality</span>
                      <span>{trackingQuality.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          trackingQuality >= 80 ? 'bg-green-500' :
                          trackingQuality >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${trackingQuality}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AR Settings */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">AR Settings</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    AR Mode
                  </label>
                  <select
                    value={arMode}
                    onChange={(e) => setArMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="overlay">Overlay Mode</option>
                    <option value="mixed">Mixed Reality</option>
                    <option value="holographic">Holographic</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showDepthMap}
                      onChange={(e) => setShowDepthMap(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Show Depth Map</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={instrumentTracking}
                      onChange={(e) => setInstrumentTracking(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Instrument Tracking</span>
                  </label>
                </div>
              </div>
            </div>

            {/* AR Markers */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">AR Markers</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {arMarkers.map(marker => (
                  <div key={marker.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: marker.type === 'tumor' ? '#ff4444' :
                                         marker.type === 'vessel' ? '#ff0000' :
                                         marker.type === 'critical' ? '#ff8800' :
                                         marker.type === 'safe' ? '#00ff00' :
                                         marker.type === 'entry' ? '#0088ff' : '#ff00ff'
                        }}
                      ></div>
                      <div>
                        <div className="text-xs font-medium text-slate-900">{marker.label}</div>
                        <div className="text-xs text-slate-500">{marker.confidence}%</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleMarkerVisibility(marker.id)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      {marker.visible ? (
                        <Eye className="h-3 w-3 text-slate-600" />
                      ) : (
                        <Eye className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Surgical Paths */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Surgical Paths</h4>
              
              <div className="space-y-2">
                {surgicalPaths.map(path => (
                  <button
                    key={path.id}
                    onClick={() => switchSurgicalPath(path.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      path.active
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Path {path.id.split('-')[1]}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        path.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                        path.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {path.riskLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {path.distance}mm • {path.points.length} waypoints
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AR Viewport */}
      {isARActive && (
        <div className="bg-black rounded-xl overflow-hidden border border-slate-200 relative">
          <div className="relative">
            {/* Camera feed */}
            <video
              ref={videoRef}
              className="w-full h-96 object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* AR overlay canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="absolute inset-0 w-full h-full"
            />
            
            {/* AR UI Overlays */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
              <div className="text-sm font-medium">AR Surgical Guidance</div>
              <div className="text-xs">Patient: {patientData?.name}</div>
            </div>
            
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg">
              <div className="text-xs">Tracking: {trackingQuality.toFixed(0)}%</div>
              <div className="text-xs">Mode: {arMode}</div>
            </div>
            
            {calibrationStatus === 'calibrating' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-900 font-medium">Calibrating AR System...</p>
                  <p className="text-sm text-slate-600">Please hold camera steady</p>
                </div>
              </div>
            )}
          </div>
          
          {/* AR Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <button className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors">
              <Target className="h-5 w-5 text-slate-700" />
            </button>
            <button className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors">
              <Crosshair className="h-5 w-5 text-slate-700" />
            </button>
            <button className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors">
              <MapPin className="h-5 w-5 text-slate-700" />
            </button>
            <button className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors">
              <Settings className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>
      )}

      {/* AR Instructions */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          <Monitor className="h-5 w-5 mr-2" />
          AR Surgical Guidance Instructions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Setup Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Camera with HD resolution (1080p+)
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Stable lighting conditions
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Calibrated surgical environment
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                AR-compatible display device
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-3">AR Features</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <Eye className="h-4 w-4 mr-2 text-blue-600" />
                Real-time anatomical overlays
              </li>
              <li className="flex items-center">
                <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                Surgical path visualization
              </li>
              <li className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                Instrument tracking and guidance
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-blue-600" />
                Real-time risk zone warnings
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARSurgicalGuidance;