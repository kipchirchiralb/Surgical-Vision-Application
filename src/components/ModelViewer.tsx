import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createDemoMedicalModel, createDemoSpineModel } from '../utils/createDemoModel';
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
  Camera
} from 'lucide-react';

interface Annotation {
  id: string;
  position: THREE.Vector3;
  note: string;
  type: 'warning' | 'info' | 'critical';
}

interface ModelViewerProps {
  modelUrl: string;
  scanId: string;
  scanType?: string;
  onAnnotationAdd?: (position: THREE.Vector3, note: string, type: string) => void;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ 
  modelUrl, 
  scanId, 
  scanType = 'CT',
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
  const annotationsRef = useRef<Annotation[]>([]);
  const annotationMarkersRef = useRef<THREE.Object3D[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWireframe, setShowWireframe] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    initializeViewer();
    loadModel();

    return () => {
      cleanup();
    };
  }, [modelUrl]);

  const initializeViewer = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
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
    renderer.setClearColor(0xf8fafc, 1);
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4f46e5, 0.4, 100);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    // Add rim lighting for better depth perception
    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    rimLight.position.set(-10, 0, -10);
    scene.add(rimLight);

    // Orbit controls with enhanced settings
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Mouse event handlers for annotations
    renderer.domElement.addEventListener('click', handleCanvasClick);
    renderer.domElement.addEventListener('mousemove', handleCanvasMouseMove);

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    animate();
  };

  const loadModel = async () => {
    if (!sceneRef.current) return;

    setLoading(true);
    setError(null);

    const loader = new GLTFLoader();
    
    try {
      console.log('Loading 3D model:', modelUrl);
      
      // Try to load the GLB file first
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          modelUrl,
          resolve,
          (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
          },
          (error) => {
            console.log('GLB file not found, creating demo model');
            reject(error);
          }
        );
      });

      const model = gltf.scene;
      setupModel(model);

    } catch (error) {
      console.log('Creating demo model for scan type:', scanType);
      
      // Create demo model based on scan type
      let demoModel: THREE.Group;
      if (scanType.toLowerCase().includes('spine') || scanType.toLowerCase().includes('back')) {
        demoModel = createDemoSpineModel();
      } else {
        demoModel = createDemoMedicalModel();
      }
      
      setupModel(demoModel);
    }
  };

  const setupModel = (model: THREE.Group) => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    model.scale.setScalar(1);
    model.position.set(0, 0, 0);

    // Enable shadows
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    sceneRef.current.add(model);
    modelRef.current = model;

    // Center camera on model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2; // Add padding

    cameraRef.current.position.set(center.x + cameraZ, center.y + cameraZ/2, center.z + cameraZ);
    cameraRef.current.lookAt(center);

    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    setLoading(false);
    setModelLoaded(true);
    console.log('3D model loaded successfully');
  };

  const animate = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Animate annotation markers
    annotationMarkersRef.current.forEach((marker, index) => {
      const time = Date.now() * 0.001;
      marker.position.y += Math.sin(time * 2 + index) * 0.001;
    });

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
      const note = prompt('Add annotation note:');
      
      if (note && note.trim()) {
        const type = prompt('Annotation type (info/warning/critical):', 'info') || 'info';
        
        if (onAnnotationAdd) {
          onAnnotationAdd(point, note.trim(), type);
        }
        addAnnotationMarker(point, note.trim(), type as 'info' | 'warning' | 'critical');
      }
    }
  };

  const handleCanvasMouseMove = (event: MouseEvent) => {
    // Future: Show hover effects for annotations
  };

  const addAnnotationMarker = (position: THREE.Vector3, note: string, type: 'info' | 'warning' | 'critical') => {
    if (!sceneRef.current) return;

    // Create marker geometry
    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: type === 'critical' ? 0xff0000 : type === 'warning' ? 0xffaa00 : 0x0066ff 
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    
    // Add pulsing ring
    const ringGeometry = new THREE.RingGeometry(0.08, 0.12, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: material.color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(cameraRef.current!.position);
    
    sceneRef.current.add(marker);
    sceneRef.current.add(ring);
    
    annotationMarkersRef.current.push(marker, ring);

    const annotation: Annotation = {
      id: `ann-${Date.now()}`,
      position: position.clone(),
      note,
      type
    };
    
    annotationsRef.current.push(annotation);
  };

  const toggleWireframe = () => {
    if (!modelRef.current) return;

    setShowWireframe(!showWireframe);
    
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshStandardMaterial) {
              mat.wireframe = !showWireframe;
            }
          });
        } else if (child.material instanceof THREE.MeshPhongMaterial || child.material instanceof THREE.MeshStandardMaterial) {
          child.material.wireframe = !showWireframe;
        }
      }
    });
  };

  const resetView = () => {
    if (!cameraRef.current || !controlsRef.current || !modelRef.current) return;

    const box = new THREE.Box3().setFromObject(modelRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2;

    cameraRef.current.position.set(center.x + cameraZ, center.y + cameraZ/2, center.z + cameraZ);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const takeScreenshot = () => {
    if (!rendererRef.current) return;

    const link = document.createElement('a');
    link.download = `scan-${scanId}-screenshot.png`;
    link.href = rendererRef.current.domElement.toDataURL();
    link.click();
  };

  const clearAnnotations = () => {
    if (!sceneRef.current) return;

    annotationMarkersRef.current.forEach(marker => {
      sceneRef.current!.remove(marker);
    });
    
    annotationMarkersRef.current = [];
    annotationsRef.current = [];
  };

  const cleanup = () => {
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    
    // Clean up event listeners
    window.removeEventListener('resize', () => {});
  };

  return (
    <div className="space-y-6">
      {/* 3D Viewer Container */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-lg">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm z-10">
            <div className="text-center">
              <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-slate-700 font-medium">Loading 3D Model...</p>
              <p className="text-sm text-slate-500">Scan ID: {scanId}</p>
              <div className="mt-3 w-48 bg-slate-200 rounded-full h-2 mx-auto">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm z-10">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg text-red-600 font-medium mb-2">Failed to Load Model</p>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <button
                onClick={loadModel}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retry Loading
              </button>
            </div>
          </div>
        )}

        <div ref={mountRef} className="w-full h-[600px]" />

        {/* Enhanced Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col space-y-3">
          {/* Primary Controls */}
          <div className="flex space-x-2">
            <button
              onClick={toggleWireframe}
              className={`p-3 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-200 ${
                showWireframe 
                  ? 'bg-blue-600 text-white shadow-blue-500/25' 
                  : 'bg-white/90 text-slate-600 hover:bg-white hover:shadow-lg'
              }`}
              title="Toggle Wireframe"
            >
              {showWireframe ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            
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
          </div>

          {/* Secondary Controls */}
          <div className="flex space-x-2">
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

          {/* Annotation Controls */}
          {annotationMode && (
            <div className="flex space-x-2">
              <button
                onClick={clearAnnotations}
                className="p-3 bg-red-500 text-white backdrop-blur-sm rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200"
                title="Clear All Annotations"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Annotation Mode Indicator */}
        {annotationMode && (
          <div className="absolute bottom-4 left-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center text-sm font-medium">
              <MapPin className="h-4 w-4 mr-2 animate-pulse" />
              Click on model to add annotation
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-slate-700">3D Medical Model</p>
          <p className="text-xs text-slate-500">Scan: {scanId} • Type: {scanType}</p>
          {modelLoaded && (
            <p className="text-xs text-green-600 font-medium">✓ Model loaded</p>
          )}
        </div>
      </div>

      {/* Enhanced Controls Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h4 className="font-semibold text-slate-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Viewer Controls & Navigation
          </h4>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Rotate</p>
                <p className="text-xs text-slate-600">Left click + drag</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Pan</p>
                <p className="text-xs text-slate-600">Right click + drag</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Zoom</p>
                <p className="text-xs text-slate-600">Mouse wheel</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <div className="w-3 h-3 bg-orange-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Annotate</p>
                <p className="text-xs text-slate-600">Click on model</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annotations List */}
      {annotationsRef.current.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Surgical Annotations ({annotationsRef.current.length})
              </h4>
              <button
                onClick={clearAnnotations}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {annotationsRef.current.map((annotation, index) => (
                <div 
                  key={annotation.id}
                  className="flex items-start p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-4 h-4 rounded-full mt-1 mr-4 flex-shrink-0 ${
                    annotation.type === 'critical' ? 'bg-red-500' :
                    annotation.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">{annotation.note}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        annotation.type === 'critical' ? 'bg-red-100 text-red-700' :
                        annotation.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {annotation.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Position: ({annotation.position.x.toFixed(2)}, {annotation.position.y.toFixed(2)}, {annotation.position.z.toFixed(2)})
                    </p>
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

export default ModelViewer;