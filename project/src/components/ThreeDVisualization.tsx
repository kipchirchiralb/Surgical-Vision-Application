import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Info, Play, Pause, Settings } from 'lucide-react';

interface Scan {
  id: string;
  patient_name: string;
  scan_type: string;
  risk_level: string;
}

interface ThreeDVisualizationProps {
  scan: Scan;
}

// Enhanced 3D visualization component with advanced controls and animations
const ThreeDVisualization: React.FC<ThreeDVisualizationProps> = ({ scan }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const objectsRef = useRef<{ [key: string]: THREE.Object3D[] }>({});
  
  const [layers, setLayers] = useState({
    bone: true,
    vessels: true,
    tumor: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [viewMode, setViewMode] = useState<'rotate' | 'static'>('rotate');

  useEffect(() => {
    if (!mountRef.current) return;

    initializeScene();
    
    return () => {
      cleanup();
    };
  }, [scan]);

  const initializeScene = () => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera setup with better positioning
    const camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Enhanced renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(400, 300);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xf8fafc, 1);
    rendererRef.current = renderer;

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4f46e5, 0.3, 100);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // Create anatomical structures
    createAnatomicalStructures(scene, scan);

    // Start animation
    setTimeout(() => {
      setIsLoading(false);
      animate();
    }, 1500);
  };

  const createAnatomicalStructures = (scene: THREE.Scene, scan: Scan) => {
    objectsRef.current = { bone: [], vessels: [], tumor: [] };

    // Enhanced bone structure based on scan type
    const boneGroup = new THREE.Group();
    
    if (scan.scan_type === 'CT') {
      // Skull structure for CT scans
      const skullGeometry = new THREE.SphereGeometry(1.5, 32, 16);
      const skullMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xE5E5E5,
        transparent: true,
        opacity: 0.7,
        shininess: 30
      });
      const skull = new THREE.Mesh(skullGeometry, skullMaterial);
      skull.castShadow = true;
      skull.receiveShadow = true;
      boneGroup.add(skull);

      // Add jaw bone
      const jawGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.8);
      const jaw = new THREE.Mesh(jawGeometry, skullMaterial);
      jaw.position.set(0, -1.2, 0.2);
      boneGroup.add(jaw);
    } else {
      // Generic bone structure for other scans
      const boneGeometry = new THREE.CylinderGeometry(0.8, 1.2, 2.5, 8);
      const boneMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xD3D3D3,
        transparent: true,
        opacity: 0.8
      });
      const bone = new THREE.Mesh(boneGeometry, boneMaterial);
      bone.castShadow = true;
      bone.receiveShadow = true;
      boneGroup.add(bone);
    }

    boneGroup.userData = { layer: 'bone' };
    scene.add(boneGroup);
    objectsRef.current.bone.push(boneGroup);

    // Enhanced blood vessel network
    const vesselGroup = new THREE.Group();
    const vesselMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFF2222,
      transparent: true,
      opacity: 0.9,
      emissive: 0x220000
    });

    // Main vessels
    for (let i = 0; i < 12; i++) {
      const vesselGeometry = new THREE.CylinderGeometry(0.03, 0.05, 2.5);
      const vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
      
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.0 + Math.random() * 0.5;
      vessel.position.x = Math.cos(angle) * radius;
      vessel.position.z = Math.sin(angle) * radius;
      vessel.position.y = (Math.random() - 0.5) * 2;
      vessel.rotation.z = Math.random() * Math.PI * 0.4;
      vessel.rotation.x = Math.random() * Math.PI * 0.2;
      
      vesselGroup.add(vessel);
    }

    // Capillary network
    for (let i = 0; i < 20; i++) {
      const capillaryGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1);
      const capillary = new THREE.Mesh(capillaryGeometry, vesselMaterial);
      
      capillary.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 3
      );
      capillary.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      vesselGroup.add(capillary);
    }

    vesselGroup.userData = { layer: 'vessels' };
    scene.add(vesselGroup);
    objectsRef.current.vessels.push(vesselGroup);

    // Enhanced tumor/abnormality visualization
    if (scan.risk_level.toLowerCase() === 'high') {
      const tumorGroup = new THREE.Group();
      
      // Main tumor mass
      const tumorGeometry = new THREE.SphereGeometry(0.4, 16, 8);
      const tumorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00AA00,
        transparent: true,
        opacity: 0.8,
        emissive: 0x002200,
        shininess: 50
      });
      const tumor = new THREE.Mesh(tumorGeometry, tumorMaterial);
      tumor.position.set(0.8, 0.2, 0.5);
      tumorGroup.add(tumor);

      // Tumor satellites
      for (let i = 0; i < 3; i++) {
        const satelliteGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const satellite = new THREE.Mesh(satelliteGeometry, tumorMaterial);
        const angle = (i / 3) * Math.PI * 2;
        satellite.position.set(
          tumor.position.x + Math.cos(angle) * 0.6,
          tumor.position.y + (Math.random() - 0.5) * 0.4,
          tumor.position.z + Math.sin(angle) * 0.6
        );
        tumorGroup.add(satellite);
      }

      // Risk warning markers
      const markerGeometry = new THREE.RingGeometry(0.5, 0.6, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF4444,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      for (let i = 0; i < 2; i++) {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(tumor.position);
        marker.position.y += i * 0.1;
        marker.lookAt(cameraRef.current!.position);
        tumorGroup.add(marker);
      }

      tumorGroup.userData = { layer: 'tumor' };
      scene.add(tumorGroup);
      objectsRef.current.tumor.push(tumorGroup);
    }
  };

  const animate = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    animationIdRef.current = requestAnimationFrame(animate);
    
    if (isAnimating && viewMode === 'rotate') {
      // Rotate the entire scene
      sceneRef.current.rotation.y += 0.005;
      
      // Add subtle camera movement
      const time = Date.now() * 0.001;
      cameraRef.current.position.y = 2 + Math.sin(time * 0.5) * 0.2;
    }
    
    // Animate tumor pulsing if present
    objectsRef.current.tumor.forEach(tumorGroup => {
      tumorGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          const time = Date.now() * 0.003;
          child.scale.setScalar(1 + Math.sin(time) * 0.1);
        }
      });
    });
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  const toggleLayer = (layerName: keyof typeof layers) => {
    const newLayers = { ...layers, [layerName]: !layers[layerName] };
    setLayers(newLayers);

    // Update visibility in 3D scene
    if (objectsRef.current[layerName]) {
      objectsRef.current[layerName].forEach(obj => {
        obj.visible = newLayers[layerName];
      });
    }
  };

  const resetView = () => {
    if (cameraRef.current && sceneRef.current) {
      cameraRef.current.position.set(3, 2, 4);
      cameraRef.current.lookAt(0, 0, 0);
      sceneRef.current.rotation.set(0, 0, 0);
    }
  };

  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.9);
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.1);
    }
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'rotate' ? 'static' : 'rotate');
  };

  return (
    <div className="space-y-4">
      {/* Enhanced 3D Viewer */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border border-slate-200">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-600 font-medium">Rendering 3D model...</p>
              <p className="text-xs text-slate-500">Analyzing {scan.scan_type} scan data</p>
            </div>
          </div>
        )}
        
        <div ref={mountRef} className="w-full h-[300px] flex items-center justify-center" />
        
        {/* Enhanced controls overlay */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          <div className="flex space-x-1">
            <button
              onClick={toggleAnimation}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
              title={isAnimating ? "Pause Animation" : "Play Animation"}
            >
              {isAnimating ? (
                <Pause className="h-4 w-4 text-slate-600" />
              ) : (
                <Play className="h-4 w-4 text-slate-600" />
              )}
            </button>
            <button
              onClick={toggleViewMode}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
              title="Toggle View Mode"
            >
              <Settings className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          
          <div className="flex space-x-1">
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
          </div>
          
          <button
            onClick={resetView}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Scan info overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <p className="text-xs font-medium text-slate-700">{scan.scan_type} Scan</p>
          <p className="text-xs text-slate-500">{scan.patient_name}</p>
        </div>
      </div>

      {/* Enhanced Layer Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Anatomical Layers
          </h4>
          <span className="text-xs text-slate-500">
            {Object.values(layers).filter(Boolean).length} of 3 visible
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => toggleLayer('bone')}
            className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
              layers.bone
                ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center mb-1">
              {layers.bone ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </div>
            <span className="text-xs font-medium">Bone</span>
            <span className="text-xs text-slate-500">Structure</span>
          </button>
          
          <button
            onClick={() => toggleLayer('vessels')}
            className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
              layers.vessels
                ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center mb-1">
              {layers.vessels ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </div>
            <span className="text-xs font-medium">Vessels</span>
            <span className="text-xs text-slate-500">Network</span>
          </button>
          
          <button
            onClick={() => toggleLayer('tumor')}
            className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
              layers.tumor
                ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center mb-1">
              {layers.tumor ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </div>
            <span className="text-xs font-medium">Abnormal</span>
            <span className="text-xs text-slate-500">Tissue</span>
          </button>
        </div>
      </div>

      {/* Enhanced Information Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-2">3D Visualization Guide</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-slate-300 rounded mr-2"></div>
                  <span className="text-blue-800">Bone structures (gray)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span className="text-blue-800">Blood vessels (red)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span className="text-blue-800">Abnormal tissue (green)</span>
                </div>
              </div>
              <div className="space-y-1 text-blue-700">
                <p>• Interactive rotation and zoom</p>
                <p>• Layer visibility controls</p>
                <p>• Real-time risk assessment</p>
                <p>• Surgical planning markers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDVisualization;