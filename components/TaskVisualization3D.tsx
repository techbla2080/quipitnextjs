// components/TaskVisualization3D.tsx
import React, { useRef, useEffect, useState } from 'react';
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
  const taskObjectsRef = useRef<THREE.Group[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Helper function to get color by category
  const getColorByCategory = (category: string): THREE.Color => {
    switch (category) {
      case 'creative':
        return new THREE.Color(0x50FFFF); // Cyan
      case 'analytical':
        return new THREE.Color(0xFF5FD9); // Purple
      case 'routine':
        return new THREE.Color(0x50FF96); // Green
      default:
        return new THREE.Color(0xFFFFFF); // White
    }
  };
  
  // Helper function to get color by status
  const getColorByStatus = (status: string): THREE.Color => {
    switch (status) {
      case 'pending':
        return new THREE.Color(0x50FFFF); // Cyan
      case 'in-progress':
        return new THREE.Color(0xFF5FD9); // Purple
      case 'done':
        return new THREE.Color(0x50FF96); // Green
      default:
        return new THREE.Color(0xFFFFFF); // White
    }
  };
  
  // Helper function to get task height based on priority
  const getTaskHeight = (priority: string): number => {
    switch (priority) {
      case 'high':
        return 2.5;
      case 'medium':
        return 1.5;
      case 'low':
        return 0.8;
      default:
        return 1;
    }
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene with dark blue background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1f);
    scene.fog = new THREE.FogExp2(0x0a0a1f, 0.03);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 25);
    cameraRef.current = camera;
    
    // Create renderer with anti-aliasing
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x222233, 1);
    scene.add(ambientLight);
    
    // Add directional light (with shadows)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Add point lights for each category to create glow effects
    const greenLight = new THREE.PointLight(0x50FF96, 1, 15);
    greenLight.position.set(-10, 5, -5);
    scene.add(greenLight);
    
    const purpleLight = new THREE.PointLight(0xFF5FD9, 1, 15);
    purpleLight.position.set(0, 5, 0);
    scene.add(purpleLight);
    
    const cyanLight = new THREE.PointLight(0x50FFFF, 1, 15);
    cyanLight.position.set(10, 5, 5);
    scene.add(cyanLight);
    
    // Create orbit controls for navigation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 10;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Limit vertical rotation to prevent going below the ground
    controlsRef.current = controls;
    
    // Create grid for ground plane
    const groundGrid = new THREE.GridHelper(80, 80, 0x333355, 0x222233);
    groundGrid.position.y = -0.01;
    scene.add(groundGrid);
    
    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(80, 60);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x151525,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add time axis labels
    const createTimeLabel = (text: string, x: number, z: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;
      
      canvas.width = 256;
      canvas.height = 128;
      context.fillStyle = '#151525';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = 'Bold 40px Arial';
      context.fillStyle = text === 'PRESENT' ? '#AAAAFF' : '#8888AA';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(10, 5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 0.1, z);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);
      
      return mesh;
    };
    
    createTimeLabel('PAST', -20, 10);
    createTimeLabel('PRESENT', 0, 0);
    createTimeLabel('FUTURE', 20, -10);
    
    // Create category path indicators
    const createCategoryPath = (color: THREE.Color, y: number) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-25, y, 15),
        new THREE.Vector3(-15, y, 8),
        new THREE.Vector3(-5, y, 5),
        new THREE.Vector3(5, y, 0),
        new THREE.Vector3(15, y, -5),
        new THREE.Vector3(25, y, -12)
      ]);
      
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        linewidth: 2
      });
      
      const curveObject = new THREE.Line(geometry, material);
      scene.add(curveObject);
      
      // Add small identifier for the path
      const sphereGeom = new THREE.SphereGeometry(0.3, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(-28, y, 17);
      scene.add(sphere);
      
      // Create label for path
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = 'rgba(0,0,0,0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = '20px Arial';
      context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      
      let categoryName = '';
      if (color.r > 0.5 && color.g > 0.5) categoryName = 'Creative';
      else if (color.r > 0.5) categoryName = 'Analytical';
      else categoryName = 'Routine';
      
      context.fillText(categoryName, 10, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material2 = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry2 = new THREE.PlaneGeometry(6, 3);
      const label = new THREE.Mesh(geometry2, material2);
      label.position.set(-30, y, 17);
      label.rotation.y = Math.PI / 4;
      scene.add(label);
    };
    
    createCategoryPath(new THREE.Color(0x50FF96), 0.5); // Routine
    createCategoryPath(new THREE.Color(0xFF5FD9), 1.0); // Analytical
    createCategoryPath(new THREE.Color(0x50FFFF), 1.5); // Creative
    
    // Create priority scale
    const createPriorityIndicator = (label: string, y: number, color: string) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;
      
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = 'rgba(0,0,0,0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = '18px Arial';
      context.fillStyle = color;
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillText(label, 10, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(5, 2.5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-32, y, 0);
      mesh.rotation.y = Math.PI / 2;
      scene.add(mesh);
      
      return mesh;
    };
    
    createPriorityIndicator('HIGH', 6, '#AAAAFF');
    createPriorityIndicator('MEDIUM', 3, '#8888AA');
    createPriorityIndicator('LOW', 0.8, '#666688');
    
    // Vertical line for priority scale
    const priorityLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-32, 0, 0),
      new THREE.Vector3(-32, 7, 0)
    ]);
    const priorityLineMaterial = new THREE.LineBasicMaterial({ color: 0x444466 });
    const priorityLine = new THREE.Line(priorityLineGeometry, priorityLineMaterial);
    scene.add(priorityLine);
    
    // Add legend
    const createLegend = () => {
      const legendGroup = new THREE.Group();
      
      // Background panel
      const panelGeometry = new THREE.PlaneGeometry(14, 11);
      const panelMaterial = new THREE.MeshBasicMaterial({
        color: 0x151525,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      legendGroup.add(panel);
      
      // Title and entries
      const createLegendText = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;
        
        canvas.width = 512;
        canvas.height = 512;
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        context.font = 'Bold 40px Arial';
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText('LEGEND', canvas.width / 2, 80);
        
        // Legend entries
        context.font = '30px Arial';
        context.textAlign = 'left';
        
        // Creative
        context.fillStyle = '#50FFFF';
        context.beginPath();
        context.arc(120, 180, 15, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#FFFFFF';
        context.fillText('Creative Tasks', 150, 170);
        
        // Analytical
        context.fillStyle = '#FF5FD9';
        context.beginPath();
        context.arc(120, 240, 15, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#FFFFFF';
        context.fillText('Analytical Tasks', 150, 230);
        
        // Routine
        context.fillStyle = '#50FF96';
        context.beginPath();
        context.arc(120, 300, 15, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#FFFFFF';
        context.fillText('Routine Tasks', 150, 290);
        
        // Status entries
        context.fillStyle = '#50FFFF';
        context.fillText('To Do', 150, 350);
        context.fillStyle = '#FF5FD9';
        context.fillText('In Progress', 150, 400);
        context.fillStyle = '#50FF96';
        context.fillText('Completed', 150, 450);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });
        const geometry = new THREE.PlaneGeometry(13, 10);
        const legendTextMesh = new THREE.Mesh(geometry, material);
        legendTextMesh.position.z = 0.1;
        
        return legendTextMesh;
      };
      
      const legendText = createLegendText();
      if (legendText) legendGroup.add(legendText);
      
      // Position the legend in top-right corner
      legendGroup.position.set(25, 16, -10);
      legendGroup.rotation.y = -Math.PI / 6;
      
      scene.add(legendGroup);
    };
    
    createLegend();
    
    // Create title and instruction text at the top
    const createTitle = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;
      
      canvas.width = 1024;
      canvas.height = 256;
      context.fillStyle = 'rgba(0,0,0,0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Title
      context.font = 'Bold 60px Arial';
      context.fillStyle = '#AAAAFF';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('3D TASK LANDSCAPE', canvas.width / 2, canvas.height / 2 - 40);
      
      // Instructions
      context.font = '30px Arial';
      context.fillStyle = '#7777AA';
      context.fillText('Drag to rotate | Scroll to zoom | Click task for details', canvas.width / 2, canvas.height / 2 + 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(30, 7.5);
      const titleMesh = new THREE.Mesh(geometry, material);
      titleMesh.position.set(0, 25, 0);
      titleMesh.rotation.x = -Math.PI / 8;
      
      scene.add(titleMesh);
    };
    
    createTitle();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Animate task objects - gentle floating motion
      taskObjectsRef.current.forEach((taskGroup, index) => {
        const timeOffset = index * 0.5;
        taskGroup.position.y += Math.sin(Date.now() * 0.001 + timeOffset) * 0.003;
        taskGroup.rotation.y += 0.002;
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
        taskObjectsRef.current.forEach((group) => {
          group.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
          sceneRef.current?.remove(group);
        });
      }
    };
  }, []);
  
  // Create task objects
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear previous task objects
    taskObjectsRef.current.forEach((group) => {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      sceneRef.current?.remove(group);
    });
    
    taskObjectsRef.current = [];
    
    // Group tasks by status
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const completedTasks = tasks.filter(task => task.status === 'done');
    
    // Create connector paths between tasks
    if (tasks.length > 1) {
      // Simple representation of task flow
      const flowPoints: THREE.Vector3[] = [];
      
      // Add points for each status group - following a curved path
      if (completedTasks.length) {
        flowPoints.push(new THREE.Vector3(-15, 2, 5));
      }
      
      if (inProgressTasks.length) {
        flowPoints.push(new THREE.Vector3(0, 3, 0));
      }
      
      if (pendingTasks.length) {
        flowPoints.push(new THREE.Vector3(15, 4, -5));
      }
      
      if (flowPoints.length > 1) {
        const curve = new THREE.CatmullRomCurve3(flowPoints);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create a gradient-like effect with multiple segments
        const segments = 5;
        const colors = [
          new THREE.Color(0x50FF96), // Green (completed)
          new THREE.Color(0xFF5FD9), // Purple (in progress)
          new THREE.Color(0x50FFFF)  // Cyan (pending)
        ];
        
        for (let i = 0; i < segments; i++) {
          const startIdx = Math.floor((points.length / segments) * i);
          const endIdx = Math.floor((points.length / segments) * (i + 1));
          
          if (startIdx < points.length && endIdx <= points.length) {
            const segmentPoints = points.slice(startIdx, endIdx);
            const segmentGeometry = new THREE.BufferGeometry().setFromPoints(segmentPoints);
            
            // Interpolate between colors
            const startColor = colors[Math.floor(i * colors.length / segments)];
            const endColor = colors[Math.floor((i + 1) * colors.length / segments)];
            const lerpAmount = (i % (segments / colors.length)) / (segments / colors.length);
            const segmentColor = new THREE.Color().lerpColors(startColor, endColor, lerpAmount);
            
            const material = new THREE.LineBasicMaterial({
              color: segmentColor,
              linewidth: 3,
              transparent: true,
              opacity: 0.8
            });
            
            const line = new THREE.Line(segmentGeometry, material);
            sceneRef.current?.add(line);
          }
        }
      }
    }
    
    // Create task objects with their positions based on status and category
    const createTaskObject = (task: Task, index: number, position: THREE.Vector3) => {
      const taskGroup = new THREE.Group();
      taskGroup.position.copy(position);
      
      // Get height based on priority
      const height = getTaskHeight(task.priority || 'medium'); // FIX: Add default value for priority
      
      // Determine material based on status
      const color = getColorByStatus(task.status || 'pending'); // FIX: Add default value for status
      
      // Create crystal-like shape for the task
      let geometry;
      
      if (task.category === 'creative') {
        // Icosahedron for creative tasks
        geometry = new THREE.IcosahedronGeometry(height * 0.7, 0);
      } else if (task.category === 'analytical') {
        // Octahedron for analytical tasks
        geometry = new THREE.OctahedronGeometry(height * 0.8);
      } else {
        // Cube/Diamond for routine tasks
        geometry = new THREE.BoxGeometry(height * 0.75, height * 1.2, height * 0.75);
        
        // Rotate to diamond orientation
        taskGroup.rotation.y = Math.PI / 4;
      }
      
      // Create glowing material
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
      });
      
      const taskMesh = new THREE.Mesh(geometry, material);
      taskMesh.castShadow = true;
      taskMesh.receiveShadow = true;
      taskGroup.add(taskMesh);
      
      // Add glow effect (simple halo)
      const glowGeometry = new THREE.SphereGeometry(height * 1.2, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      taskGroup.add(glowMesh);
      
      // Create text label for task title
      const createTaskLabel = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;
        
        canvas.width = 512;
        canvas.height = 256;
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw task title
        context.font = 'Bold 36px Arial';
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Wrap text if needed
        const maxWidth = 450;
        // FIX: Add null check for task.title
        const words = (task.title || 'Untitled Task').split(' ');
        let line = '';
        let lines = [];
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && i > 0) {
            lines.push(line);
            line = words[i] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        
        // Draw lines
        let y = canvas.height / 2 - ((lines.length - 1) * 40) / 2;
        for (let i = 0; i < lines.length; i++) {
          context.fillText(lines[i], canvas.width / 2, y);
          y += 40;
        }
        
        // Draw status
        context.font = '30px Arial';
        context.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
        
        // FIX: Add default value for task.status
        const status = task.status || 'pending';
        context.fillText(
          status === 'pending' ? 'TO DO' : 
          status === 'in-progress' ? 'IN PROGRESS' : 'COMPLETED', 
          canvas.width / 2, 
          canvas.height - 60
        );
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });
        const geometry = new THREE.PlaneGeometry(10, 5);
        const labelMesh = new THREE.Mesh(geometry, material);
        labelMesh.position.y = height * 1.5;
        
        return labelMesh;
      };
      
      const label = createTaskLabel();
      if (label) taskGroup.add(label);
      
      // Add click interaction
      taskGroup.userData = {
        type: 'task',
        task: task,
        originalPosition: position.clone(),
        originalScale: new THREE.Vector3(1, 1, 1)
      };
      
      sceneRef.current?.add(taskGroup);
      taskObjectsRef.current.push(taskGroup);
      
      return taskGroup;
    };
    
    // Position tasks based on status and category
    // Completed tasks in the past (left)
    completedTasks.forEach((task, index) => {
      const xOffset = -15 - (index % 2) * 5;
      const zOffset = 5 + (index % 3) * 3;
      const y = getTaskHeight(task.priority || 'low') / 2; // FIX: Add default value for priority
      
      // Adjust for category
      let categoryOffset = 0;
      // FIX: Add default value for category
      const category = task.category || 'routine';
      if (category === 'creative') categoryOffset = 5;
      else if (category === 'analytical') categoryOffset = 0;
      else categoryOffset = -5;
      
      createTaskObject(
        task,
        index,
        new THREE.Vector3(xOffset, y, zOffset + categoryOffset)
      );
    });
    
    // In progress tasks in the present (middle)
    inProgressTasks.forEach((task, index) => {
      const xOffset = 0 - (index % 2) * 3;
      const zOffset = (index % 3) * 3;
      const y = getTaskHeight(task.priority || 'medium') / 2; // FIX: Add default value for priority
      
      // Adjust for category
      let categoryOffset = 0;
      // FIX: Add default value for category
      const category = task.category || 'routine';
      if (category === 'creative') categoryOffset = 3;
      else if (category === 'analytical') categoryOffset = 0;
      else categoryOffset = -3;
      
      createTaskObject(
        task,
        index,
        new THREE.Vector3(xOffset, y, zOffset + categoryOffset)
      );
    });
    
    // Pending tasks in the future (right)
    pendingTasks.forEach((task, index) => {
      const xOffset = 15 + (index % 2) * 5;
      const zOffset = -5 - (index % 3) * 3;
      const y = getTaskHeight(task.priority || 'medium') / 2; // FIX: Add default value for priority
      
      // Adjust for category
      let categoryOffset = 0;
      // FIX: Add default value for category
      const category = task.category || 'routine';
      if (category === 'creative') categoryOffset = -5;
      else if (category === 'analytical') categoryOffset = 0;
      else categoryOffset = 5;
      
      createTaskObject(
        task,
        index,
        new THREE.Vector3(xOffset, y, zOffset + categoryOffset)
      );
    });

    // After creating all task objects, adjust camera to fit them all
    if (taskObjectsRef.current.length > 0 && cameraRef.current) {
      // Calculate bounding box
      const box = new THREE.Box3();
      
      taskObjectsRef.current.forEach(group => {
        box.expandByObject(group);
      });
      
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Adjust camera position to ensure all tasks are visible
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
      
      // Add some padding
      cameraZ *= 1.5;
      
      // Set camera position
      cameraRef.current.position.set(center.x, center.y + 10, center.z + cameraZ);
      cameraRef.current.lookAt(center);
      
      // Update orbit controls target
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  }, [tasks]);

  // Handle raycasting for task interaction
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !containerRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject: THREE.Object3D | null = null;

    // Mouse move handler
    const onMouseMove = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update raycaster
      raycaster.setFromCamera(mouse, cameraRef.current!);
      
      // Check for intersections with task objects
      const intersects = raycaster.intersectObjects(
        taskObjectsRef.current.map(group => group.children).flat(),
        true
      );
      
      // Reset cursor and restore any previously hovered object
      containerRef.current!.style.cursor = 'default';
      
      if (hoveredObject && hoveredObject.parent) {
        // Restore original scale
        if (hoveredObject.parent.userData.originalScale) {
          hoveredObject.parent.scale.copy(hoveredObject.parent.userData.originalScale);
        }
        hoveredObject = null;
      }
      
      // Handle new intersection
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.parent && object.parent.userData.type === 'task') {
          containerRef.current!.style.cursor = 'pointer';
          hoveredObject = object;
          
          // Scale up slightly to show hover effect
          object.parent.scale.set(1.1, 1.1, 1.1);
        }
      }
    };

    // Click handler
    const onClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update raycaster
      raycaster.setFromCamera(mouse, cameraRef.current!);
      
      // Check for intersections with task objects
      const intersects = raycaster.intersectObjects(
        taskObjectsRef.current.map(group => group.children).flat(),
        true
      );
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.parent && object.parent.userData.type === 'task') {
          const task = object.parent.userData.task;
          
          // FIX: Add null checks for task properties
          // Show task details
          alert(
            `Task: ${task.title || 'Untitled'}\n` +
            `Status: ${task.status || 'pending'}\n` +
            `Category: ${task.category || 'routine'}\n` +
            `Priority: ${task.priority || 'medium'}\n\n` +
            `${task.description || 'No description'}`
          );
          
          // In a real app, you would show a modal or panel with task details
          // and actions instead of an alert
        }
      }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen()
            .then(() => {
              setIsFullscreen(true);
              // Handle resize after going fullscreen
              if (rendererRef.current && cameraRef.current) {
                rendererRef.current.setSize(window.innerWidth, window.innerHeight);
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
              }
            })
            .catch(err => {
              console.error("Couldn't enter fullscreen mode:", err);
            });
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
            .then(() => {
              setIsFullscreen(false);
              // Handle resize after exiting fullscreen
              if (containerRef.current && rendererRef.current && cameraRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;
                rendererRef.current.setSize(width, height);
                cameraRef.current.aspect = width / height;
                cameraRef.current.updateProjectionMatrix();
              }
            })
            .catch(err => {
              console.error("Couldn't exit fullscreen mode:", err);
            });
        }
      }
    };

    // Add event listeners
    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);

    // Create fullscreen button
    const fullscreenButton = document.createElement('button');
    fullscreenButton.textContent = 'Fullscreen';
    fullscreenButton.style.position = 'absolute';
    fullscreenButton.style.top = '10px';
    fullscreenButton.style.right = '10px';
    fullscreenButton.style.padding = '8px 12px';
    fullscreenButton.style.backgroundColor = 'rgba(80, 255, 255, 0.3)';
    fullscreenButton.style.color = 'white';
    fullscreenButton.style.border = '1px solid rgba(80, 255, 255, 0.6)';
    fullscreenButton.style.borderRadius = '4px';
    fullscreenButton.style.cursor = 'pointer';
    fullscreenButton.style.zIndex = '100';
    fullscreenButton.style.fontFamily = 'Arial, sans-serif';

    fullscreenButton.addEventListener('click', toggleFullscreen);

    containerRef.current.appendChild(fullscreenButton);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeEventListener('click', onClick);
        
        // Remove fullscreen button
        try {
          containerRef.current.removeChild(fullscreenButton);
        } catch (e) {
          console.log('Fullscreen button already removed');
        }
      }
    };
  }, []);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="w-full h-64 md:h-96 lg:h-[600px] rounded-xl overflow-hidden shadow-lg"
      />
    </div>
  );
};

export default TaskVisualization3D;