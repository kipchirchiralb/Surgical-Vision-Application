import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Zap, 
  Eye, 
  EyeOff, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Activity,
  Target
} from 'lucide-react';

interface SegmentationResult {
  id: string;
  name: string;
  type: 'brain' | 'skull' | 'vessels' | 'ventricles' | 'tumor' | 'lesion';
  confidence: number;
  volume: number;
  color: string;
  visible: boolean;
  slices: number[];
}

interface AISegmentationEngineProps {
  scanId: string;
  scanType: string;
  onSegmentationComplete?: (results: SegmentationResult[]) => void;
  onProgress?: (progress: number) => void;
}

const AISegmentationEngine: React.FC<AISegmentationEngineProps> = ({
  scanId,
  scanType,
  onSegmentationComplete,
  onProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices] = useState(24);
  const [segmentationResults, setSegmentationResults] = useState<SegmentationResult[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'deeplab' | 'unet' | 'fcn'>('deeplab');
  const [processingMode, setProcessingMode] = useState<'automatic' | 'manual' | 'hybrid'>('automatic');
  const [qualityLevel, setQualityLevel] = useState<'fast' | 'balanced' | 'precise'>('balanced');

  useEffect(() => {
    drawSegmentationPreview();
  }, [currentSlice, segmentationResults]);

  const startSegmentation = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate AI segmentation process
    const steps = [
      { name: 'Preprocessing', duration: 1000 },
      { name: 'Brain extraction', duration: 2000 },
      { name: 'Tissue segmentation', duration: 3000 },
      { name: 'Vessel detection', duration: 2500 },
      { name: 'Ventricle mapping', duration: 1500 },
      { name: 'Anomaly detection', duration: 2000 },
      { name: 'Post-processing', duration: 1000 }
    ];

    let totalProgress = 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    for (const step of steps) {
      await new Promise(resolve => {
        const interval = setInterval(() => {
          totalProgress += (step.duration / totalDuration) * (100 / 10);
          setProgress(Math.min(totalProgress, 100));
          
          if (onProgress) {
            onProgress(Math.min(totalProgress, 100));
          }
          
          if (totalProgress >= (steps.indexOf(step) + 1) * (100 / steps.length)) {
            clearInterval(interval);
            resolve(void 0);
          }
        }, step.duration / 10);
      });
    }

    // Generate segmentation results
    const results = generateSegmentationResults();
    setSegmentationResults(results);
    setIsProcessing(false);
    
    if (onSegmentationComplete) {
      onSegmentationComplete(results);
    }
  };

  const generateSegmentationResults = (): SegmentationResult[] => {
    const baseResults = [
      {
        id: 'brain-tissue',
        name: 'Brain Tissue',
        type: 'brain' as const,
        confidence: 0.96,
        volume: 1350.5,
        color: '#d4a574',
        visible: true,
        slices: Array.from({ length: 20 }, (_, i) => i + 2)
      },
      {
        id: 'skull-bone',
        name: 'Skull Bone',
        type: 'skull' as const,
        confidence: 0.98,
        volume: 890.2,
        color: '#f0f0f0',
        visible: true,
        slices: Array.from({ length: 24 }, (_, i) => i)
      },
      {
        id: 'cerebral-vessels',
        name: 'Cerebral Vessels',
        type: 'vessels' as const,
        confidence: 0.89,
        volume: 45.8,
        color: '#ff2222',
        visible: true,
        slices: Array.from({ length: 18 }, (_, i) => i + 3)
      },
      {
        id: 'ventricular-system',
        name: 'Ventricular System',
        type: 'ventricles' as const,
        confidence: 0.94,
        volume: 28.3,
        color: '#3b82f6',
        visible: true,
        slices: Array.from({ length: 12 }, (_, i) => i + 6)
      }
    ];

    // Add pathology if high risk
    if (scanType.toLowerCase().includes('tumor') || Math.random() > 0.7) {
      baseResults.push({
        id: 'abnormal-tissue',
        name: 'Abnormal Tissue',
        type: 'tumor' as const,
        confidence: 0.87,
        volume: 12.4,
        color: '#00ff00',
        visible: true,
        slices: [8, 9, 10, 11, 12]
      });
    }

    return baseResults;
  };

  const drawSegmentationPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 120;

    // Draw base brain slice
    drawBrainSlice(ctx, centerX, centerY, baseRadius);
    
    // Draw segmentation overlays
    segmentationResults.forEach(result => {
      if (result.visible && result.slices.includes(currentSlice)) {
        drawSegmentationOverlay(ctx, centerX, centerY, baseRadius, result);
      }
    });

    // Draw slice info
    drawSliceInfo(ctx);
  };

  const drawBrainSlice = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    // Brain outline
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.9, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Gray matter
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.85, radius * 0.75, 0, 0, 2 * Math.PI);
    ctx.fill();

    // White matter
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.7, radius * 0.6, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawSegmentationOverlay = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    radius: number, 
    result: SegmentationResult
  ) => {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = result.color;
    ctx.strokeStyle = result.color;
    ctx.lineWidth = 2;

    switch (result.type) {
      case 'brain':
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.85, radius * 0.75, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      
      case 'skull':
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 1.2, radius * 1.1, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      
      case 'vessels':
        // Draw vessel network
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radius * 0.8;
          const y = centerY + Math.sin(angle) * radius * 0.7;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        break;
      
      case 'ventricles':
        // Lateral ventricles
        ctx.beginPath();
        ctx.ellipse(centerX - 25, centerY - 10, 20, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(centerX + 25, centerY - 10, 20, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
        break;
      
      case 'tumor':
      case 'lesion':
        ctx.beginPath();
        ctx.ellipse(centerX + 30, centerY + 20, 15, 10, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.globalAlpha = 1.0;
  };

  const drawSliceInfo = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    ctx.fillText(`Slice: ${currentSlice + 1}/${totalSlices}`, 10, 20);
    ctx.fillText(`Algorithm: ${selectedAlgorithm.toUpperCase()}`, 10, 35);
    ctx.fillText(`Mode: ${processingMode}`, 10, 50);
  };

  const toggleSegmentationVisibility = (id: string) => {
    setSegmentationResults(prev => 
      prev.map(result => 
        result.id === id 
          ? { ...result, visible: !result.visible }
          : result
      )
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProcessingIcon = () => {
    if (isProcessing) return <Cpu className="h-5 w-5 animate-pulse text-blue-600" />;
    if (segmentationResults.length > 0) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <Brain className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* AI Segmentation Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getProcessingIcon()}
              <div className="ml-3">
                <h3 className="text-xl font-semibold text-slate-900">AI Segmentation Engine</h3>
                <p className="text-sm text-slate-600">
                  Automated anatomical structure identification and segmentation
                </p>
              </div>
            </div>
            
            {!isProcessing && segmentationResults.length === 0 && (
              <button
                onClick={startSegmentation}
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
            {/* Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Configuration</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AI Algorithm
                </label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value as any)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="deeplab">DeepLab v3+ (Recommended)</option>
                  <option value="unet">U-Net Medical</option>
                  <option value="fcn">FCN-8s</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Processing Mode
                </label>
                <select
                  value={processingMode}
                  onChange={(e) => setProcessingMode(e.target.value as any)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="automatic">Automatic (Full AI)</option>
                  <option value="manual">Manual Correction</option>
                  <option value="hybrid">Hybrid (AI + Manual)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quality Level
                </label>
                <select
                  value={qualityLevel}
                  onChange={(e) => setQualityLevel(e.target.value as any)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="fast">Fast (2-3 min)</option>
                  <option value="balanced">Balanced (5-7 min)</option>
                  <option value="precise">Precise (10-15 min)</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Segmentation Preview</h4>
              
              <div className="relative bg-black rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="w-full h-64"
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Cpu className="h-8 w-8 animate-pulse mx-auto mb-2" />
                      <p className="text-sm">Processing...</p>
                      <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1">{Math.round(progress)}%</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
                  disabled={currentSlice === 0}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Slice {currentSlice + 1} / {totalSlices}
                </span>
                <button
                  onClick={() => setCurrentSlice(Math.min(totalSlices - 1, currentSlice + 1))}
                  disabled={currentSlice === totalSlices - 1}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Progress & Status */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Processing Status</h4>
              
              {isProcessing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Overall Progress</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-blue-600">
                      <Activity className="h-4 w-4 mr-2 animate-pulse" />
                      AI analysis in progress...
                    </div>
                    <div className="text-slate-600">
                      Estimated time: {qualityLevel === 'fast' ? '2-3' : qualityLevel === 'balanced' ? '5-7' : '10-15'} minutes
                    </div>
                  </div>
                </div>
              ) : segmentationResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Segmentation complete
                  </div>
                  <div className="text-sm text-slate-600">
                    {segmentationResults.length} structures identified
                  </div>
                  <div className="text-sm text-slate-600">
                    Average confidence: {Math.round(segmentationResults.reduce((sum, r) => sum + r.confidence, 0) / segmentationResults.length * 100)}%
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center text-slate-400">
                    <Clock className="h-4 w-4 mr-2" />
                    Ready to start
                  </div>
                  <div className="text-sm text-slate-600">
                    Click "Start AI Analysis" to begin automated segmentation
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Segmentation Results */}
      {segmentationResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Segmentation Results ({segmentationResults.length})
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {segmentationResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleSegmentationVisibility(result.id)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      {result.visible ? (
                        <Eye className="h-4 w-4 text-slate-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: result.color }}
                    ></div>
                    
                    <div>
                      <p className="font-medium text-slate-900">{result.name}</p>
                      <p className="text-sm text-slate-600">
                        Volume: {result.volume} cm³ • Slices: {result.slices.length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                      {Math.round(result.confidence * 100)}% confidence
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {result.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISegmentationEngine;