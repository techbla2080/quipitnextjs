
// pages/agents/3.tsx or app/(root)/(routes)/agents3/page.tsx (continued)
placeholder="Plant a new task..."
disabled={loading}
className="w-full bg-white/5 border border-gray-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
/>
</div>

<div className="flex justify-between mt-3 gap-2">
<button 
type="submit" 
disabled={loading}
className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex-grow"
>
{loading ? 'Planting...' : 'Plant Task'}
</button>

<button
type="button"
onClick={prioritizeTasks}
disabled={prioritizing || pendingTasks.length < 2}
className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
>
{prioritizing ? 'Prioritizing...' : 'AI Prioritize'}
</button>
</div>
</form>

{/* Task List */}
<div className="mb-8">
<h2 className="text-xl text-emerald-400 mb-4">Growing Tasks</h2>
{pendingTasks.length === 0 ? (
<div className="text-gray-400 text-center py-8 border border-dashed border-gray-700 rounded-xl">
No active tasks. Add one to start growing your tree!
</div>
) : (
<div className="space-y-4">
{pendingTasks.map(task => (
  <div 
    key={task.id} 
    className={`border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 ${
      task.category === 'creative' ? 'border-l-4 border-l-purple-500' :
      task.category === 'analytical' ? 'border-l-4 border-l-blue-500' :
      'border-l-4 border-l-emerald-500'
    }`}
  >
    <div className="flex items-start p-4 bg-gray-800/50">
      <div 
        className="flex-grow cursor-pointer" 
        onClick={() => toggleTaskExpansion(task.id)}
      >
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${
            task.category === 'creative' ? 'bg-purple-500' :
            task.category === 'analytical' ? 'bg-blue-500' :
            'bg-emerald-500'
          }`}></span>
          <h3 className="text-lg font-medium text-white">{task.title}</h3>
        </div>
        <div className="mt-1">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 mr-2">
            {task.category || 'Task'}
          </span>
          <span className="text-xs text-gray-400">
            {/* Show AI assistant indicator */}
            <span className="inline-flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
              Growth Spirit Available
            </span>
          </span>
        </div>
        <FocusTimer taskId={task.id} onComplete={handleTimerComplete} />
      </div>
      <button 
        onClick={() => completeTask(task.id)} 
        className="ml-4 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        Complete
      </button>
    </div>
    
    {/* Expanded view with AI */}
    {expandedTaskId === task.id && (
      <TaskAI task={task} />
    )}
  </div>
))}
</div>
)}
</div>

{/* Completed Tasks */}
<div className="mb-8">
<h2 className="text-xl text-emerald-400 mb-4">Harvested Tasks</h2>
{completedTasks.length === 0 ? (
<div className="text-gray-400 text-center py-4 border border-dashed border-gray-700 rounded-xl">
No completed tasks yet.
</div>
) : (
<div className="space-y-2">
{completedTasks.map(task => (
  <div 
    key={task.id} 
    className="p-3 rounded-lg bg-gray-800/30 opacity-70"
  >
    <p className="text-gray-300 line-through">{task.title}</p>
  </div>
))}
</div>
)}
</div>

{/* Dashboard */}
<Dashboard 
completedTasks={completedTasks.length} 
pendingTasks={pendingTasks.length}
treeLevel={treeLevel}
treePoints={treePoints}
/>
</div>
</div>
);
}
