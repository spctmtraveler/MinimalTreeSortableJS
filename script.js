// -------------  DUN Task Management  ------------------
// 🔧 Fixes applied:
// 1. Clear old tree on load to avoid duplicates
// 2. Persist every priority‐flag toggle immediately
// 3. Persist edits from modal immediately
// 4. Persist new tasks under TRIAGE (not as siblings) via db.addTask()
// ---------------------------------------------------

console.log('🚀 SCRIPT START: Main script.js is loading...');
window.addEventListener('error', (e) => {
  console.error('❌ SCRIPT ERROR:', e.error, e.filename, e.lineno);
});

// Test if basic execution works
try {
  console.log('🧪 BASIC TEST: Script executing normally');
} catch (e) {
  console.error('❌ BASIC TEST FAILED:', e);
}

// Global debug variables
let debug = true;
let debugLog = [];

// Debug logging function
function debugLogger(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  debugLog.push(logEntry);
  
  // Keep only last 500 log entries to prevent memory issues
  if (debugLog.length > 500) {
    debugLog = debugLog.slice(-500);
  }
  
  // Update debug log display if modal is open
  const debugLogElement = document.getElementById('debug-log');
  if (debugLogElement) {
    debugLogElement.textContent = debugLog.join('\n');
    debugLogElement.scrollTop = debugLogElement.scrollHeight;
  }
  
  // Update popup window log if open
  updatePopupDebugLog();
  
  // Also log to console if debug is enabled
  if (debug) {
    console.log(logEntry);
  }
}

// Database module using PostgreSQL API
const db = {
  async loadTasks() {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      if (debug) console.log('Tasks loaded from database');
      return tasks;
    } catch (error) {
      console.error('Error loading tasks from database:', error);
      return null;
    }
  },

  async addTask(taskData) {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (debug) console.log(`Task ${taskData.id} added to database`);
      return result;
    } catch (error) {
      console.error('Error adding task to database:', error);
      throw error;
    }
  },
  async saveTask(taskId, taskData) {
    try {
      console.log(`💾 DB SAVE: Attempting to save task ${taskId} to database`);
      console.log('💾 DB SAVE: Data being sent:', JSON.stringify(taskData, null, 2));
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`💾 DB SAVE ERROR: HTTP ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`💾 DB SAVE SUCCESS: Task ${taskId} saved successfully`);
      console.log('💾 DB SAVE: Server response:', result);
      return true;
    } catch (error) {
      console.error('💾 DB SAVE ERROR:', error);
      return false;
    }
  },
  async deleteTask(taskId) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (debug) console.log(`Task ${taskId} deleted from database`);
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  },

  async fetchTask(taskId) {
    try {
      console.log(`🔍 DB FETCH: Getting fresh data for task ${taskId}`);
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const dbTask = await response.json();
      console.log(`🔍 DB FETCH SUCCESS: Raw database data for ${taskId}:`, dbTask);
      
      // Transform database fields to match frontend expectations
      const task = {
        id: dbTask.id,
        content: dbTask.content,
        isSection: dbTask.is_section,
        completed: dbTask.completed,
        parent_id: dbTask.parent_id,
        positionOrder: dbTask.position_order,
        revisitDate: dbTask.revisit_date,
        fire: dbTask.fire,
        fast: dbTask.fast,
        flow: dbTask.flow,
        fear: dbTask.fear,
        first: dbTask.first,
        timeEstimate: parseFloat(dbTask.time_estimate) || 0,
        overview: dbTask.overview,
        details: dbTask.details,
        scheduledTime: dbTask.scheduled_time
      };
      
      console.log(`🔍 DB FETCH TRANSFORMED: CamelCase data for ${taskId}:`, task);
      return task;
    } catch (error) {
      console.error(`🔍 DB FETCH ERROR: Failed to fetch task ${taskId}:`, error);
      return null;
    }
  },

  clearTasks() {
    try {
      localStorage.removeItem('dun_tasks');
      if (debug) console.log('Cleared all tasks from localStorage');
      return true;
    } catch (error) {
      console.error('Error clearing tasks:', error);
      return false;
    }
  }
};

// Sample Data with Sections
const sampleTasks = [
  {
    id: 'section-triage',
    content: 'TRIAGE',
    isSection: true,
    children: [
      {
        id: 'task-triage-1',
        content: 'SAMPLE:: Mail check',
        completed: true,
        children: [],
        revisitDate: '2025-03-07',
        fire: true,
        fast: false,
        flow: false,
        fear: false,
        first: false,
        timeEstimate: 0.5,
        overview: 'Check mail for important documents',
        details: 'Need to sort through mail and check for bills and other important documents.',
        scheduledTime: '10:00'
      },
      {
        id: 'task-triage-2',
        content: 'SAMPLE:: Clean Kitchen',
        completed: true,
        children: [],
        revisitDate: null,
        fire: false,
        fast: true,
        flow: true,
        fear: false,
        first: false,
        timeEstimate: 1,
        overview: 'Clean the kitchen thoroughly',
        details: 'Do the dishes, wipe down counters, sweep and mop the floor.',
        scheduledTime: null
      }
    ]
  },
  {
    id: 'section-a',
    content: 'A',
    isSection: true,
    children: [
      {
        id: 'task-a-1',
        content: 'Make Cake',
        completed: false,
        revisitDate: 'today',
        fire: true,
        fast: true,
        flow: false,
        fear: false,
        first: false,
        timeEstimate: 3,
        overview: 'Bake a cake for the party',
        details: 'Need to make a chocolate cake for the weekend party.',
        scheduledTime: '14:00',
        children: [
          {
            id: 'task-a-1-1',
            content: 'Buy Ingredients',
            completed: false,
            revisitDate: 'tomorrow',
            fire: false,
            fast: true,
            flow: false,
            fear: true,
            first: false,
            timeEstimate: 1,
            overview: 'Get all necessary ingredients',
            details: 'Buy flour, sugar, eggs, chocolate, and butter.',
            scheduledTime: null,
            children: [
              {
                id: 'task-a-1-1-1',
                content: 'Make a list',
                completed: false,
                revisitDate: 'today',
                fire: false,
                fast: false,
                flow: true,
                fear: false,
                first: false,
                timeEstimate: 0.25,
                overview: 'Write down all needed ingredients',
                details: 'Check recipe and pantry, make shopping list.',
                scheduledTime: null,
                children: []
              },
              {
                id: 'task-a-1-1-2',
                content: 'Go shopping',
                completed: false,
                revisitDate: 'today',
                fire: false,
                fast: false,
                flow: true,
                fear: false,
                first: false,
                timeEstimate: 0.75,
                overview: 'Go to the grocery store',
                details: 'Visit the supermarket to buy all ingredients on the list.',
                scheduledTime: null,
                children: []
              }
            ]
          },
          {
            id: 'task-a-1-2',
            content: 'Mix Ingredients',
            completed: false,
            revisitDate: null,
            fire: true,
            fast: true,
            flow: true,
            fear: false,
            first: false,
            timeEstimate: 0.5,
            overview: 'Prepare the cake batter',
            details: 'Mix all ingredients according to the recipe instructions.',
            scheduledTime: null,
            children: []
          },
          {
            id: 'task-a-1-3',
            content: 'Bake',
            completed: false,
            revisitDate: null,
            fire: false,
            fast: false,
            flow: false,
            fear: false,
            first: true,
            timeEstimate: 1.5,
            overview: 'Bake the cake in the oven',
            details: 'Preheat oven, prepare pan, bake for required time.',
            scheduledTime: null,
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 'section-b',
    content: 'B',
    isSection: true,
    children: [
      {
        id: 'task-b-1',
        content: 'Mail check',
        completed: true,
        revisitDate: 'today',
        fire: false,
        fast: false,
        flow: false,
        fear: true,
        first: false,
        timeEstimate: 0.25,
        overview: 'Check mail for bills',
        details: 'Sort through mail and check for bills and payment notices.',
        scheduledTime: null,
        children: []
      },
      {
        id: 'task-b-2',
        content: 'Shower',
        completed: true,
        revisitDate: 'tomorrow',
        fire: false,
        fast: true,
        flow: true,
        fear: false,
        first: false,
        timeEstimate: 0.5,
        overview: 'Take a shower',
        details: 'Morning routine, shower and get ready for the day.',
        scheduledTime: null,
        children: []
      }
    ]
  },
  {
    id: 'section-c',
    content: 'C',
    isSection: true,
    children: [
      {
        id: 'task-c-1',
        content: 'Oil Change',
        completed: true,
        revisitDate: 'next week',
        fire: true,
        fast: false,
        flow: false,
        fear: false,
        first: true,
        timeEstimate: 1,
        overview: 'Change car oil',
        details: 'Take car to mechanic or DIY oil change.',
        scheduledTime: null,
        children: []
      },
      {
        id: 'task-c-2',
        content: 't17',
        completed: false,
        revisitDate: '4/22',
        fire: true,
        fast: false,
        flow: true,
        fear: false,
        first: false,
        timeEstimate: 2,
        overview: 'Task 17 from project list',
        details: 'Special task #17 from the project requirements.',
        scheduledTime: null,
        children: []
      },
      {
        id: 'task-c-3',
        content: 'Test task from SQL',
        completed: false,
        revisitDate: '3/12',
        fire: false,
        fast: true,
        flow: false,
        fear: true,
        first: false,
        timeEstimate: 1.5,
        overview: 'Test SQL integration',
        details: 'Verify that SQL integration is working properly.',
        scheduledTime: '15:30',
        children: []
      }
    ]
  }
];

/* ---------- Build Tree ----------- */
function buildTree(tasks, parent) {
  const ul = document.createElement('ul');
  ul.className = 'task-list';
  parent.appendChild(ul);

  if (parent.id !== 'task-tree') {
    createSortable(ul);
  } else {
    ul.dataset.isRoot = 'true';
  }

  // Sort tasks by position_order to maintain saved sort order
  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = typeof a.positionOrder === 'number' ? a.positionOrder : (a.position_order || 999);
    const orderB = typeof b.positionOrder === 'number' ? b.positionOrder : (b.position_order || 999);
    return orderA - orderB;
  });

  sortedTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    li.dataset.taskData = JSON.stringify(task);
    li.dataset.taskId = task.id; // Add task ID for centralized state management

    if (task.isSection) {
      li.classList.add('section-header');
      li.setAttribute('data-no-drag', 'true');
    }
    if (task.completed) li.classList.add('task-completed');

    const row = document.createElement('div');
    row.className = 'task-content';
    li.appendChild(row);

    if (!task.isSection) {
      const grip = document.createElement('span');
      grip.className = 'task-grip';
      grip.innerHTML = '<i class="fa-solid fa-grip-lines"></i>';
      row.appendChild(grip);
    }

    if (!task.isSection) {
      const checkbox = document.createElement('span');
      checkbox.className = 'task-checkbox';
      checkbox.setAttribute('data-no-drag', 'true');
      checkbox.innerHTML = task.completed ? '<i class="fa-solid fa-check"></i>' : '';
      checkbox.addEventListener('click', async e => {
        e.stopPropagation();
        const newCompleted = !task.completed;
        await updateTaskState(task.id, { completed: newCompleted });
        if (debug) console.log(`Task "${task.content}" marked ${newCompleted ? 'completed' : 'incomplete'}`);
      });
      row.appendChild(checkbox);
    }

    const chevron = document.createElement('span');
    chevron.className = 'toggle-btn';
    chevron.textContent = '▸';
    chevron.style.display = (task.isSection || task.children?.length) ? 'inline-block' : 'none';
    const toggleArea = document.createElement('div');
    toggleArea.className = 'toggle-area';
    toggleArea.setAttribute('data-no-drag', 'true');
    toggleArea.appendChild(chevron);
    row.appendChild(toggleArea);

    const childContainer = document.createElement('div');
    childContainer.className = 'task-children';
    li.appendChild(childContainer);
    const childList = document.createElement('ul');
    childList.className = 'task-list';
    childContainer.appendChild(childList);

    toggleArea.addEventListener('click', e => {
      e.stopPropagation();
      const open = chevron.classList.toggle('expanded');
      chevron.textContent = open ? '▾' : '▸';
      childContainer.style.display = open ? 'block' : 'none';
      if (debug) console.log(`${open ? 'Expanded' : 'Collapsed'} "${task.content}"`);
    });

    const txt = document.createElement('span');
    txt.className = 'task-text';
    // Truncate text to ~26 characters with ellipsis
    const maxLength = 26;
    if (task.content.length > maxLength) {
      txt.textContent = task.content.substring(0, maxLength) + '...';
    } else {
      txt.textContent = task.content;
    }
    txt.title = task.content; // Show full text on hover
    
    // Add inline editing functionality
    if (!task.isSection) {
      txt.addEventListener('dblclick', e => {
        e.stopPropagation();
        startTaskInlineEdit(txt, task, li);
      });
    }
    
    row.appendChild(txt);

    if (!task.isSection) {
      // Fixed-width date field (always present)
      const dateContainer = document.createElement('div');
      dateContainer.className = 'task-date-container';
      dateContainer.setAttribute('data-no-drag', 'true');
      
      if (task.revisitDate) {
        const date = document.createElement('span');
        date.className = 'task-date';
        date.textContent = formatRevisitDate(task.revisitDate);
        date.addEventListener('click', e => {
          e.stopPropagation();
          openTaskModal(task, li);
        });
        dateContainer.appendChild(date);
      } else {
        const calendarIcon = document.createElement('button');
        calendarIcon.className = 'task-date-icon';
        calendarIcon.innerHTML = '<i class="fa-solid fa-calendar"></i>';
        calendarIcon.title = 'Set date';
        calendarIcon.addEventListener('click', e => {
          e.stopPropagation();
          openTaskModal(task, li);
        });
        dateContainer.appendChild(calendarIcon);
      }
      row.appendChild(dateContainer);

      const controlContainer = document.createElement('div');
      controlContainer.className = 'task-control-container';
      controlContainer.setAttribute('data-no-drag', 'true');

      const controlBar = document.createElement('div');
      controlBar.className = 'task-control-bar';
      controlBar.setAttribute('data-no-drag', 'true');
      controlContainer.appendChild(controlBar);
      row.appendChild(controlContainer);

      const editBtn = document.createElement('button');
      editBtn.className = 'control-btn edit-btn';
      editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
      editBtn.title = 'Edit task';
      editBtn.setAttribute('data-no-drag', 'true');
      editBtn.addEventListener('click', e => {
        e.stopPropagation();
        openTaskModal(task, li);
      });
      controlBar.appendChild(editBtn);

      const playBtn = document.createElement('button');
      playBtn.className = 'control-btn play-btn';
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      playBtn.title = 'Start task';
      playBtn.setAttribute('data-no-drag', 'true');
      playBtn.addEventListener('click', e => {
        e.stopPropagation();
        showToast('Start Task', `Started: ${task.content}`, 'Stop', () => {
          showToast('Task Stopped', `Stopped: ${task.content}`);
        });
      });
      controlBar.appendChild(playBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'control-btn delete-btn';
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      deleteBtn.title = 'Delete task';
      deleteBtn.setAttribute('data-no-drag', 'true');
      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteTask(task, li);
      });
      controlBar.appendChild(deleteBtn);

      const priorityFlags = document.createElement('div');
      priorityFlags.className = 'task-priority-flags';
      priorityFlags.setAttribute('data-no-drag', 'true');
      priorityFlags.appendChild(createPriorityFlag('fire','fa-fire', task.fire));
      priorityFlags.appendChild(createPriorityFlag('fast','fa-bolt', task.fast));
      priorityFlags.appendChild(createPriorityFlag('flow','fa-water', task.flow));
      priorityFlags.appendChild(createPriorityFlag('fear','fa-skull', task.fear));
      priorityFlags.appendChild(createPriorityFlag('first','fa-flag', task.first));
      row.appendChild(priorityFlags);
    }

    childContainer.appendChild(childList);
    if (task.isSection) {
      createSectionSortable(childList, chevron, childContainer);
    } else {
      createSortable(childList, chevron, childContainer);
    }

    row.addEventListener('dragover', () => {
      if (childList.children.length===0) childList.classList.add('drop-target-active');
    });
    row.addEventListener('dragleave', () => {
      childList.classList.remove('drop-target-active');
    });

    if (task.children?.length) {
      buildTree(task.children, childList);
      chevron.classList.add('expanded');
      chevron.textContent = '▾';
    }

    ul.appendChild(li);
  });

  if (parent.id === 'task-tree') {
    createRootSortable(ul);
  }
}

/* ---------- Priority Flag Factory ----------- */
function createPriorityFlag(type, iconClass, isActive, tooltip, isModal = false) {
  const flag = document.createElement('button');
  flag.className = `${isModal ? 'priority-flag-modal' : 'priority-flag'} ${isActive ? 'active' : ''}`;
  flag.setAttribute('data-priority', type);
  flag.setAttribute('data-no-drag', 'true');

  let icon, title;
  switch(type) {
    case 'fire':  icon='fa-fire';  title='Urgent?'; break;
    case 'fast':  icon='fa-bolt';  title='Under 5 min?'; break;
    case 'flow':  icon='fa-water'; title='Hyperfocus risk?'; break;
    case 'fear':  icon='fa-skull'; title='Avoidance risk?'; break;
    case 'first': icon='fa-flag';  title='20% that matters most?'; break;
    default:      icon=iconClass;  title=tooltip||type;
  }
  flag.title = title;
  flag.innerHTML = `<i class="fa-solid ${icon}"></i>`;

  flag.addEventListener('click', async e => {
    e.stopPropagation();
    const taskItem = flag.closest('.task-item');
    if (!taskItem) return;
    try {
      const td = JSON.parse(taskItem.dataset.taskData);
      const oldValue = td[type];
      td[type] = !td[type];
      taskItem.dataset.taskData = JSON.stringify(td);
      flag.classList.toggle('active', td[type]);
      
      console.log(`🔴 MAIN SCREEN FLAG CHANGE: ${type} for task "${td.content}" changed from ${oldValue} to ${td[type]}`);
      console.log('🔴 About to save task data to DB:', JSON.stringify(td, null, 2));
      
      db.saveTask(td.id, td).catch(err => console.error('Save error:', err));      // 📌 persist immediately
      if (debug) console.log(`Flag ${type} for "${td.content}" → ${td[type]}`);
    } catch(err) {
      console.error('Error toggling flag:', err);
    }
  });

  return flag;
}

/* ---------- Format revisit date ----------- */
function formatRevisitDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr==='today') return 'today';
  if (dateStr==='tomorrow') return 'tomorrow';
  if (dateStr==='next week') return 'Next week';
  if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) return dateStr;
  
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let taskDate;
    
    // Handle ISO date format from database (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.SSSZ)
    if (typeof dateStr === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Parse date in local timezone to avoid UTC conversion issues
        const [year, month, day] = dateStr.split('-').map(Number);
        taskDate = new Date(year, month - 1, day);
      } else if (dateStr.includes('T')) {
        // Extract just the date part to avoid timezone issues
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        taskDate = new Date(year, month - 1, day);
      } else {
        taskDate = new Date(dateStr);
      }
    }
    
    if (taskDate && !isNaN(taskDate)) {
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      
      // Check if it's today or tomorrow
      if (taskDateOnly.getTime() === today.getTime()) {
        return 'today';
      } else if (taskDateOnly.getTime() === tomorrow.getTime()) {
        return 'tomorrow';
      } else {
        // Return simplified M/D format
        return `${taskDate.getMonth() + 1}/${taskDate.getDate()}`;
      }
    }
  } catch(e) {
    console.error('Date formatting error:', e, 'for dateStr:', dateStr);
  }
  
  return dateStr;
}

/* ---------- Format for input[type=date] ----------- */
function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  
  try {
    const today = new Date();
    let d;
    
    if (dateStr === 'today') {
      d = today;
    } else if (dateStr === 'tomorrow') {
      d = new Date(today);
      d.setDate(d.getDate() + 1);
    } else if (dateStr === 'next week') {
      d = new Date(today);
      d.setDate(d.getDate() + 7);
    } else if (typeof dateStr === 'string') {
      console.log('🗓️ FORMAT INPUT: Processing string date:', dateStr);
      // Handle ISO date strings from database (YYYY-MM-DDTHH:MM:SS.SSSZ)
      if (dateStr.includes('T')) {
        // For ISO strings, extract just the date part to avoid timezone issues
        const datePart = dateStr.split('T')[0];
        console.log('🗓️ FORMAT INPUT: Extracted date part from ISO:', datePart);
        // Return the date part directly since it's already in YYYY-MM-DD format
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return datePart;
        }
        // Parse in local timezone
        const [year, month, day] = datePart.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format
        console.log('🗓️ FORMAT INPUT: Date already in correct format:', dateStr);
        return dateStr;
      } else {
        d = new Date(dateStr);
      }
    } else {
      d = new Date(dateStr);
    }
    
    if (isNaN(d)) return '';
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  } catch (e) {
    console.error('Error formatting date for input:', e, 'for dateStr:', dateStr);
    return '';
  }
}

/* ---------- Open Task Modal ----------- */
async function openTaskModal(task, taskElement) {
  try {
    console.log('🟡 MODAL OPEN: Starting to open modal for task:', task.id);
    
    // Fetch fresh data from database to ensure we have the latest values
    console.log('🟡 MODAL OPEN: Fetching fresh data from database...');
    const freshTask = await db.fetchTask(task.id);
    if (freshTask) {
      console.log('🟡 MODAL OPEN: Got fresh data from DB:', freshTask);
      task = freshTask;
    } else {
      console.log('🟡 MODAL OPEN: Using cached data (DB fetch failed)');
    }
    
    const modal = document.getElementById('task-view-modal');
    if (!modal) throw new Error('Modal not found');
    
    // Use correct IDs that match the HTML
    const titleInput = document.getElementById('modal-task-name');
    const revisitInput = document.getElementById('modal-revisit-date');
    const timeInput = document.getElementById('modal-scheduled-time');
    const overviewInput = document.getElementById('modal-overview');
    const detailsInput = document.getElementById('modal-details');
    const estimateInput = document.getElementById('modal-time-estimate');
    
    console.log('Modal fields found:', {
      titleInput: !!titleInput,
      revisitInput: !!revisitInput,
      timeInput: !!timeInput,
      overviewInput: !!overviewInput,
      detailsInput: !!detailsInput,
      estimateInput: !!estimateInput
    });
    
    if (!titleInput||!revisitInput||!timeInput||!overviewInput||!detailsInput||!estimateInput){
      throw new Error('Modal fields missing');
    }

    // Populate form fields with fresh data from database
    console.log('🟡 MODAL POPULATE: Setting form values from task data:', {
      content: task.content,
      revisitDate: task.revisitDate,
      scheduledTime: task.scheduledTime,
      overview: task.overview,
      details: task.details,
      timeEstimate: task.timeEstimate,
      timeEstimateType: typeof task.timeEstimate
    });
    
    titleInput.value = task.content || '';
    
    // Handle date formatting for modal input - convert all dates to YYYY-MM-DD format
    let dateValue = '';
    if (task.revisitDate) {
      dateValue = formatDateForInput(task.revisitDate);
      console.log('🟡 MODAL POPULATE: Formatted date from', task.revisitDate, 'to', dateValue);
    }
    revisitInput.value = dateValue;
    
    timeInput.setAttribute('step','900');
    if (!timeInput.hasAttribute('data-interval-listener')) {
      timeInput.setAttribute('data-interval-listener','true');
      timeInput.addEventListener('change', function(){
        const [h,m] = this.value.split(':').map(Number);
        const total = Math.round(((h*60+m)/15))*15;
        const hh = String(Math.floor(total/60)).padStart(2,'0'),
              mmu = String(total%60).padStart(2,'0');
        this.value=`${hh}:${mmu}`;
      });
    }
    
    // Handle scheduled time - convert from database format (HH:MM:SS) to input format (HH:MM)
    let timeValue = '09:00';
    if (task.scheduledTime) {
      if (task.scheduledTime.includes(':')) {
        const timeParts = task.scheduledTime.split(':');
        timeValue = `${timeParts[0]}:${timeParts[1]}`;
      } else {
        timeValue = task.scheduledTime;
      }
    }
    timeInput.value = timeValue;
    console.log('🟡 MODAL POPULATE: Set scheduled time from', task.scheduledTime, 'to', timeValue);
    
    overviewInput.value = task.overview || '';
    detailsInput.value = task.details || '';
    
    // Handle time estimate - ensure it's a number
    const timeEstimateValue = task.timeEstimate || 0;
    estimateInput.value = timeEstimateValue;
    console.log('🟡 MODAL POPULATE: Set time estimate to', timeEstimateValue, 'type:', typeof timeEstimateValue);

    // Generate priority flags dynamically using the unified function
    const modalFlagsContainer = document.getElementById('modal-priority-flags');
    modalFlagsContainer.innerHTML = ''; // Clear existing flags
    
    const flagTypes = [
      { type: 'fire', icon: 'fa-fire', title: 'Fire' },
      { type: 'fast', icon: 'fa-bolt', title: 'Fast' },
      { type: 'flow', icon: 'fa-water', title: 'Flow' },
      { type: 'fear', icon: 'fa-skull', title: 'Fear' },
      { type: 'first', icon: 'fa-star', title: 'First' }
    ];
    
    flagTypes.forEach(flagDef => {
      const isActive = !!task[flagDef.type];
      const flag = createPriorityFlag(flagDef.type, flagDef.icon, isActive, flagDef.title, true);
      
      // Add click handler for modal flags with real-time saving
      flag.onclick = async (e) => {
        e.preventDefault();
        flag.classList.toggle('active');
        
        // Save flag change immediately
        const updates = {};
        updates[flagDef.type] = flag.classList.contains('active');
        await saveModalChanges(task, updates);
      };
      
      modalFlagsContainer.appendChild(flag);
    });

    // Set up real-time saving for all form fields
    setupRealTimeSaving(task, titleInput, revisitInput, timeInput, overviewInput, detailsInput, estimateInput);

    modal.style.display='block';
    titleInput.focus();

    // Replace save button with close button
    document.getElementById('close-task-btn').onclick = () => modal.style.display='none';
    document.getElementById('delete-task-btn').onclick = () => deleteTask(task, taskElement);
    document.querySelector('.close-modal').onclick = () => modal.style.display='none';
    
    // Fixed modal close behavior - only close on actual clicks, not drags
    setupModalCloseHandling(modal);
    
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.removeEventListener('keydown', escHandler);
      }
    });

    if (debug) console.log(`Opened modal for "${task.content}"`);
  } catch(err){
    console.error('Error opening modal:', err);
    showToast('Error','Failed to open task details.');
  }
}

/* ---------- Real-time Saving Functions ----------- */
function setupRealTimeSaving(task, titleInput, revisitInput, timeInput, overviewInput, detailsInput, estimateInput) {
  // Debounce function to avoid too many saves
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Create debounced save function (500ms delay)
  const debouncedSave = debounce(async (updates) => {
    await saveModalChanges(task, updates);
  }, 500);

  // Set up listeners for all form fields
  titleInput.addEventListener('input', () => {
    debouncedSave({ content: titleInput.value });
  });

  revisitInput.addEventListener('change', () => {
    debouncedSave({ revisitDate: revisitInput.value });
  });

  timeInput.addEventListener('change', () => {
    const newTime = timeInput.value;
    debouncedSave({ scheduledTime: newTime });
    
    // Immediate propagation to Hours panel
    propagateTimeChangeToHoursPanel(task.id, newTime);
  });

  overviewInput.addEventListener('input', () => {
    debouncedSave({ overview: overviewInput.value });
  });

  detailsInput.addEventListener('input', () => {
    debouncedSave({ details: detailsInput.value });
  });

  estimateInput.addEventListener('change', () => {
    const newEstimate = parseFloat(estimateInput.value) || 0;
    debouncedSave({ timeEstimate: newEstimate });
    
    // Immediate propagation to Hours panel
    propagateEstimateChangeToHoursPanel(task.id, newEstimate);
  });
}

async function saveModalChanges(task, updates) {
  try {
    console.log('🔵 REAL-TIME SAVE: Saving changes for task:', task.id, updates);
    
    // Update task object with new values
    Object.assign(task, updates);
    
    // Use centralized state management
    await updateTaskState(task.id, updates);
    
    // Check if Hours panel affecting changes were made
    const hasHoursChanges = 
      updates.hasOwnProperty('timeEstimate') ||
      updates.hasOwnProperty('scheduledTime');

    // If Hours panel changes were made, refresh just the Hours panel
    if (hasHoursChanges) {
      console.log('🔵 REAL-TIME SAVE: Hours panel changes detected, refreshing Hours panel');
      
      const hoursVisible = !document.querySelector('.hours-column')?.classList.contains('hidden');
      if (hoursVisible) {
        // Clear existing hours tasks
        hoursData.tasks = [];
        const taskBlocksContainer = document.getElementById('task-blocks-container');
        if (taskBlocksContainer) {
          taskBlocksContainer.querySelectorAll('.task-block').forEach(block => block.remove());
        }
        
        // Reload hours tasks
        await addSampleHoursTasks();
      }
    }
    
    console.log('✅ REAL-TIME SAVE: Changes saved successfully');
  } catch(err) {
    console.error('❌ REAL-TIME SAVE ERROR:', err);
    showToast('Save Error', 'Failed to save changes automatically');
  }
}

function setupModalCloseHandling(modal) {
  let isMouseDown = false;
  let mouseDownTarget = null;
  
  // Track mouse down events
  document.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseDownTarget = e.target;
  });
  
  // Track mouse up events - only close if both down and up were outside modal content
  document.addEventListener('mouseup', (e) => {
    if (isMouseDown && modal.style.display === 'block') {
      const modalContent = modal.querySelector('.modal-content');
      
      // Check if both mousedown and mouseup were outside modal content
      const mouseDownOutside = !modalContent.contains(mouseDownTarget);
      const mouseUpOutside = !modalContent.contains(e.target);
      
      if (mouseDownOutside && mouseUpOutside && e.target === modal) {
        modal.style.display = 'none';
        console.log('🔵 MODAL: Closed via click outside (not drag)');
      }
    }
    
    isMouseDown = false;
    mouseDownTarget = null;
  });
}

/* ---------- Save from Modal (Legacy - kept for compatibility) ----------- */
async function saveTaskFromModal(task, taskElement) {
  try {
    console.log('🔵 MODAL SAVE: Starting save for task:', task.id);
    
    // Store original values to detect changes
    const originalData = {
      content: task.content,
      revisitDate: task.revisitDate,
      scheduledTime: task.scheduledTime,
      timeEstimate: task.timeEstimate
    };
    
    // Create updates object with modal form data
    const updates = {
      content: document.getElementById('modal-task-name').value,
      revisitDate: document.getElementById('modal-revisit-date').value,
      scheduledTime: document.getElementById('modal-scheduled-time').value,
      overview: document.getElementById('modal-overview').value,
      details: document.getElementById('modal-details').value,
      timeEstimate: parseFloat(document.getElementById('modal-time-estimate').value) || 0
    };

    // Update priority flags
    document.querySelectorAll('.priority-flag-modal').forEach(btn=>{
      const p=btn.dataset.priority;
      if (p) {
        const newValue = btn.classList.contains('active');
        console.log(`🔵 MODAL SAVE: ${p} flag changed to ${newValue}`);
        updates[p] = newValue;
      }
    });

    console.log('🔵 MODAL SAVE: Updates being applied:', JSON.stringify(updates, null, 2));

    // Check if display-affecting changes were made
    const hasDisplayChanges = 
      originalData.content !== updates.content ||
      originalData.revisitDate !== updates.revisitDate ||
      originalData.scheduledTime !== updates.scheduledTime ||
      originalData.timeEstimate !== updates.timeEstimate;

    // Use centralized state management
    await updateTaskState(task.id, updates);

    // Check if Hours panel affecting changes were made (time estimate or scheduled time)
    const hasHoursChanges = 
      originalData.timeEstimate !== updates.timeEstimate ||
      originalData.scheduledTime !== updates.scheduledTime;

    // If display-affecting changes were made, refresh both panels
    if (hasDisplayChanges) {
      console.log('🔵 MODAL SAVE: Display changes detected, refreshing panels');
      
      // Reload tasks from database and rebuild both panels
      const tasks = await db.loadTasks();
      if (tasks) {
        // Refresh task tree
        const taskTree = document.getElementById('task-tree');
        taskTree.innerHTML = '';
        buildTree(tasks, taskTree);
        handleFilterChange(); // Reapply current filter
        
        // Refresh hours panel if visible
        const hoursVisible = !document.querySelector('.hours-column')?.classList.contains('hidden');
        if (hoursVisible) {
          await addSampleHoursTasks(); // This loads database tasks for today
        }
        
        console.log('🔵 MODAL SAVE: Panels refreshed after display changes');
      }
    } 
    // If only Hours panel changes were made, refresh just the Hours panel
    else if (hasHoursChanges) {
      console.log('🔵 MODAL SAVE: Hours panel changes detected, refreshing Hours panel only');
      
      const hoursVisible = !document.querySelector('.hours-column')?.classList.contains('hidden');
      if (hoursVisible) {
        // Clear existing hours tasks
        hoursData.tasks = [];
        const taskBlocksContainer = document.getElementById('task-blocks-container');
        if (taskBlocksContainer) {
          taskBlocksContainer.querySelectorAll('.task-block').forEach(block => block.remove());
        }
        
        // Reload hours tasks
        await addSampleHoursTasks();
        console.log('🔵 MODAL SAVE: Hours panel refreshed after time estimate/schedule changes');
      }
    }

    document.getElementById('task-view-modal').style.display='none';
    showToast('Task Updated','Saved changes.');
    if (debug) console.log(`Saved modal edits for "${updates.content}"`);
  } catch(err){
    console.error('Error saving from modal:', err);
    showToast('Error','Failed to save task.');
  }
}

/* ---------- Delete a Task ----------- */
function deleteTask(task, taskElement) {
  try {
    const parentList = taskElement.parentNode;
    if (!parentList) throw new Error('No parent list');
    
    // Store complete task data including position and parent info for proper restoration
    const taskData = JSON.parse(JSON.stringify(task));
    const taskPosition = Array.from(parentList.children).indexOf(taskElement);
    const parentSection = taskElement.closest('.section-header');
    const parentId = parentSection ? parentSection.dataset.taskId : null;
    
    console.log('🗑️ DELETE: Storing restoration data:', {
      taskData,
      taskPosition,
      parentId,
      parentListId: parentList.id
    });

    // Remove from UI and database
    parentList.removeChild(taskElement);
    db.deleteTask(task.id);

    showToast('Task Deleted', 'Task removed.', 'Undo', async () => {
      try {
        console.log('🔄 UNDO: Restoring task to database and UI');
        
        // Restore to database first (use addTask since the task was deleted)
        const restored = await db.addTask({
          ...taskData,
          parentId: parentId,
          positionOrder: taskPosition
        });
        
        if (restored !== false) {
          // Reload the entire task tree to ensure proper positioning
          const tasks = await db.loadTasks();
          if (tasks) {
            const taskTree = document.getElementById('task-tree');
            taskTree.innerHTML = '';
            buildTree(tasks, taskTree);
            
            // Reapply current filter to maintain user's view
            handleFilterChange();
          }
          showToast('Restored', 'Task restored successfully.');
          console.log('✅ UNDO: Task restored successfully');
        } else {
          throw new Error('Failed to restore task to database');
        }
      } catch (error) {
        console.error('❌ UNDO ERROR:', error);
        showToast('Error', 'Failed to restore task.');
      }
    });
    
    if (debug) console.log(`Deleted "${task.content}"`);
  } catch(err){
    console.error('Error deleting task:', err);
    showToast('Error','Failed to delete task.');
  }
}

/* ---------- Toast ----------- */
function showToast(title, message, actionText, actionCallback) {
  try {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const content = document.createElement('div');
    content.className = 'toast-content';
    const t = document.createElement('div');
    t.className = 'toast-title';
    t.textContent = title;
    const m = document.createElement('div');
    m.className = 'toast-message';
    m.textContent = message;
    content.appendChild(t);
    content.appendChild(m);
    toast.appendChild(content);
    if (actionText && actionCallback) {
      const btn = document.createElement('button');
      btn.className = 'toast-action';
      btn.textContent = actionText;
      btn.onclick = () => {
        actionCallback();
        container.removeChild(toast);
      };
      toast.appendChild(btn);
    }
    container.appendChild(toast);
    setTimeout(()=>{ if(container.contains(toast)) container.removeChild(toast); }, 5000);
  } catch(e){
    console.error('Error showing toast:', e);
  }
}

/* ---------- DOM Debug Dump Function ----------- */
function DOM_dump(context = 'Filter Debug') {
  try {
    // Capture comprehensive DOM debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      context: context,
      url: window.location.href,
      
      // Task tree container information
      taskTreeElement: {
        exists: !!document.getElementById('task-tree'),
        innerHTML: document.getElementById('task-tree')?.innerHTML || 'NOT FOUND',
        childElementCount: document.getElementById('task-tree')?.childElementCount || 0
      },
      
      // Task items query results
      taskItems: {
        byClass: document.querySelectorAll('.task-item').length,
        byDataAttribute: document.querySelectorAll('[data-task-id]').length,
        byListElements: document.querySelectorAll('.task-list').length,
        allTaskElements: Array.from(document.querySelectorAll('.task-item')).map(el => ({
          id: el.dataset.id || el.dataset.taskId,
          className: el.className,
          textContent: el.textContent.trim().substring(0, 50),
          display: el.style.display,
          visible: el.offsetParent !== null
        }))
      },
      
      // Filter dropdown state
      filterDropdown: {
        exists: !!document.getElementById('filter-dropdown'),
        value: document.getElementById('filter-dropdown')?.value,
        options: Array.from(document.getElementById('filter-dropdown')?.options || []).map(opt => opt.value)
      },
      
      // Document readiness
      documentState: {
        readyState: document.readyState,
        bodyExists: !!document.body,
        headExists: !!document.head
      },
      
      // Sample of actual DOM structure
      taskTreeHTML: document.getElementById('task-tree')?.outerHTML?.substring(0, 2000) || 'TASK TREE NOT FOUND'
    };
    
    // Format for clipboard
    const clipboardContent = `
=== DOM DEBUG DUMP ===
Context: ${debugInfo.context}
Timestamp: ${debugInfo.timestamp}
URL: ${debugInfo.url}

TASK ELEMENTS FOUND:
- .task-item elements: ${debugInfo.taskItems.byClass}
- [data-task-id] elements: ${debugInfo.taskItems.byDataAttribute}  
- .task-list elements: ${debugInfo.taskItems.byListElements}

TASK TREE CONTAINER:
- Exists: ${debugInfo.taskTreeElement.exists}
- Child elements: ${debugInfo.taskTreeElement.childElementCount}

FILTER DROPDOWN:
- Exists: ${debugInfo.filterDropdown.exists}
- Current value: ${debugInfo.filterDropdown.value}
- Available options: ${debugInfo.filterDropdown.options.join(', ')}

DOCUMENT STATE:
- Ready state: ${debugInfo.documentState.readyState}
- Body exists: ${debugInfo.documentState.bodyExists}

FOUND TASK ELEMENTS DETAILS:
${debugInfo.taskItems.allTaskElements.map(task => 
  `- ID: ${task.id}, Class: ${task.className}, Text: "${task.textContent}", Display: ${task.display}, Visible: ${task.visible}`
).join('\n')}

TASK TREE HTML SAMPLE (first 2000 chars):
${debugInfo.taskTreeHTML}

=== END DEBUG DUMP ===
    `;
    
    // Copy to clipboard
    navigator.clipboard.writeText(clipboardContent).then(() => {
      showToast('DOM Debug', `${context} - DOM structure copied to clipboard`, 'View Log', () => {
        console.log('📋 FULL DOM DUMP:', debugInfo);
      });
      console.log('📋 DOM DUMP: Copied to clipboard for context:', context);
    }).catch(err => {
      console.error('📋 DOM DUMP: Failed to copy to clipboard:', err);
      console.error('DOM Debug Error: Failed to copy DOM dump to clipboard');
    });
    
    return debugInfo;
    
  } catch (error) {
    console.error('📋 DOM DUMP ERROR:', error);
    showToast('DOM Debug Error', 'Error generating DOM dump');
    return null;
  }
}

/* ---------- Filter Tasks ----------- */
function handleFilterChange() {
  console.log('🚀 FILTER START: handleFilterChange() function called');
  
  // CAPTURE DOM STATE BEFORE FILTER PROCESSING
  DOM_dump('Before Filter Processing');
  
  const filterDropdown = document.getElementById('filter-dropdown');
  if (!filterDropdown) {
    console.log('❌ FILTER ERROR: filter-dropdown element not found!');
    DOM_dump('Filter Dropdown Not Found');
    return;
  }
  
  const filterValue = filterDropdown.value;
  console.log(`🔍 FILTER: Selected filter value = "${filterValue}"`);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  console.log(`📅 FILTER: Today's date = ${today.toISOString().split('T')[0]} (${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')})`);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Fixed: This week is last Monday through coming Sunday
  const daysSinceMonday = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 system
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysSinceMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(weekEnd.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
  
  // Fixed: This month is 1st through last calendar day of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  console.log(`📅 DATE RANGES:
    Today: ${today.toDateString()}
    Tomorrow: ${tomorrow.toDateString()}
    This Week: ${weekStart.toDateString()} → ${weekEnd.toDateString()}
    Next Week: ${nextWeekStart.toDateString()} → ${nextWeekEnd.toDateString()}
    This Month: ${monthStart.toDateString()} → ${monthEnd.toDateString()}
    Next Month: ${nextMonthStart.toDateString()} → ${nextMonthEnd.toDateString()}`);

  const allTaskItems = document.querySelectorAll('.task-item');

  // CAPTURE DOM STATE AT CRITICAL MOMENT
  DOM_dump('Critical Filter Moment - Task Query Results');
//
//
//


  
  console.log(`📋 FILTER: Found ${allTaskItems.length} task items in DOM`);
  
  let processedCount = 0;
  let shownCount = 0;
  let hiddenCount = 0;
  let sectionCount = 0;
  
  allTaskItems.forEach(taskItem => {
    processedCount++;
    console.log(`\n--- PROCESSING TASK ${processedCount}/${allTaskItems.length} ---`);
    
    if (taskItem.classList.contains('section-header')) {
      // Always show section headers
      taskItem.style.display = '';
      sectionCount++;
      shownCount++;
      console.log(`📁 SECTION: Found section header - always visible`);
      return;
    }
    
    let shouldShow = false;
    const rawTaskData = taskItem.dataset.taskData || '{}';
    console.log(`📄 RAW DATA: ${rawTaskData}`);
    
    const taskData = JSON.parse(rawTaskData);
    console.log(`📊 PARSED TASK: "${taskData.content}" - ID: ${taskData.id}, revisitDate: ${taskData.revisitDate}, parent: ${taskData.parent_id}`);
    
    if (filterValue === 'all') {
      shouldShow = true;
    } else if (filterValue === 'triage') {
      // TRIAGE LOGIC: Show tasks that NEED triaging regardless of their current location
      // These are tasks that haven't been properly categorized yet
      const revisitDate = taskData.revisitDate;
      const isCompleted = taskData.completed;
      const isInTriageSection = taskData.parent_id === 'section-triage';
      const isInABC = taskData.parent_id === 'section-a' || taskData.parent_id === 'section-b' || taskData.parent_id === 'section-c';
      
      console.log(`🔍 TRIAGE CHECK: Task "${taskData.content}" - completed: ${isCompleted}, revisitDate: ${revisitDate}, parent: ${taskData.parent_id}`);
      
      // Always show tasks physically in Triage section (user manually placed them there)
      if (isInTriageSection) {
        shouldShow = true;
        console.log(`✅ TRIAGE: "${taskData.content}" - physically in Triage section`);
      } 
      // Only check uncompleted tasks for triage criteria
      else if (!isCompleted) {
        // Case 1: Tasks with no revisit date (need to be scheduled/categorized)
        if (!revisitDate || revisitDate === null || revisitDate === '') {
          shouldShow = true;
          console.log(`✅ TRIAGE: "${taskData.content}" - no revisit date set`);
        } 
        // Case 2: Tasks with expired revisit dates (past due)
        else {
          let taskDate = null;
          if (revisitDate === 'today') {
            taskDate = today;
          } else if (revisitDate === 'tomorrow') {
            taskDate = tomorrow;
          } else if (typeof revisitDate === 'string') {
            if (revisitDate.includes('T')) {
              taskDate = new Date(revisitDate);
            } else if (revisitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              taskDate = new Date(revisitDate + 'T00:00:00');
            } else {
              taskDate = new Date(revisitDate);
            }
          }
          
          if (taskDate && !isNaN(taskDate)) {
            const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            // Show if revisit date has passed (expired) 
            if (taskDateOnly < today) {
              shouldShow = true;
              console.log(`✅ TRIAGE: "${taskData.content}" - expired revisit date (${taskDateOnly.toDateString()} < ${today.toDateString()})`);
            }
            // Case 3: Tasks scheduled for today but not in A/B/C sections
            else if (taskDateOnly.getTime() === today.getTime() && !isInABC) {
              shouldShow = true;
              console.log(`✅ TRIAGE: "${taskData.content}" - scheduled for today but not categorized to A/B/C`);
            }
          }
        }
      }
      
      if (!shouldShow) {
        console.log(`❌ TRIAGE: "${taskData.content}" - does not meet triage criteria`);
      }
    } else {
      // Date-based filters (Today, Tomorrow, This Week, etc.)
      const revisitDate = taskData.revisitDate;
      const isCompleted = taskData.completed;
      
      // CORRECTED BUSINESS LOGIC: 
      // - Past due tasks should show in ALL date filters (they need attention)
      // - Exact date matches should show in their specific filters
      // - Tasks without revisit dates should ONLY appear in Triage filter
      
      // Check for super-dump trigger: First failure case
      const shouldTriggerDump = taskData.content && (
        (taskData.content.includes('PastDue') && filterValue === 'today') ||
        (taskData.content.includes('Today') && filterValue === 'today') ||
        (taskData.content.includes('Tomorrow') && filterValue === 'tomorrow') ||
        (taskData.content.includes('ThisWeek') && filterValue === 'this-week')
      );
      
      if (shouldTriggerDump && !isCompleted) {
        console.log(`\n🚨🚨🚨 SUPER-DUMP: Task "${taskData.content}" should match filter "${filterValue}" but may not be showing`);
        console.log(`📋 FULL TASK DATA:`, taskData);
        console.log(`📅 REVISIT DATE: "${revisitDate}" (type: ${typeof revisitDate})`);
        console.log(`✅ COMPLETED: ${isCompleted}`);
        console.log(`🎯 FILTER: "${filterValue}"`);
        console.log(`📆 TODAY: ${today.toDateString()} (${today.getTime()})`);
        console.log(`📆 TOMORROW: ${tomorrow.toDateString()} (${tomorrow.getTime()})`);
      }
      
      if (revisitDate && revisitDate !== null && revisitDate !== '') {
        let taskDate;
        
        // Handle different date formats
        if (revisitDate === 'today') {
          taskDate = today;
        } else if (revisitDate === 'tomorrow') {
          taskDate = tomorrow;
        } else if (typeof revisitDate === 'string') {
          // Handle ISO date strings from database (YYYY-MM-DDTHH:MM:SS.SSSZ)
          if (revisitDate.includes('T')) {
            taskDate = new Date(revisitDate);
          } else if (revisitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            taskDate = new Date(revisitDate + 'T00:00:00');
          } else {
            taskDate = new Date(revisitDate);
          }
        }
        
        if (taskDate && !isNaN(taskDate)) {
          // Convert to date-only for comparison
          const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
          
          if (shouldTriggerDump && !isCompleted) {
            console.log(`🔍 PARSED DATE: taskDate = ${taskDate.toISOString()}`);
            console.log(`🔍 DATE-ONLY: taskDateOnly = ${taskDateOnly.toDateString()} (${taskDateOnly.getTime()})`);
            console.log(`🔍 COMPARISON: taskDateOnly < today? ${taskDateOnly.getTime() < today.getTime()}`);
            console.log(`🔍 COMPARISON: taskDateOnly === today? ${taskDateOnly.getTime() === today.getTime()}`);
          }
          
          switch (filterValue) {
            case 'today':
              // CORRECTED LOGIC: Show tasks that are due today OR overdue (past due)
              const isToday = taskDateOnly.getTime() === today.getTime();
              const isOverdue = taskDateOnly.getTime() < today.getTime() && !isCompleted;
              shouldShow = isToday || isOverdue;
              
              if (shouldTriggerDump && !isCompleted) {
                console.log(`🔍 TODAY LOGIC: isToday=${isToday}, isOverdue=${isOverdue}, shouldShow=${shouldShow}`);
              }
              console.log(`🔍 TODAY FILTER: Task "${taskData.content}" - taskDate: ${taskDateOnly.toDateString()}, today: ${today.toDateString()}, isToday: ${isToday}, isOverdue: ${isOverdue}, shouldShow: ${shouldShow}`);
              break;
            case 'tomorrow':
              // Tomorrow filter: Only exact matches (no overdue logic for tomorrow)
              shouldShow = taskDateOnly.getTime() === tomorrow.getTime();
              if (shouldTriggerDump && !isCompleted) {
                console.log(`🔍 TOMORROW LOGIC: exact match = ${shouldShow}`);
              }
              console.log(`🔍 TOMORROW FILTER: Task "${taskData.content}" - taskDate: ${taskDateOnly.toDateString()}, tomorrow: ${tomorrow.toDateString()}, match: ${shouldShow}`);
              break;
            case 'this-week':
              // This week: Show tasks in week range OR overdue tasks
              const isInWeek = taskDateOnly.getTime() >= weekStart.getTime() 
                            && taskDateOnly.getTime() <= weekEnd.getTime();
              const isOverdueForWeek = taskDateOnly.getTime() < weekStart.getTime() && !isCompleted;
              shouldShow = isInWeek || isOverdueForWeek;
              
              if (shouldTriggerDump && !isCompleted) {
                console.log(`🔍 THIS-WEEK LOGIC: isInWeek=${isInWeek}, isOverdueForWeek=${isOverdueForWeek}, shouldShow=${shouldShow}`);
              }
              console.log(`🔍 THIS-WEEK FILTER: Task "${taskData.content}" - taskDate: ${taskDateOnly.toDateString()}, weekStart: ${weekStart.toDateString()}, weekEnd: ${weekEnd.toDateString()}, isInWeek: ${isInWeek}, isOverdue: ${isOverdueForWeek}, shouldShow: ${shouldShow}`);
              break;
            case 'next-week':
              shouldShow = taskDateOnly.getTime() >= nextWeekStart.getTime() 
                        && taskDateOnly.getTime() <= nextWeekEnd.getTime();
              console.log(`🔍 NEXT-WEEK FILTER: Task "${taskData.content}" - taskDate: ${taskDateOnly.toDateString()}, nextWeekStart: ${nextWeekStart.toDateString()}, nextWeekEnd: ${nextWeekEnd.toDateString()}, match: ${shouldShow}`);
              break;
            case 'this-month':
              // This month: Show tasks in month range OR overdue tasks
              const isInMonth = taskDateOnly.getTime() >= monthStart.getTime() 
                             && taskDateOnly.getTime() <= monthEnd.getTime();
              const isOverdueForMonth = taskDateOnly.getTime() < monthStart.getTime() && !isCompleted;
              shouldShow = isInMonth || isOverdueForMonth;
              console.log(`🔍 THIS-MONTH FILTER: Task "${taskData.content}" - taskDate: ${taskDateOnly.toDateString()}, monthStart: ${monthStart.toDateString()}, monthEnd: ${monthEnd.toDateString()}, isInMonth: ${isInMonth}, isOverdue: ${isOverdueForMonth}, shouldShow: ${shouldShow}`);
              break;
            case 'next-month':
              // Next month: Only exact matches (no overdue logic for future dates)
              shouldShow = taskDateOnly.getTime() >= nextMonthStart.getTime() 
                        && taskDateOnly.getTime() <= nextMonthEnd.getTime();
              console.log(`🔍 NEXT-MONTH FILTER: Task "${taskData.content}" - taskDate: ${taskDateOnly.toDateString()}, nextMonthStart: ${nextMonthStart.toDateString()}, nextMonthEnd: ${nextMonthEnd.toDateString()}, match: ${shouldShow}`);
              break;
            default:
              shouldShow = false;
              break;
          }
          
          // SUPER-DUMP: Final result for failure cases
          if (shouldTriggerDump && !isCompleted) {
            console.log(`🚨 FINAL RESULT: Task "${taskData.content}" shouldShow = ${shouldShow}`);
            if (!shouldShow) {
              console.log(`💥 FAILURE ANALYSIS: This task should be visible but won't be!`);
              console.log(`💥 TASK NAME suggests: ${taskData.content.includes('PastDue') ? 'PAST DUE' : taskData.content.includes('Today') ? 'TODAY' : taskData.content.includes('Tomorrow') ? 'TOMORROW' : 'OTHER'}`);
              console.log(`💥 FILTER TYPE: ${filterValue}`);
              console.log(`💥 DATE COMPARISON: task=${taskDateOnly.toDateString()}, filter_target=${filterValue === 'today' ? today.toDateString() : filterValue === 'tomorrow' ? tomorrow.toDateString() : 'other'}`);
            }
            console.log(`🚨🚨🚨 END SUPER-DUMP for "${taskData.content}"\n`);
          }
        }
      } else {
        // No revisit date - only show in Triage
        if (shouldTriggerDump) {
          console.log(`🚨 NO REVISIT DATE: Task "${taskData.content}" has no revisit date, should only appear in Triage filter`);
        }
      }
    }
    
    // Apply visibility and count results
    taskItem.style.display = shouldShow ? '' : 'none';
    if (shouldShow) {
      shownCount++;
      console.log(`✅ SHOW: "${taskData.content}" will be visible`);
    } else {
      hiddenCount++;
      console.log(`❌ HIDE: "${taskData.content}" will be hidden`);
    }
  });
  
  console.log(`\n🏁 FILTER COMPLETE: "${filterValue}" filter applied`);
  console.log(`📊 SUMMARY: ${processedCount} total, ${sectionCount} sections, ${shownCount} shown, ${hiddenCount} hidden`);
  
  // CAPTURE DOM STATE AFTER FILTER PROCESSING
  DOM_dump('After Filter Processing Complete');
}

/* ---------- Sort by Priority ----------- */
async function sortTasksByPriority() {
  if (debug) console.log('🔄 Starting priority sort');
  
  const sortPromises = [];
  
  document.querySelectorAll('.section-header').forEach(sectionHeader=>{
    const sectionId = sectionHeader.dataset.id;
    console.log(`🔄 SORT: Processing section ${sectionId}`);
    
    // Debug: Log the section header element structure
    console.log(`🔄 SORT: Section header element:`, sectionHeader);
    console.log(`🔄 SORT: Section header parent:`, sectionHeader.parentElement);
    
    // Find the task-children container within this section header's parent
    const sectionLi = sectionHeader.closest('.task-item');
    console.log(`🔄 SORT: Section LI found:`, sectionLi);
    
    const container = sectionLi?.querySelector('.task-children');
    console.log(`🔄 SORT: Container found:`, container);
    
    if (!container) {
      console.log(`❌ SORT: No task-children container found for ${sectionId}`);
      return;
    }
    
    const list = container.querySelector('.task-list');
    console.log(`🔄 SORT: List found:`, list);
    
    if (!list) {
      console.log(`❌ SORT: No task-list found for ${sectionId}`);
      return;
    }
    
    // Look for tasks in nested ul structures - the actual tasks might be in a nested task-list
    let taskItems = [];
    
    // First check direct children
    const directChildren = Array.from(list.children).filter(li => 
      li.classList.contains('task-item') && !li.classList.contains('section-header')
    );
    
    // If no direct children, look in nested ul elements
    if (directChildren.length === 0) {
      const nestedLists = list.querySelectorAll(':scope > ul.task-list');
      console.log(`🔄 SORT: Found ${nestedLists.length} nested lists`);
      
      nestedLists.forEach(nestedList => {
        const nestedItems = Array.from(nestedList.children).filter(li => 
          li.classList.contains('task-item') && !li.classList.contains('section-header')
        );
        taskItems.push(...nestedItems);
        console.log(`🔄 SORT: Found ${nestedItems.length} items in nested list`);
      });
    } else {
      taskItems = directChildren;
    }
    
    const items = taskItems;
    console.log(`🔄 SORT: Total task items found: ${items.length}`);
    
    console.log(`🔄 SORT: Found ${items.length} tasks in ${sectionId}`);
    
    if (items.length<=1) return;

    const completed    = items.filter(i=>i.classList.contains('task-completed'));
    const notCompleted = items.filter(i=>!i.classList.contains('task-completed'));

    console.log(`🔄 SORT: Section ${sectionHeader.dataset.id} - ${notCompleted.length} incomplete, ${completed.length} completed`);

    notCompleted.sort((a,b)=>{
      const score = el=>['fast','first','fire','fear','flow']
        .reduce((s,p,i)=>s + (el.querySelector(`.priority-flag[data-priority="${p}"]`)?.classList.contains('active') ? (50-10*i) : 0),0);
      return score(b)-score(a);
    });

    const sortedItems = [...notCompleted, ...completed];
    
    // Update DOM order - append to the correct list (nested if applicable)
    let targetList = list;
    if (items.length > 0 && items[0].parentElement !== list) {
      // Tasks are in a nested list, use that as the target
      targetList = items[0].parentElement;
      console.log(`🔄 SORT: Using nested list as target for ${sectionId}`);
    }
    
    sortedItems.forEach(li=>targetList.appendChild(li));
    
    // Update database with new positions
    sortedItems.forEach((li, index) => {
      const taskData = JSON.parse(li.dataset.taskData || '{}');
      if (taskData.id) {
        console.log(`🔄 SORT: Updating ${taskData.id} to position ${index}`);
        const updateData = {
          ...taskData,
          positionOrder: index
        };
        
        // Save new position to database
        const savePromise = db.saveTask(taskData.id, updateData)
          .then(() => {
            console.log(`✅ SORT: Saved position ${index} for ${taskData.id}`);
          })
          .catch(err => {
            console.error(`❌ SORT: Failed to save position for ${taskData.id}:`, err);
          });
        
        sortPromises.push(savePromise);
      }
    });
  });
  
  // Wait for all database updates to complete
  try {
    await Promise.all(sortPromises);
    if (sortPromises.length > 0) {
      showToast('Tasks Sorted','By priority and saved to database.');
      console.log('✅ Priority sort complete - all positions saved to database');
    } else {
      showToast('Sort Notice','No tasks found to sort. Make sure sections are expanded.');
      console.log('⚠️ No sortable tasks found in any section');
    }
  } catch (error) {
    console.error('❌ Error saving sort order to database:', error);
    showToast('Sort Warning','Tasks sorted but some positions may not be saved.');
  }
}

/* ---------- Consolidate to Triage ----------- */
async function consolidateToTriage() {
  console.log('🔄 Starting consolidation to Triage');
  
  try {
    // Get all tasks from sections A, B, and C
    const tasksToMove = [];
    const sectionsToConsolidate = ['section-a', 'section-b', 'section-c'];
    
    document.querySelectorAll('.task-item').forEach(taskItem => {
      if (taskItem.classList.contains('section-header')) return;
      
      const taskData = JSON.parse(taskItem.dataset.taskData || '{}');
      if (sectionsToConsolidate.includes(taskData.parent_id) || 
          sectionsToConsolidate.some(section => taskData.id && taskData.id.includes(section.replace('section-', '')))) {
        tasksToMove.push(taskData);
      }
    });
    
    console.log(`🔄 CONSOLIDATE: Found ${tasksToMove.length} tasks to move to Triage`);
    
    if (tasksToMove.length === 0) {
      showToast('Consolidation Complete', 'No tasks found in A, B, or C sections to move.');
      return;
    }
    
    // Update all tasks to have parent_id = 'section-triage'
    const updatePromises = tasksToMove.map((task, index) => {
      const updatedTask = {
        ...task,
        parent_id: 'section-triage',
        positionOrder: 1000 + index // Place at end of triage
      };
      
      return db.saveTask(task.id, updatedTask)
        .then(() => {
          console.log(`✅ CONSOLIDATE: Moved ${task.id} to Triage`);
        })
        .catch(err => {
          console.error(`❌ CONSOLIDATE: Failed to move ${task.id}:`, err);
        });
    });
    
    await Promise.all(updatePromises);
    
    // Reload tasks to reflect changes
    const tasks = await db.loadTasks();
    if (tasks) {
      const taskTree = document.getElementById('task-tree');
      taskTree.innerHTML = '';
      buildTree(tasks, taskTree);
      showToast('Consolidation Complete', `Moved ${tasksToMove.length} tasks to Triage for aggressive sorting.`);
      console.log('✅ Consolidation complete - all tasks moved to Triage');
    }
    
  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    showToast('Consolidation Error', 'Failed to move some tasks to Triage.');
  }
}

/* ---------- Centralized Task State Management (DRY) ----------- */
async function updateTaskState(taskId, updates) {
  try {
    console.log(`🔄 Updating task ${taskId}:`, updates);
    
    // Find the task element
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) {
      console.error('Task element not found for:', taskId);
      return false;
    }
    
    // Get current task data
    let taskData = JSON.parse(taskElement.dataset.taskData || '{}');
    
    // Apply updates
    taskData = { ...taskData, ...updates };
    
    // Update element's dataset
    taskElement.dataset.taskData = JSON.stringify(taskData);
    
    // Update visual elements based on state changes
    if (updates.hasOwnProperty('completed')) {
      const checkbox = taskElement.querySelector('.task-checkbox');
      if (checkbox) {
        checkbox.innerHTML = taskData.completed ? '<i class="fa-solid fa-check"></i>' : '';
        taskElement.classList.toggle('task-completed', taskData.completed);
      }
    }
    
    if (updates.hasOwnProperty('content')) {
      const textEl = taskElement.querySelector('.task-text');
      if (textEl) {
        const maxLength = 26;
        if (taskData.content.length > maxLength) {
          textEl.textContent = taskData.content.substring(0, maxLength) + '...';
        } else {
          textEl.textContent = taskData.content;
        }
        textEl.title = taskData.content;
      }
    }
    
    if (updates.hasOwnProperty('revisitDate')) {
      const dateContainer = taskElement.querySelector('.task-date-container');
      if (dateContainer) {
        dateContainer.innerHTML = '';
        if (taskData.revisitDate) {
          const date = document.createElement('span');
          date.className = 'task-date';
          date.textContent = formatRevisitDate(taskData.revisitDate);
          date.addEventListener('click', e => {
            e.stopPropagation();
            openTaskModal(taskData, taskElement);
          });
          dateContainer.appendChild(date);
        } else {
          const calendarIcon = document.createElement('button');
          calendarIcon.className = 'task-date-icon';
          calendarIcon.innerHTML = '<i class="fa-solid fa-calendar"></i>';
          calendarIcon.title = 'Set date';
          calendarIcon.addEventListener('click', e => {
            e.stopPropagation();
            openTaskModal(taskData, taskElement);
          });
          dateContainer.appendChild(calendarIcon);
        }
      }
    }
    
    if (updates.hasOwnProperty('timeEstimate')) {
      const estimateEl = taskElement.querySelector('.task-time-estimate');
      if (estimateEl) {
        if (taskData.timeEstimate && taskData.timeEstimate > 0) {
          estimateEl.textContent = `${taskData.timeEstimate}h`;
          estimateEl.style.display = 'inline';
        } else {
          estimateEl.style.display = 'none';
        }
      }
    }
    
    // Update priority flags
    ['fire', 'fast', 'flow', 'fear', 'first'].forEach(flag => {
      if (updates.hasOwnProperty(flag)) {
        const flagEl = taskElement.querySelector(`[data-priority="${flag}"]`);
        if (flagEl) {
          flagEl.classList.toggle('active', !!taskData[flag]);
        }
      }
    });
    
    // Persist to database
    await db.saveTask(taskId, taskData);
    console.log(`✅ Task ${taskId} updated successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to update task ${taskId}:`, error);
    return false;
  }
}

/* ---------- Drag and Drop Persistence ----------- */
async function handleDragEnd(evt) {
  try {
    const draggedElement = evt.item;
    const taskId = draggedElement.dataset.taskId;
    
    if (!taskId) {
      console.warn('No task ID found on dragged element');
      return;
    }
    
    // Determine new parent
    let newParentId = null;
    const parentTaskItem = evt.to.closest('.task-item');
    if (parentTaskItem) {
      newParentId = parentTaskItem.dataset.taskId;
    } else {
      // Dropped at root level - find section
      const section = evt.to.closest('.section-header');
      if (section) {
        newParentId = section.dataset.taskId;
      }
    }
    
    // Calculate new position
    const newPosition = evt.newIndex;
    
    console.log(`🔄 DRAG: Moving task ${taskId} to parent ${newParentId} at position ${newPosition}`);
    
    // Check if task was moved FROM Triage TO A/B/C sections and auto-assign date
    const oldParentId = evt.from.closest('.section-header')?.dataset.taskId;
    const isFromTriage = oldParentId === 'section-triage';
    const isToABC = newParentId === 'section-a' || newParentId === 'section-b' || newParentId === 'section-c';
    
    // Update task with new parent and position
    const updates = {
      parent_id: newParentId,
      positionOrder: newPosition
    };
    
    // AUTO-ASSIGN REVISIT DATE when moving from Triage to A/B/C
    if (isFromTriage && isToABC) {
      const autoAssignedDate = calculateAutoRevisitDate();
      if (autoAssignedDate) {
        updates.revisitDate = autoAssignedDate;
        console.log(`📅 AUTO-DATE: Task ${taskId} moved from Triage to ${newParentId}, assigned date: ${autoAssignedDate}`);
        showToast('Date Assigned', `Task scheduled for ${formatDateForDisplay(autoAssignedDate)}`);
      }
    }
    
    await updateTaskState(taskId, updates);
    
    // Update positions of other tasks in the same container
    await updateSiblingPositions(evt.to);
    
  } catch (error) {
    console.error('❌ Error handling drag end:', error);
    showToast('Error', 'Failed to save task position');
  }
}

function calculateAutoRevisitDate() {
  const filterValue = document.getElementById('filter-dropdown').value;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`📅 AUTO-DATE: Current filter is "${filterValue}"`);
  
  switch (filterValue) {
    case 'today':
      return today.toISOString();
      
    case 'tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString();
      
    case 'this-week':
      // First day of current week (Monday) or today if today is within the week
      const daysSinceMonday = (today.getDay() + 6) % 7;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysSinceMonday);
      
      // If today is within this week and weekStart is in the past, use today
      if (weekStart <= today) {
        return today.toISOString();
      } else {
        return weekStart.toISOString();
      }
      
    case 'next-week':
      const nextWeekStart = new Date(today);
      const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
      nextWeekStart.setDate(today.getDate() + daysUntilNextMonday);
      return nextWeekStart.toISOString();
      
    case 'this-month':
      // First day of current month or today if today is within the month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // If today is within this month and monthStart is in the past, use today
      if (monthStart <= today) {
        return today.toISOString();
      } else {
        return monthStart.toISOString();
      }
      
    case 'next-month':
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonthStart.toISOString();
      
    case 'all':
    case 'triage':
    default:
      // For non-date views, assign today's date
      return today.toISOString();
  }
}

function formatDateForDisplay(isoDateString) {
  const date = new Date(isoDateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Compare dates only (ignore time)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'today';
  } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return 'tomorrow';
  } else {
    return date.toLocaleDateString();
  }
}

/* ---------- Update Sibling Positions ----------- */
async function updateSiblingPositions(container) {
  try {
    const taskItems = container.querySelectorAll(':scope > .task-item');
    const updates = [];
    
    taskItems.forEach((item, index) => {
      const taskId = item.dataset.taskId;
      if (taskId) {
        updates.push({
          id: taskId,
          positionOrder: index
        });
      }
    });
    
    if (updates.length > 0) {
      console.log('🔄 Updating sibling positions:', updates);
      
      // Use batch update API
      const response = await fetch('/api/tasks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update positions: ${response.status}`);
      }
      
      console.log('✅ Sibling positions updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Failed to update sibling positions:', error);
  }
}

/* ---------- Toggle Priority Flags Visibility ----------- */
function togglePriorityFlags() {
  const priorityFlags = document.querySelectorAll('.priority-flag, .task-priority-flags');
  const toggleBtn = document.getElementById('toggle-priority');
  const sortBtn = document.getElementById('priority-sort-btn');
  const consolidateBtn = document.getElementById('consolidate-btn');
  
  const isVisible = !document.body.classList.contains('priority-flags-hidden');
  
  if (isVisible) {
    // Hide priority flags and related controls
    document.body.classList.add('priority-flags-hidden');
    toggleBtn?.classList.remove('active');
    if (sortBtn) sortBtn.style.display = 'none';
    if (consolidateBtn) consolidateBtn.style.display = 'none';
    
    // Hide all priority flag elements
    priorityFlags.forEach(flag => {
      flag.style.display = 'none';
    });
    
    console.log('🎯 Priority flags and controls hidden');
  } else {
    // Show priority flags and related controls
    document.body.classList.remove('priority-flags-hidden');
    toggleBtn?.classList.add('active');
    if (sortBtn) sortBtn.style.display = 'block';
    if (consolidateBtn) consolidateBtn.style.display = 'block';
    
    // Show all priority flag elements
    priorityFlags.forEach(flag => {
      flag.style.display = '';
    });
    
    console.log('🎯 Priority flags and controls shown');
  }
  
  // Update layout after panel visibility change
  updateLayoutWidth();
}

// Update the overall layout width based on visible panels
function updateLayoutWidth() {
  const container = document.querySelector('.container');
  if (!container) return;
  
  // Check which panels are visible
  const tasksVisible = !document.querySelector('.content-section')?.classList.contains('tasks-hidden');
  const priorityVisible = !document.body.classList.contains('priority-flags-hidden');
  const hoursVisible = !document.querySelector('.hours-column')?.classList.contains('hidden');
  
  if (debug) console.log(`Layout Detection: Tasks(${tasksVisible}) Priority(${priorityVisible}) Hours(${hoursVisible})`);
  
  let visiblePanels = 0;
  if (tasksVisible) visiblePanels++;
  if (priorityVisible) visiblePanels++;
  if (hoursVisible) visiblePanels++;
  
  // Panel widths and margins
  const tasksPanelWidth = 500;
  const priorityPanelWidth = 150;
  const hoursPanelWidth = 225;
  const panelMargin = 20;
  
  // Calculate appropriate width based on visible panels with proper spacing
  let newWidth;
  if (!tasksVisible && !hoursVisible && !priorityVisible) {
    // No panels visible - shouldn't happen, but fallback
    newWidth = '400px';
  } else if (!tasksVisible && !hoursVisible && priorityVisible) {
    // Only priority column
    newWidth = `${priorityPanelWidth + 40}px`;
  } else if (tasksVisible && !hoursVisible && !priorityVisible) {
    // Only tasks column
    newWidth = `${tasksPanelWidth + 40}px`;
  } else if (!tasksVisible && hoursVisible && !priorityVisible) {
    // Only hours column
    newWidth = `${hoursPanelWidth + 40}px`;
  } else if (tasksVisible && !hoursVisible && priorityVisible) {
    // Tasks + priority
    newWidth = `${tasksPanelWidth + priorityPanelWidth + panelMargin + 40}px`;
  } else if (!tasksVisible && hoursVisible && priorityVisible) {
    // Hours + priority
    newWidth = `${hoursPanelWidth + priorityPanelWidth + panelMargin + 40}px`;
  } else if (tasksVisible && hoursVisible && !priorityVisible) {
    // Tasks + hours
    newWidth = `${tasksPanelWidth + hoursPanelWidth + panelMargin + 40}px`;
  } else {
    // All three panels
    newWidth = `${tasksPanelWidth + priorityPanelWidth + hoursPanelWidth + (panelMargin * 2) + 40}px`;
  }
  
  container.style.width = newWidth;
  
  if (debug) console.log(`Layout: Updated width to ${newWidth} for ${visiblePanels} visible panels (T:${tasksVisible}, P:${priorityVisible}, H:${hoursVisible})`);
}

// Start inline editing for task names in the main task list
function startTaskInlineEdit(textSpan, task, taskElement) {
  const currentText = task.content;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.className = 'task-inline-edit';
  
  // Style the input to match the text
  input.style.width = '240px';
  input.style.background = 'transparent';
  input.style.border = '1px solid var(--accent-color)';
  input.style.color = 'var(--text-color)';
  input.style.fontSize = '14px';
  input.style.padding = '2px 4px';
  input.style.borderRadius = '2px';
  
  textSpan.style.display = 'none';
  textSpan.parentNode.insertBefore(input, textSpan);
  input.focus();
  input.select();
  
  const finishEdit = async () => {
    const newText = input.value.trim();
    if (newText && newText !== currentText) {
      // Update task in database
      try {
        await updateTaskState(task.id, { content: newText });
        task.content = newText;
        
        // Update text span with new content
        const maxLength = 26;
        if (newText.length > maxLength) {
          textSpan.textContent = newText.substring(0, maxLength) + '...';
        } else {
          textSpan.textContent = newText;
        }
        textSpan.title = newText;
        
        // Update task data in element
        taskElement.dataset.taskData = JSON.stringify(task);
        
        if (debug) console.log('Task renamed:', newText);
      } catch (error) {
        console.error('Error updating task name:', error);
        showToast('Error', 'Could not update task name');
      }
    }
    
    input.remove();
    textSpan.style.display = '';
  };
  
  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEdit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      input.remove();
      textSpan.style.display = '';
    }
  });
}

/* ---------- View Toggle Functions ----------- */
function toggleCompletedTasks(btn) {
  const isActive = btn.classList.contains('active');
  
  if (isActive) {
    // Show all tasks
    document.querySelectorAll('.task-item').forEach(task => {
      task.style.display = '';
    });
    btn.classList.remove('active');
    console.log('✅ Showing all tasks');
  } else {
    // Show only completed tasks
    document.querySelectorAll('.task-item').forEach(task => {
      if (task.classList.contains('section-header')) {
        task.style.display = '';
        return;
      }
      
      const isCompleted = task.classList.contains('task-completed');
      task.style.display = isCompleted ? '' : 'none';
    });
    btn.classList.add('active');
    console.log('✅ Showing only completed tasks');
  }
}

function toggleTasksView(btn) {
  const tasksColumn = document.querySelector('.content-section');
  const toggleBtn = document.getElementById('toggle-tasks');
  const priorityToggleBtn = document.getElementById('toggle-priority');
  
  if (tasksColumn && toggleBtn) {
    const isVisible = !tasksColumn.classList.contains('tasks-hidden');
    
    if (isVisible) {
      // Hide tasks column AND priority flags (since priority requires tasks)
      tasksColumn.classList.add('tasks-hidden');
      toggleBtn.classList.remove('active');
      
      // Also hide priority flags when tasks are hidden
      if (!document.body.classList.contains('priority-flags-hidden')) {
        document.body.classList.add('priority-flags-hidden');
        priorityToggleBtn?.classList.remove('active');
        
        // Hide priority flag elements
        const priorityFlags = document.querySelectorAll('.priority-flag, .task-priority-flags');
        priorityFlags.forEach(flag => {
          flag.style.display = 'none';
        });
        
        // Hide priority controls
        const sortBtn = document.getElementById('priority-sort-btn');
        const consolidateBtn = document.getElementById('consolidate-btn');
        if (sortBtn) sortBtn.style.display = 'none';
        if (consolidateBtn) consolidateBtn.style.display = 'none';
        
        console.log('🎯 Priority flags auto-hidden with tasks panel');
      }
      
      console.log('📋 Tasks panel hidden');
    } else {
      // Show tasks column
      tasksColumn.classList.remove('tasks-hidden');
      toggleBtn.classList.add('active');
      console.log('📋 Tasks panel shown');
      
      // Note: Priority flags remain hidden until user explicitly shows them
    }
    
    // Update layout after panel visibility change
    updateLayoutWidth();
  }
}

function toggleHoursView(btn) {
  const hoursColumn = document.querySelector('.hours-column');
  const hoursColumnHeader = document.querySelector('.hours-column-header');
  const toggleBtn = document.getElementById('toggle-hours');
  
  if (hoursColumn && hoursColumnHeader && toggleBtn) {
    const isVisible = !hoursColumn.classList.contains('hidden');
    
    if (isVisible) {
      // Hide hours column and header
      hoursColumn.classList.add('hidden');
      hoursColumnHeader.classList.add('hidden');
      toggleBtn.classList.remove('active');
      console.log('🕐 Hours panel hidden');
    } else {
      // Show hours column and header
      hoursColumn.classList.remove('hidden');
      hoursColumnHeader.classList.remove('hidden');
      toggleBtn.classList.add('active');
      console.log('🕐 Hours panel shown');
    }
    
    // Update layout after panel visibility change
    updateLayoutWidth();
  }
}

function toggleTimerView(btn) {
  // This could show time estimates more prominently
  const timeEstimates = document.querySelectorAll('.task-time-estimate');
  const isActive = btn.classList.contains('active');
  
  timeEstimates.forEach(est => {
    est.style.display = isActive ? 'none' : 'inline';
  });
  
  btn.classList.toggle('active');
  console.log('⏰ Timer view toggled');
}

function toggleReviewView(btn) {
  // This could highlight tasks that need review
  const reviewTasks = document.querySelectorAll('.task-item');
  const isActive = btn.classList.contains('active');
  
  reviewTasks.forEach(task => {
    if (task.classList.contains('section-header')) return;
    
    const taskData = JSON.parse(task.dataset.taskData || '{}');
    const hasReviewDate = taskData.revisitDate;
    
    if (isActive) {
      task.style.display = '';
    } else {
      task.style.display = hasReviewDate ? '' : 'none';
    }
  });
  
  btn.classList.toggle('active');
  console.log('💡 Review view toggled');
}

function toggleDailyView(btn) {
  // This could show today's tasks prominently
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tasks = document.querySelectorAll('.task-item');
  const isActive = btn.classList.contains('active');
  
  tasks.forEach(task => {
    if (task.classList.contains('section-header')) {
      task.style.display = '';
      return;
    }
    
    const taskData = JSON.parse(task.dataset.taskData || '{}');
    const reviewDate = taskData.revisitDate;
    
    if (isActive) {
      task.style.display = '';
    } else {
      let isToday = false;
      if (reviewDate) {
        const taskDateStr = reviewDate.includes('T') ? reviewDate.split('T')[0] : reviewDate;
        isToday = taskDateStr === todayStr;
      }
      task.style.display = isToday ? '' : 'none';
    }
  });
  
  btn.classList.toggle('active');
  console.log('📅 Daily view toggled');
}

/* ---------- UI Init ----------- */
function initUI() {
  console.log('🚀 INIT UI: Starting UI initialization...');
  document.getElementById('toggle-priority')?.addEventListener('click', ()=>{
    togglePriorityFlags();
  });

  document.getElementById('priority-sort-btn')?.addEventListener('click', ()=>{
    sortTasksByPriority();
    const btn = document.getElementById('priority-sort-btn');
    btn.classList.add('active');
    setTimeout(()=>btn.classList.remove('active'), 800);
  });

  document.getElementById('consolidate-btn')?.addEventListener('click', ()=>{
    consolidateToTriage();
    const btn = document.getElementById('consolidate-btn');
    btn.classList.add('active');
    setTimeout(()=>btn.classList.remove('active'), 800);
  });

  // Filter dropdown functionality
  const filterDropdown = document.getElementById('filter-dropdown');
  console.log('🔍 SETUP: Looking for filter dropdown...', filterDropdown);
  
  if (filterDropdown) {
    console.log('🔍 SETUP: Filter dropdown found, current value:', filterDropdown.value);
    filterDropdown.addEventListener('change', handleFilterChange);
    console.log('✅ SETUP: Filter dropdown event listener attached successfully');
    
    // Test the event listener immediately
    console.log('🧪 SETUP: Testing filter function directly...');
    try {
      handleFilterChange();
      console.log('✅ SETUP: Filter function executed successfully during setup');
    } catch (error) {
      console.error('❌ SETUP: Filter function failed during test:', error);
    }
  } else {
    console.log('❌ SETUP ERROR: filter-dropdown element not found during initUI');
  }

  // Add view toggle functionality for all toggle buttons
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    if (btn.id === 'toggle-priority') return; // Already handled above
    if (btn.id === 'toggle-hours') return; // Handled separately below
    if (btn.id === 'toggle-tasks') return; // Handled separately below
  });
  
  // Tasks panel toggle functionality
  document.getElementById('toggle-tasks')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    toggleTasksView(btn);
  });

  // Hours panel toggle functionality
  document.getElementById('toggle-hours')?.addEventListener('click', toggleHoursView);
  
  // Set initial state for toggle buttons (all panels visible by default)
  const hoursToggleBtn = document.getElementById('toggle-hours');
  const priorityToggleBtn = document.getElementById('toggle-priority');
  const tasksToggleBtn = document.getElementById('toggle-tasks');
  
  if (hoursToggleBtn) {
    hoursToggleBtn.classList.add('active');
  }
  if (priorityToggleBtn) {
    priorityToggleBtn.classList.add('active');
  }
  if (tasksToggleBtn) {
    tasksToggleBtn.classList.add('active');
  }

  document.querySelectorAll('.flag-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      btn.classList.toggle('active');
    });
  });

  const addBtn = document.getElementById('add-task-btn');
  const input  = document.getElementById('new-task-input');
  addBtn?.addEventListener('click', addNewTask);
  input?.addEventListener('keydown', e=>{
    if (e.key==='Enter') addNewTask();
  });

  // Add keyboard navigation for tasks
  setupKeyboardNavigation();
}

/* ---------- Keyboard Navigation ----------- */
let currentFocusedTask = null;

function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Skip if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const visibleTasks = Array.from(document.querySelectorAll('.task-item:not(.section-header)'))
      .filter(task => task.style.display !== 'none');
    
    if (visibleTasks.length === 0) return;
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateToNextTask(visibleTasks);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateToPreviousTask(visibleTasks);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentFocusedTask) {
          const taskData = JSON.parse(currentFocusedTask.dataset.taskData || '{}');
          openTaskModal(taskData, currentFocusedTask);
        }
        break;
      case 'Escape':
        e.preventDefault();
        const modal = document.getElementById('task-view-modal');
        if (modal && modal.style.display === 'block') {
          modal.style.display = 'none';
        }
        break;
      case 'Tab':
        if (currentFocusedTask) {
          e.preventDefault();
          navigateTabWithinTask(currentFocusedTask, !e.shiftKey);
        }
        break;
    }
  });
}

function navigateToNextTask(visibleTasks) {
  if (!currentFocusedTask) {
    focusTask(visibleTasks[0]);
  } else {
    const currentIndex = visibleTasks.indexOf(currentFocusedTask);
    const nextIndex = (currentIndex + 1) % visibleTasks.length;
    focusTask(visibleTasks[nextIndex]);
  }
}

function navigateToPreviousTask(visibleTasks) {
  if (!currentFocusedTask) {
    focusTask(visibleTasks[visibleTasks.length - 1]);
  } else {
    const currentIndex = visibleTasks.indexOf(currentFocusedTask);
    const prevIndex = currentIndex === 0 ? visibleTasks.length - 1 : currentIndex - 1;
    focusTask(visibleTasks[prevIndex]);
  }
}

function focusTask(taskElement) {
  // Remove focus from previous task
  if (currentFocusedTask) {
    currentFocusedTask.classList.remove('keyboard-focused');
  }
  
  // Set focus to new task
  currentFocusedTask = taskElement;
  currentFocusedTask.classList.add('keyboard-focused');
  currentFocusedTask.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  console.log('⌨️ Focused task:', currentFocusedTask.dataset.taskData);
}

function navigateTabWithinTask(taskElement, forward) {
  const tabbableElements = taskElement.querySelectorAll('.task-checkbox, .task-text, .priority-flag, .task-control-btn');
  const currentFocused = document.activeElement;
  const currentIndex = Array.from(tabbableElements).indexOf(currentFocused);
  
  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = forward ? 0 : tabbableElements.length - 1;
  } else {
    nextIndex = forward 
      ? (currentIndex + 1) % tabbableElements.length
      : currentIndex === 0 ? tabbableElements.length - 1 : currentIndex - 1;
  }
  
  tabbableElements[nextIndex]?.focus();
}

/* ---------- Add New Task ----------- */
async function addNewTask() {
  const input = document.getElementById('new-task-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) { showToast('Error','Enter a task.'); return; }

  // IMMEDIATE UI FEEDBACK: Clear input and show visual confirmation
  input.value = '';
  input.placeholder = 'Adding task...';
  input.disabled = true;
  
  const newTask = {
    id: 'task-'+Date.now(),
    content: text,
    completed: false,
    children: [],
    revisitDate: null,
    fire: false, fast: false, flow: false, fear: false, first: false,
    overview:'', details:'', timeEstimate:0, scheduledTime:null
  };

  // persist to database
  try {
    const taskData = {
      id: newTask.id,
      content: newTask.content,
      isSection: false,
      completed: false,
      parentId: 'section-triage',
      positionOrder: 999, // Will be at the end
      revisitDate: null,
      fire: false,
      fast: false,
      flow: false,
      fear: false,
      first: false,
      timeEstimate: 0,
      overview: '',
      details: '',
      scheduledTime: null
    };
    
    await db.addTask(taskData);
    
    // Show immediate success feedback
    showToast('Task Added','Added to TRIAGE');
    console.log(`✅ QUICK ADD: Successfully added "${text}" to Triage`);
    
  } catch (error) {
    console.error('Error saving new task:', error);
    showToast('Error','Could not save new task to database.');
    // Restore input if there was an error
    input.value = text;
  }

  // Reload tasks from database and reapply current filter
  try {
    const tasks = await db.loadTasks();
    if (tasks) {
      const taskTree = document.getElementById('task-tree');
      taskTree.innerHTML = '';
      buildTree(tasks, taskTree);
      
      // Reapply the current filter to maintain the user's view
      handleFilterChange();
      
      if (debug) console.log(`Rebuilt task tree with new task "${text}" and reapplied current filter`);
    } else {
      showToast('Error','Could not reload tasks after adding new task.');
    }
  } catch (error) {
    console.error('Error reloading tasks after adding new task:', error);
    showToast('Error','Could not reload tasks after adding new task.');
  } finally {
    // Always restore input state
    input.placeholder = 'Enter task';
    input.disabled = false;
    input.focus();
  }
}

/* ---------- Sortable Factories ----------- */
function createSortable(list, chevron=null, container=null) {
  if (list.dataset.sortable) return;
  new Sortable(list, {
    group:{name:'nested',pull:true,put:true},
    animation:150, fallbackOnBody:true, forceFallback:true,
    swapThreshold:0.65, emptyInsertThreshold:10,
    ghostClass:'task-ghost', chosenClass:'task-chosen',
    dragClass:'task-drag', filter:'[data-no-drag]',
    onMove(evt) {
      document.querySelectorAll('.task-list:empty').forEach(el=>{
        el.classList.remove('drop-target-active','drop-target-hint');
      });
      if (evt.to.children.length===0) evt.to.classList.add('drop-target-active');
      return true;
    },
    onEnd(evt) {
      document.querySelectorAll('.drop-target-active, .drop-target-hint')
        .forEach(el=>el.classList.remove('drop-target-active','drop-target-hint'));
      evt.item.classList.remove('drag-compact');
      if (evt.clone) evt.clone.classList.remove('drag-compact');
      document.body.classList.remove('is-dragging');
      
      // Persist drag and drop changes to database
      handleDragEnd(evt);
      
      const parent = evt.to.closest('.task-item');
      if (debug) console.log(parent ? `Dropped into: ${parent.querySelector('.task-text').textContent.trim()}` : 'Dropped at root');
    },
    onStart(evt){ evt.item.classList.add('drag-compact'); if(evt.clone) evt.clone.classList.add('drag-compact'); },
    onAdd() {
      if (!chevron) return;
      container.style.display='block';
      chevron.style.display='inline-block';
      chevron.classList.add('expanded');
      chevron.textContent='▾';
    },
    onRemove(evt) {
      const parentLi = evt.from.closest('.task-item');
      if (parentLi && evt.from.children.length===0) {
        const t = parentLi.querySelector('.toggle-btn');
        if (t) t.style.display='none';
      }
    }
  });
  list.dataset.sortable='1';
}

function createSectionSortable(list, chevron=null, container=null) {
  if (list.dataset.sortable) return;
  new Sortable(list, {
    group:{name:'section',pull:true,put:to=>to.el.closest('.task-item').classList.contains('section-header')},
    animation:150, fallbackOnBody:true, forceFallback:true,
    swapThreshold:0.65, emptyInsertThreshold:10,
    ghostClass:'task-ghost', chosenClass:'task-chosen',
    dragClass:'task-drag', filter:'[data-no-drag]',
    onMove(evt) {
      document.querySelectorAll('.task-list:empty').forEach(el=>{
        el.classList.remove('drop-target-active','drop-target-hint');
      });
      if (evt.to.children.length===0) evt.to.classList.add('drop-target-active');
      return true;
    },
    onEnd(evt) {
      document.querySelectorAll('.drop-target-active, .drop-target-hint')
        .forEach(el=>el.classList.remove('drop-target-active','drop-target-hint'));
      evt.item.classList.remove('drag-compact');
      if (evt.clone) evt.clone.classList.remove('drag-compact');
      document.body.classList.remove('is-dragging');
      
      // Persist drag and drop changes to database
      handleDragEnd(evt);
    },
    onStart(evt){ evt.item.classList.add('drag-compact'); if(evt.clone) evt.clone.classList.add('drag-compact'); },
    onAdd() {
      if (!chevron) return;
      container.style.display='block';
      chevron.style.display='inline-block';
      chevron.classList.add('expanded');
      chevron.textContent='▾';
    },
    onRemove(evt) {
      const parentLi = evt.from.closest('.task-item');
      if (parentLi && evt.from.children.length===0 && !parentLi.classList.contains('section-header')) {
        const t = parentLi.querySelector('.toggle-btn');
        if (t) t.style.display='none';
      }
    }
  });
  list.dataset.sortable='1';
  list.dataset.sectionList='1';
}

function createRootSortable(list) {
  if (list.dataset.sortable) return;
  new Sortable(list, {
    group:{name:'root',pull:false,put:false},
    sort:false, animation:150,
    filter:'[data-no-drag]',
    onMove:()=>false
  });
  list.dataset.sortable='1';
  list.dataset.rootList='1';
}

/* ---------- Initialize Application ----------- */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOM READY: DOMContentLoaded event fired, starting application...');
  initUI();
  const root = document.getElementById('task-tree');
  root.innerHTML = '';  // clear any previous

  try {
    let tasksToUse = await db.loadTasks();
    if (tasksToUse && Array.isArray(tasksToUse) && tasksToUse.length > 0) {
      if (debug) console.log('Using tasks from database');
    } else {
      if (debug) console.log('No tasks found in database, loading sampleTasks');
      tasksToUse = sampleTasks;
    }

    buildTree(tasksToUse, root);
    const rootList = root.querySelector(':scope > .task-list');
    if (rootList) createRootSortable(rootList);
    
    // CAPTURE DOM STATE AFTER TREE IS BUILT
    DOM_dump('After BuildTree Complete - Database Tasks');
  } catch (error) {
    console.error('Error initializing application:', error);
    // Fallback to sample tasks if database fails
    if (debug) console.log('Database error, using sample tasks as fallback');
    buildTree(sampleTasks, root);
    const rootList = root.querySelector(':scope > .task-list');
    if (rootList) createRootSortable(rootList);
    
    // CAPTURE DOM STATE AFTER FALLBACK TREE IS BUILT
    DOM_dump('After BuildTree Complete - Sample Tasks Fallback');
  }

  if (debug) console.log('Application initialized');
  
  // Initialize Hours Panel with error handling
  try {
    console.log('🕐 INIT: Starting Hours Panel initialization...');
    initHoursPanel();
    console.log('✅ INIT: Hours Panel initialization completed');
  } catch (error) {
    console.error('❌ INIT: Hours Panel initialization failed:', error);
  }
  
  // Set initial layout width
  updateLayoutWidth();
  
  // Initialize tasks panel as active (visible by default)
  const tasksToggleBtn = document.getElementById('toggle-tasks');
  if (tasksToggleBtn) {
    tasksToggleBtn.classList.add('active');
  }
  
  // Initialize debug modal functionality
  initDebugModal();
  
  // Add manual filter test button for debugging
  setTimeout(() => {
    console.log('🧪 MANUAL TEST: Adding filter test button to page');
    const testBtn = document.createElement('button');
    testBtn.textContent = 'TEST FILTER';
    testBtn.style.position = 'fixed';
    testBtn.style.top = '10px';
    testBtn.style.right = '10px';
    testBtn.style.zIndex = '9999';
    testBtn.style.background = '#00CEF7';
    testBtn.style.color = 'white';
    testBtn.style.border = 'none';
    testBtn.style.padding = '5px 10px';
    testBtn.style.cursor = 'pointer';
    testBtn.onclick = () => {
      console.log('🧪 MANUAL: Filter test button clicked');
      const dropdown = document.getElementById('filter-dropdown');
      if (dropdown) {
        dropdown.value = 'today';
        console.log('🧪 MANUAL: Set dropdown to today, calling handleFilterChange()');
        handleFilterChange();
      } else {
        console.log('❌ MANUAL: Dropdown still not found');
      }
    };
    document.body.appendChild(testBtn);
  }, 1000);
});

/* ===== DEBUG MODAL FUNCTIONALITY ===== */

function initDebugModal() {
  const debugToggleBtn = document.getElementById('debug-toggle');
  const modal = document.getElementById('debug-modal');
  
  if (!debugToggleBtn) {
    console.error('Debug toggle button not found');
    return;
  }
  
  if (!modal) {
    console.error('Debug modal not found');
    return;
  }
  
  // Debug toggle button
  debugToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle modal visibility
    if (modal.style.display === 'block') {
      closeSettingsModal();
    } else {
      openSettingsModal();
    }
  });
  
  // Debug logging toggle
  const debugCheckbox = document.getElementById('debug-toggle-checkbox');
  if (debugCheckbox) {
    debugCheckbox.addEventListener('change', (e) => {
      debug = e.target.checked;
      debugLogger(`Debug logging ${debug ? 'enabled' : 'disabled'}`);
    });
  }
  
  // Borders toggle
  const bordersCheckbox = document.getElementById('borders-toggle-checkbox');
  if (bordersCheckbox) {
    bordersCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('debug-borders-enabled');
        debugLogger('Debug borders enabled');
      } else {
        document.body.classList.remove('debug-borders-enabled');
        debugLogger('Debug borders disabled');
      }
    });
  }
  
  // Clear log button
  const clearLogBtn = document.getElementById('clear-debug-log');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      debugLog = [];
      const debugLogElement = document.getElementById('debug-log');
      if (debugLogElement) debugLogElement.textContent = '';
      debugLogger('Debug log cleared');
    });
  }
  
  // Copy log button
  const copyLogBtn = document.getElementById('copy-debug-log');
  if (copyLogBtn) {
    copyLogBtn.addEventListener('click', async () => {
      try {
        const logText = debugLog.join('\n');
        await navigator.clipboard.writeText(logText);
        copyLogBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyLogBtn.textContent = 'Copy Log';
        }, 1000);
      } catch (err) {
        console.error('Failed to copy log:', err);
        copyLogBtn.textContent = 'Copy failed';
        setTimeout(() => {
          copyLogBtn.textContent = 'Copy Log';
        }, 1000);
      }
    });
  }
  
  // Database reset button
  const clearDatabaseBtn = document.getElementById('clear-database-btn');
  if (clearDatabaseBtn) {
    clearDatabaseBtn.addEventListener('click', async () => {
      const confirmation = confirm(
        '🚨 DANGER: Clear Database\n\n' +
        'This will permanently delete ALL tasks from the database.\n' +
        'This action cannot be undone!\n\n' +
        'Are you absolutely sure you want to continue?'
      );
      
      if (!confirmation) {
        debugLogger('Database clear operation cancelled by user');
        return;
      }
      
      const doubleConfirmation = confirm(
        '⚠️ FINAL WARNING\n\n' +
        'You are about to delete ALL tasks permanently.\n' +
        'Type "DELETE" and click OK to confirm this dangerous operation.'
      );
      
      if (!doubleConfirmation) {
        debugLogger('Database clear operation cancelled at final confirmation');
        return;
      }
      
      try {
        clearDatabaseBtn.textContent = 'Clearing...';
        clearDatabaseBtn.disabled = true;
        
        debugLogger('🚨 DATABASE CLEAR: User confirmed deletion, executing...');
        
        const response = await fetch('/api/reset-database', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to clear database: ${response.status}`);
        }
        
        const result = await response.json();
        debugLogger('✅ DATABASE CLEAR: ' + result.message);
        
        // Refresh the application to show empty state
        window.location.reload();
        
      } catch (error) {
        console.error('❌ Database clear error:', error);
        debugLogger('❌ DATABASE CLEAR ERROR: ' + error.message);
        showToast('Error', 'Failed to clear database');
        
        clearDatabaseBtn.textContent = 'Clear Database';
        clearDatabaseBtn.disabled = false;
      }
    });
  }
  
  // Load test data button
  const loadTestDataBtn = document.getElementById('load-test-data-btn');
  if (loadTestDataBtn) {
    loadTestDataBtn.addEventListener('click', async () => {
      const confirmation = confirm(
        '🧪 Load Test Data\n\n' +
        'This will:\n' +
        '• Delete ALL existing tasks\n' +
        '• Load comprehensive test dataset\n' +
        '• Create tasks for all time intervals\n' +
        '• Add tasks with various priority combinations\n' +
        '• Include nested tasks and sample data\n\n' +
        'Continue?'
      );
      
      if (!confirmation) {
        debugLogger('Test data load operation cancelled by user');
        return;
      }
      
      try {
        loadTestDataBtn.textContent = 'Loading...';
        loadTestDataBtn.disabled = true;
        
        debugLogger('🧪 TEST DATA: User confirmed load, executing...');
        
        const response = await fetch('/api/load-test-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load test data: ${response.status}`);
        }
        
        const result = await response.json();
        debugLogger('✅ TEST DATA LOADED: ' + result.message);
        debugLogger(`📊 TEST DATA STATS: ${result.sectionsCount} sections, ${result.tasksCount} tasks`);
        
        showToast('Test Data Loaded', `${result.tasksCount} test tasks created across all time intervals`);
        
        // Refresh the application to show new test data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Test data load error:', error);
        debugLogger('❌ TEST DATA ERROR: ' + error.message);
        showToast('Error', 'Failed to load test data');
        
        loadTestDataBtn.textContent = 'Load Test Data';
        loadTestDataBtn.disabled = false;
      }
    });
  }
  
  // Modal close functionality
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      debugLogger('Debug modal closed');
    });
  }
  
  // Close modal when clicking outside the window (but not on it)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettingsModal();
    }
  });
  
  // Make modal draggable
  makeSettingsModalDraggable();
  
  debugLogger('Debug modal initialized successfully');
}

// Global reference to settings popup window
let settingsPopupWindow = null;

// Open the settings modal in a popup window
function openSettingsModal() {
  // Check if popup is already open and bring it to front
  if (settingsPopupWindow && !settingsPopupWindow.closed) {
    settingsPopupWindow.focus();
    debugLogger('Settings window brought to front');
    return;
  }
  
  // Create popup window
  const windowFeatures = 'width=800,height=700,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
  settingsPopupWindow = window.open('', 'DUN_Settings', windowFeatures);
  
  if (!settingsPopupWindow) {
    // Fallback to modal if popup blocked
    openSettingsModalFallback();
    return;
  }
  
  // Generate settings window HTML
  const settingsHTML = generateSettingsHTML();
  
  // Write the HTML to the popup
  settingsPopupWindow.document.write(settingsHTML);
  settingsPopupWindow.document.close();
  
  // Setup communication between windows
  setupSettingsWindowCommunication();
  
  debugLogger('Settings opened in popup window');
}

// Fallback to modal if popup is blocked
function openSettingsModalFallback() {
  const modal = document.getElementById('debug-modal');
  if (!modal) return;
  
  modal.style.display = 'block';
  debugLogger('Settings modal opened (popup fallback)');
  
  // Update checkboxes with current states
  const debugCheckbox = document.getElementById('debug-toggle-checkbox');
  const bordersCheckbox = document.getElementById('borders-toggle-checkbox');
  
  if (debugCheckbox) debugCheckbox.checked = debug;
  if (bordersCheckbox) bordersCheckbox.checked = document.body.classList.contains('debug-borders-enabled');
  
  // Update debug log display
  const debugLogElement = document.getElementById('debug-log');
  if (debugLogElement) {
    debugLogElement.textContent = debugLog.join('\n');
    debugLogElement.scrollTop = debugLogElement.scrollHeight;
  }
}

// Generate HTML for settings popup window
function generateSettingsHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DUN Settings Console</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: #1a1a1a; 
            color: #e0e0e0; 
            overflow-x: hidden;
        }
        .settings-container {
            padding: 20px;
            max-width: 100%;
        }
        .settings-header {
            background: linear-gradient(135deg, #00CEF7, #0099cc);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .settings-title {
            font-size: 18px;
            font-weight: 600;
        }
        .debug-controls {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: #333;
            border-radius: 8px;
        }
        .debug-controls label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #e0e0e0;
            font-size: 14px;
            cursor: pointer;
        }
        .debug-controls input[type="checkbox"] {
            accent-color: #00CEF7;
        }
        .debug-controls button {
            background: #00CEF7;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .debug-controls button:hover {
            background: #0099cc;
        }
        .debug-database-controls {
            margin-bottom: 24px;
            padding: 20px;
            background: #2a1a1a;
            border: 2px solid #cc4444;
            border-radius: 8px;
        }
        .debug-database-controls h4 {
            color: #ff6b6b;
            margin-bottom: 16px;
            font-size: 16px;
        }
        .debug-danger-btn {
            background: #cc4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 12px;
            margin-bottom: 8px;
            transition: background 0.2s;
        }
        .debug-danger-btn:hover {
            background: #aa3333;
        }
        .debug-warning {
            color: #ffaa44;
            font-size: 12px;
            margin-top: 12px;
        }
        .debug-nav-section {
            margin-bottom: 24px;
            padding: 20px;
            background: #2a2a2a;
            border-radius: 8px;
        }
        .debug-nav-section h4 {
            color: #00CEF7;
            margin-bottom: 16px;
            font-size: 16px;
        }
        .nav-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        .nav-link {
            background: #3a3a3a;
            color: #e0e0e0;
            text-decoration: none;
            padding: 12px 16px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
        }
        .nav-link:hover {
            background: #4a4a4a;
            color: #00CEF7;
        }
        .debug-log-container {
            margin-bottom: 24px;
        }
        .debug-log-container h3 {
            color: #00CEF7;
            margin-bottom: 12px;
            font-size: 18px;
        }
        .debug-log {
            background: #1a1a1a;
            color: #00ff00;
            padding: 16px;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            white-space: pre-wrap;
            border: 1px solid #333;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <div class="settings-container">
        <div class="settings-header">
            <i class="fa-solid fa-gear"></i>
            <div class="settings-title">DUN Settings Console</div>
        </div>
        
        <div class="debug-controls">
            <label>
                <input type="checkbox" id="debug-toggle-checkbox"> Enable Debug Logging
            </label>
            <label>
                <input type="checkbox" id="borders-toggle-checkbox"> Show Element Borders
            </label>
            <button id="clear-debug-log">Clear Log</button>
            <button id="copy-debug-log">Copy Log</button>
        </div>
        
        <div class="debug-nav-section">
            <h4>📋 Debug Pages</h4>
            <div class="nav-links">
                <a href="/debug/tasks" target="_blank" class="nav-link">
                    <i class="fa-solid fa-code"></i> Raw JSON Tasks
                </a>
                <a href="/debug/table" target="_blank" class="nav-link">
                    <i class="fa-solid fa-table"></i> Table View
                </a>
                <a href="/debug/formatted" target="_blank" class="nav-link">
                    <i class="fa-solid fa-file-lines"></i> Formatted View
                </a>
                <a href="/debug-files.html" target="_blank" class="nav-link">
                    <i class="fa-solid fa-folder-open"></i> File Aggregator
                </a>
                <a href="/filter-flow-diagram.html" target="_blank" class="nav-link">
                    <i class="fa-solid fa-diagram-project"></i> Filter Flow Diagram
                </a>
                <a href="#" class="nav-link" id="one-click-export-nav">
                    <i class="fa-solid fa-rocket"></i> One-Click Debug Export
                </a>
            </div>
        </div>
        
        <div class="debug-database-controls">
            <h4>🚨 Dangerous Database Operations</h4>
            <button id="clear-database-btn" class="debug-danger-btn">Clear Database</button>
            <button id="load-test-data-btn" class="debug-danger-btn">Load Test Data</button>
            <p class="debug-warning">⚠️ These operations are irreversible and will modify your database!</p>
        </div>
        
        <div class="debug-log-container">
            <h3>Debug Log:</h3>
            <pre id="debug-log" class="debug-log">${debugLog.join('\\n')}</pre>
        </div>
    </div>
</body>
</html>
  `;
}

// Setup communication between main window and settings popup
function setupSettingsWindowCommunication() {
  if (!settingsPopupWindow || settingsPopupWindow.closed) return;
  
  // Wait for popup to load, then setup event listeners
  setTimeout(() => {
    const popupDoc = settingsPopupWindow.document;
    
    // One-click export button
    const exportNavBtn = popupDoc.getElementById('one-click-export-nav');
    if (exportNavBtn) {
      exportNavBtn.addEventListener('click', function(e) {
        e.preventDefault();
        debugLogger('One-click export button clicked');
        
        // Make sure the function is available in the main window context
        if (typeof window.startOneClickExport === 'function') {
          window.startOneClickExport();
        } else if (typeof startOneClickExport === 'function') {
          startOneClickExport();
        } else {
          debugLogger('ERROR: startOneClickExport function not found');
        }
      });
      debugLogger('One-click export event listener attached successfully');
    } else {
      debugLogger('ERROR: One-click export button not found in popup');
    }
    
    // Debug logging toggle
    const debugCheckbox = popupDoc.getElementById('debug-toggle-checkbox');
    if (debugCheckbox) {
      debugCheckbox.checked = debug;
      debugCheckbox.addEventListener('change', (e) => {
        debug = e.target.checked;
        debugLogger(`Debug logging ${debug ? 'enabled' : 'disabled'}`);
        updatePopupDebugLog();
      });
    }
    
    // Borders toggle
    const bordersCheckbox = popupDoc.getElementById('borders-toggle-checkbox');
    if (bordersCheckbox) {
      bordersCheckbox.checked = document.body.classList.contains('debug-borders-enabled');
      bordersCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          document.body.classList.add('debug-borders-enabled');
          debugLogger('Debug borders enabled');
        } else {
          document.body.classList.remove('debug-borders-enabled');
          debugLogger('Debug borders disabled');
        }
        updatePopupDebugLog();
      });
    }
    
    // Clear log button
    const clearLogBtn = popupDoc.getElementById('clear-debug-log');
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        debugLog = [];
        debugLogger('Debug log cleared');
        updatePopupDebugLog();
      });
    }
    
    // Copy log button
    const copyLogBtn = popupDoc.getElementById('copy-debug-log');
    if (copyLogBtn) {
      copyLogBtn.addEventListener('click', async () => {
        try {
          const logText = debugLog.join('\n');
          await navigator.clipboard.writeText(logText);
          copyLogBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyLogBtn.textContent = 'Copy Log';
          }, 1000);
        } catch (err) {
          console.error('Failed to copy log:', err);
          copyLogBtn.textContent = 'Copy failed';
          setTimeout(() => {
            copyLogBtn.textContent = 'Copy Log';
          }, 1000);
        }
      });
    }
    
    // Database controls
    setupDatabaseControls(popupDoc);
    
  }, 100);
}

// Setup database controls in popup
function setupDatabaseControls(popupDoc) {
  // Clear database button
  const clearDatabaseBtn = popupDoc.getElementById('clear-database-btn');
  if (clearDatabaseBtn) {
    clearDatabaseBtn.addEventListener('click', async () => {
      const confirmation = confirm(
        '🚨 DANGER: Clear Database\n\n' +
        'This will permanently delete ALL tasks from the database.\n' +
        'This action cannot be undone!\n\n' +
        'Are you absolutely sure you want to continue?'
      );
      
      if (!confirmation) {
        debugLogger('Database clear operation cancelled by user');
        return;
      }
      
      const doubleConfirmation = confirm(
        '⚠️ FINAL WARNING\n\n' +
        'You are about to delete ALL tasks permanently.\n' +
        'Type "DELETE" and click OK to confirm this dangerous operation.'
      );
      
      if (!doubleConfirmation) {
        debugLogger('Database clear operation cancelled at final confirmation');
        return;
      }
      
      try {
        clearDatabaseBtn.textContent = 'Clearing...';
        clearDatabaseBtn.disabled = true;
        
        debugLogger('🚨 DATABASE CLEAR: User confirmed deletion, executing...');
        
        const response = await fetch('/api/reset-database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to clear database: ${response.status}`);
        }
        
        const result = await response.json();
        debugLogger('✅ DATABASE CLEAR: ' + result.message);
        
        // Refresh the main application
        window.location.reload();
        
      } catch (error) {
        console.error('❌ Database clear error:', error);
        debugLogger('❌ DATABASE CLEAR ERROR: ' + error.message);
        clearDatabaseBtn.textContent = 'Clear Database';
        clearDatabaseBtn.disabled = false;
      }
      
      updatePopupDebugLog();
    });
  }
  
  // Load test data button
  const loadTestDataBtn = popupDoc.getElementById('load-test-data-btn');
  if (loadTestDataBtn) {
    loadTestDataBtn.addEventListener('click', async () => {
      const confirmation = confirm(
        '🧪 Load Test Data\n\n' +
        'This will:\n' +
        '• Delete ALL existing tasks\n' +
        '• Load comprehensive test dataset\n' +
        '• Create tasks for all time intervals\n' +
        '• Add tasks with various priority combinations\n' +
        '• Include nested tasks and sample data\n\n' +
        'Continue?'
      );
      
      if (!confirmation) {
        debugLogger('Test data load operation cancelled by user');
        return;
      }
      
      try {
        loadTestDataBtn.textContent = 'Loading...';
        loadTestDataBtn.disabled = true;
        
        debugLogger('🧪 TEST DATA: User confirmed load, executing...');
        
        const response = await fetch('/api/load-test-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load test data: ${response.status}`);
        }
        
        const result = await response.json();
        debugLogger('✅ TEST DATA LOADED: ' + result.message);
        debugLogger(`📊 TEST DATA STATS: ${result.sectionsCount} sections, ${result.tasksCount} tasks`);
        
        // Refresh the main application
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Test data load error:', error);
        debugLogger('❌ TEST DATA ERROR: ' + error.message);
        loadTestDataBtn.textContent = 'Load Test Data';
        loadTestDataBtn.disabled = false;
      }
      
      updatePopupDebugLog();
    });
  }
}

// Update debug log in popup window
function updatePopupDebugLog() {
  if (!settingsPopupWindow || settingsPopupWindow.closed) return;
  
  const debugLogElement = settingsPopupWindow.document.getElementById('debug-log');
  if (debugLogElement) {
    debugLogElement.textContent = debugLog.join('\n');
    debugLogElement.scrollTop = debugLogElement.scrollHeight;
  }
}

// Close the settings modal
function closeSettingsModal() {
  if (settingsPopupWindow && !settingsPopupWindow.closed) {
    settingsPopupWindow.close();
    settingsPopupWindow = null;
    debugLogger('Settings popup window closed');
  }
  
  // Also handle fallback modal
  const modal = document.getElementById('debug-modal');
  if (modal) {
    modal.style.display = 'none';
    debugLogger('Settings modal closed');
  }
}

// Make the settings modal window draggable
function makeSettingsModalDraggable() {
  const settingsWindow = document.getElementById('settings-window');
  const header = document.getElementById('settings-header');
  
  if (!settingsWindow || !header) return;
  
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  header.addEventListener('mousedown', (e) => {
    // Don't start dragging if clicking on dropdown or close button
    if (e.target.closest('.debug-nav-dropdown') || e.target.closest('.settings-close-btn')) {
      return;
    }
    
    isDragging = true;
    settingsWindow.classList.add('dragging');
    
    // Get current position
    const rect = settingsWindow.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    // Store initial mouse position
    startX = e.clientX;
    startY = e.clientY;
    
    // Remove transform and set explicit position
    settingsWindow.style.transform = 'none';
    settingsWindow.style.left = initialX + 'px';
    settingsWindow.style.top = initialY + 'px';
    
    debugLogger('Settings modal: Started dragging');
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Calculate new position
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newX = initialX + deltaX;
    const newY = initialY + deltaY;
    
    // Keep modal within viewport bounds
    const maxX = window.innerWidth - settingsWindow.offsetWidth;
    const maxY = window.innerHeight - settingsWindow.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    settingsWindow.style.left = boundedX + 'px';
    settingsWindow.style.top = boundedY + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      settingsWindow.classList.remove('dragging');
      debugLogger('Settings modal: Finished dragging');
    }
  });
}

// Navigation function for debug pages dropdown
function navigateToDebugPage(url) {
  if (url) {
    window.open(url, '_blank');
    // Reset dropdown to default
    document.getElementById('debug-nav-select').value = '';
  }
}

/* ===== HOURS PANEL FUNCTIONALITY ===== */

// Hours panel data structure (runtime-only, no persistence)
let hoursData = {
  tasks: [],
  nextId: 1,
  limitLines: {
    stop: { time: '18:00', position: 18 * 60 }, // 6:00 PM in minutes from midnight
    sleep: { time: '23:00', position: 23 * 60 } // 11:00 PM in minutes from midnight
  }
};

// Initialize Hours Panel
function initHoursPanel() {
  console.log('🕐 INIT: initHoursPanel() called');
  
  try {
    console.log('🕐 INIT: Calling generateHourGrid()...');
    generateHourGrid();
    
    console.log('🕐 INIT: Calling initCurrentTimeLine()...');
    initCurrentTimeLine();
    
    console.log('🕐 INIT: Calling initLimitLines()...');
    initLimitLines();
    
    console.log('🕐 INIT: Calling setupHoursEventListeners()...');
    setupHoursEventListeners();
    
    console.log('🕐 INIT: Calling updateRemainingTimes()...');
    updateRemainingTimes();
    
    // Update remaining times every minute
    setInterval(updateRemainingTimes, 60 * 1000);
    
    // Add sample tasks to demonstrate functionality
    console.log('🕐 INIT: Calling addSampleHoursTasks()...');
    addSampleHoursTasks();
    
    console.log('✅ HOURS: Panel initialization completed successfully');
  } catch (error) {
    console.error('❌ HOURS: Panel initialization failed:', error);
  }
}

// Load tasks from database for today's date with scheduled times
async function addSampleHoursTasks() {
  try {
    debugLogger('Hours: Starting task loading from database...');
    
    // Clear existing hours tasks first
    hoursData.tasks = [];
    const taskBlocksContainer = document.getElementById('task-blocks-container');
    if (taskBlocksContainer) {
      taskBlocksContainer.querySelectorAll('.task-block').forEach(block => block.remove());
    }
    
    // Direct API call to get ALL raw tasks from database (not the tree structure)
    const response = await fetch('/api/tasks/raw');
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const allTasks = await response.json();
    debugLogger('Hours: Raw API response received');
    debugLogger(`Hours: API returned ${allTasks.length} total records`);
    
    if (!allTasks || !Array.isArray(allTasks)) {
      debugLogger('Hours: No database tasks found or invalid response');
      return;
    }
    
    // Debug: log first few tasks to see structure
    if (allTasks.length > 0) {
      debugLogger(`Hours: First task structure: ${JSON.stringify(allTasks[0])}`);
    }
    
    // Filter out section headers using the correct field name
    const actualTasks = allTasks.filter(task => task.is_section === false);
    debugLogger(`Hours: Found ${actualTasks.length} actual tasks (excluding ${allTasks.length - actualTasks.length} section headers)`);
    
    // Debug: log a few actual tasks
    if (actualTasks.length > 0) {
      debugLogger(`Hours: Sample actual task: ${JSON.stringify(actualTasks[0])}`);
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    debugLogger(`Hours: Today's date for comparison: ${today}`);
    let addedCount = 0;
    
    actualTasks.forEach(task => {
      // Enhanced debug logging for task examination
      debugLogger(`Hours: Examining task "${task.content}" - revisitDate: ${task.revisit_date}, scheduledTime: ${task.scheduled_time}`);
      
      // Check if task has scheduled time for today
      let isToday = false;
      
      if (task.revisit_date) {
        const taskDate = task.revisit_date.includes('T') ? task.revisit_date.split('T')[0] : task.revisit_date;
        isToday = taskDate === today;
        debugLogger(`Hours: Task "${task.content}" date comparison - taskDate: ${taskDate}, today: ${today}, isToday: ${isToday}`);
      }
      
      // Only show tasks scheduled for today in Hours panel
      if (task.scheduled_time && isToday) {
        debugLogger(`Hours: Task "${task.content}" has scheduled time: ${task.scheduled_time}`);
        
        // Parse scheduled time (HH:MM:SS format from database)
        const timeStr = task.scheduled_time;
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          
          console.log('⏰ TIME PARSE: Task', task.content, 'scheduled at', hours + ':' + minutes.toString().padStart(2, '0'));
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            const startMinutes = hours * 60 + minutes;
            // Parse time_estimate from database - all values are in minutes
            let timeEstimate = parseFloat(task.time_estimate) || 60; // Default to 60 minutes
            
            // Enforce 15-minute intervals: round to nearest 15-minute interval, minimum 15 minutes
            timeEstimate = Math.max(15, Math.round(timeEstimate / 15) * 15);
            
            const durationMinutes = timeEstimate;
            
            const hoursTask = {
              id: `hours-task-${hoursData.nextId++}`,
              title: task.content,
              startIndex: Math.round(startMinutes / 15),
              durationSteps: Math.round(durationMinutes / 15),
              startMinutes: startMinutes,
              durationMinutes: durationMinutes,
              dbTaskId: task.id // Link to original database task
            };
            
            debugLogger(`Hours: Created hours task - start: ${hours}:${minutes.toString().padStart(2, '0')}, duration: ${durationMinutes}min (from estimate: ${task.time_estimate}min → ${timeEstimate}min)`);
            
            // Check for overlaps before adding
            console.log('🔍 OVERLAP CHECK: About to check overlap for task', hoursTask.id);
            const hasOverlap = checkTaskOverlap(hoursTask);
            console.log('🔍 OVERLAP RESULT:', hasOverlap ? 'HAS OVERLAP' : 'NO OVERLAP');
            
            if (!hasOverlap) {
              console.log('✅ NO OVERLAP: Adding task to hoursData.tasks');
              hoursData.tasks.push(hoursTask);
              console.log('🚀 ABOUT TO RENDER: Task', hoursTask.id, 'with data:', hoursTask);
              console.log('🚀 ABOUT TO RENDER: Container exists?', !!document.getElementById('task-blocks-container'));
              renderHoursTask(hoursTask);
              addedCount++;
              debugLogger(`Hours: Successfully added database task: "${task.content}" at ${hours}:${minutes.toString().padStart(2, '0')}`);
            } else {
              console.log('❌ HAS OVERLAP: Skipping task due to overlap');
              debugLogger(`Hours: Task "${task.content}" overlaps with existing task, skipped`);
            }
          } else {
            debugLogger(`Hours: Invalid time format for task "${task.content}": ${task.scheduled_time}`);
          }
        } else {
          debugLogger(`Hours: Malformed scheduled time for task "${task.content}": ${task.scheduled_time}`);
        }
      } else {
        debugLogger(`Hours: Task "${task.content}" has no scheduled time or not scheduled for today`);
      }
    });
    
    if (debug) console.log(`Hours panel: Added ${addedCount} tasks from database for today`);
    
    // If no database tasks found, add one demo task for testing
    if (addedCount === 0) {
      debugLogger('Hours: No database tasks scheduled for today found, adding demo task');
      
      const demoTask = { title: 'Fake Task', startMinutes: 17 * 60, durationMinutes: 60 }; // 5:00 PM
      
      const task = {
        id: `hours-task-${hoursData.nextId++}`,
        title: demoTask.title,
        startIndex: Math.round(demoTask.startMinutes / 15),
        durationSteps: Math.round(demoTask.durationMinutes / 15),
        startMinutes: demoTask.startMinutes,
        durationMinutes: demoTask.durationMinutes
      };
      
      hoursData.tasks.push(task);
      console.log('🚀 DEMO RENDER: About to render demo task', task.id, 'with data:', task);
      console.log('🚀 DEMO RENDER: Container exists?', !!document.getElementById('task-blocks-container'));
      renderHoursTask(task);
      
      debugLogger('Hours: Added single demo task at 5:00 PM');
    } else {
      debugLogger(`Hours: Successfully added ${addedCount} database tasks with scheduled times`);
    }
    
    debugLogger(`Hours: Summary - processed ${actualTasks.length} actual tasks, added ${addedCount} with scheduled times`);
    
  } catch (error) {
    console.error('Error loading database tasks for Hours panel:', error);
    if (debug) console.log('Hours panel: Error loading from database, skipping task loading');
  }
}

// Refresh Hours panel when tasks are updated
function refreshHoursPanel() {
  if (!document.getElementById('hours-panel').style.display || document.getElementById('hours-panel').style.display !== 'none') {
    debugLogger('Hours: Refreshing panel due to task updates');
    // Clear existing tasks
    hoursData.tasks = [];
    const hoursContainer = document.querySelector('.hours-container');
    if (hoursContainer) {
      hoursContainer.querySelectorAll('.hours-task').forEach(task => task.remove());
    }
    // Reload tasks
    addSampleHoursTasks();
  }
}

// Generate 24-hour grid with labels and lines
function generateHourGrid() {
  const hourGrid = document.getElementById('hour-grid');
  if (!hourGrid) {
    console.log('🕐 GRID ERROR: hour-grid element not found!');
    return;
  }
  
  console.log('🕐 GRID: Generating hour grid...');
  hourGrid.innerHTML = '';
  
  // Create 24 hour slots (one per hour)
  for (let hour = 0; hour < 24; hour++) {
    const position = hour * 60; // 60px per hour
    
    // Create hour line
    const hourLine = document.createElement('div');
    hourLine.className = 'hour-line';
    hourLine.style.position = 'absolute';
    hourLine.style.top = position + 'px';
    hourLine.style.left = '0';
    hourLine.style.width = '100%';
    hourLine.style.height = '1px';
    hourLine.style.background = '#333333';
    hourLine.style.zIndex = '1';
    hourGrid.appendChild(hourLine);
    
    // Add hour label
    const hourLabel = document.createElement('div');
    hourLabel.className = hour >= 12 ? 'hour-label pm' : 'hour-label';
    hourLabel.style.position = 'absolute';
    hourLabel.style.top = (position - 10) + 'px';
    hourLabel.style.left = '-50px';
    hourLabel.style.width = '45px';
    hourLabel.style.textAlign = 'right';
    hourLabel.style.fontSize = '0.875rem';
    hourLabel.style.color = '#dddddd';
    hourLabel.style.zIndex = '2';
    
    let displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const period = hour >= 12 ? 'PM' : 'AM';
    hourLabel.textContent = `${displayHour} ${period}`;
    
    hourGrid.appendChild(hourLabel);
  }
  
  console.log('✅ GRID: Hour grid generated successfully with 24 hours');
}

// Initialize current time line with auto-update
function initCurrentTimeLine() {
  updateCurrentTimeLine();
  
  // Update every 5 minutes as per requirements
  setInterval(updateCurrentTimeLine, 5 * 60 * 1000);
  
  // EXTREME DEBUG: Force elements to be visible after a delay
  setTimeout(() => {
    debugForceTimelineVisible();
  }, 2000);
}

// EXTREME DEBUG FUNCTION: Force timeline elements to be visible
function debugForceTimelineVisible() {
  console.log('🚨 DEBUG: Starting force visibility check...');
  
  // Get the Hours timeline container to understand positioning context
  const hoursTimeline = document.getElementById('hours-timeline');
  console.log('🚨 DEBUG: hoursTimeline container:', hoursTimeline);
  
  if (hoursTimeline) {
    const timelineRect = hoursTimeline.getBoundingClientRect();
    console.log('🚨 DEBUG: Hours timeline container position:', {
      top: timelineRect.top,
      left: timelineRect.left,
      width: timelineRect.width,
      height: timelineRect.height
    });
  }
  
  // Check current time line
  const currentTimeLine = document.getElementById('current-time-line');
  const timeLineIndicator = document.querySelector('.time-line-indicator');
  
  console.log('🚨 DEBUG: currentTimeLine element:', currentTimeLine);
  console.log('🚨 DEBUG: timeLineIndicator element:', timeLineIndicator);
  
  if (currentTimeLine) {
    console.log('🚨 DEBUG: Current time line computed styles:');
    const styles = getComputedStyle(currentTimeLine);
    console.log('  - position:', styles.position);
    console.log('  - top:', styles.top);
    console.log('  - left:', styles.left);
    console.log('  - width:', styles.width);
    console.log('  - height:', styles.height);
    console.log('  - display:', styles.display);
    console.log('  - visibility:', styles.visibility);
    console.log('  - zIndex:', styles.zIndex);
    console.log('  - background:', styles.background);
  }
  
  if (timeLineIndicator) {
    console.log('🚨 DEBUG: Time line indicator computed styles:');
    const styles = getComputedStyle(timeLineIndicator);
    console.log('  - position:', styles.position);
    console.log('  - top:', styles.top);
    console.log('  - left:', styles.left);
    console.log('  - width:', styles.width);
    console.log('  - height:', styles.height);
    console.log('  - display:', styles.display);
    console.log('  - visibility:', styles.visibility);
    console.log('  - zIndex:', styles.zIndex);
    console.log('  - background:', styles.background);
  }
  
  // Check limit lines
  const stopLine = document.getElementById('stop-line');
  const stopBar = document.querySelector('.stop-line .limit-line-bar');
  const sleepLine = document.getElementById('sleep-line');
  const sleepBar = document.querySelector('.sleep-line .limit-line-bar');
  
  console.log('🚨 DEBUG: stopLine element:', stopLine);
  console.log('🚨 DEBUG: stopBar element:', stopBar);
  console.log('🚨 DEBUG: sleepLine element:', sleepLine);
  console.log('🚨 DEBUG: sleepBar element:', sleepBar);
  
  if (stopBar) {
    console.log('🚨 DEBUG: Stop bar computed styles:');
    const styles = getComputedStyle(stopBar);
    console.log('  - position:', styles.position);
    console.log('  - top:', styles.top);
    console.log('  - left:', styles.left);
    console.log('  - width:', styles.width);
    console.log('  - height:', styles.height);
    console.log('  - display:', styles.display);
    console.log('  - visibility:', styles.visibility);
    console.log('  - zIndex:', styles.zIndex);
    console.log('  - background:', styles.background);
  }
  
  console.log('🚨 DEBUG: Force visibility check complete - elements exist, fixing positioning...');
}

// Update current time line position
function updateCurrentTimeLine() {
  const currentTimeLine = document.getElementById('current-time-line');
  if (!currentTimeLine) {
    console.log('⏰ ERROR: current-time-line element not found!');
    return;
  }
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const position = (totalMinutes / 60) * 60; // Same calculation as limit lines: 60px per hour
  
  // Get timeline container for proper positioning context
  const timeline = document.getElementById('hours-timeline');
  const timelineRect = timeline ? timeline.getBoundingClientRect() : null;
  
  // Force position the current time line with explicit styles
  currentTimeLine.style.cssText = `
    position: absolute !important;
    top: ${position}px !important;
    left: 0 !important;
    width: 100% !important;
    height: 3px !important;
    background: #00CEF7 !important;
    z-index: 20 !important;
    display: block !important;
    visibility: visible !important;
  `;
  
  // Also apply to the indicator child if it exists
  const indicator = currentTimeLine.querySelector('.time-line-indicator');
  if (indicator) {
    indicator.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: #00CEF7 !important;
      z-index: 20 !important;
      display: block !important;
      visibility: visible !important;
    `;
  }
  
  console.log('⏰ CURRENT TIME: Current time line updated:', `${hours}:${minutes.toString().padStart(2, '0')}`, 'position:', position + 'px', 'totalMinutes:', totalMinutes);
  console.log('⏰ CURRENT TIME: Timeline container rect:', timelineRect);
}

// Initialize draggable limit lines
function initLimitLines() {
  const stopLine = document.getElementById('stop-line');
  const sleepLine = document.getElementById('sleep-line');
  
  if (stopLine) {
    const stopPosition = 18 * 60; // 6:00 PM = 18 * 60 = 1080 minutes
    positionLimitLine(stopLine, stopPosition);
    makeLimitLineDraggable(stopLine, 'stop');
  }
  
  if (sleepLine) {
    const sleepPosition = 23 * 60; // 11:00 PM = 23 * 60 = 1380 minutes
    positionLimitLine(sleepLine, sleepPosition);
    makeLimitLineDraggable(sleepLine, 'sleep');
  }
}

// Position limit line at specified time
function positionLimitLine(element, minutes) {
  const position = (minutes / 60) * 60; // 60px per hour
  
  // Force position the limit line with explicit styles
  element.style.cssText = `
    position: absolute !important;
    top: ${position}px !important;
    left: 0 !important;
    width: 100% !important;
    height: 3px !important;
    z-index: 15 !important;
    display: block !important;
    visibility: visible !important;
    cursor: ns-resize !important;
  `;
  
  // Also apply to the bar child if it exists
  const bar = element.querySelector('.limit-line-bar');
  if (bar) {
    bar.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: ${element.id === 'stop-line' ? '#ff6b6b' : '#00BFAE'} !important;
      z-index: 15 !important;
      display: block !important;
      visibility: visible !important;
    `;
  }
  
  console.log('🚦 LIMIT LINE: Positioned', element.id, 'at', position + 'px', 'for', minutes, 'minutes');
}

// Make limit line draggable with 15-minute snapping
function makeLimitLineDraggable(element, type) {
  let isDragging = false;
  let startY = 0;
  let startPosition = 0;
  
  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startPosition = hoursData.limitLines[type].position;
    element.style.cursor = 'ns-resize';
    
    if (debug) console.log(`limitDrag: ${type} drag started`);
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const deltaMinutes = (deltaY / 60) * 60; // Convert pixels to minutes
    let newPosition = startPosition + deltaMinutes;
    
    // Snap to 15-minute increments
    newPosition = Math.round(newPosition / 15) * 15;
    
    // Constrain to valid range (0-24 hours)
    newPosition = Math.max(0, Math.min(1440, newPosition));
    
    hoursData.limitLines[type].position = newPosition;
    positionLimitLine(element, newPosition);
    
    // Update time display
    const hours = Math.floor(newPosition / 60);
    const minutes = newPosition % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    hoursData.limitLines[type].time = timeStr;
    
    // Update label with just duration
    const label = element.querySelector('.limit-label');
    if (label) {
      const currentTime = new Date();
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const remainingMinutes = newPosition - currentMinutes;
      label.textContent = formatRemainingTime(remainingMinutes);
    }
    
    updateRemainingTimes();
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'ns-resize';
      
      if (debug) console.log(`limitDrag: ${type} drag ended at ${hoursData.limitLines[type].time}`);
    }
  });
}

// Format time for display (e.g., "18:00" -> "6:00 PM")
function formatTimeDisplay(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Update remaining time displays
function updateRemainingTimes() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Update STOP remaining time
  const stopLabel = document.querySelector('#stop-line .limit-label');
  if (stopLabel) {
    const stopMinutes = hoursData.limitLines.stop.position;
    const remainingToStop = stopMinutes - currentMinutes;
    stopLabel.textContent = formatRemainingTime(remainingToStop);
  }
  
  // Update SLEEP remaining time
  const sleepLabel = document.querySelector('#sleep-line .limit-label');
  if (sleepLabel) {
    const sleepMinutes = hoursData.limitLines.sleep.position;
    const remainingToSleep = sleepMinutes - currentMinutes;
    sleepLabel.textContent = formatRemainingTime(remainingToSleep);
  }
}

// Format remaining time (e.g., 570 minutes -> "9:30")
function formatRemainingTime(minutes) {
  if (minutes <= 0) return '0:00';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

// Setup event listeners for Hours panel
function setupHoursEventListeners() {
  const timeline = document.getElementById('hours-timeline');
  if (!timeline) return;
  
  // Double-click to create task
  timeline.addEventListener('dblclick', (e) => {
    // Don't create task if clicking on existing task or control elements
    if (e.target.closest('.task-block') || e.target.closest('.limit-line') || e.target.closest('.current-time-line')) {
      return;
    }
    
    const rect = timeline.getBoundingClientRect();
    const clickY = e.clientY - rect.top - 20; // Adjust for padding
    const minutes = Math.round((clickY / 60) * 60); // Convert pixels to minutes
    const snappedMinutes = Math.round(minutes / 15) * 15; // Snap to 15-minute grid
    
    createHoursTask(snappedMinutes);
  });
}

// Create a new task in the Hours panel
function createHoursTask(startMinutes, title = null) {
  const task = {
    id: `hours-task-${hoursData.nextId++}`,
    title: title || 'New Task',
    startIndex: Math.round(startMinutes / 15), // Store as 15-minute increments
    durationSteps: 4, // Default 60 minutes (4 * 15 minutes)
    startMinutes: startMinutes,
    durationMinutes: 60
  };
  
  // Check for overlaps
  if (checkTaskOverlap(task)) {
    showToast('Error', 'Task overlaps with existing task or limit');
    return;
  }
  
  hoursData.tasks.push(task);
  const taskBlock = renderHoursTask(task);
  
  // Immediately start inline editing if no title was provided
  if (!title) {
    const titleSpan = taskBlock.querySelector('.task-title');
    setTimeout(() => startInlineEdit(titleSpan, task), 50);
  }
  
  if (debug) console.log('create: Hours task created', task);
}

// Check if task overlaps with existing tasks or limits
function checkTaskOverlap(newTask) {
  const newStart = newTask.startMinutes;
  const newEnd = newStart + newTask.durationMinutes;
  
  // Check overlap with existing tasks
  for (const task of hoursData.tasks) {
    if (task.id === newTask.id) continue; // Skip self when updating
    
    const taskStart = task.startMinutes;
    const taskEnd = taskStart + task.durationMinutes;
    
    if (newStart < taskEnd && newEnd > taskStart) {
      return true; // Overlap detected
    }
  }
  
  // Check overlap with limit lines
  const stopPos = hoursData.limitLines.stop.position;
  const sleepPos = hoursData.limitLines.sleep.position;
  
  if (newEnd > stopPos && newStart < stopPos) return true;
  if (newEnd > sleepPos && newStart < sleepPos) return true;
  
  return false;
}

// Render a task block in the Hours panel
function renderHoursTask(task) {
  console.log('🔧 RENDER: Starting to render task', task.id);
  const container = document.getElementById('task-blocks-container');
  if (!container) {
    console.log('❌ RENDER: Container task-blocks-container not found!');
    return;
  }
  console.log('✅ RENDER: Container found, proceeding with task rendering');
  
  const taskBlock = document.createElement('div');
  taskBlock.className = 'task-block';
  taskBlock.dataset.taskId = task.id;
  
  const position = (task.startMinutes / 60) * 60; // 60px per hour
  const height = (task.durationMinutes / 60) * 60; // 60px per hour
  
  console.log('🎯 POSITION CALC: Task', task.id, 'startMinutes:', task.startMinutes, 'position:', position + 'px');
  console.log('🎯 HEIGHT CALC: Task', task.id, 'durationMinutes:', task.durationMinutes, 'height:', height + 'px');
  
  taskBlock.style.position = 'absolute';
  taskBlock.style.top = position + 'px';
  taskBlock.style.height = height + 'px';
  taskBlock.style.left = '2px';
  taskBlock.style.right = '10px';
  taskBlock.style.background = '#00CEF7';
  taskBlock.style.background = 'rgba(0, 206, 247, 0.3)';
  taskBlock.style.color = 'white';
  taskBlock.style.borderRadius = '4px';
  taskBlock.style.zIndex = '10';
  
  taskBlock.innerHTML = `
    <span class="task-title">${task.title}</span>
    <div class="task-block-controls">
      <button class="task-control-btn edit-btn" title="Edit task">
        <i class="fas fa-edit"></i>
      </button>
      <button class="task-control-btn delete-btn" title="Delete task">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="resize-handle"></div>
  `;
  
  container.appendChild(taskBlock);
  
  console.log('🔧 RENDER: About to setup task interactions for', task.id);
  console.log('🔧 RENDER: TaskBlock HTML before setup:', taskBlock.outerHTML);
  // Setup task interactions
  setupTaskInteractions(taskBlock, task);
  console.log('🔧 RENDER: Task rendering complete for', task.id);
  
  return taskBlock;
}

// Setup interactions for a task block
function setupTaskInteractions(taskBlock, task) {
  console.log('🔧 SETUP: Starting interaction setup for task', task.id);
  const titleSpan = taskBlock.querySelector('.task-title');
  const editBtn = taskBlock.querySelector('.edit-btn');
  const deleteBtn = taskBlock.querySelector('.delete-btn');
  const resizeHandle = taskBlock.querySelector('.resize-handle');
  
  console.log('🔧 SETUP: Found elements - title:', !!titleSpan, 'edit:', !!editBtn, 'delete:', !!deleteBtn, 'resize:', !!resizeHandle);
  
  // TEST: Add simple click listener to verify events work
  if (titleSpan) {
    titleSpan.addEventListener('click', (e) => {
      console.log('🟢 CLICK TEST: Title span clicked successfully for task', task.id);
    });
  }
  
  if (taskBlock) {
    taskBlock.addEventListener('click', (e) => {
      console.log('🟢 CLICK TEST: Task block clicked successfully for task', task.id);
    });
  }
  
  // Inline rename on double-click title
  if (titleSpan) {
    titleSpan.addEventListener('dblclick', (e) => {
      console.log('🎯 TITLE: Double-click detected on title span for task', task.id);
      e.stopPropagation();
      startInlineEdit(titleSpan, task);
    });
  }
  
  // Modal edit on double-click block (but not title)
  taskBlock.addEventListener('dblclick', (e) => {
    if (e.target === titleSpan) return; // Already handled above
    e.stopPropagation();
    openHoursTaskModal(task, taskBlock);
  });
  
  // Edit button
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openHoursTaskModal(task, taskBlock);
  });
  
  // Delete button
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteHoursTask(task.id);
  });
  
  // Make task draggable
  makeTaskDraggable(taskBlock, task);
  
  // Make task resizable
  makeTaskResizable(taskBlock, task, resizeHandle);
}

// Start inline editing of task title
function startInlineEdit(titleSpan, task) {
  const currentTitle = task.title;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  input.style.width = 'calc(100% - 30px)';
  
  titleSpan.style.display = 'none';
  titleSpan.parentNode.insertBefore(input, titleSpan);
  input.focus();
  input.select();
  
  const finishEdit = () => {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== currentTitle) {
      task.title = newTitle;
      titleSpan.textContent = newTitle;
      if (debug) console.log('Task renamed:', task);
    }
    
    input.remove();
    titleSpan.style.display = '';
  };
  
  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finishEdit();
    if (e.key === 'Escape') {
      input.remove();
      titleSpan.style.display = '';
    }
  });
}

// Open task edit modal (reuse existing modal system)
function openHoursTaskModal(task, taskElement) {
  // Convert Hours task to database task format for modal
  const modalTask = {
    id: task.dbTaskId || task.id,
    content: task.title,
    completed: false,
    fire: false, fast: false, flow: false, fear: false, first: false,
    overview: '', details: '', timeEstimate: task.durationMinutes,
    scheduledTime: `${Math.floor(task.startMinutes / 60).toString().padStart(2, '0')}:${(task.startMinutes % 60).toString().padStart(2, '0')}`,
    revisitDate: new Date().toISOString().split('T')[0]
  };
  
  openTaskModal(modalTask, taskElement);
}

// Delete a task with undo functionality
function deleteHoursTask(taskId) {
  const taskIndex = hoursData.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;
  
  const task = hoursData.tasks[taskIndex];
  const taskBlock = document.querySelector(`[data-task-id="${taskId}"]`);
  
  // Store task data for potential undo
  const deletedTaskData = { ...task };
  const deletedTaskHTML = taskBlock ? taskBlock.outerHTML : null;
  
  // Remove from data and DOM
  hoursData.tasks.splice(taskIndex, 1);
  if (taskBlock) {
    taskBlock.remove();
  }
  
  // Show undo toast
  showToast(
    'Task Deleted',
    `"${task.title}" removed from timeline`,
    'UNDO',
    () => {
      // Restore task
      hoursData.tasks.push(deletedTaskData);
      renderHoursTask(deletedTaskData);
      if (debug) console.log('undo: Hours task restored', deletedTaskData);
    }
  );
  
  if (debug) console.log('delete: Hours task deleted', taskId);
}

// Make task draggable with snapping
function makeTaskDraggable(taskBlock, task) {
  let isDragging = false;
  let startY = 0;
  let startMinutes = 0;
  
  taskBlock.addEventListener('mousedown', (e) => {
    // Don't start drag if clicking on controls or resize handle
    if (e.target.closest('.task-block-controls') || e.target.closest('.resize-handle')) {
      return;
    }
    
    isDragging = true;
    startY = e.clientY;
    startMinutes = task.startMinutes;
    taskBlock.classList.add('dragging');
    
    if (debug) console.log('dragStart: Hours task drag started', task.id);
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const deltaMinutes = (deltaY / 60) * 60; // Convert pixels to minutes
    let newStartMinutes = startMinutes + deltaMinutes;
    
    // Snap to 15-minute increments
    newStartMinutes = Math.round(newStartMinutes / 15) * 15;
    
    // Constrain to valid range
    newStartMinutes = Math.max(0, Math.min(1440 - task.durationMinutes, newStartMinutes));
    
    // Check for overlaps
    const testTask = { ...task, startMinutes: newStartMinutes };
    if (checkTaskOverlap(testTask)) {
      taskBlock.classList.add('overlap-error');
      return;
    } else {
      taskBlock.classList.remove('overlap-error');
    }
    
    // Update task position
    task.startMinutes = newStartMinutes;
    task.startIndex = Math.round(newStartMinutes / 15);
    
    const position = (newStartMinutes / 60) * 60;
    taskBlock.style.top = position + 'px';
  });
  
  document.addEventListener('mouseup', async () => {
    if (!isDragging) return;
    
    isDragging = false;
    taskBlock.classList.remove('dragging');
    
    // Handle overlap error
    if (taskBlock.classList.contains('overlap-error')) {
      taskBlock.classList.add('overlap-error');
      setTimeout(() => {
        taskBlock.classList.remove('overlap-error');
        // Revert to original position
        task.startMinutes = startMinutes;
        task.startIndex = Math.round(startMinutes / 15);
        const position = (startMinutes / 60) * 60;
        taskBlock.style.top = position + 'px';
      }, 400);
    } else if (task.startMinutes !== startMinutes) {
      // Time changed - save to database and propagate to other views
      const newTime = minutesToTimeString(task.startMinutes);
      const updates = { scheduledTime: newTime };
      
      try {
        // Use dbTaskId for database operations, fallback to task.id for demo tasks
        const databaseId = task.dbTaskId || task.id;
        await updateTaskState(databaseId, updates);
        
        // Propagate changes to modal if open
        const modal = document.getElementById('task-modal');
        if (modal && modal.style.display === 'block') {
          const timeInput = document.getElementById('modal-scheduled-time');
          if (timeInput && timeInput.value !== newTime) {
            timeInput.value = newTime;
          }
        }
        
        // Show success feedback
        showToast('Time Updated', `Task moved to ${formatTime(newTime)}`, '', null, 2000);
        
        if (debug) console.log('dragEnd: Time saved to database and propagated', task.id, newTime);
      } catch (error) {
        console.error('dragEnd: Failed to save time change', error);
        showToast('Save Error', 'Failed to save time change', '', null, 3000);
        
        // Revert on error
        task.startMinutes = startMinutes;
        task.startIndex = Math.round(startMinutes / 15);
        const position = (startMinutes / 60) * 60;
        taskBlock.style.top = position + 'px';
      }
    }
    
    if (debug) console.log('dragEnd: Hours task drag ended', task);
  });
}

// Make task resizable from bottom edge
function makeTaskResizable(taskBlock, task, resizeHandle) {
  let isResizing = false;
  let startY = 0;
  let startDuration = 0;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startDuration = task.durationMinutes;
    taskBlock.classList.add('dragging');
    
    if (debug) console.log('resize: Hours task resize started', task.id);
    
    e.preventDefault();
    e.stopPropagation();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const deltaMinutes = (deltaY / 60) * 60; // Convert pixels to minutes
    let newDuration = startDuration + deltaMinutes;
    
    // Snap to 15-minute increments
    newDuration = Math.round(newDuration / 15) * 15;
    
    // Minimum 15 minutes
    newDuration = Math.max(15, newDuration);
    
    // Don't extend past midnight
    const maxDuration = 1440 - task.startMinutes;
    newDuration = Math.min(newDuration, maxDuration);
    
    // Check for overlaps
    const testTask = { ...task, durationMinutes: newDuration };
    if (checkTaskOverlap(testTask)) {
      taskBlock.classList.add('overlap-error');
      return;
    } else {
      taskBlock.classList.remove('overlap-error');
    }
    
    // Update task duration
    task.durationMinutes = newDuration;
    task.durationSteps = Math.round(newDuration / 15);
    
    const height = (newDuration / 60) * 60;
    taskBlock.style.height = height + 'px';
  });
  
  document.addEventListener('mouseup', async () => {
    if (!isResizing) return;
    
    isResizing = false;
    taskBlock.classList.remove('dragging');
    
    // Handle overlap error
    if (taskBlock.classList.contains('overlap-error')) {
      taskBlock.classList.add('overlap-error');
      setTimeout(() => {
        taskBlock.classList.remove('overlap-error');
        // Revert to original duration
        task.durationMinutes = startDuration;
        task.durationSteps = Math.round(startDuration / 15);
        const height = (startDuration / 60) * 60;
        taskBlock.style.height = height + 'px';
      }, 400);
    } else if (task.durationMinutes !== startDuration) {
      // Duration changed - save to database and propagate to other views
      const newEstimate = task.durationMinutes; // Keep in minutes for database
      const updates = { timeEstimate: newEstimate };
      
      try {
        // Use dbTaskId for database operations, fallback to task.id for demo tasks
        const databaseId = task.dbTaskId || task.id;
        await updateTaskState(databaseId, updates);
        
        // Propagate changes to modal if open
        const modal = document.getElementById('task-modal');
        if (modal && modal.style.display === 'block') {
          const estimateInput = document.getElementById('modal-time-estimate');
          if (estimateInput && parseFloat(estimateInput.value) !== newEstimate) {
            estimateInput.value = newEstimate.toString();
          }
        }
        
        // Show success feedback
        const durationText = task.durationMinutes >= 60 ? 
          `${Math.floor(task.durationMinutes / 60)}h ${task.durationMinutes % 60}m` : 
          `${task.durationMinutes}m`;
        showToast('Duration Updated', `Task duration set to ${durationText}`, '', null, 2000);
        
        if (debug) console.log('resize: Duration saved to database and propagated', task.id, newEstimate);
      } catch (error) {
        console.error('resize: Failed to save duration change', error);
        showToast('Save Error', 'Failed to save duration change', '', null, 3000);
        
        // Revert on error
        task.durationMinutes = startDuration;
        task.durationSteps = Math.round(startDuration / 15);
        const height = (startDuration / 60) * 60;
        taskBlock.style.height = height + 'px';
      }
    }
    
    if (debug) console.log('resize: Hours task resize ended', task);
  });
}

/* ---------- Helper Functions for Time Formatting ----------- */
function minutesToTimeString(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24);
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes}${ampm}`;
}

/* ---------- Hours Panel Propagation Functions ----------- */
function propagateTimeChangeToHoursPanel(taskId, newTime) {
  try {
    // Find the Hours panel task block
    const taskBlock = document.querySelector(`.task-block[data-task-id="${taskId}"]`);
    if (!taskBlock) return;
    
    // Convert time string to minutes
    const [hours, minutes] = newTime.split(':');
    const totalMinutes = (parseInt(hours) * 60) + parseInt(minutes);
    
    // Find the corresponding hours data object
    const hoursTask = hoursData.tasks.find(t => t.id === taskId);
    if (hoursTask) {
      hoursTask.startMinutes = totalMinutes;
      hoursTask.startIndex = Math.round(totalMinutes / 15);
      
      // Update visual position
      const position = (totalMinutes / 60) * 60;
      taskBlock.style.top = position + 'px';
      
      if (debug) console.log('propagateTime: Updated Hours panel position for', taskId, newTime);
    }
  } catch (error) {
    console.error('propagateTime: Failed to update Hours panel', error);
  }
}

function propagateEstimateChangeToHoursPanel(taskId, newEstimate) {
  try {
    // Find the Hours panel task block
    const taskBlock = document.querySelector(`.task-block[data-task-id="${taskId}"]`);
    if (!taskBlock) return;
    
    // Convert hours to minutes
    const totalMinutes = newEstimate * 60;
    
    // Find the corresponding hours data object
    const hoursTask = hoursData.tasks.find(t => t.id === taskId);
    if (hoursTask) {
      hoursTask.durationMinutes = totalMinutes;
      hoursTask.durationSteps = Math.round(totalMinutes / 15);
      
      // Update visual height
      const height = (totalMinutes / 60) * 60;
      taskBlock.style.height = height + 'px';
      
      if (debug) console.log('propagateEstimate: Updated Hours panel height for', taskId, newEstimate + 'h');
    }
  } catch (error) {
    console.error('propagateEstimate: Failed to update Hours panel', error);
  }
}

/* ---------- One-Click Debug Export System ----------- */
async function startOneClickExport() {
  debugLogger('🚀 EXPORT: Starting one-click debug export process');
  
  // Find the export button for status updates
  let exportBtn = null;
  let targetDoc = document;
  
  if (settingsPopupWindow && !settingsPopupWindow.closed) {
    targetDoc = settingsPopupWindow.document;
    debugLogger('EXPORT: Using popup window document');
  }
  
  exportBtn = targetDoc.getElementById('one-click-export-nav') || targetDoc.getElementById('one-click-export');
  
  if (exportBtn) {
    exportBtn.disabled = true;
    if (exportBtn.id === 'one-click-export-nav') {
      exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
    } else {
      exportBtn.textContent = '⏳ Exporting...';
    }
  }
  
  const steps = [
    'Initializing export process...',
    'Collecting system information...',
    'Fetching raw task data from API...',
    'Gathering project source files...',
    'Capturing debug logs and console data...',
    'Generating comprehensive bug report...',
    'Creating filter flow analysis...',
    'Compiling final export package...',
    'Preparing download...'
  ];
  
  let exportData = {
    timestamp: new Date().toISOString(),
    systemInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      debug: debug,
      currentFilter: document.getElementById('filter-dropdown')?.value
    },
    sections: []
  };
  
  try {
    for (let i = 0; i < steps.length; i++) {
      debugLogger(`📋 EXPORT STEP ${i + 1}/9: ${steps[i]}`);
      
      switch (i) {
        case 0: // Initialize
          debugLogger('EXPORT: Initializing export system...');
          await new Promise(resolve => setTimeout(resolve, 300));
          debugLogger('✅ EXPORT: Export system initialized');
          break;
          
        case 1: // System info
          debugLogger('EXPORT: Collecting system information...');
          const systemData = {
            timestamp: exportData.timestamp,
            userAgent: exportData.systemInfo.userAgent,
            url: exportData.systemInfo.url,
            viewport: exportData.systemInfo.viewport,
            debug: exportData.systemInfo.debug,
            currentFilter: exportData.systemInfo.currentFilter || 'None',
            taskTree: document.getElementById('task-tree') ? 'Present' : 'Missing',
            filterDropdown: document.getElementById('filter-dropdown') ? 'Present' : 'Missing',
            hoursPanel: document.querySelector('.hours-column') ? 'Present' : 'Missing',
            taskItems: document.querySelectorAll('.task-item').length
          };
          exportData.sections.push({
            title: 'SYSTEM INFORMATION',
            content: `Timestamp: ${systemData.timestamp}
User Agent: ${systemData.userAgent}
Current URL: ${systemData.url}
Viewport: ${systemData.viewport}
Debug Mode: ${systemData.debug}
Current Filter: ${systemData.currentFilter}

DOM Elements Status:
- Task Tree: ${systemData.taskTree}
- Filter Dropdown: ${systemData.filterDropdown}
- Hours Panel: ${systemData.hoursPanel}
- Task Items: ${systemData.taskItems} found`
          });
          debugLogger(`✅ EXPORT: System info collected - ${systemData.taskItems} tasks, debug: ${systemData.debug}`);
          break;
          
        case 2: // Raw API data
          debugLogger('EXPORT: Fetching raw task data from API...');
          try {
            const response = await fetch('/api/debug/tasks');
            const rawData = await response.json();
            exportData.sections.push({
              title: 'RAW TASK DATA (API)',
              content: JSON.stringify(rawData, null, 2)
            });
            debugLogger(`✅ EXPORT: Raw API data fetched - ${rawData.length || 0} records`);
          } catch (error) {
            debugLogger(`❌ EXPORT: Failed to fetch API data - ${error.message}`);
            exportData.sections.push({
              title: 'RAW TASK DATA (API)',
              content: `ERROR: Failed to fetch API data - ${error.message}`
            });
          }
          break;
          
        case 3: // Source files
          debugLogger('EXPORT: Gathering project source files...');
          const sourceFiles = [
            '/index.html', '/styles.css', '/script.js', '/server.js',
            '/emergency-fix.js', '/filter-fix.js', '/package.json', '/replit.md'
          ];
          
          let fileContents = '';
          for (const filePath of sourceFiles) {
            try {
              const response = await fetch(filePath);
              if (response.ok) {
                const content = await response.text();
                fileContents += `\n${'='.repeat(80)}\n`;
                fileContents += `FILE: ${filePath}\n`;
                fileContents += `${'='.repeat(80)}\n\n`;
                fileContents += content;
                fileContents += '\n\n';
              }
            } catch (error) {
              fileContents += `\nERROR loading ${filePath}: ${error.message}\n`;
            }
          }
          
          exportData.sections.push({
            title: 'PROJECT SOURCE FILES',
            content: fileContents
          });
          debugLogger('✅ EXPORT: Project source files collected');
          break;
          
        case 4: // Debug logs
          debugLogger('EXPORT: Capturing debug logs and console data...');
          const debugLog = document.getElementById('debug-log')?.textContent || 'No debug log available';
          
          exportData.sections.push({
            title: 'DEBUG LOGS AND CONSOLE DATA',
            content: `DEBUG LOG:\n${debugLog}\n\nCONSOLE INFORMATION:\n${JSON.stringify(exportData.systemInfo, null, 2)}`
          });
          debugLogger('✅ EXPORT: Debug logs and console data captured');
          break;
          
        case 5: // Bug report
          debugLogger('EXPORT: Generating comprehensive bug report...');
          exportData.sections.push({
            title: 'COMPREHENSIVE BUG REPORT',
            content: `BUG REPORT: Date Range Filter Issues

SEVERITY: High - Core functionality broken

EXPECTED BEHAVIOR:
- Next Week: Tasks scheduled July 28 - August 3, 2025
- Next Month: Tasks scheduled August 1-31, 2025
- Triage tasks (overdue/unscheduled) should appear in Today/Tomorrow filters

ACTUAL BEHAVIOR:
- Next Week shows same tasks as This Week (July 21-27, 2025)
- Next Month shows same tasks as This Month (July 1-31, 2025)
- Triage tasks don't appear in Today/Tomorrow date filters despite fixes

REPRODUCTION STEPS:
1. Load DUN task management application
2. Select "This Week" from filter dropdown - note visible tasks
3. Select "Next Week" from filter dropdown
4. Observe identical tasks are shown
5. Repeat with "This Month" vs "Next Month"
6. Try Today/Tomorrow filters - triage tasks missing

ATTEMPTED SOLUTIONS:
1. Added comprehensive date range debugging with console.log statements
2. Enhanced triage filtering rules to include overdue tasks in Today/Tomorrow
3. Fixed Hours panel database ID mismatch (dbTaskId vs temporary IDs)
4. Added layout detection logging for panel repositioning issues
5. Verified date calculation logic - mathematically correct but results identical

SUSPECTED CAUSES:
1. Task date parsing issues in comparison logic
2. Test data may only contain tasks for current week/month periods
3. Date timezone conversion problems causing incorrect comparisons
4. Switch statement logic error in filter application
5. Database date storage format mismatch with JavaScript Date objects

KEY FILES INVOLVED:
script.js (lines 1398-1408): handleFilterChange() function
script.js (lines 1410-1450): Date range calculation logic
script.js (lines 1500-1600): Task filtering and display logic
server.js: Database date format and task query endpoints`
          });
          debugLogger('✅ EXPORT: Comprehensive bug report generated');
          break;
          
        case 6: // Filter flow analysis
          debugLogger('EXPORT: Creating filter flow analysis...');
          exportData.sections.push({
            title: 'FILTER FLOW ANALYSIS',
            content: `Current filter state analysis and flow diagram data:
- Current filter selection: ${exportData.systemInfo.currentFilter}
- Visible tasks count: ${document.querySelectorAll('.task-item:not([style*="display: none"])').length}
- Hidden tasks count: ${document.querySelectorAll('.task-item[style*="display: none"]').length}
- Date range calculations and comparisons
- Task visibility logic flow`
          });
          debugLogger('✅ EXPORT: Filter flow analysis created');
          break;
          
        case 7: // Compile package
          debugLogger('EXPORT: Compiling final export package...');
          await new Promise(resolve => setTimeout(resolve, 500));
          debugLogger('✅ EXPORT: Final package compiled');
          break;
          
        case 8: // Prepare download
          debugLogger('EXPORT: Preparing download...');
          const finalExport = generateFinalExportContent(exportData);
          downloadExportFile(finalExport);
          debugLogger('✅ EXPORT: File download initiated');
          break;
      }
    }
    
    // Success
    debugLogger('🎉 EXPORT: Export completed successfully! File download should have started.');
    if (exportBtn) {
      if (exportBtn.id === 'one-click-export-nav') {
        exportBtn.innerHTML = '<i class="fa-solid fa-check"></i> Export Complete!';
      } else {
        exportBtn.textContent = '✅ Export Complete!';
      }
    }
    setTimeout(() => {
      if (exportBtn) {
        exportBtn.disabled = false;
        if (exportBtn.id === 'one-click-export-nav') {
          exportBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> One-Click Debug Export';
        } else {
          exportBtn.textContent = '🚀 One-Click Debug Export';
        }
      }
    }, 3000);
    
  } catch (error) {
    console.error('Export failed:', error);
    debugLogger('Export failed: ' + error.message);
    if (exportBtn) {
      if (exportBtn.id === 'one-click-export-nav') {
        exportBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Export Failed';
      } else {
        exportBtn.textContent = '❌ Export Failed';
      }
      exportBtn.style.background = '#dc3545';
    }
    setTimeout(() => {
      if (exportBtn) {
        exportBtn.disabled = false;
        if (exportBtn.id === 'one-click-export-nav') {
          exportBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> One-Click Debug Export';
        } else {
          exportBtn.textContent = '🚀 One-Click Debug Export';
        }
        exportBtn.style.background = '#28a745';
      }
    }, 3000);
  }
}

async function updateExportProgress(stepsDiv, steps, currentIndex, status) {
  stepsDiv.innerHTML = '';
  
  steps.forEach((step, index) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'export-step';
    
    if (index < currentIndex) {
      stepDiv.classList.add('complete');
      stepDiv.textContent = `✅ ${step}`;
    } else if (index === currentIndex) {
      stepDiv.classList.add(status);
      stepDiv.textContent = status === 'active' ? `⏳ ${step}` : `✅ ${step}`;
    } else {
      stepDiv.textContent = `⏸️ ${step}`;
    }
    
    stepsDiv.appendChild(stepDiv);
  });
  
  await new Promise(resolve => setTimeout(resolve, 150));
}

function generateFinalExportContent(exportData) {
  // Check for errors in sections and move to top
  const errorSections = exportData.sections.filter(section => 
    section.content.includes('ERROR:') || section.title.includes('ERROR')
  );
  const normalSections = exportData.sections.filter(section => 
    !section.content.includes('ERROR:') && !section.title.includes('ERROR')
  );
  
  let content = `================================================================================
DUN TASK MANAGEMENT - COMPREHENSIVE DEBUG EXPORT
================================================================================

Generated: ${exportData.timestamp}
Purpose: Complete system analysis for debugging date filter and UI issues

This export contains:
1. ERROR INFORMATION (if any) - Critical issues requiring immediate attention
2. SYSTEM INFORMATION - Current application state and environment details  
3. RAW TASK DATA - Direct database records for data integrity verification
4. PROJECT SOURCE FILES - Complete codebase for analysis
5. DEBUG LOGS - Runtime information and console data
6. COMPREHENSIVE BUG REPORT - Known issues with reproduction steps
7. FILTER FLOW ANALYSIS - Current filtering state and behavior

================================================================================
`;

  // Add error sections first if any exist
  if (errorSections.length > 0) {
    content += `\n⚠️  CRITICAL ERRORS DETECTED - REVIEW IMMEDIATELY\n`;
    content += `${'='.repeat(80)}\n\n`;
    errorSections.forEach(section => {
      content += `\n${section.title}\n`;
      content += `${'-'.repeat(section.title.length)}\n`;
      content += `${section.content}\n\n`;
    });
  }

  // Add normal sections
  normalSections.forEach(section => {
    content += `\n${section.title}\n`;
    content += `${'-'.repeat(section.title.length)}\n`;
    content += `${section.content}\n\n`;
  });

  content += `\n================================================================================
END OF EXPORT - READY FOR AI CONSULTATION
================================================================================

INSTRUCTIONS FOR AI DEBUGGING:
1. Review system information for environment context
2. Examine raw API data for data consistency issues
3. Analyze source code files for logic errors
4. Check debug logs for runtime issues
5. Focus on date range filter logic in script.js
6. Verify database date format compatibility

PRIORITY ISSUE: Date range filters (Next Week/Next Month) showing identical 
results to current period filters (This Week/This Month).`;

  return content;
}

function downloadExportFile(content) {
  // Extract error text for filename if present
  let filename = 'Bug Report ReadMe First';
  const errorMatch = content.match(/ERROR:([^\n]{1,50})/);
  if (errorMatch) {
    const errorText = errorMatch[1].trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .substring(0, 15); // First 15 characters
    filename = `${errorText} - ${filename}`;
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  debugLogger(`📁 EXPORT: File saved as "${filename}.txt"`);
}

// Make the function globally available after definition
window.startOneClickExport = startOneClickExport;

// Connect one-click export button on page load
document.addEventListener('DOMContentLoaded', function() {
  debugLogger('Setting up one-click export event listeners...');
  
  // Set up export button in settings modal (if exists)
  const exportBtn = document.getElementById('one-click-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', startOneClickExport);
    debugLogger('Main export button event listener attached');
  }
  
  // Set up export button in navigation (if exists)
  const exportNavBtn = document.getElementById('one-click-export-nav');
  if (exportNavBtn) {
    exportNavBtn.addEventListener('click', function(e) {
      e.preventDefault();
      startOneClickExport();
    });
    debugLogger('Navigation export button event listener attached');
  }
});
