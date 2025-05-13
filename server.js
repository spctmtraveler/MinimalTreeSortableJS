// Small Express server to provide API for Replit Database
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('@replit/database');

// Create Express app
const app = express();
const port = 3000; // Backend API port
const db = new Database();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static('.')); // Serve static files from current directory

// Database key for the task tree
const TASKS_KEY = 'dun_tasks';

// --- API Routes ---

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.get(TASKS_KEY);
    res.json(tasks || []);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Save all tasks
app.post('/api/tasks', async (req, res) => {
  try {
    const tasks = req.body;
    await db.set(TASKS_KEY, tasks);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
});

// Get a single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await db.get(TASKS_KEY) || [];
    
    // Find task recursively
    const findTask = (taskList, id) => {
      for (const task of taskList) {
        if (task.id === id) {
          return task;
        }
        if (task.children && task.children.length > 0) {
          const found = findTask(task.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const task = findTask(tasks, req.params.id);
    
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Update a single task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const taskData = req.body;
    
    // Get current tasks
    let tasks = await db.get(TASKS_KEY) || [];
    
    // Update task recursively
    const updateTask = (taskList, id, newData) => {
      for (let i = 0; i < taskList.length; i++) {
        if (taskList[i].id === id) {
          // Keep the children array if not provided in the new data
          if (!newData.children && taskList[i].children) {
            newData.children = taskList[i].children;
          }
          // Update task
          taskList[i] = { ...taskList[i], ...newData };
          return true;
        }
        
        if (taskList[i].children && taskList[i].children.length > 0) {
          if (updateTask(taskList[i].children, id, newData)) {
            return true;
          }
        }
      }
      return false;
    };
    
    if (updateTask(tasks, taskId, taskData)) {
      await db.set(TASKS_KEY, tasks);
      res.json({ success: true });
    } else {
      // If task not found, add it
      if (taskData.id === taskId) {
        // If it's a root task
        tasks.push(taskData);
        await db.set(TASKS_KEY, tasks);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Task not found and could not be created' });
      }
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Get current tasks
    let tasks = await db.get(TASKS_KEY) || [];
    
    // Delete task recursively
    const deleteTask = (taskList, id) => {
      for (let i = 0; i < taskList.length; i++) {
        if (taskList[i].id === id) {
          // Remove the task
          taskList.splice(i, 1);
          return true;
        }
        
        if (taskList[i].children && taskList[i].children.length > 0) {
          if (deleteTask(taskList[i].children, id)) {
            return true;
          }
        }
      }
      return false;
    };
    
    if (deleteTask(tasks, taskId)) {
      await db.set(TASKS_KEY, tasks);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Clear all tasks
app.delete('/api/tasks', async (req, res) => {
  try {
    await db.delete(TASKS_KEY);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing tasks:', error);
    res.status(500).json({ error: 'Failed to clear tasks' });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`API server running at http://0.0.0.0:${port}`);
  console.log(`WebApp accessible at http://0.0.0.0:5000`);
});