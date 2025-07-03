import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Brain, 
  Heart, 
  Activity, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Cpu,
  Database,
  Network,
  Monitor
} from 'lucide-react';

interface PatientVitals {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  oxygenSaturation: number;
  temperature: number;
  respiratoryRate: number;
  intracranialPressure: number;
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  complexity: 'low' | 'medium' | 'high';
  outcomes: string[];
}

interface DigitalTwinSimulatorProps {
  patientId: string;
  scanData: any;
  onSimulationComplete?: (results: any) => void;
}

const DigitalTwinSimulator: React.FC<DigitalTwinSimulatorProps> = ({
  patientId,
  scanData,
  onSimulationComplete
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null);
  const [patientVitals, setPatientVitals] = useState<PatientVitals>({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    oxygenSaturation: 98,
    temperature: 36.5,
    respiratoryRate: 16,
    intracranialPressure: 12
  });
  
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const [physicsEngine, setPhysicsEngine] = useState<'basic' | 'advanced' | 'quantum'>('advanced');
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [multiPatientMode, setMultiPatientMode] = useState(false);

  const simulationScenarios: SimulationScenario[] = [
    {
      id: 'tumor-resection',
      name: 'Tumor Resection Simulation',
      description: 'Complete surgical removal of brain tumor with real-time tissue response',
      duration: 180,
      complexity: 'high',
      outcomes: ['Complete resection', 'Partial resection', 'Complications detected']
    },
    {
      id: 'vessel-bypass',
      name: 'Cerebral Bypass Surgery',
      description: 'Vascular bypass procedure with blood flow simulation',
      duration: 240,
      complexity: 'high',
      outcomes: ['Successful bypass', 'Flow complications', 'Anastomosis issues']
    },
    {
      id: 'biopsy-procedure',
      name: 'Stereotactic Biopsy',
      description: 'Minimally invasive tissue sampling with precision targeting',
      duration: 60,
      complexity: 'medium',
      outcomes: ['Successful sampling', 'Target missed', 'Bleeding complications']
    },
    {
      id: 'awake-craniotomy',
      name: 'Awake Craniotomy',
      description: 'Conscious patient surgery with real-time neurological monitoring',
      duration: 300,
      complexity: 'high',
      outcomes: ['Preserved function', 'Temporary deficits', 'Permanent changes']
    },
    {
      id: 'emergency-evacuation',
      name: 'Emergency Hematoma Evacuation',
      description: 'Urgent removal of intracranial bleeding with pressure monitoring',
      duration: 90,
      complexity: 'high',
      outcomes: ['Pressure relieved', 'Rebleeding', 'Brain herniation']
    }
  ];

  useEffect(() => {
    initializeDigitalTwin();
    startVitalsMonitoring();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeDigitalTwin = () => {
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

    // Create digital twin model
    createDigitalTwinModel(scene);
    
    // Animation loop
    animate();
  };

  const createDigitalTwinModel = (scene: THREE.Scene) => {
    // Create a more sophisticated brain model for digital twin
    const brainGroup = new THREE.Group();

    // Brain hemispheres with detailed geometry
    const leftHemisphere = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI);
    const rightHemisphere = new THREE.SphereGeometry(1.2, 32, 16, Math.PI, Math.PI);
    
    const brainMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFB6C1,
      transparent: true,
      opacity: 0.8,
      shininess: 30
    });
    
    const leftBrain = new THREE.Mesh(leftHemisphere, brainMaterial);
    const rightBrain = new THREE.Mesh(rightHemisphere, brainMaterial);
    
    leftBrain.position.set(-0.1, 0, 0);
    rightBrain.position.set(0.1, 0, 0);
    
    brainGroup.add(leftBrain);
    brainGroup.add(rightBrain);

    // Vascular system with pulsing animation
    createVascularSystem(brainGroup);
    
    // Neural pathways
    createNeuralPathways(brainGroup);
    
    // Tumor or pathology
    if (scanData?.risk_level === 'high') {
      createPathology(brainGroup);
    }

    scene.add(brainGroup);
  };

  const createVascularSystem = (parent: THREE.Group) => {
    const vesselMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff2222,
      emissive: 0x220000
    });

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
      const vessel = new THREE.Mesh(tubeGeometry, vesselMaterial);
      vessel.userData = { type: 'vessel', name: artery.name };
      parent.add(vessel);
    });
  };

  const createNeuralPathways = (parent: THREE.Group) => {
    const pathwayMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6
    });

    // Create neural fiber bundles
    for (let i = 0; i < 20; i++) {
      const points = [];
      for (let j = 0; j < 10; j++) {
        points.push(new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.01, 4, false);
      const pathway = new THREE.Mesh(tubeGeometry, pathwayMaterial);
      pathway.userData = { type: 'neural', activity: Math.random() };
      parent.add(pathway);
    }
  };

  const createPathology = (parent: THREE.Group) => {
    const tumorGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const tumorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00,
      emissive: 0x002200,
      transparent: true,
      opacity: 0.8
    });
    
    const tumor = new THREE.Mesh(tumorGeometry, tumorMaterial);
    tumor.position.set(0.5, 0.2, 0.3);
    tumor.userData = { type: 'tumor', growth: 0 };
    parent.add(tumor);
  };

  const startVitalsMonitoring = () => {
    const vitalsInterval = setInterval(() => {
      if (!isSimulating) {
        // Normal variation
        setPatientVitals(prev => ({
          heartRate: prev.heartRate + (Math.random() - 0.5) * 4,
          bloodPressure: {
            systolic: prev.bloodPressure.systolic + (Math.random() - 0.5) * 6,
            diastolic: prev.bloodPressure.diastolic + (Math.random() - 0.5) * 4
          },
          oxygenSaturation: Math.max(95, Math.min(100, prev.oxygenSaturation + (Math.random() - 0.5) * 2)),
          temperature: prev.temperature + (Math.random() - 0.5) * 0.2,
          respiratoryRate: prev.respiratoryRate + (Math.random() - 0.5) * 2,
          intracranialPressure: Math.max(8, Math.min(20, prev.intracranialPressure + (Math.random() - 0.5) * 2))
        }));
      }
    }, 1000);

    return () => clearInterval(vitalsInterval);
  };

  const startSimulation = async (scenario: SimulationScenario) => {
    setCurrentScenario(scenario);
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResults([]);

    // Simulate surgical procedure
    const steps = scenario.duration / 10; // 10-second intervals
    
    for (let step = 0; step < steps; step++) {
      await new Promise(resolve => setTimeout(resolve, realTimeMode ? 1000 : 100));
      
      const progress = ((step + 1) / steps) * 100;
      setSimulationProgress(progress);
      
      // Simulate physiological changes during surgery
      simulatePhysiologicalResponse(scenario, progress);
      
      // Record simulation data
      recordSimulationStep(scenario, step, progress);
    }

    // Generate final results
    const results = generateSimulationResults(scenario);
    setSimulationResults(results);
    setIsSimulating(false);
    
    if (onSimulationComplete) {
      onSimulationComplete(results);
    }
  };

  const simulatePhysiologicalResponse = (scenario: SimulationScenario, progress: number) => {
    // Simulate realistic physiological changes during surgery
    const stressLevel = Math.sin((progress / 100) * Math.PI) * 0.5 + 0.5;
    
    setPatientVitals(prev => {
      const baseHR = 72;
      const baseBP = { systolic: 120, diastolic: 80 };
      
      return {
        heartRate: baseHR + stressLevel * 30 + (Math.random() - 0.5) * 10,
        bloodPressure: {
          systolic: baseBP.systolic + stressLevel * 40 + (Math.random() - 0.5) * 15,
          diastolic: baseBP.diastolic + stressLevel * 20 + (Math.random() - 0.5) * 10
        },
        oxygenSaturation: Math.max(92, 100 - stressLevel * 8 + (Math.random() - 0.5) * 3),
        temperature: 36.5 + stressLevel * 1.5 + (Math.random() - 0.5) * 0.5,
        respiratoryRate: 16 + stressLevel * 8 + (Math.random() - 0.5) * 4,
        intracranialPressure: 12 + stressLevel * 15 + (Math.random() - 0.5) * 5
      };
    });
  };

  const recordSimulationStep = (scenario: SimulationScenario, step: number, progress: number) => {
    // Record detailed simulation data for analysis
    const stepData = {
      timestamp: Date.now(),
      step,
      progress,
      vitals: { ...patientVitals },
      scenario: scenario.id,
      events: generateSimulationEvents(scenario, progress)
    };
    
    // In a real implementation, this would be stored in a database
    console.log('Simulation step recorded:', stepData);
  };

  const generateSimulationEvents = (scenario: SimulationScenario, progress: number) => {
    const events = [];
    
    // Generate realistic surgical events based on progress
    if (progress > 20 && progress < 25) {
      events.push('Craniotomy completed');
    }
    if (progress > 40 && progress < 45) {
      events.push('Tumor visualization achieved');
    }
    if (progress > 60 && progress < 65) {
      events.push('Resection initiated');
    }
    if (progress > 80 && progress < 85) {
      events.push('Hemostasis achieved');
    }
    
    return events;
  };

  const generateSimulationResults = (scenario: SimulationScenario) => {
    // Generate comprehensive simulation results
    const successProbability = Math.random();
    const outcome = successProbability > 0.7 ? scenario.outcomes[0] : 
                   successProbability > 0.4 ? scenario.outcomes[1] : scenario.outcomes[2];
    
    return {
      scenario: scenario.name,
      outcome,
      duration: scenario.duration,
      successRate: (successProbability * 100).toFixed(1),
      complications: successProbability < 0.3 ? ['Minor bleeding', 'Temporary swelling'] : [],
      recommendations: [
        'Monitor patient for 24 hours post-surgery',
        'Follow-up imaging in 48 hours',
        'Neurological assessment every 2 hours'
      ],
      physiologicalData: {
        avgHeartRate: patientVitals.heartRate,
        maxICP: Math.max(20, patientVitals.intracranialPressure + 10),
        bloodLoss: Math.random() * 200 + 50
      }
    };
  };

  const animate = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    requestAnimationFrame(animate);

    // Animate digital twin elements
    if (sceneRef.current) {
      const time = Date.now() * 0.001;
      
      sceneRef.current.traverse((child) => {
        if (child.userData.type === 'vessel') {
          // Pulsing vessels based on heart rate
          const pulse = Math.sin(time * (patientVitals.heartRate / 60) * 2) * 0.1 + 1;
          child.scale.setScalar(pulse);
        }
        
        if (child.userData.type === 'neural') {
          // Neural activity visualization
          const activity = child.userData.activity;
          const opacity = Math.sin(time * activity * 5) * 0.3 + 0.6;
          if (child.material) {
            (child.material as THREE.Material).opacity = opacity;
          }
        }
        
        if (child.userData.type === 'tumor' && isSimulating) {
          // Simulate tumor changes during surgery
          const shrinkage = simulationProgress / 100;
          child.scale.setScalar(1 - shrinkage * 0.8);
        }
      });
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

  const getVitalColor = (vital: string, value: number) => {
    switch (vital) {
      case 'heartRate':
        return value > 100 || value < 60 ? 'text-red-600' : 'text-green-600';
      case 'oxygenSaturation':
        return value < 95 ? 'text-red-600' : 'text-green-600';
      case 'intracranialPressure':
        return value > 20 ? 'text-red-600' : value > 15 ? 'text-yellow-600' : 'text-green-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Digital Twin Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                Digital Twin Surgical Simulator
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Physics-based patient simulation for surgical planning and training
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">Patient ID: {patientId}</div>
                <div className="text-xs text-slate-500">Digital Twin Active</div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Simulation Controls */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Simulation Controls</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Physics Engine
                  </label>
                  <select
                    value={physicsEngine}
                    onChange={(e) => setPhysicsEngine(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic Physics</option>
                    <option value="advanced">Advanced Biomechanics</option>
                    <option value="quantum">Quantum Molecular</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={realTimeMode}
                      onChange={(e) => setRealTimeMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Real-time Mode</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={multiPatientMode}
                      onChange={(e) => setMultiPatientMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Multi-Patient Mode</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Patient Vitals */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Live Patient Vitals</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">Heart Rate:</span>
                  <span className={`text-sm font-medium ${getVitalColor('heartRate', patientVitals.heartRate)}`}>
                    {patientVitals.heartRate.toFixed(0)} bpm
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">Blood Pressure:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {patientVitals.bloodPressure.systolic.toFixed(0)}/{patientVitals.bloodPressure.diastolic.toFixed(0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">O2 Saturation:</span>
                  <span className={`text-sm font-medium ${getVitalColor('oxygenSaturation', patientVitals.oxygenSaturation)}`}>
                    {patientVitals.oxygenSaturation.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">Temperature:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {patientVitals.temperature.toFixed(1)}°C
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">ICP:</span>
                  <span className={`text-sm font-medium ${getVitalColor('intracranialPressure', patientVitals.intracranialPressure)}`}>
                    {patientVitals.intracranialPressure.toFixed(1)} mmHg
                  </span>
                </div>
              </div>
            </div>

            {/* Simulation Scenarios */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Simulation Scenarios</h4>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {simulationScenarios.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => !isSimulating && startSimulation(scenario)}
                    disabled={isSimulating}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentScenario?.id === scenario.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{scenario.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        scenario.complexity === 'high' ? 'bg-red-100 text-red-700' :
                        scenario.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {scenario.complexity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">{scenario.description}</div>
                    <div className="text-xs text-slate-400">{scenario.duration} minutes</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Status */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Simulation Status</h4>
              
              {isSimulating ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Cpu className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-medium text-slate-900">Simulating...</p>
                    <p className="text-xs text-slate-600">{currentScenario?.name}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(simulationProgress)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${simulationProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : simulationResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">Simulation Complete</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-slate-900 mb-2">Latest Results</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Outcome:</span>
                        <span className="font-medium">{simulationResults[0]?.outcome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-medium">{simulationResults[0]?.successRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Ready to simulate</p>
                  <p className="text-xs text-slate-400">Select a scenario to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Twin Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Digital Twin Visualization
          </h3>
        </div>

        <div className="p-6">
          <div className="bg-black rounded-lg overflow-hidden">
            <div ref={mountRef} className="w-full h-96" />
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Simulation Results & Analysis
            </h3>
          </div>

          <div className="p-6">
            {simulationResults.map((result, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Outcome Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Scenario:</span>
                        <span className="text-sm font-medium">{result.scenario}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Outcome:</span>
                        <span className="text-sm font-medium">{result.outcome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Success Rate:</span>
                        <span className="text-sm font-medium">{result.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Duration:</span>
                        <span className="text-sm font-medium">{result.duration} min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Physiological Data</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Avg Heart Rate:</span>
                        <span className="text-sm font-medium">{result.physiologicalData.avgHeartRate.toFixed(0)} bpm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Max ICP:</span>
                        <span className="text-sm font-medium">{result.physiologicalData.maxICP.toFixed(1)} mmHg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Blood Loss:</span>
                        <span className="text-sm font-medium">{result.physiologicalData.bloodLoss.toFixed(0)} ml</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Recommendations</h4>
                    <ul className="space-y-1">
                      {result.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTwinSimulator;