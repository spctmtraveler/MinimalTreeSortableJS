// -------------  DUN Task Management Application  ------------------
// A sophisticated vanilla JavaScript task management application
// Based on the Task Tree drag-and-drop implementation
// Updated: 2025‑05‑12 20:45
//  ✱ Full implementation of DUN Task Management Application requirements
//  ✱ Four sections: Triage, A, B, C with special styling
//  ✱ Added priority flags functionality with Fire, Fast, Flow, Fear, First
//  ✱ Task View modal with details, dates, and priority settings
//  ✱ Added toast notifications with undo functionality
// ---------------------------------------------------

// Debug mode - set to true to enable console logging
const DEBUG = true;

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Sample Data with Sections & Extended Task Model ----------- */
  const sampleTasks = [
    {
      id: 'section-triage',
      content: 'Triage',
      isSection: true, // Special flag for section headers
      children: [
        {
          id: 'task-triage-1',
          content: 'Mail check',
          completed: true,
          revisitDate: '2025-05-14',
          scheduledTime: '09:00',
          overview: 'Check mail for important documents',
          details: 'Remember to check for the tax documents and pay bills.',
          timeEstimate: '5 min',
          flags: {
            fire: false,
            fast: true,
            flow: false,
            fear: false,
            first: true
          },
          children: []
        },
        {
          id: 'task-triage-2',
          content: 'Clean Kitchen',
          completed: true,
          revisitDate: '2025-05-13',
          scheduledTime: '18:30',
          overview: 'Clean kitchen after dinner',
          details: 'Wash dishes, wipe counters, sweep floor',
          timeEstimate: '20 min',
          flags: {
            fire: false,
            fast: false,
            flow: false,
            fear: false,
            first: false
          },
          children: []
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
          revisitDate: '2025-05-15',
          scheduledTime: '14:00',
          overview: 'Prepare cake for dinner party',
          details: 'Follow recipe from cookbook page 42',
          timeEstimate: '2 hours',
          flags: {
            fire: true,
            fast: false,
            flow: true,
            fear: false,
            first: false
          },
          children: [
            {
              id: 'task-a-1-1',
              content: 'Buy Ingredients',
              completed: false,
              revisitDate: '2025-05-14',
              scheduledTime: '10:00',
              overview: 'Get everything needed for the cake',
              details: 'Check pantry first to see what we already have',
              timeEstimate: '45 min',
              flags: {
                fire: true,
                fast: false,
                flow: false,
                fear: false,
                first: true
              },
              children: [
                {
                  id: 'task-a-1-1-1',
                  content: 'Make a list',
                  completed: false,
                  revisitDate: '2025-05-13',
                  scheduledTime: '19:00',
                  overview: 'List everything needed',
                  details: 'Check recipe for quantities',
                  timeEstimate: '10 min',
                  flags: {
                    fire: false,
                    fast: true,
                    flow: false,
                    fear: false,
                    first: true
                  },
                  children: []
                },
                {
                  id: 'task-a-1-1-2',
                  content: 'Go shopping',
                  completed: false,
                  revisitDate: '2025-05-14',
                  scheduledTime: '10:00',
                  overview: 'Visit grocery store',
                  details: 'Try to get everything in one trip',
                  timeEstimate: '30 min',
                  flags: {
                    fire: false,
                    fast: false,
                    flow: false,
                    fear: false,
                    first: false
                  },
                  children: []
                }
              ]
            },
            {
              id: 'task-a-1-2',
              content: 'Mix Ingredients',
              completed: false,
              revisitDate: '2025-05-15',
              scheduledTime: '14:00',
              overview: 'Prepare the batter',
              details: 'Follow instructions carefully for best results',
              timeEstimate: '30 min',
              flags: {
                fire: false,
                fast: false,
                flow: true,
                fear: false,
                first: false
              },
              children: []
            },
            {
              id: 'task-a-1-3',
              content: 'Bake',
              completed: false,
              revisitDate: '2025-05-15',
              scheduledTime: '14:30',
              overview: 'Bake the cake',
              details: 'Preheat oven to 350°F and bake for 45 minutes',
              timeEstimate: '1 hour',
              flags: {
                fire: false,
                fast: false,
                flow: false,
                fear: true,
                first: false
              },
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
          revisitDate: '2025-05-19',
          scheduledTime: '09:00',
          overview: 'Check mail again next week',
          details: 'Look for any packages or important letters',
          timeEstimate: '5 min',
          flags: {
            fire: false,
            fast: true,
            flow: false,
            fear: false,
            first: true
          },
          children: []
        },
        {
          id: 'task-b-2',
          content: 'Shower',
          completed: true,
          revisitDate: null,
          scheduledTime: '07:00',
          overview: 'Morning shower routine',
          details: 'Quick shower to start the day',
          timeEstimate: '10 min',
          flags: {
            fire: false,
            fast: true,
            flow: false,
            fear: false,
            first: false
          },
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
          revisitDate: '2025-06-12',
          scheduledTime: null,
          overview: 'Car maintenance',
          details: 'Change oil in car or take to mechanic',
          timeEstimate: '1 hour',
          flags: {
            fire: false,
            fast: false,
            flow: false,
            fear: true,
            first: false
          },
          children: []
        },
        {
          id: 'task-c-2',
          content: 't17',
          completed: false,
          revisitDate: '2025-05-17',
          scheduledTime: null,
          overview: 'Review project documentation',
          details: 'Go through specifications and update task list',
          timeEstimate: '45 min',
          flags: {
            fire: false,
            fast: false,
            flow: true,
            fear: false,
            first: false
          },
          children: []
        },
        {
          id: 'task-c-3',
          content: 'Test task from SQL',
          completed: false,
          revisitDate: '2025-05-20',
          scheduledTime: '13:00',
          overview: 'Check database query',
          details: 'Verify that the new SQL query works correctly',
          timeEstimate: '30 min',
          flags: {
            fire: false,
            fast: false,
            flow: false,
            fear: false,
            first: true
          },
          children: []
        }
      ]
    }
  ];
  
  // Store tasks in localStorage for persistence (optional)
  // Try to load existing tasks from localStorage, if not available use sampleTasks
  let tasks = (() => {
    try {
      const savedTasks = localStorage.getItem('dunTasks');
      return savedTasks ? JSON.parse(savedTasks) : sampleTasks;
    } catch (e) {
      if (DEBUG) console.error('Error loading tasks from localStorage:', e);
      return sampleTasks;
    }
  })();
  
  // Save tasks to localStorage
  const saveTasks = () => {
    try {
      localStorage.setItem('dunTasks', JSON.stringify(tasks));
      if (DEBUG) console.log('Tasks saved to localStorage');
    } catch (e) {
      if (DEBUG) console.error('Error saving tasks to localStorage:', e);
    }
  };

  /* ---------- Helper Functions ----------- */
  
  // Generate a unique ID for new tasks
  const generateId = () => {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  };
  
  // Format a date for display (e.g., "Today", "Tomorrow", "May 15")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  // Create a toast notification
  const createToast = (message, type = 'info', duration = 3000, action = null) => {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    const toastMessage = document.createElement('div');
    toastMessage.className = 'toast-message';
    toastMessage.textContent = message;
    
    toastContent.appendChild(toastMessage);
    toast.appendChild(toastContent);
    
    if (action) {
      const actionBtn = document.createElement('span');
      actionBtn.className = 'toast-action';
      actionBtn.textContent = action.text;
      actionBtn.addEventListener('click', () => {
        action.callback();
        toast.style.animation = 'slide-out var(--transition-fast) forwards';
        setTimeout(() => toast.remove(), 200);
      });
      toast.appendChild(actionBtn);
    }
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slide-out var(--transition-fast) forwards';
        setTimeout(() => toast.remove(), 200);
      }, duration);
    }
    
    return toast;
  };
  
  // Find a task by ID in the nested structure
  const findTaskById = (taskId, taskList = tasks) => {
    for (const task of taskList) {
      if (task.id === taskId) {
        return { task, parent: taskList };
      }
      
      if (task.children && task.children.length > 0) {
        const found = findTaskById(taskId, task.children);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  };
  
  // Create a new task
  const createTask = (content, section = 'triage') => {
    if (!content.trim()) return null;
    
    const newTask = {
      id: generateId(),
      content: content,
      completed: false,
      revisitDate: null,
      scheduledTime: null,
      overview: '',
      details: '',
      timeEstimate: '',
      flags: {
        fire: false,
        fast: false,
        flow: false,
        fear: false,
        first: false
      },
      children: []
    };
    
    // Find the section to add to
    let sectionToAddTo = null;
    for (const task of tasks) {
      if (task.isSection && task.id === `section-${section.toLowerCase()}`) {
        sectionToAddTo = task;
        break;
      }
    }
    
    if (sectionToAddTo) {
      sectionToAddTo.children.push(newTask);
      saveTasks();
      if (DEBUG) console.log('Created new task:', newTask);
      return newTask;
    }
    
    return null;
  };
  
  // Delete a task
  const deleteTask = (taskId) => {
    const found = findTaskById(taskId);
    if (!found) return null;
    
    const { task, parent } = found;
    const index = parent.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      const deleted = parent.splice(index, 1)[0];
      saveTasks();
      
      if (DEBUG) console.log('Deleted task:', deleted);
      return deleted;
    }
    
    return null;
  };
  
  // Update a task
  const updateTask = (taskId, updates) => {
    const found = findTaskById(taskId);
    if (!found) return false;
    
    const { task } = found;
    
    // Update task properties
    Object.assign(task, updates);
    
    saveTasks();
    if (DEBUG) console.log('Updated task:', task);
    return true;
  };

  // Initialize the tree with tasks from our data model
  const root = document.getElementById('task-tree');
  buildTree(tasks, root);

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

      /* checkbox for completed state (except for section headers) */
      if (!task.isSection) {
        const checkbox = document.createElement('span');
        checkbox.className = 'task-checkbox';
        checkbox.setAttribute('data-no-drag', 'true');
        checkbox.innerHTML = task.completed ? '✓' : '';
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          task.completed = !task.completed;
          checkbox.innerHTML = task.completed ? '✓' : '';
          li.classList.toggle('task-completed', task.completed);
          saveTasks();
        });
        row.appendChild(checkbox);
      }

      /* chevron */
      const chevron = document.createElement('span');
      chevron.className = 'toggle-btn';
      
      // Use SVG triangle instead of text character
      const isExpanded = task.isSection ? true : false; // Sections start expanded
      chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="${isExpanded ? 'M7 10l5 5 5-5z' : 'M10 17l5-5-5-5v10z'}"/>
      </svg>`;
      
      // Always show chevron for sections, otherwise only if it has children
      chevron.style.display = 
        (task.isSection || task.children?.length) ? 'inline-block' : 'none';
      
      if (isExpanded) {
        chevron.classList.add('expanded');
      }

      const toggleArea = document.createElement('div');
      toggleArea.className = 'toggle-area';
      toggleArea.setAttribute('data-no-drag', 'true');
      toggleArea.appendChild(chevron);
      row.appendChild(toggleArea);

      /* toggle action */
      toggleArea.addEventListener('click', e => {
        e.stopPropagation();
        const open = chevron.classList.toggle('expanded');
        
        // Update SVG path based on expanded state
        chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="${open ? 'M7 10l5 5 5-5z' : 'M10 17l5-5-5-5v10z'}"/>
        </svg>`;
        
        childContainer.style.display = open ? 'block' : 'none';
      });

      /* Drag handle (dots) for non-section items */
      if (!task.isSection) {
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.setAttribute('data-drag-handle', 'true');
        dragHandle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="6" cy="6" r="2"/>
          <circle cx="6" cy="12" r="2"/>
          <circle cx="6" cy="18" r="2"/>
          <circle cx="18" cy="6" r="2"/>
          <circle cx="18" cy="12" r="2"/>
          <circle cx="18" cy="18" r="2"/>
        </svg>`;
        row.appendChild(dragHandle);
      }
      
      /* text */
      const txt = document.createElement('span');
      txt.className = 'task-text';
      txt.textContent = task.content;
      
      // Make task text clickable to open task view (for non-section items)
      if (!task.isSection) {
        txt.addEventListener('click', () => {
          openTaskView(task.id);
        });
      }
      
      row.appendChild(txt);
      
      /* Priority flags (for non-section items) */
      if (!task.isSection && task.flags) {
        const flagsContainer = document.createElement('div');
        flagsContainer.className = 'priority-flags-column';
        
        // Create each flag
        const flagTypes = ['fire', 'fast', 'flow', 'fear', 'first'];
        
        flagTypes.forEach(flagType => {
          const flag = document.createElement('span');
          flag.className = `priority-flag ${task.flags[flagType] ? 'active' : ''}`;
          flag.title = getPriorityFlagTooltip(flagType);
          
          flag.addEventListener('click', (e) => {
            e.stopPropagation();
            task.flags[flagType] = !task.flags[flagType];
            flag.classList.toggle('active', task.flags[flagType]);
            saveTasks();
          });
          
          flagsContainer.appendChild(flag);
        });
        
        row.appendChild(flagsContainer);
      }
      
      /* Revisit date (for non-section items) */
      if (!task.isSection && task.revisitDate) {
        const dateLabel = document.createElement('span');
        dateLabel.className = 'task-date';
        dateLabel.textContent = formatDate(task.revisitDate);
        
        // Make date label clickable to open date picker
        dateLabel.addEventListener('click', (e) => {
          e.stopPropagation();
          // Will implement date picker later
          openTaskView(task.id);
        });
        
        row.appendChild(dateLabel);
      }
      
      /* Task controls - Edit, Play, Delete (for non-section items) */
      if (!task.isSection) {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'task-controls';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>`;
        editBtn.title = 'Edit Task';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openTaskView(task.id);
        });
        
        // Play/Start button
        const playBtn = document.createElement('button');
        playBtn.className = 'btn-play';
        playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>`;
        playBtn.title = 'Start Task';
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openTaskView(task.id);
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;
        deleteBtn.title = 'Delete Task';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Delete with undo functionality
          const deletedTask = deleteTask(task.id);
          
          if (deletedTask) {
            // Re-render the tree
            clearAndRebuildTree();
            
            // Show toast with undo option
            createToast(
              `"${deletedTask.content}" deleted`,
              'info',
              5000,
              {
                text: 'UNDO',
                callback: () => {
                  // Find the section to add back to
                  const found = findTaskById(li.parentNode.closest('.task-item')?.dataset.id);
                  
                  if (found && found.task) {
                    found.task.children.push(deletedTask);
                  } else {
                    // If parent not found, add to Triage
                    const triageSection = tasks.find(t => t.id === 'section-triage');
                    if (triageSection) triageSection.children.push(deletedTask);
                  }
                  
                  saveTasks();
                  clearAndRebuildTree();
                  
                  createToast(`"${deletedTask.content}" restored`, 'success', 3000);
                }
              }
            );
          }
        });
        
        controlsContainer.appendChild(editBtn);
        controlsContainer.appendChild(playBtn);
        controlsContainer.appendChild(deleteBtn);
        
        row.appendChild(controlsContainer);
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
  
  // Clear and rebuild the entire tree
  function clearAndRebuildTree() {
    const root = document.getElementById('task-tree');
    root.innerHTML = '';
    buildTree(tasks, root);
  }
  
  // Get tooltip text for priority flags
  function getPriorityFlagTooltip(flagType) {
    const tooltips = {
      fire: 'Is this task urgent and needs immediate attention?',
      fast: 'Can this task be completed in under three minutes?',
      flow: 'Am I at risk of overindulging in this task instead of maintaining balance?',
      fear: 'Is this task something I should avoid due to potential negative outcomes?',
      first: 'Does this task offer an 80% result with minimal effort?'
    };
    
    return tooltips[flagType] || '';
  }

  /* ---------- Task View Modal ----------- */
  // Variables to keep track of current task being edited
  let currentTaskId = null;
  
  // Open the task view modal for a given task
  function openTaskView(taskId) {
    const found = findTaskById(taskId);
    if (!found) {
      createToast('Task not found', 'error', 3000);
      return;
    }
    
    const { task } = found;
    currentTaskId = taskId;
    
    // Get the modal elements
    const modal = document.getElementById('task-view');
    const titleInput = document.getElementById('task-title');
    const revisitDateInput = document.getElementById('revisit-date');
    const scheduledTimeInput = document.getElementById('scheduled-time');
    const overviewTextarea = document.getElementById('task-overview');
    const detailsTextarea = document.getElementById('task-details');
    const timeEstimateInput = document.getElementById('time-estimate');
    const completedCheckbox = document.getElementById('task-completed');
    
    // Set the values
    titleInput.value = task.content || '';
    revisitDateInput.value = task.revisitDate || '';
    scheduledTimeInput.value = task.scheduledTime || '';
    overviewTextarea.value = task.overview || '';
    detailsTextarea.value = task.details || '';
    timeEstimateInput.value = task.timeEstimate || '';
    completedCheckbox.checked = task.completed || false;
    
    // Set priority flag checkboxes
    Object.keys(task.flags || {}).forEach(flagType => {
      const checkbox = document.getElementById(`flag-${flagType}`);
      if (checkbox) {
        checkbox.checked = task.flags[flagType] || false;
      }
    });
    
    // Show the modal
    modal.classList.remove('hidden');
    modal.classList.add('visible');
    document.body.classList.add('modal-open');
    
    // Focus on the title input
    setTimeout(() => titleInput.focus(), 300);
    
    if (DEBUG) console.log('Opened task view for:', task);
  }
  
  // Close the task view modal
  function closeTaskView(save = true) {
    if (save && currentTaskId) {
      saveTaskFromModal();
    }
    
    const modal = document.getElementById('task-view');
    
    // Hide the modal
    modal.classList.remove('visible');
    document.body.classList.remove('modal-open');
    
    // Reset current task ID
    currentTaskId = null;
    
    // After animation completes, add the hidden class
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
    
    if (DEBUG) console.log('Closed task view');
  }
  
  // Save the task from the modal
  function saveTaskFromModal() {
    if (!currentTaskId) return;
    
    // Get the input values
    const titleInput = document.getElementById('task-title');
    const revisitDateInput = document.getElementById('revisit-date');
    const scheduledTimeInput = document.getElementById('scheduled-time');
    const overviewTextarea = document.getElementById('task-overview');
    const detailsTextarea = document.getElementById('task-details');
    const timeEstimateInput = document.getElementById('time-estimate');
    const completedCheckbox = document.getElementById('task-completed');
    
    // Get the flag values
    const flags = {
      fire: document.getElementById('flag-fire').checked,
      fast: document.getElementById('flag-fast').checked,
      flow: document.getElementById('flag-flow').checked,
      fear: document.getElementById('flag-fear').checked,
      first: document.getElementById('flag-first').checked
    };
    
    // Create the update object
    const updates = {
      content: titleInput.value,
      revisitDate: revisitDateInput.value || null,
      scheduledTime: scheduledTimeInput.value || null,
      overview: overviewTextarea.value,
      details: detailsTextarea.value,
      timeEstimate: timeEstimateInput.value,
      completed: completedCheckbox.checked,
      flags
    };
    
    // Update the task
    const success = updateTask(currentTaskId, updates);
    
    if (success) {
      // Re-render the tree
      clearAndRebuildTree();
      
      if (DEBUG) console.log('Saved task from modal:', updates);
    } else {
      createToast('Error saving task', 'error', 3000);
    }
  }
  
  /* ---------- Setup Event Listeners ----------- */
  function setupEventListeners() {
    // Task View Modal close button
    const closeButton = document.querySelector('.close-task-view');
    if (closeButton) {
      closeButton.addEventListener('click', () => closeTaskView(true));
    }
    
    // Delete task button in modal
    const deleteTaskButton = document.getElementById('delete-task');
    if (deleteTaskButton) {
      deleteTaskButton.addEventListener('click', () => {
        if (!currentTaskId) return;
        
        const found = findTaskById(currentTaskId);
        if (!found) return;
        
        const { task } = found;
        const taskContent = task.content;
        
        // Delete the task
        const deletedTask = deleteTask(currentTaskId);
        
        if (deletedTask) {
          // Close the modal
          closeTaskView(false);
          
          // Re-render the tree
          clearAndRebuildTree();
          
          // Show toast with undo option
          createToast(
            `"${taskContent}" deleted`,
            'info',
            5000,
            {
              text: 'UNDO',
              callback: () => {
                // Find the section to add back to (add to Triage by default)
                const triageSection = tasks.find(t => t.id === 'section-triage');
                if (triageSection) triageSection.children.push(deletedTask);
                
                saveTasks();
                clearAndRebuildTree();
                
                createToast(`"${taskContent}" restored`, 'success', 3000);
              }
            }
          );
        }
      });
    }
    
    // Start task button in modal
    const startTaskButton = document.getElementById('start-task');
    if (startTaskButton) {
      startTaskButton.addEventListener('click', () => {
        // For the MVP, this simply closes the modal
        closeTaskView(true);
        createToast('Task started', 'success', 3000);
      });
    }
    
    // Save on input field changes (auto-save)
    const autoSaveElements = [
      'task-title', 'revisit-date', 'scheduled-time', 
      'task-overview', 'task-details', 'time-estimate', 
      'task-completed', 'flag-fire', 'flag-fast', 
      'flag-flow', 'flag-fear', 'flag-first'
    ];
    
    autoSaveElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('blur', () => saveTaskFromModal());
        
        // For checkboxes, also save on change
        if (element.type === 'checkbox') {
          element.addEventListener('change', () => saveTaskFromModal());
        }
      }
    });
    
    // Add task input and button
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    
    if (newTaskInput && addTaskBtn) {
      // Add task on button click
      addTaskBtn.addEventListener('click', () => {
        const content = newTaskInput.value.trim();
        if (!content) return;
        
        const newTask = createTask(content, 'triage');
        
        if (newTask) {
          // Clear the input
          newTaskInput.value = '';
          
          // Re-render the tree
          clearAndRebuildTree();
          
          // Show toast
          createToast(`"${content}" added to Triage`, 'success', 3000);
        }
      });
      
      // Add task on Enter key
      newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addTaskBtn.click();
        }
      });
    }
    
    // Toggle priority flags visibility
    const toggleFlagsBtn = document.getElementById('toggle-flags-btn');
    if (toggleFlagsBtn) {
      toggleFlagsBtn.addEventListener('click', () => {
        document.body.classList.toggle('flags-hidden');
        
        // Store preference in localStorage
        localStorage.setItem('flagsHidden', document.body.classList.contains('flags-hidden'));
        
        // Show toast
        const message = document.body.classList.contains('flags-hidden') 
          ? 'Priority flags hidden' 
          : 'Priority flags visible';
          
        createToast(message, 'info', 2000);
      });
      
      // Apply saved preference
      const flagsHidden = localStorage.getItem('flagsHidden') === 'true';
      if (flagsHidden) {
        document.body.classList.add('flags-hidden');
      }
    }
  }
  
  // Set up event listeners after DOM is ready
  setupEventListeners();

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
});
