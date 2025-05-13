// DUN Task Management Application
// Database module using Replit Database via API

// API base URL for database operations
// Use the current hostname but with the API port
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Debug flag to enable/disable console logging
const debug = true;

// DB module with async/await methods for better error handling
const dbModule = {
  // Save the entire task tree
  saveTasks: async function(tasks) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tasks),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save tasks: ${response.status}`);
      }
      
      if (debug) console.log('Tasks saved to Replit Database');
      return true;
    } catch (error) {
      console.error('Error saving tasks to Replit Database:', error);
      return false;
    }
  },
  
  // Load the entire task tree
  loadTasks: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status}`);
      }
      
      const tasks = await response.json();
      
      if (!tasks || tasks.length === 0) {
        if (debug) console.log('No tasks found in Replit Database, will use default tasks');
        return null;
      }
      
      if (debug) console.log('Tasks loaded from Replit Database');
      return tasks;
    } catch (error) {
      console.error('Error loading tasks from Replit Database:', error);
      return null;
    }
  },
  
  // Save a single task
  saveTask: async function(taskId, taskData) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save task: ${response.status}`);
      }
      
      if (debug) console.log(`Task ${taskId} updated in Replit Database`);
      return true;
    } catch (error) {
      console.error('Error saving task to Replit Database:', error);
      return false;
    }
  },
  
  // Delete a task
  deleteTask: async function(taskId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }
      
      if (debug) console.log(`Task ${taskId} deleted from Replit Database`);
      return true;
    } catch (error) {
      console.error('Error deleting task from Replit Database:', error);
      return false;
    }
  },
  
  // Add a new task (uses saveTask under the hood)
  addTask: async function(parentId, taskData) {
    try {
      // If there's a parentId, set it in the task data
      if (parentId) {
        taskData.parent = parentId;
      }
      
      // Use saveTask to create/update the task
      const success = await this.saveTask(taskData.id, taskData);
      
      if (success) {
        if (debug) console.log(`Task added${parentId ? ` to parent ${parentId}` : ''} in Replit Database`);
      }
      
      return success;
    } catch (error) {
      console.error('Error adding task to Replit Database:', error);
      return false;
    }
  },
  
  // Clear all tasks (for testing/reset)
  clearTasks: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear tasks: ${response.status}`);
      }
      
      if (debug) console.log('All tasks cleared from Replit Database');
      return true;
    } catch (error) {
      console.error('Error clearing tasks from Replit Database:', error);
      return false;
    }
  }
};

// Make database module available globally for browser use
window.db = dbModule;