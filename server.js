// Small Express server to provide API for Replit Database
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('@replit/database');

// Create DB client
const db = new Database();

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(bodyParser.json());

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const keys = await db.list();
    const tasks = [];
    
    // Filter for only task keys - ensure keys is an array
    let taskKeys = [];
    if (Array.isArray(keys)) {
      taskKeys = keys.filter(key => key.startsWith('task:'));
    } else if (typeof keys === 'object') {
      // Handle if keys is not an array but an object with keys
      taskKeys = Object.keys(keys).filter(key => key.startsWith('task:'));
    }
    
    // Retrieve each task
    for (const key of taskKeys) {
      const task = await db.get(key);
      if (task) tasks.push(task);
    }
    
    // Return all tasks as array
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Save a single task
app.post('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const taskData = req.body;
    
    // Validate required task data
    if (!taskId || !taskData) {
      return res.status(400).json({ error: 'Missing task ID or data' });
    }
    
    // Save task to database
    await db.set(`task:${taskId}`, taskData);
    
    res.json({ success: true, message: 'Task saved successfully' });
  } catch (error) {
    console.error('Error saving task:', error);
    res.status(500).json({ error: 'Failed to save task' });
  }
});

// Save all tasks
app.post('/api/tasks', async (req, res) => {
  try {
    const tasks = req.body;
    
    // Validate tasks array
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Expected an array of tasks' });
    }
    
    // Save each task
    for (const task of tasks) {
      if (task && task.id) {
        await db.set(`task:${task.id}`, task);
      }
    }
    
    res.json({ success: true, message: `Saved ${tasks.length} tasks` });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Delete the task
    await db.delete(`task:${taskId}`);
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Serve static files from the root
app.use(express.static('.'));

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`API server running at http://0.0.0.0:${port}`);
  console.log(`WebApp accessible at http://0.0.0.0:5000`);
});

// Handle termination signals properly
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});