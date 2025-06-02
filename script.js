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
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (debug) console.log(`Task ${taskId} saved to database`);
      return true;
    } catch (error) {
      console.error('Error in saveTask:', error);
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

  tasks.forEach(task => {
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
    txt.textContent = task.content;
    row.appendChild(txt);

    if (!task.isSection) {
      const controlContainer = document.createElement('div');
      controlContainer.className = 'task-control-container';
      controlContainer.setAttribute('data-no-drag', 'true');

      if (task.revisitDate) {
        const date = document.createElement('span');
        date.className = 'task-date';
        date.textContent = formatRevisitDate(task.revisitDate);
        date.setAttribute('data-no-drag', 'true');
        controlContainer.appendChild(date);
      }

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
function createPriorityFlag(type, iconClass, isActive, tooltip) {
  const flag = document.createElement('button');
  flag.className = `priority-flag ${isActive ? 'active' : ''}`;
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
      td[type] = !td[type];
      taskItem.dataset.taskData = JSON.stringify(td);
      flag.classList.toggle('active', td[type]);
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
    // Handle ISO date format from database (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return `${month}/${day}`;
    }
    // Handle other formats
    const d = dateStr.includes('-')
      ? new Date(dateStr + 'T00:00:00Z')
      : new Date(dateStr);
    if (!isNaN(d)) return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
  } catch(e){}
  return dateStr;
}

/* ---------- Format for input[type=date] ----------- */
function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  let d;
  if (dateStr==='today')      d=today;
  else if (dateStr==='tomorrow'){ d=new Date(today); d.setDate(d.getDate()+1);}
  else if (dateStr==='next week'){ d=new Date(today); d.setDate(d.getDate()+7);}
  else d=new Date(dateStr);
  if (isNaN(d)) return '';
  const yy=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
  return `${yy}-${mm}-${dd}`;
}

/* ---------- Open Task Modal ----------- */
function openTaskModal(task, taskElement) {
  try {
    const modal = document.getElementById('task-view-modal');
    if (!modal) throw new Error('Modal not found');
    const titleInput = document.getElementById('task-title');
    const revisitInput = document.getElementById('revisit-date');
    const timeInput = document.getElementById('scheduled-time');
    const overviewInput = document.getElementById('task-overview');
    const detailsInput = document.getElementById('task-details');
    const estimateInput = document.getElementById('time-estimate');
    if (!titleInput||!revisitInput||!timeInput||!overviewInput||!detailsInput||!estimateInput){
      throw new Error('Modal fields missing');
    }

    titleInput.value = task.content||'';
    revisitInput.value = (['today','tomorrow','next week'].includes(task.revisitDate))
      ? formatDateForInput(task.revisitDate)
      : (task.revisitDate||'');
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

    document.querySelectorAll('.flag-btn').forEach(btn=>{
      const p=btn.dataset.priority;
      btn.classList.toggle('active', !!task[p]);
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
    task.content        = document.getElementById('task-title').value;
    task.revisitDate    = document.getElementById('revisit-date').value;
    task.scheduledTime  = document.getElementById('scheduled-time').value;
    task.overview       = document.getElementById('task-overview').value;
    task.details        = document.getElementById('task-details').value;
    task.timeEstimate   = parseFloat(document.getElementById('time-estimate').value)||0;

    document.querySelectorAll('.flag-btn').forEach(btn=>{
      const p=btn.dataset.priority;
      if (p) task[p]=btn.classList.contains('active');
    });

    taskElement.dataset.taskData = JSON.stringify(task);
    db.saveTask(task.id, task).catch(err => console.error('Save error:', err));     // 📌 persist

    const textEl = taskElement.querySelector('.task-text');
    if (textEl) textEl.textContent = task.content;
    const dateEl = taskElement.querySelector('.task-date');
    if (dateEl) dateEl.textContent = formatRevisitDate(task.revisitDate);
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

/* ---------- Sort by Priority ----------- */
function sortTasksByPriority() {
  if (debug) console.log('🔄 Starting priority sort');
  document.querySelectorAll('.section-header').forEach(sectionHeader=>{
    const container = sectionHeader.nextElementSibling;
    if (!container || !container.classList.contains('task-children')) {
      if (debug) console.log('Missing children for', sectionHeader.dataset.id);
      return;
    }
    const list = container.querySelector(':scope>.task-list');
    if (!list) return;
    const items = Array.from(list.children)
      .filter(li=>!li.classList.contains('section-header'));
    if (items.length<=1) return;

    const completed    = items.filter(i=>i.classList.contains('task-completed'));
    const notCompleted = items.filter(i=>!i.classList.contains('task-completed'));

    notCompleted.sort((a,b)=>{
      const score = el=>['fast','first','fire','fear','flow']
        .reduce((s,p,i)=>s + (el.querySelector(`.priority-flag[data-priority="${p}"]`)?.classList.contains('active') ? (50-10*i) : 0),0);
      return score(b)-score(a);
    });

    [...notCompleted, ...completed].forEach(li=>list.appendChild(li));
  });
  showToast('Tasks Sorted','By priority.');
  if (debug) console.log('✅ Priority sort complete');
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

  // insert under TRIAGE
  const sectionLi = document.querySelector('.section-header[data-id="section-triage"]');
  const childCont = sectionLi?.querySelector('.task-children');
  const ul = childCont?.querySelector(':scope>.task-list');
  if (!ul) {
    showToast('Error','Triage container missing');
    return;
  }

  // build the DOM for the new task (similar to buildTree leaf)
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = newTask.id;
  li.dataset.taskData = JSON.stringify(newTask);

  const row = document.createElement('div');
  row.className = 'task-content';

  const grip = document.createElement('span');
  grip.className='task-grip';
  grip.innerHTML='<i class="fa-solid fa-grip-lines"></i>';
  row.appendChild(grip);

  const checkbox = document.createElement('span');
  checkbox.className='task-checkbox';
  checkbox.setAttribute('data-no-drag','true');
  checkbox.addEventListener('click', e=>{
    e.stopPropagation();
    newTask.completed = !newTask.completed;
    checkbox.innerHTML = newTask.completed?'<i class="fa-solid fa-check"></i>':'';
    li.classList.toggle('task-completed', newTask.completed);
    db.saveTask(newTask.id, newTask).catch(err => console.error('Save error:', err));
  });
  row.appendChild(checkbox);

  const chevron = document.createElement('span');
  chevron.className='toggle-btn';
  chevron.textContent='▸';
  chevron.style.visibility='hidden';
  row.appendChild(chevron);

  const txt = document.createElement('span');
  txt.className='task-text';
  txt.textContent=newTask.content;
  row.appendChild(txt);

  const meta = document.createElement('div');
  meta.className='task-control-container';
  row.appendChild(meta);

  const controlBar=document.createElement('div');
  controlBar.className='task-control-bar';
  controlBar.setAttribute('data-no-drag','true');
  meta.appendChild(controlBar);

  const editBtn=document.createElement('button');
  editBtn.className='control-btn edit-btn';
  editBtn.innerHTML='<i class="fa-solid fa-pencil"></i>';
  editBtn.addEventListener('click', e=>{
    e.stopPropagation();
    openTaskModal(newTask, li);
  });
  controlBar.appendChild(editBtn);

  const deleteBtn=document.createElement('button');
  deleteBtn.className='control-btn delete-btn';
  deleteBtn.innerHTML='<i class="fa-solid fa-trash"></i>';
  deleteBtn.addEventListener('click', e=>{
    e.stopPropagation();
    deleteTask(newTask, li);
  });
  controlBar.appendChild(deleteBtn);

  const flagsWrap=document.createElement('div');
  flagsWrap.className='task-priority-flags';
  ['fire','fast','flow','fear','first'].forEach(p=>{
    const f=createPriorityFlag(p, p==='fire'?'fa-fire':p==='fast'?'fa-bolt':p==='flow'?'fa-water':p==='fear'?'fa-skull':'fa-flag',false);
    flagsWrap.appendChild(f);
  });
  row.appendChild(flagsWrap);

  li.appendChild(row);

  const childrenWrap=document.createElement('div');
  childrenWrap.className='task-children';
  childrenWrap.style.display='none';
  const childUl=document.createElement('ul');
  childUl.className='task-list';
  childrenWrap.appendChild(childUl);
  li.appendChild(childrenWrap);

  createSortable(childUl, chevron, childrenWrap);

  ul.appendChild(li);

  showToast('Task Added','Added to TRIAGE');
  input.value='';
  if (debug) console.log(`Added new task "${text}"`);
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
