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

// Secret debug files aggregation page
app.get('/debug-files.html', (req, res) => {
  res.sendFile(__dirname + '/debug-files.html');
});

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

    console.log(`🌳 TREE BUILD: Processing ${result.rows.length} database rows`);

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
        const parent = tasksMap.get(row.parent_id);
        parent.children.push(task);
        console.log(`🌳 TREE BUILD: Added "${row.content}" as child of "${parent.content}"`);
      } else if (row.is_section || !row.parent_id) {
        // Only sections or tasks without parents go to root
        rootTasks.push(task);
        console.log(`🌳 TREE BUILD: Added "${row.content}" to root (is_section: ${row.is_section})`);
      } else {
        console.log(`🌳 TREE BUILD: ORPHANED "${row.content}" - parent_id "${row.parent_id}" not found`);
      }
    });

    console.log(`🌳 TREE BUILD: Final tree has ${rootTasks.length} root items`);
    rootTasks.forEach(item => {
      console.log(`🌳 ROOT: "${item.content}" with ${item.children.length} children`);
    });

    res.json(rootTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get raw tasks from database (for Hours panel)
app.get('/api/tasks/raw', async (req, res) => {
  try {
    console.log('RAW TASKS REQUEST: Getting all raw database records');
    const result = await pool.query(`
      SELECT 
        id, content, is_section, completed, parent_id, position_order,
        revisit_date, fire, fast, flow, fear, first, time_estimate,
        overview, details, scheduled_time
      FROM tasks 
      ORDER BY position_order
    `);

    console.log(`RAW TASKS: Returning ${result.rows.length} raw database records`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching raw tasks:', error);
    res.status(500).json({ error: 'Failed to fetch raw tasks' });
  }
});

// Get a single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('FETCH REQUEST for single task:', id);
    const result = await pool.query(`
      SELECT 
        id, content, is_section, completed, parent_id, position_order,
        revisit_date, fire, fast, flow, fear, first, time_estimate,
        overview, details, scheduled_time
      FROM tasks 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    console.log('FETCH SUCCESS: Found task:', task);
    res.json(task);
  } catch (error) {
    console.error('Error fetching single task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
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
      timeEstimate, overview, details, scheduledTime, parent_id, positionOrder
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
        parent_id = COALESCE($14, parent_id),
        position_order = COALESCE($15, position_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id, content, completed, cleanRevisitDate, fire, fast, flow, fear, first,
      timeEstimate, overview, details, cleanScheduledTime, parent_id, positionOrder
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

// Debug endpoint to view raw database data
app.get('/debug/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY position_order ASC');

    // Add HTML wrapper for better presentation
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DUN Tasks Database Debug - Raw JSON</title>
      <style>
        body { font-family: 'Courier New', monospace; background: #1a1a1a; color: #ddd; margin: 20px; }
        h1 { color: #00CEF7; }
        .description { color: #aaa; font-size: 14px; margin-bottom: 20px; font-style: italic; }
        .nav { margin: 20px 0; }
        .nav a { color: #00CEF7; margin-right: 15px; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
        pre { background: #2a2a2a; padding: 20px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>🔍 DUN Tasks Database Debug - Raw JSON</h1>
      <div class="description">Complete raw JSON dump of all database records, useful for API testing and data analysis.</div>
      <div class="nav">
        <a href="/debug/tasks">Raw JSON</a>
        <a href="/debug/table">Table View</a>
        <a href="/debug/formatted">Formatted View</a>
        <a href="/debug-files.html">File Aggregator</a>
        <a href="/filter-flow-diagram.html">Filter Flow Diagram</a>
        <a href="/">Back to App</a>
      </div>
      <pre>${JSON.stringify(result.rows, null, 2)}</pre>
    </body>
    </html>`;

    res.send(html);
  } catch (error) {
    console.error('Error fetching debug tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Reset database endpoint (dangerous operation)
app.post('/api/reset-database', async (req, res) => {
  try {
    console.log('🚨 DATABASE RESET: Clearing all tasks from database');
    await pool.query('DELETE FROM tasks');
    console.log('✅ DATABASE RESET: All tasks cleared successfully');
    res.json({ message: 'Database cleared successfully' });
  } catch (error) {
    console.error('❌ DATABASE RESET ERROR:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
});

// Load test data endpoint
app.post('/api/load-test-data', async (req, res) => {
  try {
    console.log('🧪 TEST DATA: Loading comprehensive test dataset');

    // First clear existing data
    await pool.query('DELETE FROM tasks');
    console.log('🧪 TEST DATA: Cleared existing data');

    // Load test data from JSON file
    const fs = require('fs');
    const path = require('path');
    const testDataPath = path.join(__dirname, 'test-data.json');
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

    // Calculate dynamic dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // This week calculation (Monday-based)
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const thisWeekDate = new Date(today);
    thisWeekDate.setDate(today.getDate() - daysSinceMonday + 3); // Wednesday

    // Next week calculation
    const nextWeekDate = new Date(thisWeekDate);
    nextWeekDate.setDate(thisWeekDate.getDate() + 7);

    // This month calculation
    const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), 15);

    // Next month calculation
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    // Helper function to format dates
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    // Process and insert sections first
    console.log('🧪 TEST DATA: Inserting sections...');
    for (const section of testData.sections) {
      await pool.query(`
        INSERT INTO tasks (
          id, content, is_section, completed, parent_id, position_order,
          revisit_date, fire, fast, flow, fear, first, time_estimate,
          overview, details, scheduled_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        section.id, section.content, section.is_section, section.completed,
        section.parent_id, section.position_order, null, false, false, false,
        false, false, 0, '', '', null
      ]);
    }

    // Process and insert tasks with dynamic dates
    console.log('🧪 TEST DATA: Inserting tasks with dynamic dates...');
    for (const task of testData.tasks) {
      let revisitDate = task.revisit_date;

      // Replace date placeholders with actual dates
      if (revisitDate === 'TODAY_PLACEHOLDER') {
        revisitDate = formatDate(today);
      } else if (revisitDate === 'TOMORROW_PLACEHOLDER') {
        revisitDate = formatDate(tomorrow);
      } else if (revisitDate === 'THIS_WEEK_PLACEHOLDER') {
        revisitDate = formatDate(thisWeekDate);
      } else if (revisitDate === 'NEXT_WEEK_PLACEHOLDER') {
        revisitDate = formatDate(nextWeekDate);
      } else if (revisitDate === 'THIS_MONTH_PLACEHOLDER') {
        revisitDate = formatDate(thisMonthDate);
      } else if (revisitDate === 'NEXT_MONTH_PLACEHOLDER') {
        revisitDate = formatDate(nextMonthDate);
      }

      await pool.query(`
        INSERT INTO tasks (
          id, content, is_section, completed, parent_id, position_order,
          revisit_date, fire, fast, flow, fear, first, time_estimate,
          overview, details, scheduled_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        task.id, task.content, task.is_section, task.completed,
        task.parent_id, task.position_order, revisitDate, task.fire,
        task.fast, task.flow, task.fear, task.first, task.time_estimate,
        task.overview, task.details, task.scheduled_time
      ]);
    }

    console.log('✅ TEST DATA: Comprehensive test dataset loaded successfully');
    res.json({ 
      message: 'Test data loaded successfully',
      sectionsCount: testData.sections.length,
      tasksCount: testData.tasks.length
    });

  } catch (error) {
    console.error('❌ TEST DATA ERROR:', error);
    res.status(500).json({ error: 'Failed to load test data' });
  }
});

// Simple table debug endpoint
app.get('/debug/table', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY position_order ASC');

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DUN Tasks Database Debug - Table View</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #ddd; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #444; padding: 8px; text-align: left; }
        th { background-color: #333; color: #00CEF7; }
        tr:nth-child(even) { background-color: #2a2a2a; }
        .completed { opacity: 0.6; text-decoration: line-through; }
        .flag-true { color: #00CEF7; font-weight: bold; }
        .flag-false { color: #666; }
        h1 { color: #00CEF7; }
        .nav { margin: 20px 0; }
        .nav a { color: #00CEF7; margin-right: 15px; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
        .description { color: #aaa; font-size: 14px; margin-bottom: 20px; font-style: italic; }
      </style>
    </head>
    <body>
      <h1>📊 DUN Tasks Database Debug - Table View</h1>
      <div class="description">Tabular view of all database records showing raw field values, perfect for spotting data inconsistencies.</div>
      <div class="nav">
        <a href="/debug/tasks">Raw JSON</a>
        <a href="/debug/table">Table View</a>
        <a href="/debug/formatted">Formatted View</a>
        <a href="/debug-files.html">File Aggregator</a>
        <a href="/filter-flow-diagram.html">Filter Flow Diagram</a>
        <a href="/">Back to App</a>
      </div>
      <p>Total records: ${result.rows.length}</p>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Content</th>
            <th>Section</th>
            <th>Complete</th>
            <th>Parent ID</th>
            <th>Position</th>
            <th>Due Date</th>
            <th>Fire</th>
            <th>Fast</th>
            <th>Flow</th>
            <th>Fear</th>
            <th>First</th>
            <th>Time Est</th>
            <th>Overview</th>
            <th>Details</th>
            <th>Sched Time</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
    `;

    result.rows.forEach(row => {
      const formatValue = (val) => {
        if (val === null || val === undefined) return '<span class="null">null</span>';
        if (typeof val === 'boolean') return `<span class="${val}">${val}</span>`;
        if (val instanceof Date) return val.toLocaleString();
        if (typeof val === 'string' && val.length > 50) return val.substring(0, 50) + '...';
        return val;
      };

      html += `
        <tr ${row.is_section ? 'class="section"' : ''}>
          <td>${row.id}</td>
          <td>${formatValue(row.content)}</td>
          <td>${formatValue(row.is_section)}</td>
          <td>${formatValue(row.completed)}</td>
          <td>${formatValue(row.parent_id)}</td>
          <td>${formatValue(row.position_order)}</td>
          <td>${formatValue(row.revisit_date ? new Date(row.revisit_date).toLocaleDateString() : null)}</td>
          <td>${formatValue(row.fire)}</td>
          <td>${formatValue(row.fast)}</td>
          <td>${formatValue(row.flow)}</td>
          <td>${formatValue(row.fear)}</td>
          <td>${formatValue(row.first)}</td>
          <td>${formatValue(row.time_estimate)}</td>
          <td>${formatValue(row.overview)}</td>
          <td>${formatValue(row.details)}</td>
          <td>${formatValue(row.scheduled_time)}</td>
          <td>${formatValue(new Date(row.created_at).toLocaleString())}</td>
          <td>${formatValue(new Date(row.updated_at).toLocaleString())}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error fetching table debug:', error);
    res.status(500).json({ error: 'Failed to fetch table debug' });
  }
});

// Formatted debug endpoint for easier reading
app.get('/debug/formatted', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY position_order ASC');

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DUN Tasks Database Debug</title>
      <style>
        body { font-family: 'Courier New', monospace; background: #1a1a1a; color: #ddd; margin: 20px; }
        .section { background: #2a2a2a; margin: 20px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #00CEF7; }
        .task { background: #333; margin: 10px 0; padding: 10px; border-radius: 4px; border-left: 2px solid #666; }
        .completed { opacity: 0.6; text-decoration: line-through; }
        .flags { margin: 5px 0; }
        .flag { display: inline-block; margin: 2px; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
        .flag.active { background: #00CEF7; color: #000; }
        .flag.inactive { background: #444; color: #888; }
        .meta { font-size: 11px; color: #888; margin-top: 5px; }
        h1 { color: #00CEF7; }
        h2 { color: #00CEF7; margin-top: 30px; }
        .parent-info { color: #0f8; font-size: 11px; }
        .nav { margin: 20px 0; }
        .nav a { color: #00CEF7; margin-right: 15px; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>🔍 DUN Tasks Database Debug View</h1>
      <div class="nav">
        <a href="/debug/tasks">Raw JSON</a>
        <a href="/debug/table">Table View</a>
        <a href="/debug/formatted">Formatted View</a>
        <a href="/">Back to App</a>
      </div>
      <p>Total tasks: ${result.rows.length}</p>
    `;

    // Group tasks by parent
    const sections = result.rows.filter(t => t.is_section);
    const tasks = result.rows.filter(t => !t.is_section);

    // Show sections first
    sections.forEach(section => {
      html += `
        <div class="section">
          <h2>📁 SECTION: ${section.content} (${section.id})</h2>
          <div class="meta">Position: ${section.position_order} | Created: ${new Date(section.created_at).toLocaleString()}</div>
      `;

      // Find tasks in this section
      const sectionTasks = tasks.filter(t => t.parent_id === section.id);
      html += `<p>📋 Tasks in section: ${sectionTasks.length}</p>`;

      sectionTasks.forEach(task => {
        const flags = ['fire', 'fast', 'flow', 'fear', 'first'];
        const activeFlags = flags.filter(f => task[f]);

        html += `
          <div class="task ${task.completed ? 'completed' : ''}">
            <strong>${task.content}</strong>
            <div class="parent-info">ID: ${task.id} | Parent: ${task.parent_id} | Position: ${task.position_order}</div>
            <div class="flags">
              ${flags.map(f => `<span class="flag ${task[f] ? 'active' : 'inactive'}">${f.toUpperCase()}</span>`).join('')}
            </div>
            ${task.revisit_date ? `<div>📅 Due: ${new Date(task.revisit_date).toLocaleDateString()}</div>` : ''}
            ${task.scheduled_time ? `<div>⏰ Time: ${task.scheduled_time}</div>` : ''}
            ${task.time_estimate && task.time_estimate !== '0.00' ? `<div>⏱️ Estimate: ${task.time_estimate}h</div>` : ''}
            ${task.overview ? `<div>📝 Overview: ${task.overview}</div>` : ''}
            ${task.details ? `<div>📄 Details: ${task.details}</div>` : ''}
            <div class="meta">
              Status: ${task.completed ? '✅ Complete' : '⏳ Pending'} | 
              Created: ${new Date(task.created_at).toLocaleString()} | 
              Updated: ${new Date(task.updated_at).toLocaleString()}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    // Show orphaned tasks (no parent or invalid parent)
    const orphanedTasks = tasks.filter(t => !t.parent_id || !sections.find(s => s.id === t.parent_id));
    if (orphanedTasks.length > 0) {
      html += `
        <div class="section">
          <h2>⚠️ ORPHANED TASKS (${orphanedTasks.length})</h2>
          <p>Tasks without valid parent sections:</p>
      `;

      orphanedTasks.forEach(task => {
        const flags = ['fire', 'fast', 'flow', 'fear', 'first'];

        html += `
          <div class="task ${task.completed ? 'completed' : ''}">
            <strong>${task.content}</strong>
            <div class="parent-info">ID: ${task.id} | Parent: ${task.parent_id || 'NULL'} | Position: ${task.position_order}</div>
            <div class="flags">
              ${flags.map(f => `<span class="flag ${task[f] ? 'active' : 'inactive'}">${f.toUpperCase()}</span>`).join('')}
            </div>
            <div class="meta">
              Status: ${task.completed ? '✅ Complete' : '⏳ Pending'} | 
              Created: ${new Date(task.created_at).toLocaleString()}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `
      <h2>📊 Database Statistics</h2>
      <div class="section">
        <p><strong>Sections:</strong> ${sections.length}</p>
        <p><strong>Total Tasks:</strong> ${tasks.length}</p>
        <p><strong>Completed Tasks:</strong> ${tasks.filter(t => t.completed).length}</p>
        <p><strong>Pending Tasks:</strong> ${tasks.filter(t => !t.completed).length}</p>
        <p><strong>Tasks with Dates:</strong> ${tasks.filter(t => t.revisit_date).length}</p>
        <p><strong>Tasks with Time Estimates:</strong> ${tasks.filter(t => t.time_estimate && t.time_estimate !== '0.00').length}</p>
        <p><strong>Orphaned Tasks:</strong> ${orphanedTasks.length}</p>
      </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error fetching formatted debug:', error);
    res.status(500).json({ error: 'Failed to fetch formatted debug' });
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