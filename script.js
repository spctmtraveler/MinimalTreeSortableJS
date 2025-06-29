// ===== DUN Task Management - Standalone Tasks-Only Version =====
// Global debug flag for console logging
const DEBUG = true;

// Priority flag definitions with specific icons and tooltips
const PRIORITY_FLAGS = {
  fire: {
    icon: 'fa-fire',
    tooltip: 'Is this task urgent and needs immediate attention?',
    class: 'priority-fire'
  },
  fast: {
    icon: 'fa-rabbit-running',
    tooltip: 'Can this task be completed in under three minutes?',
    class: 'priority-fast'
  },
  flow: {
    icon: 'fa-water',
    tooltip: 'Am I at risk of overindulging in this task instead of maintaining balance?',
    class: 'priority-flow'
  },
  fear: {
    icon: 'fa-skull',
    tooltip: 'Is this task something I should avoid due to potential negative outcomes?',
    class: 'priority-fear'
  },
  first: {
    icon: 'fa-trophy',
    tooltip: 'Does this task offer an 80% result with minimal effort?',
    class: 'priority-first'
  }
};

// Global state
let tasks = [];
let currentFilter = 'all';
let priorityFlagsVisible = true;
let currentTask = null; // For modal editing

// Task Manager class
class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.priorityFlagsVisible = true;
  }

  debugLog(message, data = null) {
    if (DEBUG) {
      console.log(`[DUN] ${message}`, data || '');
    }
  }

  // Load tasks from server
  async loadTasks() {
    try {
      this.debugLog('Loading tasks from server...');
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.tasks = data;
      this.debugLog('Tasks loaded successfully', { count: this.tasks.length });
      
      return this.tasks;
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.showToast('Error', 'Failed to load tasks from server', 'Retry', () => this.loadTasks());
      return [];
    }
  }

  // Add new task
  async addTask(taskData) {
    try {
      this.debugLog('Adding new task...', taskData);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTask = await response.json();
      this.debugLog('Task added successfully', newTask);
      
      // Reload tasks to get updated tree structure
      await this.loadTasks();
      this.renderTasks();
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      this.showToast('Error', 'Failed to add task', 'Retry', () => this.addTask(taskData));
      throw error;
    }
  }

  // Update existing task
  async updateTask(taskId, updates) {
    try {
      this.debugLog('Updating task...', { taskId, updates });
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTask = await response.json();
      this.debugLog('Task updated successfully', updatedTask);
      
      // Reload tasks to get updated tree structure
      await this.loadTasks();
      this.renderTasks();
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      this.showToast('Error', 'Failed to update task', 'Retry', () => this.updateTask(taskId, updates));
      throw error;
    }
  }

  // Delete task
  async deleteTask(taskId) {
    try {
      this.debugLog('Deleting task...', { taskId });
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.debugLog('Task deleted successfully');
      
      // Reload tasks to get updated tree structure
      await this.loadTasks();
      this.renderTasks();
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      this.showToast('Error', 'Failed to delete task', 'Retry', () => this.deleteTask(taskId));
      throw error;
    }
  }

  // Filter tasks based on current filter setting
  getFilteredTasks() {
    if (this.currentFilter === 'all') {
      return this.tasks;
    }

    return this.tasks.filter(section => {
      if (section.is_section) {
        // Apply filter logic based on section and its children
        const filteredChildren = this.filterTasksByDate(section.children || [], this.currentFilter);
        return filteredChildren.length > 0 || section.content === 'TRIAGE';
      }
      return false;
    });
  }

  // Filter tasks by date criteria
  filterTasksByDate(tasks, filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      const revisitDate = task.revisit_date ? new Date(task.revisit_date) : null;

      switch (filter) {
        case 'triage':
          // Triage filter: tasks with no date, past due dates, or physically in Triage
          return !revisitDate || 
                 (revisitDate < today && !task.completed) || 
                 task.parent_id === this.getTriageSection()?.id;
                 
        case 'today':
          return revisitDate && this.isSameDay(revisitDate, today);
          
        case 'tomorrow':
          return revisitDate && this.isSameDay(revisitDate, tomorrow);
          
        case 'this-week':
          return revisitDate && this.isThisWeek(revisitDate);
          
        case 'next-week':
          return revisitDate && this.isNextWeek(revisitDate);
          
        case 'this-month':
          return revisitDate && this.isThisMonth(revisitDate);
          
        case 'next-month':
          return revisitDate && this.isNextMonth(revisitDate);
          
        default:
          return true;
      }
    });
  }

  // Helper date functions
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isThisWeek(date) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return date >= startOfWeek && date <= endOfWeek;
  }

  isNextWeek(date) {
    const now = new Date();
    const startOfNextWeek = new Date(now);
    startOfNextWeek.setDate(now.getDate() - now.getDay() + 7);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    
    return date >= startOfNextWeek && date <= endOfNextWeek;
  }

  isThisMonth(date) {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth();
  }

  isNextMonth(date) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return date.getFullYear() === nextMonth.getFullYear() &&
           date.getMonth() === nextMonth.getMonth();
  }

  // Get Triage section
  getTriageSection() {
    return this.tasks.find(task => task.is_section && task.content === 'TRIAGE');
  }

  // Sort tasks by priority flags
  sortTasksByPriority() {
    this.debugLog('Sorting tasks by priority...');
    
    // Priority order: Fast -> First -> Fire -> Fear -> Flow
    const priorityOrder = ['fast', 'first', 'fire', 'fear', 'flow'];
    
    this.tasks.forEach(section => {
      if (section.children) {
        section.children.sort((a, b) => {
          // Completed tasks go to bottom
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          
          // Compare priority flags
          const aPriority = this.getHighestPriority(a);
          const bPriority = this.getHighestPriority(b);
          
          if (aPriority && bPriority) {
            return priorityOrder.indexOf(aPriority) - priorityOrder.indexOf(bPriority);
          }
          
          if (aPriority && !bPriority) return -1;
          if (!aPriority && bPriority) return 1;
          
          // Preserve existing order for ties
          return 0;
        });
      }
    });
    
    this.renderTasks();
    this.showToast('Success', 'Tasks sorted by priority', null, null);
  }

  // Get highest priority flag for a task
  getHighestPriority(task) {
    const priorities = ['fast', 'first', 'fire', 'fear', 'flow'];
    
    for (const priority of priorities) {
      if (task[`priority_${priority}`]) {
        return priority;
      }
    }
    
    return null;
  }

  // Toggle priority flags visibility
  togglePriorityFlags() {
    this.priorityFlagsVisible = !this.priorityFlagsVisible;
    this.debugLog('Priority flags visibility toggled', { visible: this.priorityFlagsVisible });
    
    const body = document.body;
    const toggleBtn = document.getElementById('toggle-priority');
    
    if (this.priorityFlagsVisible) {
      body.classList.remove('priority-flags-hidden');
      toggleBtn.classList.add('active');
    } else {
      body.classList.add('priority-flags-hidden');
      toggleBtn.classList.remove('active');
    }
  }

  // Render all tasks
  renderTasks() {
    this.debugLog('Rendering tasks...', { filter: this.currentFilter });
    
    const taskTree = document.getElementById('task-tree');
    if (!taskTree) return;
    
    taskTree.innerHTML = '';
    
    const filteredTasks = this.getFilteredTasks();
    
    filteredTasks.forEach(section => {
      if (section.is_section) {
        const sectionElement = this.createSectionElement(section);
        taskTree.appendChild(sectionElement);
      }
    });
    
    // Setup drag and drop
    this.setupDragAndDrop();
  }

  // Create section element
  createSectionElement(section) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'task-section';
    sectionDiv.dataset.sectionId = section.id;
    
    // Section header
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <i class="fas fa-chevron-down section-toggle"></i>
      <span class="section-title">${section.content}</span>
    `;
    
    // Section content
    const content = document.createElement('div');
    content.className = 'section-content';
    
    // Add tasks to section
    const tasks = this.filterTasksByDate(section.children || [], this.currentFilter);
    tasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      content.appendChild(taskElement);
    });
    
    // Toggle functionality
    header.addEventListener('click', () => {
      const toggle = header.querySelector('.section-toggle');
      const isCollapsed = content.classList.contains('collapsed');
      
      if (isCollapsed) {
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
      } else {
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
      }
    });
    
    sectionDiv.appendChild(header);
    sectionDiv.appendChild(content);
    
    return sectionDiv;
  }

  // Create task element
  createTaskElement(task, level = 0) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskDiv.dataset.taskId = task.id;
    taskDiv.dataset.level = level;
    
    // Task main content
    const taskMain = document.createElement('div');
    taskMain.className = 'task-main';
    
    // Collapse toggle (if has children)
    const hasChildren = task.children && task.children.length > 0;
    const toggle = document.createElement('div');
    toggle.className = `task-toggle ${hasChildren ? '' : 'empty'}`;
    if (hasChildren) {
      toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed || false;
    checkbox.addEventListener('change', (e) => {
      this.updateTask(task.id, { completed: e.target.checked });
    });
    
    // Task content
    const content = document.createElement('div');
    content.className = 'task-content';
    content.textContent = task.content || task.name || '';
    content.title = task.content || task.name || ''; // Tooltip for truncated text
    
    // Click to open modal
    content.addEventListener('click', () => {
      this.openTaskModal(task);
    });
    
    taskMain.appendChild(toggle);
    taskMain.appendChild(checkbox);
    taskMain.appendChild(content);
    
    // Priority flags
    const priorityDiv = document.createElement('div');
    priorityDiv.className = 'task-priority';
    
    Object.keys(PRIORITY_FLAGS).forEach(flagKey => {
      const flag = PRIORITY_FLAGS[flagKey];
      const flagBtn = document.createElement('button');
      flagBtn.className = `priority-flag ${flag.class} ${task[`priority_${flagKey}`] ? 'active' : ''}`;
      flagBtn.innerHTML = `<i class="fas ${flag.icon}"></i>`;
      flagBtn.title = flag.tooltip;
      
      flagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = flagBtn.classList.contains('active');
        this.updateTask(task.id, { [`priority_${flagKey}`]: !isActive });
      });
      
      priorityDiv.appendChild(flagBtn);
    });
    
    // Task controls
    const controls = document.createElement('div');
    controls.className = 'task-controls';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'task-control-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit Task';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTaskModal(task);
    });
    
    const playBtn = document.createElement('button');
    playBtn.className = 'task-control-btn';
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    playBtn.title = 'Start/Play Task';
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTaskModal(task);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-control-btn delete';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.title = 'Delete Task';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTaskWithUndo(task);
    });
    
    controls.appendChild(editBtn);
    controls.appendChild(playBtn);
    controls.appendChild(deleteBtn);
    
    taskDiv.appendChild(taskMain);
    taskDiv.appendChild(priorityDiv);
    taskDiv.appendChild(controls);
    
    // Add children if expanded
    if (hasChildren && !task.collapsed) {
      task.children.forEach(child => {
        const childElement = this.createTaskElement(child, level + 1);
        taskDiv.appendChild(childElement);
      });
    }
    
    // Toggle children functionality
    if (hasChildren) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        task.collapsed = !task.collapsed;
        this.renderTasks(); // Re-render to show/hide children
      });
    }
    
    return taskDiv;
  }

  // Open task modal for editing
  openTaskModal(task) {
    this.debugLog('Opening task modal...', task);
    
    currentTask = task;
    const modal = document.getElementById('task-view-modal');
    
    // Populate modal fields
    document.getElementById('modal-title').value = task.content || task.name || '';
    document.getElementById('modal-revisit-date').value = task.revisit_date ? task.revisit_date.split('T')[0] : '';
    document.getElementById('modal-scheduled-time').value = task.scheduled_time || '';
    document.getElementById('modal-overview').value = task.overview || '';
    document.getElementById('modal-details').value = task.details || '';
    document.getElementById('modal-time-estimate').value = task.time_estimate || '';
    document.getElementById('modal-completed').checked = task.completed || false;
    
    // Setup priority flags in modal
    this.setupModalPriorityFlags(task);
    
    modal.classList.add('active');
  }

  // Setup priority flags in modal
  setupModalPriorityFlags(task) {
    const container = document.getElementById('modal-priority-flags');
    container.innerHTML = '';
    
    Object.keys(PRIORITY_FLAGS).forEach(flagKey => {
      const flag = PRIORITY_FLAGS[flagKey];
      const flagDiv = document.createElement('div');
      flagDiv.className = `modal-priority-flag ${task[`priority_${flagKey}`] ? 'active' : ''}`;
      
      flagDiv.innerHTML = `
        <button class="priority-flag ${flag.class} ${task[`priority_${flagKey}`] ? 'active' : ''}" 
                data-flag="${flagKey}">
          <i class="fas ${flag.icon}"></i>
        </button>
        <div class="flag-label">${flagKey.charAt(0).toUpperCase() + flagKey.slice(1)}</div>
      `;
      
      flagDiv.title = flag.tooltip;
      
      const flagBtn = flagDiv.querySelector('.priority-flag');
      flagBtn.addEventListener('click', () => {
        const isActive = flagBtn.classList.contains('active');
        if (isActive) {
          flagBtn.classList.remove('active');
          flagDiv.classList.remove('active');
        } else {
          flagBtn.classList.add('active');
          flagDiv.classList.add('active');
        }
      });
      
      container.appendChild(flagDiv);
    });
  }

  // Close task modal
  closeTaskModal() {
    const modal = document.getElementById('task-view-modal');
    modal.classList.remove('active');
    currentTask = null;
  }

  // Save task from modal
  async saveTaskFromModal() {
    if (!currentTask) return;
    
    this.debugLog('Saving task from modal...', currentTask.id);
    
    // Collect form data
    const updates = {
      content: document.getElementById('modal-title').value,
      revisit_date: document.getElementById('modal-revisit-date').value || null,
      scheduled_time: document.getElementById('modal-scheduled-time').value || null,
      overview: document.getElementById('modal-overview').value || null,
      details: document.getElementById('modal-details').value || null,
      time_estimate: parseInt(document.getElementById('modal-time-estimate').value) || null,
      completed: document.getElementById('modal-completed').checked
    };
    
    // Collect priority flags
    const priorityFlags = document.querySelectorAll('#modal-priority-flags .priority-flag');
    priorityFlags.forEach(flag => {
      const flagKey = flag.dataset.flag;
      updates[`priority_${flagKey}`] = flag.classList.contains('active');
    });
    
    try {
      await this.updateTask(currentTask.id, updates);
      this.closeTaskModal();
      this.showToast('Success', 'Task updated successfully', null, null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }

  // Delete task with undo functionality
  deleteTaskWithUndo(task) {
    this.debugLog('Deleting task with undo...', task);
    
    // Store task data for undo
    const taskData = { ...task };
    
    // Remove task immediately from UI
    this.deleteTask(task.id);
    
    // Show undo toast
    this.showToast(
      'Task Deleted',
      `"${task.content || task.name}" has been deleted`,
      'Undo',
      async () => {
        try {
          await this.addTask(taskData);
          this.showToast('Success', 'Task restored successfully', null, null);
        } catch (error) {
          console.error('Error restoring task:', error);
        }
      },
      5000 // 5 second timeout
    );
  }

  // Setup drag and drop functionality
  setupDragAndDrop() {
    this.debugLog('Setting up drag and drop...');
    
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
      new Sortable(section, {
        group: 'tasks',
        animation: 150,
        ghostClass: 'task-ghost',
        chosenClass: 'task-chosen',
        dragClass: 'task-drag',
        
        onEnd: async (evt) => {
          const taskId = evt.item.dataset.taskId;
          const newParentElement = evt.to.closest('.task-section');
          const newParentId = newParentElement.dataset.sectionId;
          
          this.debugLog('Task moved', { taskId, newParentId, oldIndex: evt.oldIndex, newIndex: evt.newIndex });
          
          try {
            await this.updateTask(taskId, { 
              parent_id: newParentId,
              position: evt.newIndex 
            });
          } catch (error) {
            console.error('Error updating task position:', error);
            // Revert the UI change
            this.renderTasks();
          }
        }
      });
    });
  }

  // Show toast notification
  showToast(title, message, actionText = null, actionCallback = null, timeout = 3000) {
    this.debugLog('Showing toast notification', { title, message });
    
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
      <div class="toast-header">${title}</div>
      <div class="toast-message">${message}</div>
      ${actionText ? `
        <div class="toast-actions">
          <button class="toast-btn primary" data-action="action">${actionText}</button>
          <button class="toast-btn secondary" data-action="dismiss">Dismiss</button>
        </div>
      ` : ''}
    `;
    
    // Handle actions
    if (actionText && actionCallback) {
      const actionBtn = toast.querySelector('[data-action="action"]');
      actionBtn.addEventListener('click', () => {
        actionCallback();
        container.removeChild(toast);
      });
    }
    
    const dismissBtn = toast.querySelector('[data-action="dismiss"]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        container.removeChild(toast);
      });
    }
    
    container.appendChild(toast);
    
    // Auto-dismiss
    if (timeout > 0) {
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, timeout);
    }
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DUN Task Management - Initializing...');
  
  const taskManager = new TaskManager();
  
  // Load initial tasks
  await taskManager.loadTasks();
  taskManager.renderTasks();
  
  // Setup event listeners
  setupEventListeners(taskManager);
  
  // Initialize UI state
  const priorityToggle = document.getElementById('toggle-priority');
  if (priorityToggle) {
    priorityToggle.classList.add('active'); // Priority flags visible by default
  }
  
  console.log('DUN Task Management - Ready!');
});

// Setup all event listeners
function setupEventListeners(taskManager) {
  // Add task button
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskInput = document.getElementById('new-task-input');
  
  if (addTaskBtn && taskInput) {
    addTaskBtn.addEventListener('click', () => addNewTask(taskManager));
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addNewTask(taskManager);
      }
    });
  }
  
  // Filter dropdown
  const filterDropdown = document.getElementById('filter-dropdown');
  if (filterDropdown) {
    filterDropdown.addEventListener('change', (e) => {
      taskManager.currentFilter = e.target.value;
      taskManager.debugLog('Filter changed', { filter: taskManager.currentFilter });
      taskManager.renderTasks();
    });
  }
  
  // Priority flags toggle
  const priorityToggle = document.getElementById('toggle-priority');
  if (priorityToggle) {
    priorityToggle.addEventListener('click', () => {
      taskManager.togglePriorityFlags();
    });
  }
  
  // Sort tasks button
  const sortBtn = document.getElementById('sort-tasks');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      taskManager.sortTasksByPriority();
    });
  }
  
  // Modal close
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      taskManager.closeTaskModal();
    });
  }
  
  // Modal backdrop close
  const modal = document.getElementById('task-view-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        taskManager.closeTaskModal();
      }
    });
  }
  
  // Modal save button
  const modalSaveBtn = document.getElementById('modal-save-btn');
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
      taskManager.saveTaskFromModal();
    });
  }
  
  // Modal start/play button
  const modalStartBtn = document.getElementById('modal-start-btn');
  if (modalStartBtn) {
    modalStartBtn.addEventListener('click', () => {
      // For MVP, start/play just closes the modal
      taskManager.closeTaskModal();
    });
  }
  
  // Modal delete button
  const modalDeleteBtn = document.getElementById('modal-delete-btn');
  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', () => {
      if (currentTask) {
        taskManager.deleteTaskWithUndo(currentTask);
        taskManager.closeTaskModal();
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape') {
      taskManager.closeTaskModal();
    }
  });
}

// Add new task helper function
async function addNewTask(taskManager) {
  const input = document.getElementById('new-task-input');
  const content = input.value.trim();
  
  if (!content) return;
  
  taskManager.debugLog('Adding new task via quick add', { content });
  
  // Get Triage section ID
  const triageSection = taskManager.getTriageSection();
  if (!triageSection) {
    console.error('Triage section not found');
    return;
  }
  
  const taskData = {
    content: content,
    parent_id: triageSection.id,
    is_section: false,
    completed: false,
    priority_fire: false,
    priority_fast: false,
    priority_flow: false,
    priority_fear: false,
    priority_first: false,
    revisit_date: null,
    scheduled_time: null,
    overview: null,
    details: null,
    time_estimate: null
  };
  
  try {
    await taskManager.addTask(taskData);
    input.value = ''; // Clear input
    taskManager.showToast('Success', 'Task added to Triage', null, null);
  } catch (error) {
    console.error('Error adding task:', error);
  }
}

// Export taskManager for global access (debugging)
window.taskManager = null;
document.addEventListener('DOMContentLoaded', () => {
  window.taskManager = new TaskManager();
});