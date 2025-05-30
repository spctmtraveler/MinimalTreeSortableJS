// -------------  DUN Task Management  ------------------
// Updated: 2025‑05‑12 18:30
//  ✱ Redesigned UI according to mockup
//  ✱ Added priority flags (Fire, Fast, Flow, Fear, First)
//  ✱ Added task modal and actions
//  ✱ Maintained drag-and-drop functionality
// ---------------------------------------------------

// Debug mode - set to true to enable console logging
const debug = true;

// Database module is loaded from db.js and available as window.db

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
        checkbox.addEventListener('click', async (e) => {
          e.stopPropagation();
          task.completed = !task.completed;
          checkbox.innerHTML = task.completed ? '<i class="fa-solid fa-check"></i>' : '';
          li.classList.toggle('task-completed', task.completed);
          
          // Update task data in DOM
          li.dataset.taskData = JSON.stringify(task);
          
          // Save updated completion status to database
          try {
            await db.saveTask(task.id, task);
            if (debug) console.log(`Task "${task.content}" marked as ${task.completed ? 'completed' : 'incomplete'} and saved to database`);
          } catch (error) {
            console.error('Error saving task completion status to database:', error);
          }
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
    console.log(`Creating priority flag: ${type}, isActive=${isActive}`);
    
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
    
    flag.addEventListener('click', async (e) => {
      try {
        e.stopPropagation();
        const taskItem = flag.closest('.task-item');
        if (!taskItem) {
          console.error('No parent task item found for flag');
          return;
        }
        
        const taskId = taskItem.dataset.id;
        console.log(`🚩 FLAG CLICK: ${type} flag for task ID ${taskId}`);
        
        if (!taskItem.dataset.taskData) {
          console.error('No task data found in element', taskItem);
          return;
        }
        
        // Get the current task data
        let taskData;
        try {
          taskData = JSON.parse(taskItem.dataset.taskData);
        } catch (parseError) {
          console.error('Error parsing task data:', parseError);
          console.log('Raw data that failed to parse:', taskItem.dataset.taskData);
          return;
        }
        
        if (!taskData.id) {
          console.error('Task data missing ID:', taskData);
          return;
        }
        
        // Toggle the flag value
        const oldValue = taskData[type] === true;
        const newValue = !oldValue;
        console.log(`Setting ${type}=${newValue} (was ${oldValue}) for "${taskData.content}"`);
        
        // Update the flag data explicitly with a boolean
        taskData[type] = newValue;
        
        // Update visual state immediately
        flag.classList.toggle('active', newValue);
        
        // Save the updated task data back to the DOM element
        taskItem.dataset.taskData = JSON.stringify(taskData);
        
        // Create a clean copy of task data for database save
        // This ensures we don't have circular references or unexpected properties
        const cleanTaskData = {
          id: taskData.id,
          content: taskData.content,
          completed: taskData.completed === true,
          children: taskData.children || [],
          revisitDate: taskData.revisitDate || '',
          fire: taskData.fire === true,
          fast: taskData.fast === true, 
          flow: taskData.flow === true,
          fear: taskData.fear === true,
          first: taskData.first === true,
          timeEstimate: taskData.timeEstimate || 0,
          overview: taskData.overview || '',
          details: taskData.details || '',
          scheduledTime: taskData.scheduledTime || '',
          parent: taskData.parent || null
        };
        
        // Specific flag was updated, ensure it's set correctly
        cleanTaskData[type] = newValue;
        
        console.log(`Sending to database:`, JSON.stringify(cleanTaskData));
        
        // Save updated flag status to database
        try {
          const saveResult = await db.saveTask(taskData.id, cleanTaskData);
          if (saveResult) {
            console.log(`✅ DATABASE UPDATED: ${type}=${newValue} for "${taskData.content}"`);
            
            // Dispatch event to update all instances of this flag
            document.dispatchEvent(new CustomEvent('task-flag-updated', {
              detail: { taskId: taskData.id, flagType: type, isActive: newValue }
            }));
          } else {
            console.error(`❌ FAILED to save ${type}=${newValue} to database`);
          }
        } catch (dbError) {
          console.error('Error saving flag change to database:', dbError);
        }
      } catch (error) {
        console.error('Error in flag click handler:', error);
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
    
    // Try to parse as a date - fixing timezone issues
    try {
      // Force midnight UTC to avoid timezone issues
      if (dateStr.includes('-')) {
        // For ISO format dates (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Create date and fix the day to match the user's expected date
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(dateObj.getTime())) {
          return `${dateObj.getUTCMonth() + 1}/${dateObj.getUTCDate()}`;
        }
      } else {
        // For other date formats
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          // Use UTC methods to avoid timezone issues
          return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
        }
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
      
      console.log(`Opening modal for task: ${task.id} - ${task.content}`);
      
      const modal = document.getElementById('task-view-modal');
      if (!modal) {
        console.error('Task modal not found');
        return;
      }
      
      // Store the task ID in the modal for reference
      modal.dataset.taskId = task.id;
      
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
  async function saveTaskFromModal(task, taskElement) {
    try {
      console.log(`💾 SAVING TASK FROM MODAL: ${task?.id} - ${task?.content}`);
      
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
      
      // Create a clean copy of the task to avoid reference issues
      const updatedTask = {
        // Preserve existing fields
        id: task.id,
        parent: task.parent,
        children: task.children || [],
        isSection: task.isSection || false,
        completed: task.completed || false,
        
        // Update with form values
        content: titleInput.value,
        revisitDate: revisitDateInput.value,
        scheduledTime: scheduledTimeInput.value,
        overview: overviewInput.value,
        details: detailsInput.value,
        timeEstimate: parseFloat(timeEstimateInput.value) || 0,
        
        // Initialize flags with default values
        fire: false,
        fast: false,
        flow: false,
        fear: false,
        first: false
      };
      
      // Get flag states from modal buttons
      const flagBtns = document.querySelectorAll('.flag-btn');
      console.log(`Found ${flagBtns.length} flag buttons in modal`);
      
      flagBtns.forEach(btn => {
        const priority = btn.getAttribute('data-priority');
        if (priority && priority in updatedTask) {
          const isActive = btn.classList.contains('active');
          updatedTask[priority] = isActive;
          console.log(`Modal flag state: ${priority}=${isActive}`);
        }
      });
      
      console.log('Saving task with flags:', 
        `fire=${updatedTask.fire}`,
        `fast=${updatedTask.fast}`,
        `flow=${updatedTask.flow}`,
        `fear=${updatedTask.fear}`,
        `first=${updatedTask.first}`
      );
      
      try {
        // Update the task element with the new data
        taskElement.dataset.taskData = JSON.stringify(updatedTask);
        
        // Save to database with explicit boolean flag values
        const savedResult = await db.saveTask(updatedTask.id, updatedTask);
        console.log(`Database save result: ${savedResult ? 'Success' : 'Failed'}`);
        
        // Update text content in the UI
        const textElement = taskElement.querySelector('.task-text');
        if (textElement) {
          textElement.textContent = updatedTask.content;
        }
        
        // Update date display if present
        const dateElement = taskElement.querySelector('.task-date');
        if (dateElement) {
          const formattedDate = formatRevisitDate(updatedTask.revisitDate);
          dateElement.textContent = formattedDate || '';
          console.log(`Updated date display: ${formattedDate}`);
        }
        
        // Update revisit date if present (it's sometimes named differently)
        const revisitDateElement = taskElement.querySelector('.revisit-date');
        if (revisitDateElement) {
          const formattedDate = formatRevisitDate(updatedTask.revisitDate);
          revisitDateElement.textContent = formattedDate || '';
          console.log(`Updated revisit date display: ${formattedDate}`);
        }
        
        // Update priority flags in the task list item
        const flags = taskElement.querySelectorAll('.priority-flag');
        console.log(`Updating ${flags.length} flag elements in task`);
        
        flags.forEach(flag => {
          const priority = flag.getAttribute('data-priority');
          if (priority && priority in updatedTask) {
            const wasActive = flag.classList.contains('active');
            const shouldBeActive = updatedTask[priority] === true;
            
            if (wasActive !== shouldBeActive) {
              flag.classList.toggle('active', shouldBeActive);
              console.log(`Updated flag UI: ${priority}=${shouldBeActive} (was ${wasActive})`);
            }
          }
        });
        
        // Broadcast flag updates to update any other instances of this task
        ['fire', 'fast', 'flow', 'fear', 'first'].forEach(flagType => {
          document.dispatchEvent(new CustomEvent('task-flag-updated', {
            detail: { 
              taskId: updatedTask.id, 
              flagType: flagType, 
              isActive: updatedTask[flagType] === true
            }
          }));
        });
        
        console.log(`✅ SAVED: Task "${updatedTask.content}" updated successfully`);
      } catch (updateError) {
        console.error('Error updating task:', updateError);
      }
      
      // Close the modal
      modal.style.display = 'none';
      
      // Show confirmation toast
      showToast('Task Updated', 'The task has been successfully updated.');
    } catch (error) {
      console.error('Error saving task from modal:', error);
      showToast('Error', 'Failed to save task details.');
    }
  }
  
  // Delete a task
  async function deleteTask(task, taskElement) {
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
      
      // Delete from database
      try {
        await db.deleteTask(task.id);
        if (debug) console.log('Task deleted from database:', task.id);
      } catch (dbError) {
        console.error('Error deleting task from database:', dbError);
        // Continue with UI removal even if database deletion fails
      }
      
      // Show confirmation toast with undo option
      showToast('Task Deleted', 'The task has been deleted.', 'Undo', async () => {
        try {
          // Recreate the task in the same position
          const newTaskElement = document.createElement('li');
          parentList.appendChild(newTaskElement);
          
          // Rebuild the task with original data
          buildTree([taskData], parentList);
          
          // Add back to database
          try {
            await db.saveTask(taskData.id, taskData);
            if (debug) console.log('Task restored in database:', taskData.id);
          } catch (dbError) {
            console.error('Error restoring task to database:', dbError);
          }
          
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
  
  // Helper function to parse a revisit date string into a Date object
  function parseRevisitDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle special cases
    if (dateStr === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
    
    if (dateStr === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
    
    // Parse ISO format YYYY-MM-DD
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date;
    }
    
    // Parse MM/DD format
    if (dateStr.includes('/')) {
      const [month, day] = dateStr.split('/').map(Number);
      const date = new Date();
      date.setMonth(month - 1);
      date.setDate(day);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    
    // Default date parsing
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  // Function to apply filters based on revisit dates
  function applyFilter(filterValue) {
    if (debug) console.log(`Applying filter: ${filterValue}`);
    
    // Helper to check if two dates are the same day
    const isSameDay = (date1, date2) => {
      if (!date1 || !date2) return false;
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };
    
    // Always show Triage section tasks regardless of filter
    const triageShown = document.querySelectorAll('#section-triage .task-item');
    
    // Helper to get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Helper to get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get start and end of current week (Sunday-Saturday)
    const getWeekRange = () => {
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay); // Go back to Sunday
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Go forward to Saturday
      
      return { start: startOfWeek, end: endOfWeek };
    };
    
    // Get start and end of current month
    const getMonthRange = () => {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: startOfMonth, end: endOfMonth };
    };
    
    // Set up date ranges based on filter
    let startDate = null;
    let endDate = null;
    let showOnlySection = null;
    
    switch (filterValue) {
      case 'all':
        // Show all tasks
        break;
      case 'triage':
        // Show only Triage section
        showOnlySection = 'section-triage';
        break;
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'tomorrow':
        startDate = tomorrow;
        endDate = tomorrow;
        break;
      case 'this-week':
        const thisWeek = getWeekRange();
        startDate = thisWeek.start;
        endDate = thisWeek.end;
        break;
      case 'next-week':
        const thisWeekEnd = getWeekRange().end;
        const nextWeekStart = new Date(thisWeekEnd);
        nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        startDate = nextWeekStart;
        endDate = nextWeekEnd;
        break;
      case 'this-month':
        const thisMonth = getMonthRange();
        startDate = thisMonth.start;
        endDate = thisMonth.end;
        break;
      case 'next-month':
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        startDate = nextMonthStart;
        endDate = nextMonthEnd;
        break;
    }
    
    if (debug) {
      console.log(`Filter date range: ${startDate ? startDate.toDateString() : 'all'} to ${endDate ? endDate.toDateString() : 'all'}`);
      console.log(`Show only section: ${showOnlySection || 'all sections'}`);
    }
    
    // Get all tasks
    const allTasks = document.querySelectorAll('.task-item:not(.section-header)');
    
    // Get all sections
    const allSections = document.querySelectorAll('.section-header');
    
    // If showing all tasks, make sure all sections are visible
    if (filterValue === 'all') {
      allTasks.forEach(task => {
        task.style.display = '';
      });
      allSections.forEach(section => {
        section.closest('.task-item').style.display = '';
      });
      showToast('Filter Applied', 'Showing all tasks');
      return;
    }
    
    // If showing only a specific section
    if (showOnlySection) {
      allSections.forEach(section => {
        const sectionId = section.getAttribute('data-id');
        const sectionItem = section.closest('.task-item');
        
        if (sectionId === showOnlySection) {
          sectionItem.style.display = '';
          // Show all tasks in this section
          const tasksContainer = sectionItem.querySelector('.task-children');
          if (tasksContainer) {
            const sectionTasks = tasksContainer.querySelectorAll('.task-item');
            sectionTasks.forEach(task => {
              task.style.display = '';
            });
          }
        } else {
          sectionItem.style.display = 'none';
        }
      });
      showToast('Filter Applied', 'Showing Triage tasks only');
      return;
    }
    
    // Count tasks that match the filter
    let matchCount = 0;
    
    // Find all tasks in Triage section to always show them
    const triageSection = document.querySelector('.section-header[data-id="section-triage"]');
    const triageTasks = new Set();
    if (triageSection) {
      const triageItem = triageSection.closest('.task-item');
      if (triageItem) {
        const triageChildrenContainer = triageItem.querySelector('.task-children');
        if (triageChildrenContainer) {
          const triageTaskElements = triageChildrenContainer.querySelectorAll('.task-item:not(.section-header)');
          triageTaskElements.forEach(task => triageTasks.add(task));
          if (debug) console.log(`Found ${triageTasks.size} tasks in Triage section to always show`);
        }
      }
    }
    
    // For date filters, check each task
    allTasks.forEach(task => {
      try {
        // Always show tasks in the Triage section regardless of filter
        if (triageTasks.has(task)) {
          task.style.display = '';
          matchCount++;
          return; // Skip the rest of the filtering for Triage tasks
        }
        
        const taskData = JSON.parse(task.dataset.taskData || '{}');
        let display = 'none'; // Default to hiding the task
        
        // Check if task has a revisit date
        if (taskData.revisitDate) {
          // Only process dates when we have a filter that's not 'all'
          if (filterValue === 'today') {
            // Special handling for today filter
            if (taskData.revisitDate === 'today') {
              display = '';
              matchCount++;
            } else {
              try {
                // Try to parse the date and check if it's today
                const revisitDate = parseRevisitDate(taskData.revisitDate);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                
                if (isSameDay(revisitDate, todayDate)) {
                  display = '';
                  matchCount++;
                }
              } catch (error) {
                if (debug) console.error(`Error checking today date: ${taskData.revisitDate}`, error);
              }
            }
          } else if (filterValue === 'tomorrow') {
            // Special handling for tomorrow filter
            if (taskData.revisitDate === 'tomorrow') {
              display = '';
              matchCount++;
            } else {
              try {
                // Try to parse the date and check if it's tomorrow
                const revisitDate = parseRevisitDate(taskData.revisitDate);
                const tomorrowDate = new Date();
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                tomorrowDate.setHours(0, 0, 0, 0);
                
                if (isSameDay(revisitDate, tomorrowDate)) {
                  display = '';
                  matchCount++;
                }
              } catch (error) {
                if (debug) console.error(`Error checking tomorrow date: ${taskData.revisitDate}`, error);
              }
            }
          } else if (startDate && endDate) {
            // For date range filters (this-week, next-week, etc.)
            try {
              let revisitDate;
              
              // Handle special strings
              if (taskData.revisitDate === 'today') {
                revisitDate = new Date();
                revisitDate.setHours(0, 0, 0, 0);
              } else if (taskData.revisitDate === 'tomorrow') {
                revisitDate = new Date();
                revisitDate.setDate(revisitDate.getDate() + 1);
                revisitDate.setHours(0, 0, 0, 0);
              } else {
                revisitDate = parseRevisitDate(taskData.revisitDate);
              }
              
              // Check if the revisit date is within the filter range
              if (revisitDate >= startDate && revisitDate <= endDate) {
                display = '';
                matchCount++;
                if (debug) console.log(`Task "${taskData.content}" matches date range: ${revisitDate.toDateString()}`);
              }
            } catch (parseError) {
              console.error(`Error parsing date: ${taskData.revisitDate}`, parseError);
            }
          }
        }
        
        // Apply the display setting
        task.style.display = display;
        
      } catch (error) {
        console.error('Error processing task during filtering:', error);
      }
    });
    
    // Make sure all sections are visible
    allSections.forEach(section => {
      section.closest('.task-item').style.display = '';
    });
    
    // Show toast with results
    showToast('Filter Applied', `Found ${matchCount} tasks with matching revisit dates`);
  }
  
  // Sort tasks within each section according to priority
  function sortTasksByPriority() {
    console.log("------------------------");
    console.log("🔄 STARTING PRIORITY SORTING");
    console.log("------------------------");
    
    // The primary task container 
    const mainContainer = document.getElementById('task-tree');
    if (!mainContainer) {
      console.error('Main task container not found!');
      return;
    }

    // Get all top-level sections within the main container
    const sections = Array.from(mainContainer.querySelectorAll(':scope > ul > li.task-item.section-header'));
    
    console.log(`Found ${sections.length} top-level sections to process`);
    
    if (sections.length === 0) {
      console.warn('No sections found, looking for alternate section structure');
      
      // Try alternate search for sections
      const alternateSections = document.querySelectorAll('.section-header');
      console.log(`Found ${alternateSections.length} sections with alternate search`);
      
      if (alternateSections.length === 0) {
        console.error('No sections found at all. Cannot continue sorting.');
        return;
      }
    }
    
    // Process each section
    sections.forEach((sectionHeader, index) => {
      // Get section name
      const sectionName = sectionHeader.querySelector('.task-text')?.textContent || 
                          sectionHeader.textContent || 
                          `Section ${index+1}`;
                          
      const sectionId = sectionHeader.dataset.id || sectionHeader.getAttribute('data-id') || '';
      
      console.log(`\n🔶 SORTING SECTION: "${sectionName}" (${sectionId}) [${index+1}/${sections.length}]`);
      
      // Find all tasks in this section (direct children only)
      let tasks = [];
      
      // First check if there's a task-children container
      const childrenContainer = sectionHeader.querySelector('.task-children');
      
      if (childrenContainer) {
        // Get the task list inside the children container
        const taskList = childrenContainer.querySelector('.task-list');
        
        if (taskList) {
          // Get all direct child task items that aren't section headers
          tasks = Array.from(taskList.children).filter(item => 
            item.classList.contains('task-item') && !item.classList.contains('section-header')
          );
          
          console.log(`Found ${tasks.length} tasks in section "${sectionName}" via children container`);
        }
      }
      
      // If we didn't find tasks, try alternate methods
      if (tasks.length === 0) {
        // Try to find the next sibling which should be a children container
        const nextSibling = sectionHeader.nextElementSibling;
        
        if (nextSibling && nextSibling.classList.contains('task-children')) {
          const taskList = nextSibling.querySelector('.task-list');
          
          if (taskList) {
            tasks = Array.from(taskList.children).filter(item => 
              item.classList.contains('task-item') && !item.classList.contains('section-header')
            );
            
            console.log(`Found ${tasks.length} tasks in section "${sectionName}" via next sibling`);
          }
        }
      }
      
      // If we still don't have tasks, try a broader search
      if (tasks.length === 0) {
        // This is a more desperate measure - might get tasks from wrong sections
        const parentLi = sectionHeader.closest('li.task-item');
        
        if (parentLi) {
          const allChildLists = parentLi.querySelectorAll('.task-list');
          
          if (allChildLists.length > 0) {
            // Just take the first task list we find
            const firstList = allChildLists[0];
            
            tasks = Array.from(firstList.children).filter(item => 
              item.classList.contains('task-item') && !item.classList.contains('section-header')
            );
            
            console.log(`Found ${tasks.length} tasks in section "${sectionName}" via broader search`);
          }
        }
      }
      
      // Last resort - check direct HTML structure
      if (tasks.length === 0 && sectionHeader.parentElement) {
        const taskList = sectionHeader.parentElement;
        
        // Get sibling task items
        let siblingTasks = [];
        let currentElement = sectionHeader.nextElementSibling;
        
        while (currentElement && !currentElement.classList.contains('section-header')) {
          if (currentElement.classList.contains('task-item')) {
            siblingTasks.push(currentElement);
          }
          currentElement = currentElement.nextElementSibling;
        }
        
        tasks = siblingTasks;
        console.log(`Found ${tasks.length} tasks in section "${sectionName}" via sibling search`);
      }
      
      // If we still have no tasks, we can't sort this section
      if (tasks.length <= 1) {
        console.log(`Not enough tasks to sort in section "${sectionName}"`);
        return;
      }
      
      console.log(`Sorting ${tasks.length} tasks in section "${sectionName}"`);
      
      // Split into completed and non-completed tasks
      const completedTasks = tasks.filter(task => task.classList.contains('task-completed'));
      const nonCompletedTasks = tasks.filter(task => !task.classList.contains('task-completed'));
      
      console.log(`${nonCompletedTasks.length} active tasks, ${completedTasks.length} completed tasks`);
      
      // Sort non-completed tasks by priority (Fast → First → Fire → Fear → Flow)
      nonCompletedTasks.sort((a, b) => {
        // Parse task data for both tasks
        let aData, bData;
        try {
          aData = JSON.parse(a.dataset.taskData || '{}');
          bData = JSON.parse(b.dataset.taskData || '{}');
        } catch (e) {
          console.error('Error parsing task data for sorting:', e);
          return 0;
        }
        
        // Calculate priority scores
        // Fast (50) > First (40) > Fire (30) > Fear (20) > Flow (10)
        const getPriorityScore = (data) => {
          let score = 0;
          if (data.fast === true) score += 50;
          if (data.first === true) score += 40;
          if (data.fire === true) score += 30;
          if (data.fear === true) score += 20;
          if (data.flow === true) score += 10;
          return score;
        };
        
        const aScore = getPriorityScore(aData);
        const bScore = getPriorityScore(bData);
        
        // Higher score comes first (descending order)
        return bScore - aScore;
      });
      
      // Combine sorted active tasks with completed tasks
      const sortedTasks = [...nonCompletedTasks, ...completedTasks];
      
      // Find the parent list that contains these tasks
      const taskParent = tasks[0].parentNode;
      if (!taskParent) {
        console.error('Cannot find parent node for tasks, aborting sort');
        return;
      }
      
      // Remove all tasks from the DOM
      sortedTasks.forEach(task => {
        if (task.parentNode === taskParent) {
          taskParent.removeChild(task);
        }
      });
      
      // Re-add them in sorted order
      sortedTasks.forEach(task => {
        taskParent.appendChild(task);
      });
      
      console.log(`✅ Successfully sorted ${sortedTasks.length} tasks in section "${sectionName}"`);
      
      // Get task names for verification
      if (sortedTasks.length > 0) {
        console.log('Sorted order:');
        sortedTasks.forEach((task, idx) => {
          try {
            const data = JSON.parse(task.dataset.taskData || '{}');
            const flags = [];
            if (data.fast) flags.push('Fast');
            if (data.first) flags.push('First');
            if (data.fire) flags.push('Fire');
            if (data.fear) flags.push('Fear');
            if (data.flow) flags.push('Flow');
            console.log(`  ${idx+1}. ${data.content} [${flags.join(', ')}]`);
          } catch (e) {
            console.log(`  ${idx+1}. Unknown task`);
          }
        });
      }
    });
    
    console.log("------------------------");
    console.log("✅ PRIORITY SORTING COMPLETE");
    console.log("------------------------");
    
    // Save the sorted tasks
    try {
      const tasksFromDOM = getAllTasksFromDOM(document.getElementById('task-tree'));
      db.saveTasks(tasksFromDOM);
      localStorage.setItem('dun_tasks', JSON.stringify(tasksFromDOM));
      console.log('Saved sorted tasks to storage');
    } catch (err) {
      console.error('Failed to save sorted tasks:', err);
    }
  }
  
  // Helper function to collect all tasks for database saving
  function getAllTasksFromDOM(rootElement) {
    if (!rootElement) return [];
    
    // Array to hold all task objects
    const allTasks = [];
    
    // Find all task items
    const taskElements = rootElement.querySelectorAll('.task-item');
    
    // Process each task element
    taskElements.forEach(taskElement => {
      try {
        // Get task data from dataset
        if (taskElement.dataset.taskData) {
          const taskData = JSON.parse(taskElement.dataset.taskData);
          
          // Get parent information
          const parentList = taskElement.parentElement;
          if (parentList) {
            // Get parent task or section
            const parentItem = parentList.closest('.task-item');
            if (parentItem && parentItem.dataset.taskData) {
              // If parent is a task, get its ID
              const parentData = JSON.parse(parentItem.dataset.taskData);
              taskData.parent = parentData.id;
            } else {
              // If no parent task, check for section header
              const sectionHeader = parentList.closest('li')?.querySelector('.section-header');
              if (sectionHeader && sectionHeader.dataset.id) {
                taskData.parent = sectionHeader.dataset.id;
              }
            }
          }
          
          // Add to collection
          allTasks.push(taskData);
        }
      } catch (error) {
        console.error('Error processing task element for database save:', error);
      }
    });
    
    return allTasks;
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
        if (debug) console.log('Sort button clicked, starting priority sort');
        
        // Add visual feedback immediately
        prioritySortBtn.classList.add('active');
        prioritySortBtn.setAttribute('disabled', 'disabled');
        prioritySortBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        // Use setTimeout to allow UI to update before the sort (which can be CPU-intensive)
        setTimeout(() => {
          try {
            sortTasksByPriority();
            showToast('Tasks Sorted', 'Tasks have been sorted by priority order.');
          } catch (error) {
            console.error('Error during task sorting:', error);
            showToast('Sorting Error', 'There was a problem sorting tasks.');
          } finally {
            // Restore button state
            prioritySortBtn.removeAttribute('disabled');
            prioritySortBtn.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short"></i>';
            
            // Remove active class after animation
            setTimeout(() => {
              prioritySortBtn.classList.remove('active');
            }, 500);
          }
        }, 100);
      });
    }
    
    // Filter dropdown
    const filterDropdown = document.getElementById('filter-dropdown');
    if (filterDropdown) {
      filterDropdown.addEventListener('change', () => {
        applyFilter(filterDropdown.value);
      });
    }
    
    // Make priority flags active in the modal and immediately save changes
    // These flag buttons are in the UI for the task modal view
    document.querySelectorAll('.flag-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        console.log('Modal flag button clicked:', btn.dataset.priority);
        
        // Toggle UI state
        const isActive = btn.classList.toggle('active');
        const priority = btn.getAttribute('data-priority');
        
        if (!priority) {
          console.error('No priority attribute found on flag button');
          return;
        }
        
        // Get current task from modal
        const modal = document.getElementById('task-view-modal');
        const taskId = modal.dataset.taskId;
        
        if (!taskId) {
          console.error('No task ID found in modal');
          return;
        }
        
        console.log(`Updating task ${taskId} in modal - setting ${priority}=${isActive}`);
        
        try {
          // Find the task element
          const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
          
          if (!taskElement) {
            console.error(`Task element with ID ${taskId} not found in DOM`);
            return;
          }
          
          // Update the task data
          const taskData = JSON.parse(taskElement.dataset.taskData || '{}');
          taskData[priority] = isActive;
          
          // Save back to DOM
          taskElement.dataset.taskData = JSON.stringify(taskData);
          
          // Save to database
          await db.saveTask(taskId, taskData);
          console.log(`✅ SAVED flag change from modal: ${priority}=${isActive} for task "${taskData.content}"`);
          
          // Update all instances via event
          document.dispatchEvent(new CustomEvent('task-flag-updated', {
            detail: { taskId, flagType: priority, isActive }
          }));
        } catch (error) {
          console.error('Error updating task flag from modal:', error);
        }
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
  async function addNewTask() {
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
      
      // Creating a simpler approach to find the Triage container
      let triageChildrenContainer = null;
      let triageChildList = null;
      
      // First approach - find inside the parent li element
      const triageLi = triageSection.closest('li');
      if (triageLi) {
        triageChildrenContainer = triageLi.querySelector('.task-children');
        if (triageChildrenContainer) {
          triageChildList = triageChildrenContainer.querySelector('.task-list');
          if (debug) console.log('Found triage task list inside parent li');
        }
      }
      
      // Second approach - check next sibling of section header
      if (!triageChildList && triageSection.nextElementSibling) {
        if (triageSection.nextElementSibling.classList.contains('task-children')) {
          triageChildrenContainer = triageSection.nextElementSibling;
          triageChildList = triageChildrenContainer.querySelector('.task-list');
          if (debug) console.log('Found triage list through next sibling');
        }
      }
      
      // Third approach - search specifically using ID and class attributes
      if (!triageChildList) {
        // Try direct query using the ID of the section header to find nearby task list
        const allTriageElements = document.querySelectorAll('[data-id="section-triage"], [data-section="triage"]');
        for (const elem of allTriageElements) {
          // Check parent element
          if (elem.parentElement) {
            const container = elem.parentElement.querySelector('.task-children');
            if (container) {
              triageChildrenContainer = container;
              triageChildList = container.querySelector('.task-list');
              if (triageChildList) {
                if (debug) console.log('Found triage list through ID attribute');
                break;
              }
            }
          }
        }
      }
      
      // Last resort - just search for any Triage-related elements
      if (!triageChildList) {
        const taskLists = document.querySelectorAll('.task-list');
        for (const list of taskLists) {
          // Look for the nearest section header
          const nearestHeader = list.closest('li')?.querySelector('.section-header');
          if (nearestHeader && nearestHeader.textContent.includes('TRIAGE')) {
            triageChildList = list;
            if (debug) console.log('Found triage list through text content match');
            break;
          }
        }
      }
      
      // If all else fails, use the first available task list
      if (!triageChildList) {
        triageChildList = document.querySelector('.task-list');
        if (debug) console.log('Using first task list as fallback');
      }
      
      if (!triageChildList) {
        showToast('Error', 'Triage task list not found');
        if (debug) console.error('No task list found for new task');
        return;
      }
      
      // Save task to database before adding to DOM
      try {
        // The parent should be the ID of the triage section
        newTask.parent = 'section-triage';
        
        // Save to Replit Database
        await db.saveTask(newTask.id, newTask);
        if (debug) console.log('New task saved to database:', newTask);
      } catch (dbError) {
        console.error('Error saving task to database:', dbError);
        // Continue to display in UI even if database save fails
      }
      
      // Log info about what we found
      if (debug) {
        console.log('Triage section:', triageSection);
        console.log('Triage child list found:', triageChildList);
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
      checkbox.addEventListener('click', async (e) => {
        e.stopPropagation();
        newTask.completed = !newTask.completed;
        checkbox.innerHTML = newTask.completed ? '<i class="fa-solid fa-check"></i>' : '';
        newTaskElement.classList.toggle('task-completed', newTask.completed);
        
        // Update task data in DOM
        newTaskElement.dataset.taskData = JSON.stringify(newTask);
        
        // Save updated completion status to database
        try {
          await db.saveTask(newTask.id, newTask);
          if (debug) console.log(`New task completion status updated and saved to database`);
        } catch (error) {
          console.error('Error saving new task completion status to database:', error);
        }
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
        flagCircle.addEventListener('click', async (e) => {
          console.log(`▶️ Flag circle clicked: ${priority}`);
          try {
            e.stopPropagation();
            const isActive = flagCircle.classList.toggle('active');
            console.log(`Toggle state: ${isActive}`);
            
            // Ensure task element has ID
            if (!newTaskElement.dataset.id && newTask.id) {
              console.log(`Setting missing data-id attribute to ${newTask.id}`);
              newTaskElement.dataset.id = newTask.id;
            }
            
            // Get latest task data from element
            let taskData;
            try {
              if (!newTaskElement.dataset.taskData) {
                console.error('No task data found in element', newTaskElement);
                return;
              }
              
              taskData = JSON.parse(newTaskElement.dataset.taskData);
              console.log(`Read task data for '${taskData.content}', current ${priority}=${taskData[priority]}`);
            } catch (error) {
              console.error('Error parsing task data:', error, 'Raw data:', newTaskElement.dataset.taskData);
              return;
            }
            
            // Update the task data with new flag state
            const oldValue = taskData[priority] || false;
            console.log(`Changing flag from ${oldValue} to ${isActive}`);
            taskData[priority] = isActive;
            
            // Save back to the DOM element
            newTaskElement.dataset.taskData = JSON.stringify(taskData);
            
            console.log(`Updated DOM with new task data for task "${taskData.content}"`);
            
            // Save updated flag status to database
            try {
              await db.saveTask(taskData.id, taskData);
              console.log(`✅ DATABASE UPDATED: ${priority}=${isActive} for task "${taskData.content}" (ID: ${taskData.id})`);
              
              // Refresh the view to update all instances of flags
              console.log(`Broadcasting flag update event for task ${taskData.id}`);
              document.dispatchEvent(new CustomEvent('task-flag-updated', {
                detail: { taskId: taskData.id, flagType: priority, isActive: isActive }
              }));
            } catch (error) {
              console.error('Error saving flag status to database:', error);
            }
          } catch (flagError) {
            console.error('Error in flag circle click handler:', flagError);
          }
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
        
        // Get the moved task data
        const taskElement = evt.item;
        let taskData;
        try {
          taskData = JSON.parse(taskElement.dataset.taskData);
        } catch (e) {
          console.error('Error parsing task data for saving after drag:', e);
          return;
        }
        
        // Log the result of the drag
        const parentItem = evt.to.closest('.task-item');
        let parentId = null;
        
        if (parentItem) {
          if (debug) console.log(`Dropped into: ${parentItem.querySelector('.task-text').textContent.trim()}`);
          
          // Get the parent task data for updating relationships
          try {
            const parentData = JSON.parse(parentItem.dataset.taskData);
            parentId = parentData.id;
            
            // Update task's parent reference
            taskData.parent = parentId;
            
            // Save updated task to database
            db.saveTask(taskData.id, taskData).catch(error => {
              console.error('Error saving task parent relationship to database:', error);
            });
          } catch (e) {
            console.error('Error updating parent-child relationship:', e);
          }
        } else {
          if (debug) console.log('Dropped at root level');
          
          // If dropped at root level, use section id as parent
          const sectionHeader = evt.to.closest('li')?.querySelector('.section-header');
          if (sectionHeader && sectionHeader.dataset.id) {
            taskData.parent = sectionHeader.dataset.id;
            
            // Save updated task to database
            db.saveTask(taskData.id, taskData).catch(error => {
              console.error('Error saving task parent relationship to database:', error);
            });
          }
        }
        
        // Save the entire task tree periodically (not on every drag to reduce database writes)
        const now = Date.now();
        if (!window.lastFullSave || now - window.lastFullSave > 10000) {
          window.lastFullSave = now;
          
          // Get all tasks from the DOM and save to database
          const rootElement = document.getElementById('task-tree');
          if (rootElement) {
            const allTasks = getAllTasksFromDOM(rootElement);
            
            if (allTasks && allTasks.length > 0) {
              db.saveTasks(allTasks).catch(error => {
                console.error('Error saving full task tree to database:', error);
              });
            }
          }
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

// Event handler for synchronizing flag status across all instances
document.addEventListener('task-flag-updated', (event) => {
  const { taskId, flagType, isActive } = event.detail;
  
  console.log(`📢 FLAG UPDATE EVENT: Task ${taskId}, ${flagType}=${isActive}`);
  
  // Find all task items with this ID
  const taskElements = document.querySelectorAll(`.task-item[data-id="${taskId}"]`);
  console.log(`Updating ${taskElements.length} instances of task ${taskId} to set ${flagType}=${isActive}`);
  
  if (taskElements.length === 0) {
    console.warn(`No task elements found with ID ${taskId}. Searching without data-id attribute...`);
    
    // Try alternative lookup by iterating through all tasks
    const allTasks = document.querySelectorAll('.task-item');
    let matchCount = 0;
    
    allTasks.forEach(task => {
      try {
        const taskData = JSON.parse(task.dataset.taskData || '{}');
        if (taskData.id === taskId) {
          matchCount++;
          console.log(`Found task by taskData ID: ${taskData.content}`);
          
          // Update task data and flags
          updateTaskFlags(task, taskData, flagType, isActive);
        }
      } catch (e) {
        // Ignore parse errors for this search
      }
    });
    
    console.log(`Found ${matchCount} tasks by taskData ID lookup`);
    return;
  }
  
  taskElements.forEach(taskElement => {
    console.log(`Updating task element: ${taskElement.querySelector('.task-text')?.textContent || '[no text]'}`);
    
    try {
      const taskData = JSON.parse(taskElement.dataset.taskData || '{}');
      updateTaskFlags(taskElement, taskData, flagType, isActive);
    } catch (error) {
      console.error('Error updating task data during sync:', error);
    }
  });
  
  // Helper function to update flags in a task element
  function updateTaskFlags(element, taskData, type, value) {
    // Update priority flags in the task list
    const flags = element.querySelectorAll(`[data-priority="${type}"]`);
    console.log(`Found ${flags.length} flag elements with type ${type}`);
    
    // Ensure value is a boolean
    const boolValue = value === true;
    
    // Update visual flag states
    flags.forEach(flag => {
      const wasActive = flag.classList.contains('active');
      
      if (wasActive !== boolValue) {
        flag.classList.toggle('active', boolValue);
        console.log(`Updated flag element UI: ${wasActive} → ${boolValue}`);
      }
    });
    
    // Also update the task data (ensure it's a boolean)
    const wasValueSet = taskData[type] === true;
    
    // Only update if value changed
    if (wasValueSet !== boolValue) {
      taskData[type] = boolValue;
      console.log(`Updated task data: ${type}=${wasValueSet} → ${boolValue}`);
      
      // Save the updated task data back to the element
      element.dataset.taskData = JSON.stringify(taskData);
      
      // Save to the database
      (async () => {
        try {
          const saveResult = await db.saveTask(taskData.id, {...taskData});
          console.log(`DB save for flag update ${type}=${boolValue}: ${saveResult ? 'Success' : 'Failed'}`);
        } catch (err) {
          console.error('Failed to save flag update to database:', err);
        }
      })();
    }
  }
});

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Application initializing...');
    
    // Initialize event handlers for UI components
    initUI();
    
    // Try to load tasks from Replit Database
    let tasksToUse;
    try {
      console.log('Loading tasks from database...');
      const loadedTasks = await db.loadTasks();
      
      console.log(`Database response received: ${loadedTasks ? 'data found' : 'no data'}`);
      
      // Try to load tasks from localStorage directly first
      const localData = localStorage.getItem('dun_tasks');
      let localTasks = null;
      
      if (localData) {
        try {
          localTasks = JSON.parse(localData);
          console.log(`Found saved tasks in localStorage: ${localTasks.length} tasks`);
        } catch (e) {
          console.error('Failed to parse localStorage data:', e);
        }
      }
      
      // If we have data from either source, use it
      const tasksFromStorage = localTasks || loadedTasks;
      
      // Ensure tasks is an array before using it
      if (tasksFromStorage && Array.isArray(tasksFromStorage) && tasksFromStorage.length > 0) {
        console.log(`Using ${tasksFromStorage.length} tasks from storage`);
        
        // Validate and fix boolean flag values
        tasksFromStorage.forEach(task => {
          if (!task.children) task.children = [];
          
          // Fix flag properties to be explicit booleans
          task.fire = task.fire === true;
          task.fast = task.fast === true;
          task.flow = task.flow === true;
          task.fear = task.fear === true;
          task.first = task.first === true;
          
          // Fix flag properties in children recursively
          const fixFlagsRecursive = (items) => {
            items.forEach(item => {
              item.fire = item.fire === true;
              item.fast = item.fast === true;
              item.flow = item.flow === true;
              item.fear = item.fear === true;
              item.first = item.first === true;
              
              if (item.children && item.children.length > 0) {
                fixFlagsRecursive(item.children);
              }
            });
          };
          
          if (task.children.length > 0) {
            fixFlagsRecursive(task.children);
          }
        });
        
        console.log('Using tasks from storage with fixed boolean values');
        tasksToUse = tasksFromStorage;
        
        // Save tasks to ensure they're in both storage locations
        setTimeout(async () => {
          await db.saveTasks(tasksToUse);
        }, 1000);
      } else {
        console.log('No valid tasks in storage, using sample tasks');
        tasksToUse = sampleTasks;
        
        // Save sample tasks to both storage locations
        console.log('Saving sample tasks for first use');
        await db.saveTasks(sampleTasks);
        localStorage.setItem('dun_tasks', JSON.stringify(sampleTasks));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      console.log('Error occurred, using sample tasks');
      tasksToUse = sampleTasks;
      
      // Attempt to save sample tasks
      try {
        console.log('Saving sample tasks to database after load error');
        await db.saveTasks(sampleTasks);
      } catch (saveError) {
        console.error('Failed to save sample tasks:', saveError);
      }
    }
    
    // Build the task tree with the tasks we determined to use
    const root = document.getElementById('task-tree');
    
    // Clear any existing content to prevent duplicate lists
    root.innerHTML = '';
    
    if (debug) console.log('Building tree with tasks:', tasksToUse);
    buildTree(tasksToUse, root);
    
    // Create root sortable
    const rootList = root.querySelector(':scope > .task-list');
    if (rootList) {
      createRootSortable(rootList);
    }
    
    // Set up periodic saving of all tasks (every 30 seconds)
    window.lastFullSave = Date.now();
    setInterval(async () => {
      try {
        const rootElement = document.getElementById('task-tree');
        if (rootElement) {
          const allTasks = getAllTasksFromDOM(rootElement);
          
          if (allTasks && allTasks.length > 0) {
            await db.saveTasks(allTasks);
            window.lastFullSave = Date.now();
            if (debug) console.log('Auto-saved all tasks to database');
          }
        }
      } catch (error) {
        console.error('Error during auto-save:', error);
      }
    }, 30000); // 30 seconds
    
    if (debug) console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    showToast('Error', 'Failed to initialize application. Please refresh the page.');
  }
});
