const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Google Sheets setup
let privateKey = process.env.GOOGLE_PRIVATE_KEY;
if (privateKey) {
  // Handle various formats of private key input
  privateKey = privateKey.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
  privateKey = privateKey.replace(/\\n/g, '\n'); // Replace literal \n with actual newlines
  
  // Ensure proper format
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('Private key format error: Key should start with -----BEGIN PRIVATE KEY-----');
  }
  if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
    console.error('Private key format error: Key should end with -----END PRIVATE KEY-----');
  }
}

console.log('Private key length:', privateKey ? privateKey.length : 'undefined');
console.log('Service account email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: "replit-task-manager",
    private_key_id: "key-id",
    private_key: privateKey,
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    client_id: "client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = 'Tasks';

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Helper function to convert sheet row to task object
function rowToTask(row) {
  if (!row || row.length === 0) return null;
  
  return {
    id: row[0] || '',
    content: row[1] || '',
    isSection: row[2] === 'true',
    completed: row[3] === 'true',
    parentId: row[4] || null,
    positionOrder: parseInt(row[5]) || 0,
    revisitDate: row[6] || null,
    fire: row[7] === 'true',
    fast: row[8] === 'true',
    flow: row[9] === 'true',
    fear: row[10] === 'true',
    first: row[11] === 'true',
    timeEstimate: parseFloat(row[12]) || 0,
    overview: row[13] || '',
    details: row[14] || '',
    scheduledTime: row[15] || null
  };
}

// Helper function to convert task object to sheet row
function taskToRow(task) {
  return [
    task.id || '',
    task.content || '',
    task.isSection ? 'true' : 'false',
    task.completed ? 'true' : 'false',
    task.parentId || '',
    task.positionOrder || 0,
    task.revisitDate || '',
    task.fire ? 'true' : 'false',
    task.fast ? 'true' : 'false',
    task.flow ? 'true' : 'false',
    task.fear ? 'true' : 'false',
    task.first ? 'true' : 'false',
    task.timeEstimate || 0,
    task.overview || '',
    task.details || '',
    task.scheduledTime || ''
  ];
}

// Initialize sheet with headers if needed
async function initializeSheet() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:P1`
    });

    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:P1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            'id', 'content', 'isSection', 'completed', 'parentId', 'positionOrder',
            'revisitDate', 'fire', 'fast', 'flow', 'fear', 'first',
            'timeEstimate', 'overview', 'details', 'scheduledTime'
          ]]
        }
      });
      console.log('Sheet initialized with headers');
    }
  } catch (error) {
    console.error('Error initializing sheet:', error);
  }
}

// Get all tasks from Google Sheets
async function getAllTasks() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:P`
    });

    if (!response.data.values) {
      return [];
    }

    const tasks = response.data.values.map(rowToTask).filter(task => task && task.id);
    
    // Convert flat structure to nested tree
    const tasksMap = new Map();
    const rootTasks = [];
    
    // First pass: create all task objects
    tasks.forEach(task => {
      task.children = [];
      tasksMap.set(task.id, task);
    });
    
    // Second pass: build tree structure
    tasks.forEach(task => {
      if (task.parentId && tasksMap.has(task.parentId)) {
        tasksMap.get(task.parentId).children.push(task);
      } else {
        rootTasks.push(task);
      }
    });
    
    return rootTasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
}

// Find task row in sheet
async function findTaskRow(taskId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`
    });

    if (!response.data.values) {
      return -1;
    }

    for (let i = 1; i < response.data.values.length; i++) {
      if (response.data.values[i][0] === taskId) {
        return i + 1; // Sheet rows are 1-indexed
      }
    }
    
    return -1;
  } catch (error) {
    console.error('Error finding task row:', error);
    return -1;
  }
}

// Add task to Google Sheets
async function addTask(task) {
  try {
    const row = taskToRow(task);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row]
      }
    });
    
    return task;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

// Update task in Google Sheets
async function updateTask(taskId, task) {
  try {
    const rowIndex = await findTaskRow(taskId);
    if (rowIndex === -1) {
      throw new Error('Task not found');
    }
    
    const row = taskToRow(task);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex}:P${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row]
      }
    });
    
    return task;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// Delete task from Google Sheets
async function deleteTask(taskId) {
  try {
    const rowIndex = await findTaskRow(taskId);
    if (rowIndex === -1) {
      throw new Error('Task not found');
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }]
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// API Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log('FETCH REQUEST for single task:', taskId);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:P`
    });

    if (!response.data.values) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskRow = response.data.values.find(row => row[0] === taskId);
    
    if (!taskRow) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = rowToTask(taskRow);
    console.log('FETCH SUCCESS: Found task:', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    console.log('CREATE REQUEST:', req.body);
    
    const task = await addTask(req.body);
    console.log('CREATE SUCCESS:', task);
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log('UPDATE REQUEST for task:', taskId);
    console.log('Request body:', req.body);
    
    const task = await updateTask(taskId, req.body);
    console.log('UPDATE SUCCESS:', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log('DELETE REQUEST for task:', taskId);
    
    await deleteTask(taskId);
    console.log('DELETE SUCCESS for task:', taskId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize and start server
async function startServer() {
  await initializeSheet();
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`DUN Task Management server running on port ${port}`);
  });
}

startServer().catch(console.error);