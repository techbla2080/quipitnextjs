// components/VisualizationTabs.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types';
import MetricsDashboard from './MetricsDashboard';
import TaskVisualization3D from './TaskVisualization3D';

interface VisualizationTabsProps {
  tasks: Task[];
}

const VisualizationTabs: React.FC<VisualizationTabsProps> = ({ tasks }) => {
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d');
  
  return (
    <section className="mt-16 mb-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
          Task Analytics
        </h2>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex p-1 bg-gray-800/50 backdrop-blur-md rounded-lg">
            <button
              onClick={() => setActiveTab('2d')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
                activeTab === '2d'
                  ? 'bg-neon-cyan text-gray-900 shadow-[0_0_15px_rgba(80,255,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Statistics Dashboard
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
                activeTab === '3d'
                  ? 'bg-neon-cyan text-gray-900 shadow-[0_0_15px_rgba(80,255,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              3D Visualization
            </button>
          </div>
        </div>
        
        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-[0_0_20px_rgba(80,255,255,0.1)]"
          >
            {activeTab === '2d' ? (
              <div className="p-0">
                <MetricsDashboard tasks={tasks} />
              </div>
            ) : (
              <div className="p-6">
                <TaskVisualization3D tasks={tasks} />
                
                {/* Legend for 3D visualization */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-white mb-2">Shapes by Category</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                        <span className="text-gray-300">Icosahedron = Creative</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                        <span className="text-gray-300">Octahedron = Analytical</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                        <span className="text-gray-300">Cube = Routine</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-white mb-2">Colors by Status</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-neon-cyan mr-2"></div>
                        <span className="text-gray-300">Cyan = Pending</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-neon-purple mr-2"></div>
                        <span className="text-gray-300">Purple = In Progress</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-neon-green mr-2"></div>
                        <span className="text-gray-300">Green = Completed</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-white mb-2">Height by Priority</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                        <span className="text-gray-300">Top Level = High Priority</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                        <span className="text-gray-300">Middle Level = Medium Priority</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
                        <span className="text-gray-300">Bottom Level = Low Priority</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-400 text-center">
                  <p>Drag to rotate | Scroll to zoom | Right-click drag to pan</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default VisualizationTabs;