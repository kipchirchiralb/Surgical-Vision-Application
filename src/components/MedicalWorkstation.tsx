import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Layers, Ruler, Crosshair, RotateCw, ZoomIn, ZoomOut, Move, Square, Circle, ArrowRight, Settings, Save, Printer as Print, Share2, Maximize2, Grid3X3, Eye, EyeOff, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Info } from 'lucide-react';

interface MedicalWorkstationProps {
  scanId: string;
  patientData: {
    name: string;
    id: string;
    dob: string;
    sex: string;
    scanType: string;
    scanDate: string;
    studyDescription: string;
    seriesNumber: string;
    institution: string;
    physician: string;
  };
  onMeasurement?: (measurement: any) => void;
  onAnnotation?: (annotation: any) => void;
}

const MedicalWorkstation: React.FC<MedicalWorkstationProps> = ({
  scanId,
  patientData,
  onMeasurement,
  onAnnotation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSlice, setCurrentSlice] = useState(6);
  const [totalSlices] = useState(24);
  const [windowLevel, setWindowLevel] = useState(40);
  const [windowWidth, setWindowWidth] = useState(80);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'cursor' | 'zoom' | 'pan' | 'measure' | 'annotate' | 'windowing'>('cursor');
  const [measurements, setMeasurements] = useState<Array<any>>([]);
  const [annotations, setAnnotations] = useState<Array<any>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [overlays, setOverlays] = useState({
    patientInfo: true,
    measurements: true,
    annotations: true,
    orientation: true,
    scale: true,
    crosshairs: false
  });
  const [viewLayout, setViewLayout] = useState<'single' | 'quad' | 'compare'>('single');

  useEffect(() => {
    drawMedicalImage();
  }, [currentSlice, windowLevel, windowWidth, zoom, pan, overlays]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlice(prev => {
          const next = prev + 1;
          return next >= totalSlices ? 0 : next;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalSlices]);

  const drawMedicalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with medical black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply window/level settings
    const brightness = windowLevel / 100;
    const contrast = windowWidth / 100;

    // Draw brain slice with proper medical imaging appearance
    drawBrainSlice(ctx, currentSlice, brightness, contrast);
    
    // Draw overlays
    if (overlays.orientation) drawOrientationMarkers(ctx);
    if (overlays.scale) drawScaleBar(ctx);
    if (overlays.patientInfo) drawPatientInfo(ctx);
    if (overlays.crosshairs) drawCrosshairs(ctx);
    if (overlays.measurements) drawMeasurements(ctx);
    if (overlays.annotations) drawAnnotations(ctx);
  };

  const drawBrainSlice = (ctx: CanvasRenderingContext2D, slice: number, brightness: number, contrast: number) => {
    const centerX = ctx.canvas.width / 2 + pan.x;
    const centerY = ctx.canvas.height / 2 + pan.y;
    const baseRadius = 140 * zoom;
    
    // Simulate different slice levels
    const slicePosition = slice / totalSlices;
    const radiusVariation = Math.sin(slicePosition * Math.PI) * 0.4 + 0.6;
    const radius = baseRadius * radiusVariation;
    
    // Brain parenchyma with realistic grayscale values
    const brainIntensity = Math.floor((0.3 + brightness * 0.4) * 255 * contrast);
    ctx.fillStyle = `rgb(${brainIntensity}, ${brainIntensity}, ${brainIntensity})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.9, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Gray matter (higher intensity)
    const grayMatterIntensity = Math.floor((0.4 + brightness * 0.3) * 255 * contrast);
    ctx.fillStyle = `rgb(${grayMatterIntensity}, ${grayMatterIntensity}, ${grayMatterIntensity})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.85, radius * 0.75, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // White matter (lower intensity)
    const whiteMatterIntensity = Math.floor((0.6 + brightness * 0.2) * 255 * contrast);
    ctx.fillStyle = `rgb(${whiteMatterIntensity}, ${whiteMatterIntensity}, ${whiteMatterIntensity})`;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.7, radius * 0.6, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // CSF spaces (ventricles) - dark
    if (slice >= 8 && slice <= 16) {
      const ventricleSize = 25 * zoom * (1 - Math.abs(slice - 12) / 8);
      const csfIntensity = Math.floor((0.1 + brightness * 0.1) * 255 * contrast);
      ctx.fillStyle = `rgb(${csfIntensity}, ${csfIntensity}, ${csfIntensity})`;
      
      // Lateral ventricles
      ctx.beginPath();
      ctx.ellipse(centerX - 30 * zoom, centerY - 10 * zoom, ventricleSize * 0.8, ventricleSize * 0.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(centerX + 30 * zoom, centerY - 10 * zoom, ventricleSize * 0.8, ventricleSize * 0.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Third ventricle
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, ventricleSize * 0.2, ventricleSize * 0.6, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Add realistic noise/texture
    addMedicalImageNoise(ctx, centerX, centerY, radius);
  };

  const addMedicalImageNoise = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    const imageData = ctx.getImageData(centerX - radius, centerY - radius, radius * 2, radius * 2);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    
    ctx.putImageData(imageData, centerX - radius, centerY - radius);
  };

  const drawOrientationMarkers = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    
    // Standard radiological orientation
    ctx.fillText('A', ctx.canvas.width / 2, 20); // Anterior
    ctx.fillText('P', ctx.canvas.width / 2, ctx.canvas.height - 10); // Posterior
    ctx.fillText('R', 20, ctx.canvas.height / 2); // Right
    ctx.fillText('L', ctx.canvas.width - 20, ctx.canvas.height / 2); // Left
  };

  const drawScaleBar = (ctx: CanvasRenderingContext2D) => {
    const scaleLength = 50 * zoom; // 50mm scale
    const x = ctx.canvas.width - 100;
    const y = ctx.canvas.height - 40;
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + scaleLength, y);
    ctx.stroke();
    
    ctx.fillStyle = '#00FF00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('50mm', x + scaleLength / 2, y + 15);
  };

  const drawPatientInfo = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#00FF00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const info = [
      `${patientData.name}`,
      `ID: ${patientData.id}`,
      `DOB: ${patientData.dob}`,
      `${patientData.scanType}`,
      `${patientData.scanDate}`,
      `Series: ${patientData.seriesNumber}`,
      `Slice: ${currentSlice + 1}/${totalSlices}`,
      `WL: ${windowLevel} WW: ${windowWidth}`,
      `Zoom: ${(zoom * 100).toFixed(0)}%`
    ];
    
    info.forEach((line, index) => {
      ctx.fillText(line, 10, 20 + index * 16);
    });
  };

  const drawCrosshairs = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(ctx.canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, ctx.canvas.height);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  const drawMeasurements = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#FF0000';
    ctx.fillStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.font = '12px monospace';
    
    measurements.forEach((measurement, index) => {
      if (measurement.slice === currentSlice) {
        ctx.beginPath();
        ctx.moveTo(measurement.start.x, measurement.start.y);
        ctx.lineTo(measurement.end.x, measurement.end.y);
        ctx.stroke();
        
        // Distance label
        const midX = (measurement.start.x + measurement.end.x) / 2;
        const midY = (measurement.start.y + measurement.end.y) / 2;
        ctx.fillText(`${measurement.distance.toFixed(1)}mm`, midX + 5, midY - 5);
      }
    });
  };

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#00FFFF';
    ctx.font = '12px monospace';
    
    annotations.forEach((annotation, index) => {
      if (annotation.slice === currentSlice) {
        // Arrow marker
        ctx.beginPath();
        ctx.arc(annotation.x, annotation.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Text label
        ctx.fillText(annotation.text, annotation.x + 10, annotation.y - 10);
      }
    });
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    switch (activeTool) {
      case 'measure':
        // Start measurement
        break;
      case 'annotate':
        const text = prompt('Enter annotation:');
        if (text) {
          const newAnnotation = {
            slice: currentSlice,
            x,
            y,
            text
          };
          setAnnotations(prev => [...prev, newAnnotation]);
          if (onAnnotation) onAnnotation(newAnnotation);
        }
        break;
    }
  };

  const handleWindowLevelChange = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'windowing') return;
    
    const deltaX = event.movementX;
    const deltaY = event.movementY;
    
    setWindowWidth(prev => Math.max(1, Math.min(200, prev + deltaX)));
    setWindowLevel(prev => Math.max(0, Math.min(100, prev - deltaY)));
  };

  return (
    <div className="h-screen bg-black text-green-400 font-mono flex">
      {/* Left Toolbar */}
      <div className="w-16 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 space-y-2">
        {[
          { tool: 'cursor', icon: ArrowRight, label: 'Select' },
          { tool: 'zoom', icon: ZoomIn, label: 'Zoom' },
          { tool: 'pan', icon: Move, label: 'Pan' },
          { tool: 'windowing', icon: Settings, label: 'W/L' },
          { tool: 'measure', icon: Ruler, label: 'Measure' },
          { tool: 'annotate', icon: Crosshair, label: 'Annotate' }
        ].map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool as any)}
            className={`p-2 rounded transition-colors ${
              activeTool === tool 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Main Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 text-gray-400 hover:text-white"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
                className="p-1 text-gray-400 hover:text-white"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentSlice(Math.min(totalSlices - 1, currentSlice + 1))}
                className="p-1 text-gray-400 hover:text-white"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-sm">
              Image {currentSlice + 1} of {totalSlices}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs">WL:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={windowLevel}
                onChange={(e) => setWindowLevel(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-xs w-8">{windowLevel}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs">WW:</span>
              <input
                type="range"
                min="1"
                max="200"
                value={windowWidth}
                onChange={(e) => setWindowWidth(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-xs w-8">{windowWidth}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-white">
              <Save className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-white">
              <Print className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-white">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 flex">
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={activeTool === 'windowing' ? handleWindowLevelChange : undefined}
            />
            
            {/* Slice Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <input
                type="range"
                min="0"
                max={totalSlices - 1}
                value={currentSlice}
                onChange={(e) => setCurrentSlice(Number(e.target.value))}
                className="w-64"
              />
            </div>
          </div>
          
          {/* Right Panel */}
          <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 space-y-4">
            {/* Patient Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Patient Information</h3>
              <div className="text-xs space-y-1">
                <div>Name: {patientData.name}</div>
                <div>ID: {patientData.id}</div>
                <div>DOB: {patientData.dob}</div>
                <div>Sex: {patientData.sex}</div>
              </div>
            </div>
            
            {/* Study Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Study Information</h3>
              <div className="text-xs space-y-1">
                <div>Type: {patientData.scanType}</div>
                <div>Date: {patientData.scanDate}</div>
                <div>Description: {patientData.studyDescription}</div>
                <div>Series: {patientData.seriesNumber}</div>
                <div>Institution: {patientData.institution}</div>
                <div>Physician: {patientData.physician}</div>
              </div>
            </div>
            
            {/* Display Settings */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Display</h3>
              <div className="space-y-2">
                {Object.entries(overlays).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setOverlays(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-3 h-3"
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Measurements */}
            {measurements.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Measurements</h3>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {measurements.map((measurement, index) => (
                    <div key={index} className="flex justify-between">
                      <span>#{index + 1}</span>
                      <span>{measurement.distance.toFixed(1)}mm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Annotations */}
            {annotations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Annotations</h3>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {annotations.map((annotation, index) => (
                    <div key={index} className="text-cyan-400">
                      Slice {annotation.slice + 1}: {annotation.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalWorkstation;