// -------------  DUN Task Management  ------------------
// Updated: 2025‑05‑12 18:30
//  ✱ Redesigned UI according to mockup
//  ✱ Added priority flags (Fire, Fast, Flow, Fear, First)
//  ✱ Added task modal and actions
//  ✱ Maintained drag-and-drop functionality
// ---------------------------------------------------

// Debug mode - set to true to enable console logging
const debug = true;

// Database module using localStorage
const db = {
  // Save the entire task tree
  saveTasks: function(tasks) {
    try {
      localStorage.setItem('dun_tasks', JSON.stringify(tasks));
      if (debug) console.log('Tasks saved to localStorage');
      return true;
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
      return false;
    }
  },
  
  // Load the entire task tree
  loadTasks: function() {
    try {
      const tasks = localStorage.getItem('dun_tasks');
      if (!tasks) {
        if (debug) console.log('No tasks found in localStorage, using default tasks');
        return null;
      }
      
      const parsedTasks = JSON.parse(tasks);
      if (debug) console.log('Tasks loaded from localStorage');
      return parsedTasks;
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
      return null;
    }
  },
  
  // Save a single task
  saveTask: function(taskId, taskData) {
    try {
      // Get the current tasks
      const tasks = this.loadTasks() || sampleTasks;
      
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
        this.saveTasks(tasks);
        if (debug) console.log(`Task ${taskId} updated in localStorage`);
        return true;
      } else {
        console.error(`Task ${taskId} not found in task tree`);
        return false;
      }
    } catch (error) {
      console.error('Error saving task to localStorage:', error);
      return false;
    }
  },
  
  // Delete a task
  deleteTask: function(taskId) {
    try {
      // Get the current tasks
      const tasks = this.loadTasks() || sampleTasks;
      
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
        this.saveTasks(tasks);
        if (debug) console.log(`Task ${taskId} deleted from localStorage`);
        return true;
      } else {
        console.error(`Task ${taskId} not found in task tree`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting task from localStorage:', error);
      return false;
    }
  },
  
  // Add a new task
  addTask: function(parentId, taskData) {
    try {
      // Get the current tasks
      const tasks = this.loadTasks() || sampleTasks;
      
      // If parentId is null, add to root level
      if (!parentId) {
        tasks.push(taskData);
        this.saveTasks(tasks);
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
        this.saveTasks(tasks);
        if (debug) console.log(`Task added to parent ${parentId} in localStorage`);
        return true;
      } else {
        console.error(`Parent task ${parentId} not found in task tree`);
        return false;
      }
    } catch (error) {
      console.error('Error adding task to localStorage:', error);
      return false;
    }
  },
  
  // Clear all tasks (for testing)
  clearTasks: function() {
    try {
      localStorage.removeItem('dun_tasks');
      if (debug) console.log('All tasks cleared from localStorage');
      return true;
    } catch (error) {
      console.error('Error clearing tasks from localStorage:', error);
      return false;
    }
  }
};

// Task model properties
// id: unique identifier
// content: task title/text
// isSection: boolean indicating if this is a section header
// completed: boolean indicating completion status
// children: array of child tasks
// revisitDate: date for revisiting the task
// fire, fast, flow, fear, first: boolean priority flags
// timeEstimate: number of hours estimated for task
// overview: text describing task overview
// details: detailed task description
// scheduledTime: specific time for task

/* ---------- Sample Data with Sections ----------- */
const sampleTasks = [
    {
      id: 'section-triage',
      content: 'TRIAGE',
      isSection: true, // Special flag for section headers
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

  const root = document.getElementById('task-tree');
  buildTree(sampleTasks, root);

  /* ---------- Build Tree ----------- */
  function buildTree(tasks, parent) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    parent.appendChild(ul);
    
    // Only enable sorting for the root level if it's not the top-level container
    if (parent.id !== 'task-tree') {
      createSortable(ul);
    } else {
      // For the top-level container, we'll set up sorting with special rules
      ul.dataset.isRoot = 'true';
    }

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;
      
      // Store task data for easy access
      li.dataset.taskData = JSON.stringify(task);
      
      // Mark section headers to style differently
      if (task.isSection) {
        li.classList.add('section-header');
        // Prevent sections from being dragged
        li.setAttribute('data-no-drag', 'true');
      }
      
      // Add completed class if task is done
      if (task.completed) {
        li.classList.add('task-completed');
      }

      /* --- content row --- */
      const row = document.createElement('div');
      row.className = 'task-content';
      li.appendChild(row);

      /* grip icon for dragging (for non-section items) */
      if (!task.isSection) {
        const grip = document.createElement('span');
        grip.className = 'task-grip';
        grip.innerHTML = '<i class="fa-solid fa-grip-lines"></i>';
        row.appendChild(grip);
      }

      /* checkbox for completed state (except for section headers) */
      if (!task.isSection) {
        const checkbox = document.createElement('span');
        checkbox.className = 'task-checkbox';
        checkbox.setAttribute('data-no-drag', 'true');
        checkbox.innerHTML = task.completed ? '<i class="fa-solid fa-check"></i>' : '';
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          task.completed = !task.completed;
          checkbox.innerHTML = task.completed ? '<i class="fa-solid fa-check"></i>' : '';
          li.classList.toggle('task-completed', task.completed);
          if (debug) console.log(`Task "${task.content}" marked as ${task.completed ? 'completed' : 'incomplete'}`);
        });
        row.appendChild(checkbox);
      }

      /* chevron */
      const chevron = document.createElement('span');
      chevron.className = 'toggle-btn';
      chevron.textContent = '▸';
      // Always show chevron for sections, otherwise only if it has children
      chevron.style.display = 
        (task.isSection || task.children?.length) ? 'inline-block' : 'none';

      const toggleArea = document.createElement('div');
      toggleArea.className = 'toggle-area';
      toggleArea.setAttribute('data-no-drag', 'true');
      toggleArea.appendChild(chevron);
      row.appendChild(toggleArea);

      /* toggle action */
      toggleArea.addEventListener('click', e => {
        e.stopPropagation();
        const open = chevron.classList.toggle('expanded');
        chevron.textContent = open ? '▾' : '▸';
        childContainer.style.display = open ? 'block' : 'none';
        if (debug) console.log(`${open ? 'Expanded' : 'Collapsed'} task "${task.content}"`);
      });

      /* text */
      const txt = document.createElement('span');
      txt.className = 'task-text';
      txt.textContent = task.content;
      row.appendChild(txt);

      /* Add a container for date and controls (except for section headers) */
      if (!task.isSection) {
        const controlContainer = document.createElement('div');
        controlContainer.className = 'task-control-container';
        controlContainer.setAttribute('data-no-drag', 'true');
        
        /* Add task revisit date if present */
        if (task.revisitDate) {
          const date = document.createElement('span');
          date.className = 'task-date';
          date.textContent = formatRevisitDate(task.revisitDate);
          date.setAttribute('data-no-drag', 'true');
          controlContainer.appendChild(date);
        }
        
        /* Add control buttons */
        const controlBar = document.createElement('div');
        controlBar.className = 'task-control-bar';
        controlBar.setAttribute('data-no-drag', 'true');
        controlContainer.appendChild(controlBar);
        
        row.appendChild(controlContainer);
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'control-btn edit-btn';
        editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
        editBtn.title = 'Edit task';
        editBtn.setAttribute('data-no-drag', 'true');
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openTaskModal(task, li);
        });
        controlBar.appendChild(editBtn);
        
        // Play button
        const playBtn = document.createElement('button');
        playBtn.className = 'control-btn play-btn';
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        playBtn.title = 'Start task';
        playBtn.setAttribute('data-no-drag', 'true');
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showToast('Start Task', `Started: ${task.content}`, 'Stop', () => {
            showToast('Task Stopped', `Stopped: ${task.content}`);
          });
        });
        controlBar.appendChild(playBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'control-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.setAttribute('data-no-drag', 'true');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task, li);
        });
        controlBar.appendChild(deleteBtn);
        
        // Priority flags
        const priorityFlags = document.createElement('div');
        priorityFlags.className = 'task-priority-flags';
        priorityFlags.setAttribute('data-no-drag', 'true');
        
        // Fire flag
        const fireFlag = createPriorityFlag('fire', 'fa-fire', task.fire, 'High urgency task that needs immediate attention');
        priorityFlags.appendChild(fireFlag);
        
        // Fast flag
        const fastFlag = createPriorityFlag('fast', 'fa-rabbit-fast', task.fast, 'Quick task that can be completed rapidly');
        priorityFlags.appendChild(fastFlag);
        
        // Flow flag
        const flowFlag = createPriorityFlag('flow', 'fa-water', task.flow, 'Task that requires focus and flow state');
        priorityFlags.appendChild(flowFlag);
        
        // Fear flag
        const fearFlag = createPriorityFlag('fear', 'fa-skull', task.fear, 'Task that causes anxiety or resistance');
        priorityFlags.appendChild(fearFlag);
        
        // First flag
        const firstFlag = createPriorityFlag('first', 'fa-trophy', task.first, 'High priority task to be done first');
        priorityFlags.appendChild(firstFlag);
        
        row.appendChild(priorityFlags);
      }

      /* Task click opens the modal */
      if (!task.isSection) {
        txt.addEventListener('click', (e) => {
          e.stopPropagation();
          openTaskModal(task, li);
        });
      }

      /* child container with empty ul */
      const childContainer = document.createElement('div');
      childContainer.className = 'task-children';
      li.appendChild(childContainer);

      const childList = document.createElement('ul');
      childList.className = 'task-list';
      childContainer.appendChild(childList);
      
      // For section headers, create a special sortable list where items can't be dragged to root
      if (task.isSection) {
        createSectionSortable(childList, chevron, childContainer);
      } else {
        // Regular task sortable with default behavior
        createSortable(childList, chevron, childContainer);
      }

      /* show drop zone even when pointer over row of a leaf */
      row.addEventListener('dragover', () => {
        if (childList.children.length === 0) childList.classList.add('drop-target-active');
      });
      row.addEventListener('dragleave', () => {
        childList.classList.remove('drop-target-active');
      });

      /* recurse */
      if (task.children?.length) {
        buildTree(task.children, childList);
        chevron.classList.add('expanded');
        chevron.textContent = '▾';
      }

      ul.appendChild(li);
    });
    
    // Special handling for the root level container
    if (parent.id === 'task-tree') {
      createRootSortable(ul);
    }
  }
  
  /* ---------- Helper Functions ----------- */
  
  // Create a priority flag element
  function createPriorityFlag(type, iconClass, isActive, tooltip) {
    const flag = document.createElement('button');
    flag.className = `priority-flag ${isActive ? 'active' : ''}`;
    flag.setAttribute('data-priority', type);
    flag.setAttribute('data-no-drag', 'true');
    
    // Determine the correct icon and tooltip based on flag type
    let icon, title;
    
    switch(type) {
      case 'fire':
        icon = 'fa-fire';
        title = 'Urgent (Fire)';
        break;
      case 'fast':
        icon = 'fa-bolt';
        title = 'Quick win (Fast)';
        break;
      case 'flow':
        icon = 'fa-water';
        title = 'In the flow (Flow)';
        break;
      case 'fear':
        icon = 'fa-skull';
        title = 'Challenging (Fear)';
        break;
      case 'first':
        icon = 'fa-flag';
        title = 'Do first (First)';
        break;
      default:
        icon = iconClass || 'fa-circle';
        title = tooltip || type;
    }
    
    flag.setAttribute('title', title);
    flag.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    
    flag.addEventListener('click', (e) => {
      try {
        e.stopPropagation();
        const taskItem = flag.closest('.task-item');
        if (!taskItem) return;
        
        try {
          const taskData = JSON.parse(taskItem.dataset.taskData);
          taskData[type] = !taskData[type];
          taskItem.dataset.taskData = JSON.stringify(taskData);
          flag.classList.toggle('active');
          if (debug) console.log(`${type} flag for task "${taskData.content}" set to ${taskData[type]}`);
        } catch (parseError) {
          console.error('Error updating task data for priority flag:', parseError);
        }
      } catch (error) {
        console.error('Error in priority flag click handler:', error);
      }
    });
    
    return flag;
  }
  
  // Format revisit date for display
  function formatRevisitDate(dateStr) {
    if (!dateStr) return '';
    
    // Handle special cases
    if (dateStr === 'today') return 'today';
    if (dateStr === 'tomorrow') return 'tomorrow';
    if (dateStr === 'next week') return 'Next week';
    
    // Handle simple MM/DD format (4/22)
    if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) return dateStr;
    
    // Try to parse as a date
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    
    return dateStr;
  }
  
  // Open the task modal for editing
  function openTaskModal(task, taskElement) {
    try {
      if (!task || !taskElement) {
        console.error('Invalid task or task element');
        return;
      }
      
      const modal = document.getElementById('task-view-modal');
      if (!modal) {
        console.error('Task modal not found');
        return;
      }
      
      const titleInput = document.getElementById('task-title');
      const revisitDateInput = document.getElementById('revisit-date');
      const scheduledTimeInput = document.getElementById('scheduled-time');
      const overviewInput = document.getElementById('task-overview');
      const detailsInput = document.getElementById('task-details');
      const timeEstimateInput = document.getElementById('time-estimate');
      
      if (!titleInput || !revisitDateInput || !scheduledTimeInput || 
          !overviewInput || !detailsInput || !timeEstimateInput) {
        console.error('One or more modal form fields not found');
        return;
      }
      
      // Set the current task data
      titleInput.value = task.content || '';
      
      // Handle special date formats
      if (task.revisitDate === 'today' || task.revisitDate === 'tomorrow' || task.revisitDate === 'next week') {
        revisitDateInput.value = formatDateForInput(task.revisitDate);
      } else {
        revisitDateInput.value = task.revisitDate || '';
      }
      
      // Set time input to enforce 15-minute intervals
      scheduledTimeInput.setAttribute('step', '900'); // 900 seconds = 15 minutes
      
      // Add event listener to enforce 15-minute intervals on change
      if (!scheduledTimeInput.hasAttribute('data-interval-listener')) {
        scheduledTimeInput.setAttribute('data-interval-listener', 'true');
        scheduledTimeInput.addEventListener('change', function() {
          const timeValue = this.value;
          
          if (timeValue) {
            const [hours, minutes] = timeValue.split(':');
            const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
            const roundedMinutes = Math.round(totalMinutes / 15) * 15;
            
            const newHours = Math.floor(roundedMinutes / 60);
            const newMinutes = roundedMinutes % 60;
            
            // Format with leading zeros
            const formattedHours = String(newHours).padStart(2, '0');
            const formattedMinutes = String(newMinutes).padStart(2, '0');
            
            // Update the input value
            this.value = `${formattedHours}:${formattedMinutes}`;
          }
        });
      }
      
      // Set scheduled time to nearest 15-minute interval
      if (task.scheduledTime) {
        scheduledTimeInput.value = task.scheduledTime;
        // Trigger change event to round to nearest 15 minutes
        scheduledTimeInput.dispatchEvent(new Event('change'));
      } else {
        // Default to 9:00 if no time is set
        scheduledTimeInput.value = '09:00';
      }
      overviewInput.value = task.overview || '';
      detailsInput.value = task.details || '';
      timeEstimateInput.value = task.timeEstimate || '';
      
      // Set priority flags
      document.querySelectorAll('.flag-btn').forEach(btn => {
        const priority = btn.getAttribute('data-priority');
        btn.classList.toggle('active', task[priority] === true);
      });
      
      // Show the modal
      modal.style.display = 'block';
      titleInput.focus();
      
      // Save button handler
      const saveBtn = document.getElementById('save-task-btn');
      if (saveBtn) {
        saveBtn.onclick = () => {
          saveTaskFromModal(task, taskElement);
        };
      }
      
      // Close modal handler
      const closeBtn = document.querySelector('.close-modal');
      if (closeBtn) {
        closeBtn.onclick = () => {
          modal.style.display = 'none';
        };
      }
      
      // Click outside to close
      window.onclick = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      };
      
      if (debug) console.log(`Opened modal for task "${task.content}"`);
    } catch (error) {
      console.error('Error opening task modal:', error);
      showToast('Error', 'Failed to open task details.');
    }
  }
  
  // Save task data from modal
  function saveTaskFromModal(task, taskElement) {
    try {
      if (!task || !taskElement) {
        console.error('Invalid task or task element for saving');
        return;
      }
      
      const modal = document.getElementById('task-view-modal');
      const titleInput = document.getElementById('task-title');
      const revisitDateInput = document.getElementById('revisit-date');
      const scheduledTimeInput = document.getElementById('scheduled-time');
      const overviewInput = document.getElementById('task-overview');
      const detailsInput = document.getElementById('task-details');
      const timeEstimateInput = document.getElementById('time-estimate');
      
      if (!modal || !titleInput || !revisitDateInput || !scheduledTimeInput || 
          !overviewInput || !detailsInput || !timeEstimateInput) {
        console.error('One or more modal form fields not found for saving');
        return;
      }
      
      // Update task data
      task.content = titleInput.value;
      task.revisitDate = revisitDateInput.value;
      task.scheduledTime = scheduledTimeInput.value;
      task.overview = overviewInput.value;
      task.details = detailsInput.value;
      task.timeEstimate = parseFloat(timeEstimateInput.value) || 0;
      
      // Update priority flags
      document.querySelectorAll('.flag-btn').forEach(btn => {
        const priority = btn.getAttribute('data-priority');
        if (priority) {
          task[priority] = btn.classList.contains('active');
        }
      });
      
      try {
        // Update the task element
        taskElement.dataset.taskData = JSON.stringify(task);
        
        // Update text content
        const textElement = taskElement.querySelector('.task-text');
        if (textElement) {
          textElement.textContent = task.content;
        }
        
        // Update date display if present
        const dateElement = taskElement.querySelector('.task-date');
        if (dateElement) {
          dateElement.textContent = formatRevisitDate(task.revisitDate);
        }
        
        // Update priority flags in the task list
        const flags = taskElement.querySelectorAll('.priority-flag');
        flags.forEach(flag => {
          const priority = flag.getAttribute('data-priority');
          if (priority) {
            flag.classList.toggle('active', task[priority] === true);
          }
        });
      } catch (updateError) {
        console.error('Error updating task element:', updateError);
      }
      
      // Close the modal
      modal.style.display = 'none';
      
      // Show confirmation toast
      showToast('Task Updated', 'The task has been successfully updated.');
      
      if (debug) console.log(`Saved changes to task "${task.content}"`);
    } catch (error) {
      console.error('Error saving task from modal:', error);
      showToast('Error', 'Failed to save task details.');
    }
  }
  
  // Delete a task
  function deleteTask(task, taskElement) {
    try {
      if (!task || !taskElement) {
        if (debug) console.error('Invalid task or element for deletion');
        return;
      }
      
      // Find parent task list
      const parentList = taskElement.parentNode;
      if (!parentList) {
        if (debug) console.error('Parent list not found for deletion');
        return;
      }
      
      // Store task data for undo
      let taskData;
      try {
        taskData = JSON.parse(JSON.stringify(task));
      } catch (e) {
        console.error('Error cloning task data:', e);
        taskData = { content: task.content || 'Unknown task' };
      }
      
      // Remove task from DOM
      parentList.removeChild(taskElement);
      
      // Show confirmation toast with undo option
      showToast('Task Deleted', 'The task has been deleted.', 'Undo', () => {
        try {
          // Recreate the task in the same position
          const newTaskElement = document.createElement('li');
          parentList.appendChild(newTaskElement);
          
          // Rebuild the task with original data
          buildTree([taskData], parentList);
          
          // Show confirmation toast
          showToast('Task Restored', 'The task has been restored.');
          
          if (debug) console.log(`Restored deleted task "${taskData.content}"`);
        } catch (error) {
          console.error('Error restoring task:', error);
          showToast('Error', 'Failed to restore the task.');
        }
      });
      
      if (debug) console.log(`Deleted task "${task.content}"`);
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Error', 'An error occurred while deleting the task.');
    }
  }
  
  // Show a toast notification
  function showToast(title, message, actionText, actionCallback) {
    try {
      const container = document.getElementById('toast-container');
      if (!container) {
        console.error('Toast container not found');
        return;
      }
      
      // Create toast element
      const toast = document.createElement('div');
      toast.className = 'toast';
      
      // Create toast content
      const content = document.createElement('div');
      content.className = 'toast-content';
      
      const toastTitle = document.createElement('div');
      toastTitle.className = 'toast-title';
      toastTitle.textContent = title || 'Notification';
      content.appendChild(toastTitle);
      
      const toastMessage = document.createElement('div');
      toastMessage.className = 'toast-message';
      toastMessage.textContent = message || '';
      content.appendChild(toastMessage);
      
      toast.appendChild(content);
      
      // Create action button if provided
      if (actionText && actionCallback) {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'toast-action';
        actionBtn.textContent = actionText;
        actionBtn.addEventListener('click', () => {
          try {
            actionCallback();
          } catch (e) {
            console.error('Error in toast action callback:', e);
          }
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        });
        toast.appendChild(actionBtn);
      }
      
      // Add to container
      container.appendChild(toast);
      
      // Remove after delay
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 5000);
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }
  
  // Format date for input element
  function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    
    const today = new Date();
    let date;
    
    if (dateStr === 'today') {
      date = today;
    } else if (dateStr === 'tomorrow') {
      date = new Date(today);
      date.setDate(date.getDate() + 1);
    } else if (dateStr === 'next week') {
      date = new Date(today);
      date.setDate(date.getDate() + 7);
    } else {
      try {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return '';
        }
      } catch (e) {
        console.error('Error parsing date:', e);
        return '';
      }
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Sort tasks within each section according to priority
  function sortTasksByPriority() {
    if (debug) console.log("Starting priority sorting");
    
    // Define the sections (Triage, A, B, C)
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    sectionHeaders.forEach(sectionHeader => {
      const sectionId = sectionHeader.getAttribute('data-id');
      if (debug) console.log(`Sorting section: ${sectionId}`);
      
      // Find the children container more reliably
      let childrenContainer = null;
      
      // Try to find the closest task-children element within the same parent
      const parentElement = sectionHeader.parentElement;
      if (parentElement) {
        // First look for siblings
        const siblings = Array.from(parentElement.children);
        for (let i = 0; i < siblings.length; i++) {
          if (siblings[i] === sectionHeader) {
            // Look for the next sibling that has the task-children class
            for (let j = i + 1; j < siblings.length; j++) {
              if (siblings[j].classList.contains('task-children')) {
                childrenContainer = siblings[j];
                break;
              }
            }
            break;
          }
        }
        
        // If not found as a sibling, look for any task-children in the parent
        if (!childrenContainer) {
          childrenContainer = parentElement.querySelector('.task-children');
        }
      }
      
      if (!childrenContainer) {
        if (debug) console.log(`No children container found for section: ${sectionId}`);
        return;
      }
      
      const taskList = childrenContainer.querySelector('.task-list');
      if (!taskList) {
        if (debug) console.log(`No task list found for section: ${sectionId}`);
        return;
      }
      
      // Get all non-section-header tasks
      const tasks = Array.from(taskList.querySelectorAll(':scope > li.task-item:not(.section-header)'));
      if (tasks.length <= 1) {
        if (debug) console.log(`Not enough tasks to sort in section: ${sectionId}`);
        return; // Nothing to sort
      }
      
      if (debug) console.log(`Found ${tasks.length} tasks to sort in section: ${sectionId}`);
      
      // Split into completed and non-completed tasks
      const completedTasks = tasks.filter(task => task.classList.contains('task-completed'));
      const nonCompletedTasks = tasks.filter(task => !task.classList.contains('task-completed'));
      
      // Sort non-completed tasks by priority (Fast -> First -> Fire -> Fear -> Flow)
      nonCompletedTasks.sort((a, b) => {
        // Helper function to check if an element has a specific priority flag active
        const hasPriorityFlag = (element, flagName) => {
          try {
            // First try looking for the flag-circle elements
            const flagCircles = element.querySelectorAll(`.flag-circle[data-priority="${flagName}"]`);
            for (const circle of flagCircles) {
              if (circle.classList.contains('active')) {
                return true;
              }
            }
            
            // If not found, check within the task-priority-flags container
            const flagsContainer = element.querySelector('.task-priority-flags');
            if (flagsContainer) {
              const flag = flagsContainer.querySelector(`[data-priority="${flagName}"]`);
              if (flag && flag.classList.contains('active')) {
                return true;
              }
            }
            
            // If still not found, try to get the task data
            try {
              const taskData = JSON.parse(element.dataset.taskData || '{}');
              return taskData[flagName] === true;
            } catch (e) {
              if (debug) console.error('Error parsing task data:', e);
            }
          } catch (error) {
            console.error(`Error checking ${flagName} flag:`, error);
          }
          
          return false;
        };
        
        // Get priority flags for each task
        const aFlags = {
          fast: hasPriorityFlag(a, 'fast'),
          first: hasPriorityFlag(a, 'first'),
          fire: hasPriorityFlag(a, 'fire'),
          fear: hasPriorityFlag(a, 'fear'),
          flow: hasPriorityFlag(a, 'flow')
        };
        
        const bFlags = {
          fast: hasPriorityFlag(b, 'fast'),
          first: hasPriorityFlag(b, 'first'),
          fire: hasPriorityFlag(b, 'fire'),
          fear: hasPriorityFlag(b, 'fear'),
          flow: hasPriorityFlag(b, 'flow')
        };
        
        if (debug) {
          console.log('Task A flags:', a.querySelector('.task-text')?.textContent, aFlags);
          console.log('Task B flags:', b.querySelector('.task-text')?.textContent, bFlags);
        }
        
        // Priority order: Fast -> First -> Fire -> Fear -> Flow
        // If a has priority that b doesn't, a comes first
        if (aFlags.fast && !bFlags.fast) return -1;
        if (!aFlags.fast && bFlags.fast) return 1;
        
        if (aFlags.first && !bFlags.first) return -1;
        if (!aFlags.first && bFlags.first) return 1;
        
        if (aFlags.fire && !bFlags.fire) return -1;
        if (!aFlags.fire && bFlags.fire) return 1;
        
        if (aFlags.fear && !bFlags.fear) return -1;
        if (!aFlags.fear && bFlags.fear) return 1;
        
        if (aFlags.flow && !bFlags.flow) return -1;
        if (!aFlags.flow && bFlags.flow) return 1;
        
        // If equal priority, maintain original order
        return 0;
      });
      
      // Combine the sorted lists: non-completed tasks followed by completed tasks
      const sortedTasks = [...nonCompletedTasks, ...completedTasks];
      
      // Reorder the DOM
      if (debug) console.log(`Reordering ${sortedTasks.length} tasks in section: ${sectionId}`);
      sortedTasks.forEach(task => {
        taskList.appendChild(task);
      });
    });
    
    if (debug) console.log("Priority sorting complete");
  }
  
  // Initialize UI event handlers
  function initUI() {
    // Toggle priority flags visibility
    const togglePriorityBtn = document.getElementById('toggle-priority');
    if (togglePriorityBtn) {
      togglePriorityBtn.addEventListener('click', () => {
        document.querySelectorAll('.task-priority-flags').forEach(el => {
          el.style.display = el.style.display === 'none' ? 'flex' : 'none';
        });
        
        const headersElement = document.querySelector('.priority-column-headers');
        if (headersElement) {
          headersElement.style.display = headersElement.style.display === 'none' ? 'flex' : 'none';
        }
        
        const priorityHeader = document.querySelector('.priority-header');
        if (priorityHeader) {
          priorityHeader.style.display = priorityHeader.style.display === 'none' ? 'block' : 'none';
        }
        
        togglePriorityBtn.classList.toggle('active');
        
        if (debug) console.log('Toggled priority flags visibility');
      });
    }
    
    // Priority sorting button
    const prioritySortBtn = document.getElementById('priority-sort-btn');
    if (prioritySortBtn) {
      prioritySortBtn.addEventListener('click', () => {
        sortTasksByPriority();
        prioritySortBtn.classList.add('active');
        
        // Remove active class after animation
        setTimeout(() => {
          prioritySortBtn.classList.remove('active');
        }, 1000);
        
        showToast('Tasks Sorted', 'Tasks have been sorted by priority order.');
      });
    }
    
    // Make priority flags active in the modal
    document.querySelectorAll('.flag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
      });
    });
    
    // Add new task
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskInput = document.getElementById('new-task-input');
    
    if (addTaskBtn && newTaskInput) {
      addTaskBtn.addEventListener('click', () => {
        addNewTask();
      });
      
      newTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addNewTask();
        }
      });
    }
    
    // Set active state for task view button
    const taskViewBtn = document.querySelector('.view-toggle-btn:nth-child(2)');
    if (taskViewBtn) {
      taskViewBtn.classList.add('active');
    }
  }
  
  // Add a new task to the Triage section
  function addNewTask() {
    const newTaskInput = document.getElementById('new-task-input');
    if (!newTaskInput) {
      if (debug) console.error('New task input field not found');
      return;
    }
    
    const taskText = newTaskInput.value.trim();
    
    if (!taskText) {
      showToast('Error', 'Please enter a task name.');
      return;
    }
    
    // Create new task object
    const newTask = {
      id: 'task-' + Date.now(),
      content: taskText,
      completed: false,
      children: [],
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
    
    try {
      // Find the Triage section
      const triageSection = document.querySelector('.section-header[data-id="section-triage"]');
      if (!triageSection) {
        showToast('Error', 'Triage section not found.');
        if (debug) console.error('Triage section not found');
        return;
      }
      
      // Find the children container for the Triage section by looking for the task-children class
      // This is more reliable than using nextElementSibling
      let triageChildrenContainer = null;
      
      // First check if the section has any direct children with the task-children class
      const taskChildren = document.querySelectorAll('.task-children');
      for (const container of taskChildren) {
        // Check if this container belongs to the triageSection by walking up the DOM
        let parent = container.parentElement;
        while (parent) {
          if (parent === triageSection.parentElement) {
            triageChildrenContainer = container;
            break;
          }
          parent = parent.parentElement;
        }
        if (triageChildrenContainer) break;
      }
      
      // If not found by traversal, try another approach
      if (!triageChildrenContainer) {
        // Find all children elements within the triageSection's parent
        const triageParent = triageSection.parentElement;
        if (triageParent) {
          // Look for a task-children element near the section header
          triageChildrenContainer = triageParent.querySelector('.task-children');
        }
      }
      
      if (!triageChildrenContainer) {
        showToast('Error', 'Triage children container not found.');
        if (debug) {
          console.error('Triage children container not found');
          console.log('Triage section:', triageSection);
        }
        return;
      }
      
      // Get the first-level task list inside the container
      // Using :scope > .task-list to ensure we get the direct child
      const triageChildList = triageChildrenContainer.querySelector(':scope > .task-list');
      if (!triageChildList) {
        showToast('Error', 'Triage children task list not found.');
        if (debug) console.error('Triage children task list not found');
        return;
      }
      
      // Log info about what we found
      if (debug) {
        console.log('Triage section:', triageSection);
        console.log('Triage children container:', triageChildrenContainer);
        console.log('Triage child list:', triageChildList);
      }
      
      // Instead of using buildTree which can create inconsistent structures,
      // we'll manually create the new task element with the same structure as existing tasks
      
      // Create the list item
      const newTaskElement = document.createElement('li');
      newTaskElement.className = 'task-item';
      newTaskElement.dataset.id = newTask.id;
      
      // Store task data
      newTaskElement.dataset.taskData = JSON.stringify(newTask);
      
      // Create content row
      const row = document.createElement('div');
      row.className = 'task-content';
      
      // Create grip icon
      const grip = document.createElement('span');
      grip.className = 'task-grip';
      grip.innerHTML = '<i class="fa-solid fa-grip-lines"></i>';
      row.appendChild(grip);
      
      // Create checkbox
      const checkbox = document.createElement('span');
      checkbox.className = 'task-checkbox';
      checkbox.setAttribute('data-no-drag', 'true');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        newTask.completed = !newTask.completed;
        checkbox.innerHTML = newTask.completed ? '<i class="fa-solid fa-check"></i>' : '';
        newTaskElement.classList.toggle('task-completed', newTask.completed);
      });
      row.appendChild(checkbox);
      
      // Create expand/collapse chevron
      const chevron = document.createElement('span');
      chevron.className = 'toggle-btn';
      chevron.textContent = '▸';
      chevron.style.visibility = 'hidden'; // Hidden initially since there are no children
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        const childrenContainer = newTaskElement.querySelector('.task-children');
        if (childrenContainer) {
          const isExpanded = childrenContainer.style.display !== 'none';
          childrenContainer.style.display = isExpanded ? 'none' : 'block';
          chevron.textContent = isExpanded ? '▸' : '▾';
        }
      });
      row.appendChild(chevron);
      
      // Create task text
      const taskText = document.createElement('span');
      taskText.className = 'task-text';
      taskText.textContent = newTask.content;
      taskText.setAttribute('data-no-drag', 'true');
      row.appendChild(taskText);
      
      // Create metadata container
      const metaData = document.createElement('div');
      metaData.className = 'task-metadata';
      
      // Create date display (empty for now)
      const dateDisplay = document.createElement('span');
      dateDisplay.className = 'task-date';
      metaData.appendChild(dateDisplay);
      
      // Create control bar
      const controlBar = document.createElement('div');
      controlBar.className = 'task-control-bar';
      
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'control-btn edit-btn';
      editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
      editBtn.setAttribute('data-no-drag', 'true');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskModal(newTask, newTaskElement);
      });
      controlBar.appendChild(editBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'control-btn delete-btn';
      deleteBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
      deleteBtn.setAttribute('data-no-drag', 'true');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(newTask, newTaskElement);
      });
      controlBar.appendChild(deleteBtn);
      
      metaData.appendChild(controlBar);
      row.appendChild(metaData);
      
      // Create priority flags
      const flagsContainer = document.createElement('div');
      flagsContainer.className = 'task-priority-flags';
      
      // Add all 5 priority flags
      ['fire', 'fast', 'flow', 'fear', 'first'].forEach(priority => {
        const flagCircle = document.createElement('div');
        flagCircle.className = 'flag-circle';
        flagCircle.dataset.priority = priority;
        
        // Add appropriate icon based on priority
        let iconClass = '';
        switch(priority) {
          case 'fire': iconClass = 'fa-fire'; break;
          case 'fast': iconClass = 'fa-bolt'; break;
          case 'flow': iconClass = 'fa-water'; break;
          case 'fear': iconClass = 'fa-skull'; break;
          case 'first': iconClass = 'fa-trophy'; break;
        }
        
        flagCircle.innerHTML = `<i class="fas ${iconClass}"></i>`;
        
        // Add click handler to toggle the flag
        flagCircle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isActive = flagCircle.classList.toggle('active');
          const taskData = JSON.parse(newTaskElement.dataset.taskData);
          taskData[priority] = isActive;
          newTaskElement.dataset.taskData = JSON.stringify(taskData);
        });
        
        flagsContainer.appendChild(flagCircle);
      });
      
      row.appendChild(flagsContainer);
      newTaskElement.appendChild(row);
      
      // Create hidden children container (even though it's empty)
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'task-children';
      childrenContainer.style.display = 'none';
      
      // Create child task list (empty)
      const childList = document.createElement('ul');
      childList.className = 'task-list';
      childrenContainer.appendChild(childList);
      newTaskElement.appendChild(childrenContainer);
      
      // Make the child list sortable
      createSortable(childList, chevron, childrenContainer);
      
      // Finally, append to the triage list
      triageChildList.appendChild(newTaskElement);
      
      // Show confirmation toast
      showToast('Task Added', 'New task added to Triage section.');
      
      // Clear input
      newTaskInput.value = '';
      
      if (debug) console.log(`Added new task "${taskText}" to Triage`);
    } catch (error) {
      console.error('Error adding new task:', error);
      showToast('Error', 'An error occurred while adding the new task.');
    }
  }

  /* ---------- Sortable Factory ----------- */
  function createSortable(list, chevron = null, container = null) {
    if (list.dataset.sortable) return; // already done

    new Sortable(list, {
      group: { name: 'nested', pull: true, put: true },
      animation: 150,
      fallbackOnBody: true,
      forceFallback: true,
      swapThreshold: 0.65,
      emptyInsertThreshold: 10,
      ghostClass: 'task-ghost',
      chosenClass: 'task-chosen',
      dragClass: 'task-drag',
      filter: '[data-no-drag]',

      /* show dotted box ONLY when hovering an empty list */
      onMove(evt) {
        // First, hide ALL drop targets
        document.querySelectorAll('.task-list:empty')
                .forEach(el => {
                  el.classList.remove('drop-target-active');
                  el.classList.remove('drop-target-hint');
                });
        
        // Only show the active drop target we're directly hovering over
        if (evt.to.children.length === 0) {
          evt.to.classList.add('drop-target-active');
        }
        
        // This was the problematic part - don't show ALL empty lists
        // Only show the list the user is directly interacting with
        
        return true;
      },

      onEnd(evt) {
        // Clean up all drop target indicators
        document.querySelectorAll('.drop-target-active, .drop-target-hint')
                .forEach(el => {
                  el.classList.remove('drop-target-active');
                  el.classList.remove('drop-target-hint');
                });
        
        // Clean up drag item classes
        evt.item.classList.remove('drag-compact');
        evt.clone && evt.clone.classList.remove('drag-compact');
        
        // Remove dragging state from body
        document.body.classList.remove('is-dragging');
        
        // Log the result of the drag
        const parentItem = evt.to.closest('.task-item');
        if (parentItem) {
          console.log(`Dropped into: ${parentItem.querySelector('.task-text').textContent.trim()}`);
        } else {
          console.log('Dropped at root level');
        }
      },

      onStart(evt) {
        evt.item.classList.add('drag-compact');
        evt.clone && evt.clone.classList.add('drag-compact');
      },

      onAdd() {
        if (!chevron) return;
        container.style.display = 'block';
        chevron.style.display = 'inline-block';
        chevron.classList.add('expanded');
        chevron.textContent = '▾';
      },

      onRemove(evt) {
        const parentLi = evt.from.closest('.task-item');
        if (parentLi && evt.from.children.length === 0) {
          const tgl = parentLi.querySelector('.toggle-btn');
          if (tgl) tgl.style.display = 'none';
        }
      }
    });

    list.dataset.sortable = '1';
  }
  
  /* ---------- Section Sortable Factory ----------- */
  function createSectionSortable(list, chevron = null, container = null) {
    if (list.dataset.sortable) return; // already done
    
    new Sortable(list, {
      group: { 
        name: 'section', 
        pull: true, // Allow dragging items out of this list
        put: function(to) {
          // Make sure items can only be placed inside a section
          return to.el.closest('.task-item').classList.contains('section-header');
        } 
      },
      animation: 150,
      fallbackOnBody: true,
      forceFallback: true,
      swapThreshold: 0.65,
      emptyInsertThreshold: 10,
      ghostClass: 'task-ghost',
      chosenClass: 'task-chosen',
      dragClass: 'task-drag',
      filter: '[data-no-drag]',
      
      onMove(evt) {
        // First, hide ALL drop targets
        document.querySelectorAll('.task-list:empty')
                .forEach(el => {
                  el.classList.remove('drop-target-active');
                  el.classList.remove('drop-target-hint');
                });
        
        // Only show the active drop target we're directly hovering over
        if (evt.to.children.length === 0) {
          evt.to.classList.add('drop-target-active');
        }
        
        return true;
      },
      
      onEnd(evt) {
        // Clean up all drop target indicators
        document.querySelectorAll('.drop-target-active, .drop-target-hint')
                .forEach(el => {
                  el.classList.remove('drop-target-active');
                  el.classList.remove('drop-target-hint');
                });
        
        // Clean up drag item classes
        evt.item.classList.remove('drag-compact');
        evt.clone && evt.clone.classList.remove('drag-compact');
        
        // Remove dragging state from body
        document.body.classList.remove('is-dragging');
      },
      
      onStart(evt) {
        evt.item.classList.add('drag-compact');
        evt.clone && evt.clone.classList.add('drag-compact');
      },
      
      onAdd() {
        if (!chevron) return;
        container.style.display = 'block';
        chevron.style.display = 'inline-block';
        chevron.classList.add('expanded');
        chevron.textContent = '▾';
      },
      
      onRemove(evt) {
        const parentLi = evt.from.closest('.task-item');
        if (parentLi && evt.from.children.length === 0) {
          // Don't hide chevrons for section headers
          if (!parentLi.classList.contains('section-header')) {
            const tgl = parentLi.querySelector('.toggle-btn');
            if (tgl) tgl.style.display = 'none';
          }
        }
      }
    });
    
    list.dataset.sortable = '1';
    list.dataset.sectionList = '1';
  }
  
  /* ---------- Root Sortable Factory ----------- */
  function createRootSortable(list) {
    if (list.dataset.sortable) return; // already done
    
    new Sortable(list, {
      group: { 
        name: 'root',
        pull: false, // Don't allow dragging items out of the root list 
        put: false   // Don't allow dropping items directly to the root list
      },
      sort: false,   // Don't allow sorting of root items (section headers)
      animation: 150,
      filter: '[data-no-drag]', // Prevent sections from being dragged
      onMove: function() {
        return false; // Disable all movement in the root list
      }
    });
    
    list.dataset.sortable = '1';
    list.dataset.rootList = '1';
  }

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize event handlers for UI components
  initUI();
  
  // Try to load tasks from localStorage
  const loadedTasks = db.loadTasks();
  
  // Build the task tree with either loaded tasks or sample tasks
  const root = document.getElementById('task-tree');
  if (loadedTasks) {
    if (debug) console.log('Using tasks from localStorage');
    buildTree(loadedTasks, root);
  } else {
    if (debug) console.log('Using sample tasks');
    buildTree(sampleTasks, root);
    
    // Save sample tasks to localStorage for future use
    db.saveTasks(sampleTasks);
  }
  
  // Create root sortable
  const rootList = root.querySelector(':scope > .task-list');
  if (rootList) {
    createRootSortable(rootList);
  }
  
  if (debug) console.log('Application initialized');
});
