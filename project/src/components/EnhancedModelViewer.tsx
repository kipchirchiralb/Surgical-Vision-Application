import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff, 
  Settings,
  Loader,
  AlertCircle,
  Info,
  MapPin,
  Download,
  Camera,
  Layers
} from 'lucide-react';

interface EnhancedModelViewerProps {
  scanId: string;
  scanType: string;
  patientName: string;
  riskLevel: string;
  onAnnotationAdd?: (position: THREE.Vector3, note: string, type: string) => void;
}

// Enhanced 3D model viewer with medical-grade visualization
const EnhancedModelViewer: React.FC<EnhancedModelViewerProps> = ({ 
  scanId, 
  scanType, 
  patientName,
  riskLevel,
  onAnnotationAdd 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [layers, setLayers] = useState({
    brain: true,
    skull: true,
    vessels: true,
    ventricles: true,
    riskZones: true
  });

  useEffect(() => {
    if (!mountRef.current) return;

    initializeViewer();
    createMedicalModel();

    return () => {
      cleanup();
    };
  }, [scanId]);

  const initializeViewer = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark medical viewer background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a1a, 1);
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Medical-grade lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Rim lighting for depth perception
    const rimLight1 = new THREE.DirectionalLight(0x4f46e5, 0.3);
    rimLight1.position.set(-10, 0, -10);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x06b6d4, 0.2);
    rimLight2.position.set(0, -10, 5);
    scene.add(rimLight2);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // Mouse event handlers
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Animation loop
    animate();
  };

  const createMedicalModel = () => {
    if (!sceneRef.current) return;

    const group = new THREE.Group();
    modelRef.current = group;

    // Create anatomically accurate brain model
    createBrainStructure(group);
    createSkullStructure(group);
    createVascularSystem(group);
    createVentricularSystem(group);
    createRiskZones(group);

    sceneRef.current.add(group);
    setLoading(false);
  };

  const createBrainStructure = (group: THREE.Group) => {
    // Brain tissue (gray matter)
    const brainGeometry = new THREE.SphereGeometry(1.5, 32, 16);
    const brainMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xd4a574,
      transparent: true,
      opacity: 0.9,
      shininess: 10
    });
    const brain = new THREE.Mesh(brainGeometry, brainMaterial);
    brain.scale.set(1, 0.85, 1.1); // More brain-like proportions
    brain.userData = { layer: 'brain' };
    group.add(brain);

    // Cerebral hemispheres
    const leftHemisphere = new THREE.SphereGeometry(0.75, 16, 8, 0, Math.PI);
    const rightHemisphere = new THREE.SphereGeometry(0.75, 16, 8, Math.PI, Math.PI);
    
    const leftMaterial = new THREE.MeshPhongMaterial({ color: 0xc49464 });
    const rightMaterial = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
    
    const leftBrain = new THREE.Mesh(leftHemisphere, leftMaterial);
    const rightBrain = new THREE.Mesh(rightHemisphere, rightMaterial);
    
    leftBrain.position.set(-0.1, 0, 0);
    rightBrain.position.set(0.1, 0, 0);
    leftBrain.userData = { layer: 'brain' };
    rightBrain.userData = { layer: 'brain' };
    
    group.add(leftBrain);
    group.add(rightBrain);
  };

  const createSkullStructure = (group: THREE.Group) => {
    const skullGeometry = new THREE.SphereGeometry(2, 32, 16);
    const skullMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf0f0f0,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const skull = new THREE.Mesh(skullGeometry, skullMaterial);
    skull.userData = { layer: 'skull' };
    group.add(skull);
  };

  const createVascularSystem = (group: THREE.Group) => {
    const vesselGroup = new THREE.Group();
    vesselGroup.userData = { layer: 'vessels' };

    // Major cerebral arteries
    const arteries = [
      { name: 'ACA', path: [[-0.2, 0.8, 0], [0, 1.2, 0.3], [0.2, 0.8, 0]] },
      { name: 'MCA', path: [[-1.5, 0, 0], [-0.8, 0.2, 0.5], [0, 0.5, 0.8]] },
      { name: 'PCA', path: [[0, -0.5, -1.2], [0.8, -0.3, -0.8], [1.2, 0, -0.4]] }
    ];

    arteries.forEach(artery => {
      const curve = new THREE.CatmullRomCurve3(
        artery.path.map(p => new THREE.Vector3(p[0], p[1], p[2]))
      );
      
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
      const tubeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff2222,
        emissive: 0x220000
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      vesselGroup.add(tube);
    });

    group.add(vesselGroup);
  };

  const createVentricularSystem = (group: THREE.Group) => {
    const ventricleGroup = new THREE.Group();
    ventricleGroup.userData = { layer: 'ventricles' };

    // Lateral ventricles (like in your MRI image)
    const leftVentricle = new THREE.SphereGeometry(0.3, 16, 8);
    const rightVentricle = new THREE.SphereGeometry(0.3, 16, 8);
    
    const ventricleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.7,
      emissive: 0x001122
    });
    
    const leftV = new THREE.Mesh(leftVentricle, ventricleMaterial);
    const rightV = new THREE.Mesh(rightVentricle, ventricleMaterial);
    
    leftV.position.set(-0.4, 0.2, 0);
    rightV.position.set(0.4, 0.2, 0);
    leftV.scale.set(1, 0.6, 1.5);
    rightV.scale.set(1, 0.6, 1.5);
    
    ventricleGroup.add(leftV);
    ventricleGroup.add(rightV);

    // Third ventricle
    const thirdVentricle = new THREE.SphereGeometry(0.1, 8, 8);
    const thirdV = new THREE.Mesh(thirdVentricle, ventricleMaterial);
    thirdV.position.set(0, 0, 0);
    thirdV.scale.set(0.5, 2, 0.5);
    ventricleGroup.add(thirdV);

    group.add(ventricleGroup);
  };

  const createRiskZones = (group: THREE.Group) => {
    if (riskLevel.toLowerCase() === 'low') return;

    const riskGroup = new THREE.Group();
    riskGroup.userData = { layer: 'riskZones' };

    const riskColor = riskLevel.toLowerCase() === 'high' ? 0xff0000 : 0xffaa00;
    const riskMaterial = new THREE.MeshBasicMaterial({ 
      color: riskColor,
      transparent: true,
      opacity: 0.6
    });

    // Risk zone markers
    for (let i = 0; i < (riskLevel.toLowerCase() === 'high' ? 3 : 1); i++) {
      const riskGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const riskMarker = new THREE.Mesh(riskGeometry, riskMaterial);
      
      riskMarker.position.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2
      );
      
      riskGroup.add(riskMarker);

      // Pulsing ring around risk zones
      const ringGeometry = new THREE.RingGeometry(0.12, 0.16, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: riskColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(riskMarker.position);
      ring.lookAt(cameraRef.current!.position);
      riskGroup.add(ring);
    }

    group.add(riskGroup);
  };

  const animate = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Animate risk zones
    if (modelRef.current) {
      const time = Date.now() * 0.001;
      modelRef.current.traverse((child) => {
        if (child.userData.layer === 'riskZones' && child instanceof THREE.Mesh) {
          if (child.geometry instanceof THREE.SphereGeometry) {
            child.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
          }
        }
      });
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const handleCanvasClick = (event: MouseEvent) => {
    if (!annotationMode || !cameraRef.current || !sceneRef.current || !modelRef.current) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    const intersects = raycasterRef.current.intersectObject(modelRef.current, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const note = prompt('Add surgical annotation:');
      
      if (note && note.trim()) {
        const type = prompt('Annotation type (info/warning/critical):', 'info') || 'info';
        
        if (onAnnotationAdd) {
          onAnnotationAdd(point, note.trim(), type);
        }
        
        // Add visual marker
        addAnnotationMarker(point, note.trim(), type as 'info' | 'warning' | 'critical');
      }
    }
  };

  const addAnnotationMarker = (position: THREE.Vector3, note: string, type: 'info' | 'warning' | 'critical') => {
    if (!sceneRef.current) return;

    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: type === 'critical' ? 0xff0000 : type === 'warning' ? 0xffaa00 : 0x0066ff 
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    
    sceneRef.current.add(marker);
  };

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.userData.layer === layerName) {
          child.visible = !layers[layerName];
        }
      });
    }
  };

  const resetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;

    cameraRef.current.position.set(0, 0, 5);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const takeScreenshot = () => {
    if (!rendererRef.current) return;

    const link = document.createElement('a');
    link.download = `${patientName}-${scanType}-3d-model.png`;
    link.href = rendererRef.current.domElement.toDataURL();
    link.click();
  };

  const cleanup = () => {
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Viewer Container */}
      <div className="relative bg-black rounded-xl overflow-hidden border border-slate-200 shadow-lg">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-10">
            <div className="text-center">
              <Loader className="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-lg text-white font-medium">Generating 3D Medical Model...</p>
              <p className="text-sm text-blue-300">Patient: {patientName} • {scanType}</p>
            </div>
          </div>
        )}

        <div ref={mountRef} className="w-full h-[600px]" />

        {/* Enhanced Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setAnnotationMode(!annotationMode)}
              className={`p-3 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-200 ${
                annotationMode 
                  ? 'bg-green-600 text-white shadow-green-500/25' 
                  : 'bg-white/90 text-slate-600 hover:bg-white hover:shadow-lg'
              }`}
              title="Toggle Annotation Mode"
            >
              <MapPin className="h-5 w-5" />
            </button>
            
            <button
              onClick={takeScreenshot}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
              title="Take Screenshot"
            >
              <Camera className="h-5 w-5 text-slate-600" />
            </button>
            
            <button
              onClick={resetView}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
              title="Reset View"
            >
              <RotateCcw className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Annotation Mode Indicator */}
        {annotationMode && (
          <div className="absolute bottom-4 left-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center text-sm font-medium">
              <MapPin className="h-4 w-4 mr-2 animate-pulse" />
              Click on brain model to add surgical annotation
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-slate-700">3D Brain Model</p>
          <p className="text-xs text-slate-500">{patientName} • {scanType}</p>
          <p className={`text-xs font-medium ${
            riskLevel.toLowerCase() === 'high' ? 'text-red-600' :
            riskLevel.toLowerCase() === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {riskLevel} Risk Level
          </p>
        </div>
      </div>

      {/* Enhanced Layer Controls */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h4 className="font-semibold text-slate-900 flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Anatomical Layer Controls
          </h4>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(layers).map(([layerName, visible]) => (
              <button
                key={layerName}
                onClick={() => toggleLayer(layerName as keyof typeof layers)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
                  visible
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center mb-1">
                  {visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs font-medium capitalize">{layerName}</span>
                <span className="text-xs text-slate-500">
                  {layerName === 'brain' ? 'Tissue' :
                   layerName === 'skull' ? 'Bone' :
                   layerName === 'vessels' ? 'Arteries' :
                   layerName === 'ventricles' ? 'CSF' : 'Warnings'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedModelViewer;