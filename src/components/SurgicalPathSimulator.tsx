import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { 
  Navigation, 
  Target, 
  Route, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Settings,
  MapPin,
  Ruler
} from 'lucide-react';

interface SurgicalPath {
  id: string;
  name: string;
  approach: 'frontal' | 'temporal' | 'parietal' | 'occipital' | 'transcallosal';
  entryPoint: THREE.Vector3;
  targetPoint: THREE.Vector3;
  waypoints: THREE.Vector3[];
  riskScore: number;
  distance: number;
  estimatedTime: number;
  complications: string[];
  advantages: string[];
}

interface SurgicalPathSimulatorProps {
  scanId: string;
  targetLocation: THREE.Vector3;
  onPathSelected?: (path: SurgicalPath) => void;
  onSimulationComplete?: (results: any) => void;
}

const SurgicalPathSimulator: React.FC<SurgicalPathSimulatorProps> = ({
  scanId,
  targetLocation,
  onPathSelected,
  onSimulationComplete
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  
  const [surgicalPaths, setSurgicalPaths] = useState<SurgicalPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<SurgicalPath | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);

  useEffect(() => {
    initializeViewer();
    generateSurgicalPaths();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeViewer = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Create brain model
    createBrainModel(scene);
    
    // Animation loop
    animate();
  };

  const createBrainModel = (scene: THREE.Scene) => {
    // Brain tissue
    const brainGeometry = new THREE.SphereGeometry(1.5, 32, 16);
    const brainMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xd4a574,
      transparent: true,
      opacity: 0.8
    });
    const brain = new THREE.Mesh(brainGeometry, brainMaterial);
    brain.scale.set(1, 0.85, 1.1);
    scene.add(brain);

    // Skull (wireframe)
    const skullGeometry = new THREE.SphereGeometry(2, 32, 16);
    const skullMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const skull = new THREE.Mesh(skullGeometry, skullMaterial);
    scene.add(skull);

    // Blood vessels
    if (showVessels) {
      createVascularSystem(scene);
    }

    // Risk zones
    if (showRiskZones) {
      createRiskZones(scene);
    }

    // Target marker
    const targetGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.position.copy(targetLocation);
    scene.add(target);
  };

  const createVascularSystem = (scene: THREE.Scene) => {
    const vesselMaterial = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    
    // Major vessels
    const vessels = [
      { start: new THREE.Vector3(-1.5, 0.5, 0), end: new THREE.Vector3(0, 1.2, 0.3) },
      { start: new THREE.Vector3(1.5, 0.5, 0), end: new THREE.Vector3(0, 1.2, 0.3) },
      { start: new THREE.Vector3(0, -0.5, -1.2), end: new THREE.Vector3(0.8, 0, -0.4) },
      { start: new THREE.Vector3(0, -0.5, -1.2), end: new THREE.Vector3(-0.8, 0, -0.4) }
    ];

    vessels.forEach(vessel => {
      const direction = new THREE.Vector3().subVectors(vessel.end, vessel.start);
      const length = direction.length();
      
      const geometry = new THREE.CylinderGeometry(0.02, 0.02, length);
      const mesh = new THREE.Mesh(geometry, vesselMaterial);
      
      mesh.position.copy(vessel.start).add(direction.multiplyScalar(0.5));
      mesh.lookAt(vessel.end);
      mesh.rotateX(Math.PI / 2);
      
      scene.add(mesh);
    });
  };

  const createRiskZones = (scene: THREE.Scene) => {
    const riskMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4444,
      transparent: true,
      opacity: 0.3
    });

    // High-risk zones around vessels
    const riskZones = [
      new THREE.Vector3(0.8, 0.2, 0.5),
      new THREE.Vector3(-0.6, 0.4, -0.3),
      new THREE.Vector3(0.2, -0.8, 0.7)
    ];

    riskZones.forEach(position => {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const mesh = new THREE.Mesh(geometry, riskMaterial);
      mesh.position.copy(position);
      scene.add(mesh);
    });
  };

  const generateSurgicalPaths = () => {
    const paths: SurgicalPath[] = [
      {
        id: 'frontal-approach',
        name: 'Frontal Approach',
        approach: 'frontal',
        entryPoint: new THREE.Vector3(0, 1.8, 0.5),
        targetPoint: targetLocation,
        waypoints: [
          new THREE.Vector3(0, 1.5, 0.4),
          new THREE.Vector3(0, 1.0, 0.3),
          new THREE.Vector3(0, 0.5, 0.2)
        ],
        riskScore: 25,
        distance: 45.2,
        estimatedTime: 120,
        complications: ['Minimal vessel proximity', 'Standard approach'],
        advantages: ['Direct access', 'Good visualization', 'Minimal retraction']
      },
      {
        id: 'temporal-approach',
        name: 'Temporal Approach',
        approach: 'temporal',
        entryPoint: new THREE.Vector3(1.5, 0.2, 0),
        targetPoint: targetLocation,
        waypoints: [
          new THREE.Vector3(1.2, 0.2, 0.1),
          new THREE.Vector3(0.8, 0.2, 0.2),
          new THREE.Vector3(0.4, 0.2, 0.3)
        ],
        riskScore: 65,
        distance: 52.8,
        estimatedTime: 150,
        complications: ['Major vessel proximity', 'Language area risk'],
        advantages: ['Lateral access', 'Avoids motor cortex']
      },
      {
        id: 'parietal-approach',
        name: 'Parietal Approach',
        approach: 'parietal',
        entryPoint: new THREE.Vector3(-0.8, 1.2, -0.5),
        targetPoint: targetLocation,
        waypoints: [
          new THREE.Vector3(-0.6, 1.0, -0.3),
          new THREE.Vector3(-0.4, 0.7, -0.1),
          new THREE.Vector3(-0.2, 0.4, 0.1)
        ],
        riskScore: 45,
        distance: 48.6,
        estimatedTime: 135,
        complications: ['Moderate vessel risk', 'Sensory area proximity'],
        advantages: ['Good angle', 'Minimal eloquent area involvement']
      }
    ];

    setSurgicalPaths(paths);
    setSelectedPath(paths[0]); // Select safest path by default
  };

  const drawSurgicalPath = (path: SurgicalPath) => {
    if (!sceneRef.current) return;

    // Remove existing path
    const existingPath = sceneRef.current.getObjectByName('surgical-path');
    if (existingPath) {
      sceneRef.current.remove(existingPath);
    }

    const pathGroup = new THREE.Group();
    pathGroup.name = 'surgical-path';

    // Create path line
    const points = [path.entryPoint, ...path.waypoints, path.targetPoint];
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.02, 8, false);
    
    const pathMaterial = new THREE.MeshBasicMaterial({ 
      color: path.riskScore > 50 ? 0xff4444 : path.riskScore > 30 ? 0xffaa00 : 0x00ff00
    });
    
    const pathMesh = new THREE.Mesh(tubeGeometry, pathMaterial);
    pathGroup.add(pathMesh);

    // Entry point marker
    const entryGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const entryMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const entryMarker = new THREE.Mesh(entryGeometry, entryMaterial);
    entryMarker.position.copy(path.entryPoint);
    pathGroup.add(entryMarker);

    // Waypoint markers
    path.waypoints.forEach((waypoint, index) => {
      const waypointGeometry = new THREE.SphereGeometry(0.03, 8, 8);
      const waypointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const waypointMarker = new THREE.Mesh(waypointGeometry, waypointMaterial);
      waypointMarker.position.copy(waypoint);
      pathGroup.add(waypointMarker);
    });

    sceneRef.current.add(pathGroup);
  };

  const startSimulation = () => {
    if (!selectedPath) return;

    setIsSimulating(true);
    setSimulationProgress(0);
    setCurrentWaypoint(0);

    // Simulate surgical path progression
    const totalWaypoints = selectedPath.waypoints.length + 1;
    let progress = 0;

    const interval = setInterval(() => {
      progress += (100 / totalWaypoints) / (10 / animationSpeed);
      setSimulationProgress(Math.min(progress, 100));
      
      const waypointIndex = Math.floor((progress / 100) * totalWaypoints);
      setCurrentWaypoint(waypointIndex);

      if (progress >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
        
        if (onSimulationComplete) {
          onSimulationComplete({
            path: selectedPath,
            success: true,
            actualTime: selectedPath.estimatedTime * (0.9 + Math.random() * 0.2),
            complications: []
          });
        }
      }
    }, 100);
  };

  const animate = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    requestAnimationFrame(animate);

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const cleanup = () => {
    if (mountRef.current && rendererRef.current?.domElement) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  const selectPath = (path: SurgicalPath) => {
    setSelectedPath(path);
    drawSurgicalPath(path);
    
    if (onPathSelected) {
      onPathSelected(path);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore > 60) return 'text-red-600 bg-red-100 border-red-200';
    if (riskScore > 30) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const getRiskIcon = (riskScore: number) => {
    if (riskScore > 60) return <AlertTriangle className="h-4 w-4" />;
    if (riskScore > 30) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  useEffect(() => {
    if (selectedPath) {
      drawSurgicalPath(selectedPath);
    }
  }, [selectedPath, showRiskZones, showVessels]);

  return (
    <div className="space-y-6">
      {/* 3D Path Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Navigation className="h-6 w-6 mr-2 text-blue-600" />
                Surgical Path Simulator
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                AI-powered surgical approach planning and risk assessment
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowVessels(!showVessels)}
                className={`p-2 rounded-lg transition-colors ${
                  showVessels ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}
                title="Toggle Vessels"
              >
                {showVessels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              
              <button
                onClick={() => setShowRiskZones(!showRiskZones)}
                className={`p-2 rounded-lg transition-colors ${
                  showRiskZones ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                }`}
                title="Toggle Risk Zones"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3D Viewer */}
            <div className="lg:col-span-2">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div ref={mountRef} className="w-full h-96" />
                
                {isSimulating && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center text-sm font-medium">
                      <Target className="h-4 w-4 mr-2 animate-pulse" />
                      Simulating surgical approach...
                    </div>
                    <div className="mt-2">
                      <div className="w-32 bg-blue-800 rounded-full h-1">
                        <div 
                          className="bg-white h-1 rounded-full transition-all duration-300"
                          style={{ width: `${simulationProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1">{Math.round(simulationProgress)}% complete</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-slate-700">
                    {selectedPath ? selectedPath.name : 'No path selected'}
                  </p>
                  {selectedPath && (
                    <p className="text-xs text-slate-500">
                      Risk: {selectedPath.riskScore}% • {selectedPath.distance}mm
                    </p>
                  )}
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={startSimulation}
                    disabled={!selectedPath || isSimulating}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSimulating ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isSimulating ? 'Simulating...' : 'Start Simulation'}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">Speed:</span>
                    <select
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={4}>4x</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Path Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Surgical Approaches</h4>
              
              <div className="space-y-3">
                {surgicalPaths.map((path) => (
                  <button
                    key={path.id}
                    onClick={() => selectPath(path)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedPath?.id === path.id
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-slate-900">{path.name}</h5>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(path.riskScore)}`}>
                        {getRiskIcon(path.riskScore)}
                        <span className="ml-1">{path.riskScore}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Distance:</span>
                        <span className="font-medium">{path.distance}mm</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Est. Time:</span>
                        <span className="font-medium">{path.estimatedTime}min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Waypoints:</span>
                        <span className="font-medium">{path.waypoints.length}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Path Details */}
      {selectedPath && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Route className="h-5 w-5 mr-2" />
              {selectedPath.name} - Detailed Analysis
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Advantages */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Advantages
                </h4>
                <ul className="space-y-2">
                  {selectedPath.advantages.map((advantage, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-slate-700">{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Complications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                  Potential Complications
                </h4>
                <ul className="space-y-2">
                  {selectedPath.complications.map((complication, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-yellow-600 mr-2">•</span>
                      <span className="text-slate-700">{complication}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Path Metrics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{selectedPath.riskScore}%</div>
                <div className="text-sm text-slate-600">Risk Score</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{selectedPath.distance}mm</div>
                <div className="text-sm text-slate-600">Distance</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{selectedPath.estimatedTime}min</div>
                <div className="text-sm text-slate-600">Est. Time</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{selectedPath.waypoints.length}</div>
                <div className="text-sm text-slate-600">Waypoints</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurgicalPathSimulator;