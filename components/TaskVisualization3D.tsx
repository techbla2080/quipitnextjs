// components/TaskVisualization3D.tsx
import React, { useRef, useEffect } from 'react';
import { Task } from '@/types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TaskVisualization3DProps {
  tasks: Task[];
}

const TaskVisualization3D: React.FC<TaskVisualization3DProps> = ({ tasks }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const taskObjectsRef = useRef<THREE.Mesh[]>([]);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    // Create directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add a subtle glow to the scene
    const fogColor = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(fogColor, 0.025);
    
    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controlsRef.current = controls;
    
    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x050505, 0x101010);
    scene.add(gridHelper);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Rotate task objects gently
      taskObjectsRef.current.forEach((obj) => {
        obj.rotation.y += 0.005;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (sceneRef.current) {
        // Dispose geometries and materials
        taskObjectsRef.current.forEach((obj) => {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(material => material.dispose());
          } else {
            obj.material.dispose();
          }
          sceneRef.current?.remove(obj);
        });
      }
    };
  }, []);
  
  // Update task visualization when tasks change
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear previous task objects
    taskObjectsRef.current.forEach((obj) => {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(material => material.dispose());
      } else {
        obj.material.dispose();
      }
      sceneRef.current?.remove(obj);
    });
    
    taskObjectsRef.current = [];
    
    // Create new task objects
    tasks.forEach((task, index) => {
      // Determine status-based properties
      let geometry, material;
      
      // Different geometry based on category
      if (task.category === 'creative') {
        geometry = new THREE.IcosahedronGeometry(0.5);
      } else if (task.category === 'analytical') {
        geometry = new THREE.OctahedronGeometry(0.5);
      } else { // routine
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      }
      
      // Different color based on status
      if (task.status === 'pending') {
        material = new THREE.MeshStandardMaterial({
          color: 0x50FFFF, // neon cyan
          emissive: 0x50FFFF,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 0.8
        });
      } else if (task.status === 'in-progress') {
        material = new THREE.MeshStandardMaterial({
          color: 0xFF5FD9, // neon purple
          emissive: 0xFF5FD9,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 0.8
        });
      } else { // done
        material = new THREE.MeshStandardMaterial({
          color: 0x50FF96, // neon green
          emissive: 0x50FF96,
          emissiveIntensity: 0.3,
          roughness: 0.2, 
          metalness: 0.8
        });
      }
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position in circular arrangement
      const radius = 5;
      const angle = (index / tasks.length) * Math.PI * 2;
      
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.z = Math.sin(angle) * radius;
      
      // Set y position based on priority
      if (task.priority === 'high') {
        mesh.position.y = 2;
      } else if (task.priority === 'medium') {
        mesh.position.y = 1;
      } else {
        mesh.position.y = 0;
      }
      
      // Add to scene
      sceneRef.current?.add(mesh);
      taskObjectsRef.current.push(mesh);
    });
  }, [tasks]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg"
    />
  );
};

export default TaskVisualization3D;