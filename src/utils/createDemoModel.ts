import * as THREE from 'three';

/**
 * Creates a demo 3D medical model when GLB file is not available
 * This simulates a brain/skull structure for demonstration
 */
export function createDemoMedicalModel(): THREE.Group {
  const group = new THREE.Group();

  // Create brain structure
  const brainGeometry = new THREE.SphereGeometry(1.2, 32, 16);
  const brainMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFFB6C1,
    transparent: true,
    opacity: 0.8,
    shininess: 30
  });
  const brain = new THREE.Mesh(brainGeometry, brainMaterial);
  brain.scale.set(1, 0.9, 1.1); // Make it more brain-like
  group.add(brain);

  // Create skull outline
  const skullGeometry = new THREE.SphereGeometry(1.5, 32, 16);
  const skullMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xE5E5E5,
    transparent: true,
    opacity: 0.3,
    wireframe: false
  });
  const skull = new THREE.Mesh(skullGeometry, skullMaterial);
  group.add(skull);

  // Add brain hemispheres detail
  const leftHemisphere = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI);
  const rightHemisphere = new THREE.SphereGeometry(0.6, 16, 8, Math.PI, Math.PI);
  
  const hemisphereMatLeft = new THREE.MeshPhongMaterial({ color: 0xFF9999 });
  const hemisphereMatRight = new THREE.MeshPhongMaterial({ color: 0xFFAAAA });
  
  const leftBrain = new THREE.Mesh(leftHemisphere, hemisphereMatLeft);
  const rightBrain = new THREE.Mesh(rightHemisphere, hemisphereMatRight);
  
  leftBrain.position.set(-0.1, 0, 0);
  rightBrain.position.set(0.1, 0, 0);
  
  group.add(leftBrain);
  group.add(rightBrain);

  // Add some blood vessels
  for (let i = 0; i < 8; i++) {
    const vesselGeometry = new THREE.CylinderGeometry(0.02, 0.03, 2);
    const vesselMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    const vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
    
    const angle = (i / 8) * Math.PI * 2;
    vessel.position.set(
      Math.cos(angle) * 1.3,
      (Math.random() - 0.5) * 1.5,
      Math.sin(angle) * 1.3
    );
    vessel.rotation.z = Math.random() * Math.PI * 0.3;
    
    group.add(vessel);
  }

  // Add critical points (tumors/lesions)
  const criticalGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const criticalMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00FF00,
    emissive: 0x002200
  });
  
  for (let i = 0; i < 3; i++) {
    const critical = new THREE.Mesh(criticalGeometry, criticalMaterial);
    critical.position.set(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 2
    );
    group.add(critical);
  }

  return group;
}

export function createDemoSpineModel(): THREE.Group {
  const group = new THREE.Group();

  // Create vertebrae
  for (let i = 0; i < 7; i++) {
    const vertebraGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.2, 8);
    const vertebraMaterial = new THREE.MeshPhongMaterial({ color: 0xE5E5E5 });
    const vertebra = new THREE.Mesh(vertebraGeometry, vertebraMaterial);
    
    vertebra.position.y = i * 0.3 - 1;
    group.add(vertebra);

    // Add spinal processes
    const processGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.4);
    const process = new THREE.Mesh(processGeometry, vertebraMaterial);
    process.position.set(0, i * 0.3 - 1, 0.2);
    group.add(process);
  }

  // Add spinal cord
  const cordGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5);
  const cordMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFFFFAA,
    transparent: true,
    opacity: 0.7
  });
  const cord = new THREE.Mesh(cordGeometry, cordMaterial);
  cord.position.y = -0.5;
  group.add(cord);

  return group;
}