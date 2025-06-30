import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Info
} from 'lucide-react';

interface MedicalSliceViewerProps {
  scanId: string;
  scanType: string;
  patientName: string;
  onAnnotationAdd?: (slice: number, x: number, y: number, note: string) => void;
}

// Medical slice viewer for 2D DICOM-style visualization
const MedicalSliceViewer: React.FC<MedicalSliceViewerProps> = ({
  scanId,
  scanType,
  patientName,
  onAnnotationAdd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices] = useState(12); // Simulating 12 axial slices
  const [zoom, setZoom] = useState(1);
  const [annotations, setAnnotations] = useState<Array<{
    slice: number;
    x: number;
    y: number;
    note: string;
    type: 'info' | 'warning' | 'critical';
  }>>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [overlays, setOverlays] = useState({
    ventricles: true,
    vessels: true,
    contours: true
  });

  useEffect(() => {
    drawSlice();
  }, [currentSlice, zoom, showAnnotations, overlays]);

  const drawSlice = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw brain slice simulation
    drawBrainSlice(ctx, currentSlice);
    
    // Draw overlays
    if (overlays.ventricles) drawVentricles(ctx, currentSlice);
    if (overlays.vessels) drawVessels(ctx, currentSlice);
    if (overlays.contours) drawContours(ctx, currentSlice);
    
    // Draw annotations
    if (showAnnotations) drawAnnotations(ctx);
  };

  const drawBrainSlice = (ctx: CanvasRenderingContext2D, slice: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const baseRadius = 120 * zoom;
    
    // Brain outline (varies by slice)
    const radiusVariation = Math.sin((slice / totalSlices) * Math.PI) * 0.3 + 0.7;
    const radius = baseRadius * radiusVariation;
    
    // Brain tissue
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

  const drawVentricles = (ctx: CanvasRenderingContext2D, slice: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const baseSize = 30 * zoom;
    
    // Ventricular system (blue outline like in your image)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    
    // Lateral ventricles (varies by slice level)
    if (slice >= 3 && slice <= 9) {
      const ventricleSize = baseSize * (1 - Math.abs(slice - 6) / 6);
      
      // Left lateral ventricle
      ctx.beginPath();
      ctx.ellipse(centerX - 25 * zoom, centerY - 10 * zoom, ventricleSize * 0.6, ventricleSize * 0.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Right lateral ventricle
      ctx.beginPath();
      ctx.ellipse(centerX + 25 * zoom, centerY - 10 * zoom, ventricleSize * 0.6, ventricleSize * 0.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    // Third ventricle (midline)
    if (slice >= 4 && slice <= 8) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, baseSize * 0.3, baseSize * 0.8, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawVessels = (ctx: CanvasRenderingContext2D, slice: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    
    // Major vessels (simplified)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 80 * zoom;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const drawContours = (ctx: CanvasRenderingContext2D, slice: number) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Anatomical contours
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 140 * zoom, 130 * zoom, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    annotations
      .filter(ann => ann.slice === currentSlice)
      .forEach(annotation => {
        const x = annotation.x * ctx.canvas.width;
        const y = annotation.y * ctx.canvas.height;
        
        // Annotation marker
        ctx.fillStyle = annotation.type === 'critical' ? '#ef4444' : 
                       annotation.type === 'warning' ? '#f59e0b' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Annotation ring
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.stroke();
      });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotationMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvas.width;
    const y = (event.clientY - rect.top) / canvas.height;
    
    const note = prompt('Add annotation note:');
    if (note && note.trim()) {
      const newAnnotation = {
        slice: currentSlice,
        x,
        y,
        note: note.trim(),
        type: 'info' as const
      };
      
      setAnnotations(prev => [...prev, newAnnotation]);
      
      if (onAnnotationAdd) {
        onAnnotationAdd(currentSlice, x, y, note.trim());
      }
    }
  };

  const nextSlice = () => {
    setCurrentSlice(prev => Math.min(prev + 1, totalSlices - 1));
  };

  const prevSlice = () => {
    setCurrentSlice(prev => Math.max(prev - 1, 0));
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const resetView = () => {
    setZoom(1);
    setCurrentSlice(Math.floor(totalSlices / 2));
  };

  return (
    <div className="space-y-6">
      {/* Slice Viewer */}
      <div className="bg-black rounded-xl overflow-hidden border border-slate-200 relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-96 cursor-crosshair"
          onClick={handleCanvasClick}
        />
        
        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => setAnnotationMode(!annotationMode)}
            className={`p-2 backdrop-blur-sm rounded-lg shadow-sm transition-colors ${
              annotationMode 
                ? 'bg-green-600 text-white' 
                : 'bg-white/90 text-slate-600 hover:bg-white'
            }`}
            title="Toggle Annotation Mode"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>

        {/* Slice Navigation */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
          <button
            onClick={prevSlice}
            disabled={currentSlice === 0}
            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-sm font-medium text-slate-700">
            Slice {currentSlice + 1} / {totalSlices}
          </div>
          
          <button
            onClick={nextSlice}
            disabled={currentSlice === totalSlices - 1}
            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Annotation Mode Indicator */}
        {annotationMode && (
          <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center text-sm font-medium">
              <MapPin className="h-4 w-4 mr-2 animate-pulse" />
              Click to add annotation
            </div>
          </div>
        )}

        {/* Scan Info */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <p className="text-xs font-medium text-slate-700">{scanType} - {patientName}</p>
          <p className="text-xs text-slate-500">Zoom: {Math.round(zoom * 100)}%</p>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
          <Layers className="h-5 w-5 mr-2" />
          Anatomical Overlays
        </h4>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setOverlays(prev => ({ ...prev, ventricles: !prev.ventricles }))}
            className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
              overlays.ventricles
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {overlays.ventricles ? <Eye className="h-4 w-4 mb-1" /> : <EyeOff className="h-4 w-4 mb-1" />}
            <span className="text-xs font-medium">Ventricles</span>
            <span className="text-xs text-slate-500">CSF System</span>
          </button>
          
          <button
            onClick={() => setOverlays(prev => ({ ...prev, vessels: !prev.vessels }))}
            className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
              overlays.vessels
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {overlays.vessels ? <Eye className="h-4 w-4 mb-1" /> : <EyeOff className="h-4 w-4 mb-1" />}
            <span className="text-xs font-medium">Vessels</span>
            <span className="text-xs text-slate-500">Vascular</span>
          </button>
          
          <button
            onClick={() => setOverlays(prev => ({ ...prev, contours: !prev.contours }))}
            className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
              overlays.contours
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {overlays.contours ? <Eye className="h-4 w-4 mb-1" /> : <EyeOff className="h-4 w-4 mb-1" />}
            <span className="text-xs font-medium">Contours</span>
            <span className="text-xs text-slate-500">Boundaries</span>
          </button>
        </div>
      </div>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Annotations ({annotations.length})
            </h4>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAnnotations ? 'Hide' : 'Show'} on Slices
            </button>
          </div>
          
          <div className="space-y-3">
            {annotations.map((annotation, index) => (
              <div key={index} className="flex items-start p-3 bg-slate-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-1 mr-3 ${
                  annotation.type === 'critical' ? 'bg-red-500' :
                  annotation.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{annotation.note}</p>
                  <p className="text-xs text-slate-500">
                    Slice {annotation.slice + 1} • Position ({Math.round(annotation.x * 100)}%, {Math.round(annotation.y * 100)}%)
                  </p>
                </div>
                <button
                  onClick={() => setCurrentSlice(annotation.slice)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Go to Slice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Medical Slice Viewer Guide
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">Navigation:</p>
            <ul className="space-y-1">
              <li>• Use arrow buttons to navigate slices</li>
              <li>• Zoom in/out for detailed examination</li>
              <li>• Toggle overlays to focus on specific anatomy</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Annotations:</p>
            <ul className="space-y-1">
              <li>• Enable annotation mode to add surgical notes</li>
              <li>• Click on any point to place markers</li>
              <li>• View all annotations in the list below</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalSliceViewer;