// -------------  DUN Task Management  ------------------
// 🔧 Fixes applied:
// 1. Clear old tree on load to avoid duplicates
// 2. Persist every priority‐flag toggle immediately
// 3. Persist edits from modal immediately
// 4. Persist new tasks under TRIAGE (not as siblings) via db.addTask()
// ---------------------------------------------------

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
      
      // Add click handler for modal flags
      flag.onclick = (e) => {
        e.preventDefault();
        flag.classList.toggle('active');
      };
      
      modalFlagsContainer.appendChild(flag);
    });

    modal.style.display='block';
    titleInput.focus();

    document.getElementById('save-task-btn').onclick = () => saveTaskFromModal(task, taskElement);
    document.getElementById('delete-task-btn').onclick = () => deleteTask(task, taskElement);
    document.querySelector('.close-modal').onclick = () => modal.style.display='none';
    
    // Close modal on click outside or ESC key
    window.onclick = e => { if (e.target === modal) modal.style.display='none'; };
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

/* ---------- Save from Modal ----------- */
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

/* ---------- Filter Tasks ----------- */
function handleFilterChange() {
  const filterValue = document.getElementById('filter-dropdown').value;
  console.log(`🔍 FILTER: Applying filter "${filterValue}"`);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
    This Week: ${weekStart.toDateString()} → ${weekEnd.toDateString()}
    This Month: ${monthStart.toDateString()} → ${monthEnd.toDateString()}`);

  document.querySelectorAll('.task-item').forEach(taskItem => {
    if (taskItem.classList.contains('section-header')) {
      // Always show section headers
      taskItem.style.display = '';
      return;
    }
    
    let shouldShow = false;
    const taskData = JSON.parse(taskItem.dataset.taskData || '{}');
    
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
      
      // CRITICAL FIX: Tasks with no revisit date should ALWAYS show up in date filters
      // because they need attention (require scheduling/categorization)
      if (!revisitDate || revisitDate === null || revisitDate === '') {
        if (!isCompleted) {
          shouldShow = true;
          console.log(`🚨 FILTER: "${taskData.content}" - no revisit date, showing in all date filters`);
        }
      } else {
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
          
          switch (filterValue) {
            case 'today':
              shouldShow = taskDateOnly.getTime() === today.getTime();
              break;
            case 'tomorrow':
              shouldShow = taskDateOnly.getTime() === tomorrow.getTime();
              break;
            case 'this-week':
              shouldShow = taskDateOnly >= weekStart && taskDateOnly <= weekEnd;
              break;
            case 'next-week':
              shouldShow = taskDateOnly >= nextWeekStart && taskDateOnly <= nextWeekEnd;
              break;
            case 'this-month':
              shouldShow = taskDateOnly >= monthStart && taskDateOnly <= monthEnd;
              break;
            case 'next-month':
              shouldShow = taskDateOnly >= nextMonthStart && taskDateOnly <= nextMonthEnd;
              break;
          }
        }
      }
    }
    
    taskItem.style.display = shouldShow ? '' : 'none';
  });
  
  console.log(`🔍 FILTER: Applied "${filterValue}" filter with corrected Triage logic`);
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
  
  let visiblePanels = 0;
  if (tasksVisible) visiblePanels++;
  if (priorityVisible) visiblePanels++;
  if (hoursVisible) visiblePanels++;
  
  // Calculate appropriate width based on visible panels
  let newWidth;
  if (!tasksVisible && !hoursVisible) {
    newWidth = '250px'; // Only priority column
  } else if (tasksVisible && !hoursVisible) {
    newWidth = priorityVisible ? '850px' : '700px'; // Tasks + optional priority
  } else if (!tasksVisible && hoursVisible) {
    newWidth = priorityVisible ? '395px' : '225px'; // Hours + optional priority (225px hours + 150px priority + 20px margin)
  } else {
    newWidth = priorityVisible ? '1095px' : '925px'; // All panels (700px tasks + 225px hours + 150px priority + margins)
  }
  
  container.style.width = newWidth;
  
  if (debug) console.log(`Layout: Updated width to ${newWidth} for ${visiblePanels} visible panels`);
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
  
  if (tasksColumn && toggleBtn) {
    const isVisible = !tasksColumn.classList.contains('tasks-hidden');
    
    if (isVisible) {
      // Hide tasks column
      tasksColumn.classList.add('tasks-hidden');
      toggleBtn.classList.remove('active');
      console.log('📋 Tasks panel hidden');
    } else {
      // Show tasks column
      tasksColumn.classList.remove('tasks-hidden');
      toggleBtn.classList.add('active');
      console.log('📋 Tasks panel shown');
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
  document.getElementById('filter-dropdown')?.addEventListener('change', handleFilterChange);

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
  } catch (error) {
    console.error('Error initializing application:', error);
    // Fallback to sample tasks if database fails
    if (debug) console.log('Database error, using sample tasks as fallback');
    buildTree(sampleTasks, root);
    const rootList = root.querySelector(':scope > .task-list');
    if (rootList) createRootSortable(rootList);
  }

  if (debug) console.log('Application initialized');
  
  // Initialize Hours Panel
  initHoursPanel();
  
  // Set initial layout width
  updateLayoutWidth();
  
  // Initialize tasks panel as active (visible by default)
  const tasksToggleBtn = document.getElementById('toggle-tasks');
  if (tasksToggleBtn) {
    tasksToggleBtn.classList.add('active');
  }
  
  // Initialize debug modal functionality
  initDebugModal();
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
      modal.style.display = 'none';
      debugLogger('Debug modal closed via gear icon click');
    } else {
      modal.style.display = 'block';
      debugLogger('Debug modal opened via gear icon click');
      
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
  
  // Modal close functionality
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      debugLogger('Debug modal closed');
    });
  }
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      debugLogger('Debug modal closed (clicked outside)');
    }
  });
  
  // Make modal draggable
  makeDraggable(modal.querySelector('.debug-modal-content'));
  
  debugLogger('Debug modal initialized successfully');
}

// Make an element draggable by its header
function makeDraggable(element) {
  const header = element.querySelector('.modal-header');
  if (!header) return;
  
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  header.addEventListener('mousedown', (e) => {
    // Don't start dragging if clicking on close button
    if (e.target.closest('.modal-close')) return;
    
    isDragging = true;
    element.classList.add('dragging');
    
    // Get current position
    const rect = element.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    // Store initial mouse position
    startX = e.clientX;
    startY = e.clientY;
    
    // Remove transform and set explicit position
    element.style.transform = 'none';
    element.style.left = initialX + 'px';
    element.style.top = initialY + 'px';
    
    debugLogger('Debug modal: Started dragging');
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
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    element.style.left = boundedX + 'px';
    element.style.top = boundedY + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.classList.remove('dragging');
      debugLogger('Debug modal: Finished dragging');
    }
  });
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
  generateHourGrid();
  initCurrentTimeLine();
  initLimitLines();
  setupHoursEventListeners();
  updateRemainingTimes();
  
  // Update remaining times every minute
  setInterval(updateRemainingTimes, 60 * 1000);
  
  // Add sample tasks to demonstrate functionality
  addSampleHoursTasks();
  
  if (debug) console.log('Hours panel initialized');
}

// Load tasks from database for today's date with scheduled times
async function addSampleHoursTasks() {
  try {
    debugLogger('Hours: Starting task loading from database...');
    
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
      
      // Allow tasks with scheduled time regardless of date for testing
      if (task.scheduled_time) {
        debugLogger(`Hours: Task "${task.content}" has scheduled time: ${task.scheduled_time}`);
        
        // Parse scheduled time (HH:MM:SS format from database)
        const timeStr = task.scheduled_time;
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            const startMinutes = hours * 60 + minutes;
            // Parse time_estimate from database (could be string like "1.50")
            const timeEstimate = parseFloat(task.time_estimate) || 1;
            const durationMinutes = timeEstimate > 0 ? (timeEstimate * 60) : 60; // Convert hours to minutes
            
            const hoursTask = {
              id: `hours-task-${hoursData.nextId++}`,
              title: task.content,
              startIndex: Math.round(startMinutes / 15),
              durationSteps: Math.round(durationMinutes / 15),
              startMinutes: startMinutes,
              durationMinutes: durationMinutes,
              dbTaskId: task.id // Link to original database task
            };
            
            debugLogger(`Hours: Created hours task - start: ${hours}:${minutes.toString().padStart(2, '0')}, duration: ${durationMinutes}min (from estimate: ${timeEstimate}h)`);
            
            // Check for overlaps before adding
            if (!checkTaskOverlap(hoursTask)) {
              hoursData.tasks.push(hoursTask);
              renderHoursTask(hoursTask);
              addedCount++;
              debugLogger(`Hours: Successfully added database task: "${task.content}" at ${hours}:${minutes.toString().padStart(2, '0')}`);
            } else {
              debugLogger(`Hours: Task "${task.content}" overlaps with existing task, skipped`);
            }
          } else {
            debugLogger(`Hours: Invalid time format for task "${task.content}": ${task.scheduled_time}`);
          }
        } else {
          debugLogger(`Hours: Malformed scheduled time for task "${task.content}": ${task.scheduled_time}`);
        }
      } else {
        debugLogger(`Hours: Task "${task.content}" has no scheduled time`);
      }
    });
    
    if (debug) console.log(`Hours panel: Added ${addedCount} tasks from database for today`);
    
    // If no database tasks found, add one demo task for testing
    if (addedCount === 0) {
      debugLogger('Hours: No database tasks with scheduled times found, adding demo task');
      
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

// Generate 24-hour grid with labels and lines
function generateHourGrid() {
  const hourGrid = document.getElementById('hour-grid');
  if (!hourGrid) return;
  
  hourGrid.innerHTML = '';
  
  // Create 48 half-hour slots (24 hours * 2)
  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 2);
    const isHalfHour = i % 2 === 1;
    const position = i * 30; // 30px per half hour
    
    // Create hour line
    const hourLine = document.createElement('div');
    hourLine.className = isHalfHour ? 'hour-line half-hour' : 'hour-line';
    hourLine.style.top = position + 'px';
    hourGrid.appendChild(hourLine);
    
    // Add hour label for full hours only
    if (!isHalfHour) {
      const hourLabel = document.createElement('div');
      hourLabel.className = hour >= 12 ? 'hour-label pm' : 'hour-label';
      hourLabel.style.top = position + 'px';
      
      let displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      hourLabel.textContent = displayHour;
      
      hourGrid.appendChild(hourLabel);
    }
  }
}

// Initialize current time line with auto-update
function initCurrentTimeLine() {
  updateCurrentTimeLine();
  
  // Update every 5 minutes as per requirements
  setInterval(updateCurrentTimeLine, 5 * 60 * 1000);
}

// Update current time line position
function updateCurrentTimeLine() {
  const currentTimeLine = document.getElementById('current-time-line');
  if (!currentTimeLine) return;
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const position = (totalMinutes / 60) * 60; // 60px per hour
  
  currentTimeLine.style.top = position + 'px';
  
  if (debug) console.log('Current time line updated:', `${hours}:${minutes.toString().padStart(2, '0')}`);
}

// Initialize draggable limit lines
function initLimitLines() {
  const stopLine = document.getElementById('stop-line');
  const sleepLine = document.getElementById('sleep-line');
  
  if (stopLine) {
    positionLimitLine(stopLine, hoursData.limitLines.stop.position);
    makeLimitLineDraggable(stopLine, 'stop');
  }
  
  if (sleepLine) {
    positionLimitLine(sleepLine, hoursData.limitLines.sleep.position);
    makeLimitLineDraggable(sleepLine, 'sleep');
  }
}

// Position limit line at specified time
function positionLimitLine(element, minutes) {
  const position = (minutes / 60) * 60; // 60px per hour
  element.style.top = position + 'px';
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
    
    // Update label
    const label = element.querySelector('.limit-label');
    if (label) {
      label.textContent = `${type.toUpperCase()} ${formatTimeDisplay(timeStr)}`;
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
  const stopRemaining = document.getElementById('stop-remaining');
  if (stopRemaining) {
    const stopMinutes = hoursData.limitLines.stop.position;
    const remainingToStop = stopMinutes - currentMinutes;
    stopRemaining.textContent = formatRemainingTime(remainingToStop);
  }
  
  // Update SLEEP remaining time
  const sleepRemaining = document.getElementById('sleep-remaining');
  if (sleepRemaining) {
    const sleepMinutes = hoursData.limitLines.sleep.position;
    const remainingToSleep = sleepMinutes - currentMinutes;
    sleepRemaining.textContent = formatRemainingTime(remainingToSleep);
  }
}

// Format remaining time (e.g., 570 minutes -> "9h 30m")
function formatRemainingTime(minutes) {
  if (minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
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
  const container = document.getElementById('task-blocks-container');
  if (!container) return;
  
  const taskBlock = document.createElement('div');
  taskBlock.className = 'task-block';
  taskBlock.dataset.taskId = task.id;
  
  const position = (task.startMinutes / 60) * 60; // 60px per hour
  const height = (task.durationMinutes / 60) * 60; // 60px per hour
  
  taskBlock.style.top = position + 'px';
  taskBlock.style.height = height + 'px';
  
  taskBlock.innerHTML = `
    <span class="task-title">${task.title}</span>
    <div class="task-block-controls">
      <button class="task-control-btn edit-btn" title="Edit task">
        <i class="fa-solid fa-pencil"></i>
      </button>
      <button class="task-control-btn delete-btn" title="Delete task">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
    <div class="resize-handle"></div>
  `;
  
  container.appendChild(taskBlock);
  
  // Setup task interactions
  setupTaskInteractions(taskBlock, task);
  
  return taskBlock;
}

// Setup interactions for a task block
function setupTaskInteractions(taskBlock, task) {
  const titleSpan = taskBlock.querySelector('.task-title');
  const editBtn = taskBlock.querySelector('.edit-btn');
  const deleteBtn = taskBlock.querySelector('.delete-btn');
  const resizeHandle = taskBlock.querySelector('.resize-handle');
  
  // Inline rename on double-click title
  titleSpan.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startInlineEdit(titleSpan, task);
  });
  
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
  
  document.addEventListener('mouseup', () => {
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
  
  document.addEventListener('mouseup', () => {
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
    }
    
    if (debug) console.log('resize: Hours task resize ended', task);
  });
}
