// DUN Task Management Application
// Database module with fallback to localStorage if API is unavailable

// API base URL for database operations
// Use the current hostname but with the API port
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Debug flag is defined in script.js, we'll reuse it
// Storage key for localStorage
const LOCAL_STORAGE_KEY = 'dun_tasks';

// DB module with async/await methods for better error handling
const dbModule = {
  // Save the entire task tree
  saveTasks: async function(tasks) {
    try {
      // Try to save to the API first
      try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tasks),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save tasks to API: ${response.status}`);
        }
        
        console.log('✅ Tasks saved to Replit Database API');
        return true;
      } catch (apiError) {
        console.warn('API unavailable, falling back to localStorage', apiError);
        
        // Fallback to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
        console.log('✅ Tasks saved to localStorage');
        
        // Auto-save all tasks to localStorage
        document.dispatchEvent(new CustomEvent('tasks-saved-to-localstorage'));
        return true;
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  },
  
  // Load the entire task tree
  loadTasks: async function() {
    try {
      // Try to load from API first
      try {
        console.log('Attempting to load tasks from API...');
        const response = await fetch(`${API_BASE_URL}/tasks`);
        
        if (!response.ok) {
          throw new Error(`Failed to load tasks from API: ${response.status}`);
        }
        
        const tasks = await response.json();
        
        if (!tasks || tasks.length === 0) {
          console.log('No tasks found in API, checking localStorage...');
          throw new Error('No tasks in API');
        }
        
        console.log('✅ Tasks loaded from Replit Database API');
        return tasks;
      } catch (apiError) {
        console.warn('API unavailable or empty, trying localStorage', apiError);
        
        // Fallback to localStorage
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localData) {
          console.log('No tasks found in localStorage either');
          return null;
        }
        
        try {
          const tasks = JSON.parse(localData);
          console.log('✅ Tasks loaded from localStorage');
          return tasks;
        } catch (parseError) {
          console.error('Error parsing tasks from localStorage:', parseError);
          return null;
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      return null;
    }
  },
  
  // Save a single task
  saveTask: async function(taskId, taskData) {
    try {
      // First, get all tasks to update the correct one
      let allTasks;
      
      try {
        // Try API first
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) {
          throw new Error('API unavailable');
        }
        allTasks = await response.json();
        
        // Update task through API
        const updateResponse = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to save task to API: ${updateResponse.status}`);
        }
        
        console.log(`✅ Task ${taskId} updated via API`);
        return true;
      } catch (apiError) {
        console.warn(`API error, using localStorage for task ${taskId}`, apiError);
        
        // Fallback to localStorage
        // First get existing tasks
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          try {
            allTasks = JSON.parse(localData);
          } catch (parseError) {
            console.error('Error parsing tasks from localStorage:', parseError);
            allTasks = [];
          }
        } else {
          allTasks = [];
        }
        
        // Find and update the specific task - uses recursion to navigate the nested structure
        function updateTaskInArray(tasks, id, newData) {
          for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
              // Preserve children if not provided in newData
              if (!newData.children && tasks[i].children) {
                newData.children = tasks[i].children;
              }
              
              // Update task with new data (using spread operator to ensure all properties are copied)
              tasks[i] = { ...tasks[i], ...newData };
              return true;
            }
            
            // Check children recursively
            if (tasks[i].children && tasks[i].children.length > 0) {
              if (updateTaskInArray(tasks[i].children, id, newData)) {
                return true;
              }
            }
          }
          return false;
        }
        
        const found = updateTaskInArray(allTasks, taskId, taskData);
        
        if (!found) {
          // If task was not found, add it at the root level
          allTasks.push(taskData);
        }
        
        // Save all tasks back to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTasks));
        console.log(`✅ Task ${taskId} saved to localStorage`);
        return true;
      }
    } catch (error) {
      console.error('Error saving task:', error);
      return false;
    }
  },
  
  // Delete a task
  deleteTask: async function(taskId) {
    try {
      try {
        // Try API first
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete task from API: ${response.status}`);
        }
        
        console.log(`✅ Task ${taskId} deleted via API`);
        return true;
      } catch (apiError) {
        console.warn(`API error, using localStorage to delete task ${taskId}`, apiError);
        
        // Fallback to localStorage
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localData) {
          console.log('No tasks found in localStorage');
          return false;
        }
        
        try {
          let allTasks = JSON.parse(localData);
          
          // Function to remove task by ID recursively
          function removeTaskFromArray(tasks, id) {
            for (let i = 0; i < tasks.length; i++) {
              if (tasks[i].id === id) {
                tasks.splice(i, 1);
                return true;
              }
              
              // Check children recursively
              if (tasks[i].children && tasks[i].children.length > 0) {
                if (removeTaskFromArray(tasks[i].children, id)) {
                  return true;
                }
              }
            }
            return false;
          }
          
          const removed = removeTaskFromArray(allTasks, taskId);
          
          if (!removed) {
            console.log(`Task ${taskId} not found in localStorage`);
            return false;
          }
          
          // Save updated tasks back to localStorage
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTasks));
          console.log(`✅ Task ${taskId} deleted from localStorage`);
          return true;
        } catch (parseError) {
          console.error('Error parsing tasks from localStorage:', parseError);
          return false;
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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
        console.log(`✅ Task added${parentId ? ` to parent ${parentId}` : ''}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error adding task:', error);
      return false;
    }
  },
  
  // Clear all tasks (for testing/reset)
  clearTasks: async function() {
    try {
      try {
        // Try API first
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to clear tasks from API: ${response.status}`);
        }
        
        console.log('✅ All tasks cleared from API');
      } catch (apiError) {
        console.warn('API error when clearing tasks, using localStorage', apiError);
      }
      
      // Always also clear localStorage
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('✅ All tasks cleared from localStorage');
      
      return true;
    } catch (error) {
      console.error('Error clearing tasks:', error);
      return false;
    }
  }
};

// Auto-save to localStorage every 30 seconds
setInterval(() => {
  // Get all tasks from the DOM
  const getAllTasksFromDOM = function() {
    const taskElements = document.querySelectorAll('.task-item');
    const tasks = [];
    
    taskElements.forEach(taskElement => {
      if (taskElement.dataset.taskData) {
        try {
          const taskData = JSON.parse(taskElement.dataset.taskData);
          if (taskData.id && !tasks.some(t => t.id === taskData.id)) {
            tasks.push(taskData);
          }
        } catch (error) {
          // Ignore parse errors
        }
      }
    });
    
    return tasks;
  };
  
  // Only auto-save if there are tasks to save
  const tasks = getAllTasksFromDOM();
  if (tasks.length > 0) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    console.log(`Auto-saved ${tasks.length} tasks to localStorage`);
  }
}, 30000);

// Make database module available globally for browser use
window.db = dbModule;