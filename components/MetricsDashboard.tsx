// components/MetricsDashboard.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MetricsDashboardProps {
  tasks: Task[];
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ tasks }) => {
  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    // Calculate category distribution
    const categoryDistribution = [
      { name: 'Creative', value: tasks.filter(task => task.category === 'creative').length },
      { name: 'Analytical', value: tasks.filter(task => task.category === 'analytical').length },
      { name: 'Routine', value: tasks.filter(task => task.category === 'routine').length },
    ];
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
      categoryDistribution
    };
  }, [tasks]);
  
  // Colors for the charts
  const COLORS = ['#FF5FD9', '#50FFFF', '#50FF96'];
  
  return (
    <section className="mt-16 mb-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
          Productivity Dashboard
        </h2>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Completed Tasks */}
          <motion.div 
            className="bg-gray-800/30 backdrop-blur-md border border-neon-green/20 rounded-xl p-6 shadow-[0_0_20px_rgba(80,255,150,0.1)]"
            whileHover={{ y: -5, boxShadow: '0 0 25px rgba(80,255,150,0.2)' }}
          >
            <h3 className="text-gray-400 text-sm font-medium mb-1">Completed Tasks</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neon-green">{metrics.completedTasks}</span>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-neon-green/20 text-neon-green">
                  {metrics.completionRate}% Completion
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* In Progress Tasks */}
          <motion.div 
            className="bg-gray-800/30 backdrop-blur-md border border-neon-purple/20 rounded-xl p-6 shadow-[0_0_20px_rgba(255,95,217,0.1)]"
            whileHover={{ y: -5, boxShadow: '0 0 25px rgba(255,95,217,0.2)' }}
          >
            <h3 className="text-gray-400 text-sm font-medium mb-1">In Progress</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neon-purple">{metrics.inProgressTasks}</span>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-neon-purple/20 text-neon-purple">
                  {metrics.totalTasks > 0 ? Math.round((metrics.inProgressTasks / metrics.totalTasks) * 100) : 0}% of Total
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* Pending Tasks */}
          <motion.div 
            className="bg-gray-800/30 backdrop-blur-md border border-neon-cyan/20 rounded-xl p-6 shadow-[0_0_20px_rgba(80,255,255,0.1)]"
            whileHover={{ y: -5, boxShadow: '0 0 25px rgba(80,255,255,0.2)' }}
          >
            <h3 className="text-gray-400 text-sm font-medium mb-1">Pending Tasks</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neon-cyan">{metrics.pendingTasks}</span>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-neon-cyan/20 text-neon-cyan">
                  {metrics.totalTasks > 0 ? Math.round((metrics.pendingTasks / metrics.totalTasks) * 100) : 0}% of Total
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* Completion Rate */}
          <motion.div 
            className="bg-gray-800/30 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            whileHover={{ y: -5, boxShadow: '0 0 25px rgba(255,255,255,0.1)' }}
          >
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Tasks</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-white">{metrics.totalTasks}</span>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-white/10 text-gray-300">
                  {metrics.completionRate}% Complete
                </span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Category Distribution Chart */}
        <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 shadow-[0_0_20px_rgba(80,255,255,0.1)]">
          <h3 className="text-xl font-medium mb-4 text-white">Task Categories</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1000}
                    animationBegin={200}
                  >
                    {metrics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(26, 32, 44, 0.8)', 
                      borderColor: 'rgba(80, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                {metrics.categoryDistribution.map((category, index) => (
                  <div key={category.name} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">{category.name}</span>
                        <span className="text-white font-medium">{category.value}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                        <motion.div 
                          className="h-1.5 rounded-full" 
                          style={{ 
                            backgroundColor: COLORS[index % COLORS.length],
                            width: metrics.totalTasks > 0 ? `${(category.value / metrics.totalTasks) * 100}%` : '0%'
                          }}
                          initial={{ width: '0%' }}
                          animate={{ width: metrics.totalTasks > 0 ? `${(category.value / metrics.totalTasks) * 100}%` : '0%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default MetricsDashboard;