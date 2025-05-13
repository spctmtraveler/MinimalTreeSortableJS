// DUN Task Management Application
// Database module using localStorage with async API for compatibility

// Debug flag to enable/disable console logging
const debug = true;

// Database key for the task tree
const TASKS_KEY = 'dun_tasks';

// DB module with async/await methods for better error handling
const dbModule = {
  // Save the entire task tree
  saveTasks: async function(tasks) {
    try {
      // Convert tasks to string for localStorage
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      if (debug) console.log('Tasks saved to localStorage');
      return true;
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
      return false;
    }
  },
  
  // Load the entire task tree
  loadTasks: async function() {
    try {
      const tasksJson = localStorage.getItem(TASKS_KEY);
      if (!tasksJson) {
        if (debug) console.log('No tasks found in localStorage, will use default tasks');
        return null;
      }
      
      const tasks = JSON.parse(tasksJson);
      if (debug) console.log('Tasks loaded from localStorage');
      return tasks;
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
      return null;
    }
  },
  
  // Save a single task
  saveTask: async function(taskId, taskData) {
    try {
      // Get the current tasks
      let tasks = await this.loadTasks();
      if (!tasks) {
        console.error('No tasks found to update');
        return false;
      }
      
      // Find and update the task (recursive function)
      const updateTask = (taskList, id, newData) => {
        for (let i = 0; i < taskList.length; i++) {
          if (taskList[i].id === id) {
            // Update the task data
            Object.assign(taskList[i], newData);
            return true;
          }
          
          // Check children
          if (taskList[i].children && taskList[i].children.length > 0) {
            if (updateTask(taskList[i].children, id, newData)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Try to update the task
      if (updateTask(tasks, taskId, taskData)) {
        // Save the updated tasks
        await this.saveTasks(tasks);
        if (debug) console.log(`Task ${taskId} updated in Replit Database`);
        return true;
      } else {
        console.error(`Task ${taskId} not found in task tree`);
        return false;
      }
    } catch (error) {
      console.error('Error saving task to Replit Database:', error);
      return false;
    }
  },
  
  // Delete a task
  deleteTask: async function(taskId) {
    try {
      // Get the current tasks
      let tasks = await this.loadTasks();
      if (!tasks) {
        console.error('No tasks found to delete from');
        return false;
      }
      
      // Find and delete the task (recursive function)
      const removeTask = (taskList, id) => {
        for (let i = 0; i < taskList.length; i++) {
          if (taskList[i].id === id) {
            // Remove the task
            taskList.splice(i, 1);
            return true;
          }
          
          // Check children
          if (taskList[i].children && taskList[i].children.length > 0) {
            if (removeTask(taskList[i].children, id)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Try to delete the task
      if (removeTask(tasks, taskId)) {
        // Save the updated tasks
        await this.saveTasks(tasks);
        if (debug) console.log(`Task ${taskId} deleted from Replit Database`);
        return true;
      } else {
        console.error(`Task ${taskId} not found in task tree`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting task from Replit Database:', error);
      return false;
    }
  },
  
  // Add a new task
  addTask: async function(parentId, taskData) {
    try {
      // Get the current tasks
      let tasks = await this.loadTasks();
      if (!tasks) {
        if (debug) console.log('No existing tasks, creating new task tree');
        tasks = [];
      }
      
      // If parentId is null, add to root level
      if (!parentId) {
        tasks.push(taskData);
        await this.saveTasks(tasks);
        if (debug) console.log('Task added to root level');
        return true;
      }
      
      // Find parent and add task (recursive function)
      const addToParent = (taskList, id, newTask) => {
        for (let i = 0; i < taskList.length; i++) {
          if (taskList[i].id === id) {
            // Add to parent's children
            if (!taskList[i].children) {
              taskList[i].children = [];
            }
            taskList[i].children.push(newTask);
            return true;
          }
          
          // Check children
          if (taskList[i].children && taskList[i].children.length > 0) {
            if (addToParent(taskList[i].children, id, newTask)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Try to add the task
      if (addToParent(tasks, parentId, taskData)) {
        // Save the updated tasks
        await this.saveTasks(tasks);
        if (debug) console.log(`Task added to parent ${parentId} in Replit Database`);
        return true;
      } else {
        console.error(`Parent task ${parentId} not found in task tree`);
        return false;
      }
    } catch (error) {
      console.error('Error adding task to Replit Database:', error);
      return false;
    }
  },
  
  // Clear all tasks (for testing/reset)
  clearTasks: async function() {
    try {
      localStorage.removeItem(TASKS_KEY);
      if (debug) console.log('All tasks cleared from localStorage');
      return true;
    } catch (error) {
      console.error('Error clearing tasks from localStorage:', error);
      return false;
    }
  }
};

// Make database module available globally for browser use
window.db = dbModule;