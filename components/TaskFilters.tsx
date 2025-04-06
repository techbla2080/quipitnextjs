// components/TaskFilters.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

interface TaskFiltersProps {
  availableTags: string[];
  filterTag: string | null;
  setFilterTag: (tag: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: 'newest' | 'oldest' | 'priority';
  setSortBy: (sort: 'newest' | 'oldest' | 'priority') => void;
}

export default function TaskFilters({
  availableTags,
  filterTag,
  setFilterTag,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy
}: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-8 max-w-6xl mx-auto">
      {/* Search and filter toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="w-full sm:w-80 px-4 py-2 pl-10 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-white placeholder-gray-500"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 flex items-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </motion.button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
            className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
      
      {/* Tag filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <div className="p-4 bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Filter by Tags</h3>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterTag === null 
                    ? 'bg-neon-cyan text-gray-900 shadow-[0_0_10px_rgba(80,255,255,0.3)]' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    tag === filterTag 
                      ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(150,100,255,0.3)]' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}