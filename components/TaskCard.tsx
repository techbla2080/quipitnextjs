// components/TaskCard.tsx
import { motion } from 'framer-motion';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: 'pending' | 'in-progress' | 'done') => void;
  onFocus: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskCard({ task, onStatusChange, onFocus, onDelete, onEdit }: TaskCardProps) {
  // Get border color based on category
  const getBorderColor = () => {
    switch (task.category) {
      case 'creative':
        return 'border-neon-purple';
      case 'analytical':
        return 'border-neon-cyan';
      case 'routine':
        return 'border-neon-green';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-900/50 backdrop-blur-md p-4 rounded-lg border ${getBorderColor()} shadow-[0_0_15px_rgba(80,255,255,0.1)]`}
      whileHover={{ scale: 1.02 }}
    >
      <h3 className="text-white font-medium text-lg mb-2">{task.title}</h3>
      
      {task.description && (
        <p className="text-gray-400 text-sm mb-3">{task.description}</p>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
        {task.category && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
            {task.category}
          </span>
        )}
        
        {task.tags && task.tags.map(tag => (
          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <motion.button
            onClick={() => onFocus(task.id)}
            className="p-1.5 bg-neon-cyan/20 text-neon-cyan rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Focus
          </motion.button>
          
          <motion.button
            onClick={() => onDelete(task.id)}
            className="p-1.5 bg-red-500/20 text-red-400 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete
          </motion.button>
        </div>
        
        <motion.button
          onClick={() => onStatusChange(task.id, task.status === 'done' ? 'pending' : 'done')}
          className={`px-3 py-1.5 rounded-lg font-medium ${
            task.status === 'done' 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-neon-cyan text-gray-900 shadow-[0_0_10px_rgba(80,255,255,0.3)]'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {task.status === 'done' ? 'Undo' : 'Complete'}
        </motion.button>
      </div>
    </motion.div>
  );
}