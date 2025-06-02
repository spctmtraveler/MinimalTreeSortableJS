const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, content, is_section, completed, parent_id, position_order,
        revisit_date, fire, fast, flow, fear, first, time_estimate,
        overview, details, scheduled_time
      FROM tasks 
      ORDER BY position_order ASC
    `);
    
    // Convert flat structure to nested tree
    const tasksMap = new Map();
    const rootTasks = [];
    
    // First pass: create all task objects
    result.rows.forEach(row => {
      const task = {
        id: row.id,
        content: row.content,
        isSection: row.is_section,
        completed: row.completed,
        children: [],
        revisitDate: row.revisit_date,
        fire: row.fire,
        fast: row.fast,
        flow: row.flow,
        fear: row.fear,
        first: row.first,
        timeEstimate: parseFloat(row.time_estimate) || 0,
        overview: row.overview || '',
        details: row.details || '',
        scheduledTime: row.scheduled_time
      };
      tasksMap.set(row.id, task);
    });
    
    // Second pass: build the tree structure
    result.rows.forEach(row => {
      const task = tasksMap.get(row.id);
      if (row.parent_id && tasksMap.has(row.parent_id)) {
        tasksMap.get(row.parent_id).children.push(task);
      } else {
        rootTasks.push(task);
      }
    });
    
    res.json(rootTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const {
      id, content, isSection, completed, parentId, positionOrder,
      revisitDate, fire, fast, flow, fear, first, timeEstimate,
      overview, details, scheduledTime
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO tasks (
        id, content, is_section, completed, parent_id, position_order,
        revisit_date, fire, fast, flow, fear, first, time_estimate,
        overview, details, scheduled_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      id, content, isSection || false, completed || false, parentId, positionOrder || 0,
      revisitDate, fire || false, fast || false, flow || false, fear || false, first || false,
      timeEstimate || 0, overview || '', details || '', scheduledTime
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      content, completed, revisitDate, fire, fast, flow, fear, first,
      timeEstimate, overview, details, scheduledTime
    } = req.body;
    
    console.log('UPDATE REQUEST for task:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Handle empty dates - convert empty strings to null for PostgreSQL
    const cleanRevisitDate = revisitDate === '' || revisitDate === undefined ? null : revisitDate;
    const cleanScheduledTime = scheduledTime === '' || scheduledTime === undefined ? null : scheduledTime;
    
    console.log('Cleaned dates:', { cleanRevisitDate, cleanScheduledTime });
    
    const result = await pool.query(`
      UPDATE tasks SET
        content = $2,
        completed = $3,
        revisit_date = $4,
        fire = $5,
        fast = $6,
        flow = $7,
        fear = $8,
        first = $9,
        time_estimate = $10,
        overview = $11,
        details = $12,
        scheduled_time = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id, content, completed, cleanRevisitDate, fire, fast, flow, fear, first,
      timeEstimate, overview, details, cleanScheduledTime
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Update task positions (for drag and drop)
app.put('/api/tasks/reorder', async (req, res) => {
  try {
    const { updates } = req.body; // Array of {id, parentId, positionOrder}
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const update of updates) {
        await client.query(
          'UPDATE tasks SET parent_id = $2, position_order = $3 WHERE id = $1',
          [update.id, update.parentId, update.positionOrder]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Tasks reordered successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`DUN Task Management server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await pool.end();
  process.exit(0);
});