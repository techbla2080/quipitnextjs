// features/tasks.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Task {
  _id: string;
  userId: string;
  title: string;
  status: string;
  points: number;
  createdAt: string;
}

interface Tree {
  points: number;
  level: number;
}

interface TaskState {
  tasks: Task[];
  tree: Tree;
}

const initialState: TaskState = {
  tasks: [],
  tree: { points: 0, level: 1 },
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    completeTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(t => t._id === action.payload);
      if (task) {
        task.status = 'done';
        state.tree.points += 10;
        state.tree.level = Math.floor(state.tree.points / 10) + 1;
      }
    },
    updatePoints: (state, action: PayloadAction<number>) => {
      state.tree.points += action.payload;
      state.tree.level = Math.floor(state.tree.points / 10) + 1;
    },
    setTree: (state, action: PayloadAction<Tree>) => {
      state.tree = action.payload;
    },
    prioritizeTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
  },
});

export const { 
  setTasks, 
  addTask, 
  completeTask, 
  updatePoints, 
  setTree, 
  prioritizeTasks 
} = taskSlice.actions;

export default taskSlice.reducer;