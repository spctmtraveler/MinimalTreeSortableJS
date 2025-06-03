// -------------  DUN Task Management  ------------------
// 🔧 Fixes applied:
// 1. Clear old tree on load to avoid duplicates
// 2. Persist every priority‐flag toggle immediately
// 3. Persist edits from modal immediately
// 4. Persist new tasks under TRIAGE (not as siblings) via db.addTask()
// ---------------------------------------------------

// Debug mode - enable for console logs
const debug = true;

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
      const task = await response.json();
      console.log(`🔍 DB FETCH SUCCESS: Fresh data retrieved for ${taskId}:`, task);
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
        content: 'Mail check',
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
        content: 'Clean Kitchen',
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
      checkbox.addEventListener('click', e => {
        e.stopPropagation();
        task.completed = !task.completed;
        checkbox.innerHTML = task.completed ? '<i class="fa-solid fa-check"></i>' : '';
        li.classList.toggle('task-completed', task.completed);
        if (debug) console.log(`Task "${task.content}" marked ${task.completed}`);
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
    case 'fire':  icon='fa-fire';  title='Urgent'; break;
    case 'fast':  icon='fa-bolt';  title='Quick'; break;
    case 'flow':  icon='fa-water'; title='Flow'; break;
    case 'fear':  icon='fa-skull'; title='Fear'; break;
    case 'first': icon='fa-flag';  title='First'; break;
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
        taskDate = new Date(dateStr + 'T00:00:00');
      } else if (dateStr.includes('T')) {
        taskDate = new Date(dateStr);
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
      // Handle ISO date strings from database (YYYY-MM-DDTHH:MM:SS.SSSZ)
      if (dateStr.includes('T')) {
        d = new Date(dateStr);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        d = new Date(dateStr + 'T00:00:00');
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

    titleInput.value = task.content||'';
    
    // Handle date formatting for modal input - convert all dates to YYYY-MM-DD format
    let dateValue = '';
    if (task.revisitDate) {
      dateValue = formatDateForInput(task.revisitDate);
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
    timeInput.value = task.scheduledTime || '09:00';
    overviewInput.value = task.overview||'';
    detailsInput.value = task.details||'';
    estimateInput.value = task.timeEstimate||'';

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
    document.querySelector('.close-modal').onclick = () => modal.style.display='none';
    window.onclick = e => { if (e.target===modal) modal.style.display='none'; };

    if (debug) console.log(`Opened modal for "${task.content}"`);
  } catch(err){
    console.error('Error opening modal:', err);
    showToast('Error','Failed to open task details.');
  }
}

/* ---------- Save from Modal ----------- */
function saveTaskFromModal(task, taskElement) {
  try {
    console.log('🔵 MODAL SAVE: Starting save for task:', task.id);
    
    task.content        = document.getElementById('modal-task-name').value;
    task.revisitDate    = document.getElementById('modal-revisit-date').value;
    task.scheduledTime  = document.getElementById('modal-scheduled-time').value;
    task.overview       = document.getElementById('modal-overview').value;
    task.details        = document.getElementById('modal-details').value;
    task.timeEstimate   = parseFloat(document.getElementById('modal-time-estimate').value)||0;

    console.log('🔵 MODAL SAVE: Priority flags before update:');
    ['fire', 'fast', 'flow', 'fear', 'first'].forEach(p => {
      console.log(`  ${p}: ${task[p]}`);
    });

    document.querySelectorAll('.priority-flag-modal').forEach(btn=>{
      const p=btn.dataset.priority;
      if (p) {
        const newValue = btn.classList.contains('active');
        console.log(`🔵 MODAL SAVE: ${p} flag changed to ${newValue}`);
        task[p] = newValue;
      }
    });

    console.log('🔵 MODAL SAVE: Final task data being saved:', JSON.stringify(task, null, 2));

    taskElement.dataset.taskData = JSON.stringify(task);
    db.saveTask(task.id, task).catch(err => console.error('Save error:', err));     // 📌 persist

    const textEl = taskElement.querySelector('.task-text');
    if (textEl) textEl.textContent = task.content;
    
    // Update or create date element
    let dateEl = taskElement.querySelector('.task-date');
    const controlContainer = taskElement.querySelector('.task-control-container');
    
    if (task.revisitDate) {
      if (!dateEl && controlContainer) {
        // Create date element if it doesn't exist
        dateEl = document.createElement('span');
        dateEl.className = 'task-date';
        dateEl.setAttribute('data-no-drag', 'true');
        controlContainer.insertBefore(dateEl, controlContainer.firstChild);
      }
      if (dateEl) {
        dateEl.textContent = formatRevisitDate(task.revisitDate);
      }
    } else if (dateEl) {
      // Remove date element if no date
      dateEl.remove();
    }
    
    taskElement.querySelectorAll('.priority-flag').forEach(f=>{
      const p=f.dataset.priority;
      f.classList.toggle('active', !!task[p]);
    });

    document.getElementById('task-view-modal').style.display='none';
    showToast('Task Updated','Saved changes.');
    if (debug) console.log(`Saved modal edits for "${task.content}"`);
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
    const data = JSON.parse(JSON.stringify(task));

    parentList.removeChild(taskElement);
    db.deleteTask(task.id);  // persist deletion

    showToast('Task Deleted','Task removed.', 'Undo', ()=>{
      buildTree([data], parentList);
      showToast('Restored','Task restored.');
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
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(weekEnd.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  document.querySelectorAll('.task-item').forEach(taskItem => {
    if (taskItem.classList.contains('section-header')) {
      // Always show section headers
      taskItem.style.display = '';
      return;
    }
    
    let shouldShow = false;
    
    if (filterValue === 'all') {
      shouldShow = true;
    } else if (filterValue === 'triage') {
      // Show tasks in triage section - check parent_id or if task id contains triage
      const taskData = JSON.parse(taskItem.dataset.taskData || '{}');
      shouldShow = (taskData.parent_id === 'section-triage') || 
                   (taskData.id && taskData.id.includes('triage'));
    } else {
      // Date-based filters
      const taskData = JSON.parse(taskItem.dataset.taskData || '{}');
      const revisitDate = taskData.revisitDate;
      
      if (revisitDate) {
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
  
  console.log(`🔍 FILTER: Applied "${filterValue}" filter`);
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

/* ---------- UI Init ----------- */
function initUI() {
  document.getElementById('toggle-priority')?.addEventListener('click', ()=>{
    document.querySelectorAll('.task-priority-flags').forEach(el=>{
      el.style.display = el.style.display==='none'?'flex':'none';
    });
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
}

/* ---------- Add New Task ----------- */
async function addNewTask() {
  const input = document.getElementById('new-task-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) { showToast('Error','Enter a task.'); return; }

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
  } catch (error) {
    console.error('Error saving new task:', error);
    showToast('Error','Could not save new task to database.');
    return;
  }

  // Reload tasks from database to use the proper display logic
  try {
    const tasks = await db.loadTasks();
    if (tasks) {
      const taskTree = document.getElementById('task-tree');
      taskTree.innerHTML = '';
      buildTree(tasks, taskTree);
      showToast('Task Added','Added to TRIAGE');
      input.value = '';
      if (debug) console.log(`Added new task "${text}"`);
    } else {
      showToast('Error','Could not reload tasks after adding new task.');
    }
  } catch (error) {
    console.error('Error reloading tasks after adding new task:', error);
    showToast('Error','Could not reload tasks after adding new task.');
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
});
