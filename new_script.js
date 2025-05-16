// -------------  DUN Task Management  ------------------
// Updated: 2025‑05‑16 09:45
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
          scheduledTime: '10:00',
          parent: null
        },
        {
          id: 'task-triage-2',
          content: 'Clean Kitchen',
          completed: true,
          children: [],
          parent: null
        }
      ]
    },
    // sections A, B, C omitted for brevity but similar structure
  ];

  /* ---------- Build Tree ----------- */
  function buildTree(tasks, parent) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    parent.appendChild(ul);
    
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      if (task.isSection) {
        li.classList.add('section-header');
      }
      if (task.completed) {
        li.classList.add('task-completed');
      }
      
      // Set data attributes
      li.dataset.id = task.id;
      li.dataset.taskData = JSON.stringify(task);
      
      // Create task row for main content
      const row = document.createElement('div');
      row.className = 'task-row';
      
      /* checkbox for completion */
      if (!task.isSection) {
        const checkBtn = document.createElement('div');
        checkBtn.className = 'task-check';
        checkBtn.innerHTML = `<input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>`;
        checkBtn.setAttribute('data-no-drag', 'true');
        
        // Add click event for checkbox
        const checkbox = checkBtn.querySelector('input');
        checkbox.addEventListener('change', async (e) => {
          e.stopPropagation();
          
          // Get current task data
          const taskData = JSON.parse(li.dataset.taskData);
          
          // Update completed status
          taskData.completed = checkbox.checked;
          
          // Update the element's class and data
          if (checkbox.checked) {
            li.classList.add('task-completed');
          } else {
            li.classList.remove('task-completed');
          }
          
          // Save updated data back to the element
          li.dataset.taskData = JSON.stringify(taskData);
          
          // Save to database
          try {
            await db.saveTask(taskData.id, taskData);
            console.log(`Task completion state updated: ${taskData.content} -> ${checkbox.checked ? 'Completed' : 'Not completed'}`);
          } catch (error) {
            console.error('Failed to save task completion state:', error);
          }
        });
        
        row.appendChild(checkBtn);
      }
      
      /* collapsible toggle */
      const childContainer = document.createElement('div');
      childContainer.className = 'task-children';
      
      // Create chevron for toggle if has children or is a section
      const chevron = document.createElement('div');
      chevron.className = 'task-chevron';
      chevron.textContent = '▸';
      
      // Hide chevron if no children and not a section
      if (task.children.length === 0 && !task.isSection) {
        chevron.style.visibility = 'hidden';
      }
      
      // For sections, we'll expand them initially
      if (task.isSection) {
        chevron.classList.add('expanded');
        chevron.textContent = '▾';
        childContainer.style.display = 'block';
      } else {
        childContainer.style.display = 'none';
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
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'control-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.setAttribute('data-no-drag', 'true');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task, li);
        });
        controlBar.appendChild(deleteBtn);
        
        // Add all priority flags to regular tasks (not sections)
        const priorityFlags = document.createElement('div');
        priorityFlags.className = 'task-priority-flags';
        
        // Fire flag
        const fireFlag = createPriorityFlag('fire', 'fa-fire', task.fire, 'High importance task that is "on fire"');
        priorityFlags.appendChild(fireFlag);
        
        // Fast flag
        const fastFlag = createPriorityFlag('fast', 'fa-bolt', task.fast, 'Task that should be done quickly');
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
      li.appendChild(childContainer);

      const childList = document.createElement('ul');
      childList.className = 'task-list';
      childContainer.appendChild(childList);

      /* build children recursively */
      if (task.children && task.children.length > 0) {
        buildTree(task.children, childList);
      }

      /* conditionally apply hide/show state based on section status */
      if (task.isSection) {
        childContainer.style.display = 'block';
      } else {
        childContainer.style.display = 'none';
      }

      li.appendChild(row);
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
        title = tooltip || 'Fire (High Importance)';
        break;
      case 'fast':
        icon = 'fa-bolt';
        title = tooltip || 'Fast (Quick Task)';
        break;
      case 'flow':
        icon = 'fa-water';
        title = tooltip || 'Flow (Focus Required)';
        break;
      case 'fear':
        icon = 'fa-skull';
        title = tooltip || 'Fear (Anxiety/Resistance)';
        break;
      case 'first':
        icon = 'fa-trophy';
        title = tooltip || 'First (High Priority)';
        break;
      default:
        icon = 'fa-circle';
        title = tooltip || 'Priority Flag';
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
        
        // Update visual state immediately (this is immediate for the user before any database op)
        flag.classList.toggle('active', newValue);
        
        // **** IMPORTANT: Update the object property with explicit boolean ****
        taskData[type] = newValue;
        
        // Save the updated task data back to the DOM element
        taskItem.dataset.taskData = JSON.stringify(taskData);
        
        // Save updated flag status to database immediately
        try {
          // Use direct database call to ensure the update happens
          const saveResult = await db.saveTask(taskData.id, taskData);
          
          if (saveResult) {
            console.log(`✅ DATABASE UPDATED: ${type}=${newValue} for "${taskData.content}"`);
            
            // Save change to localStorage for redundancy
            try {
              const allTasks = JSON.parse(localStorage.getItem('dun_tasks') || '[]');
              const taskIndex = allTasks.findIndex(t => t.id === taskData.id);
              if (taskIndex >= 0) {
                allTasks[taskIndex][type] = newValue;
                localStorage.setItem('dun_tasks', JSON.stringify(allTasks));
                console.log('Updated localStorage with flag change');
              }
            } catch (localError) {
              console.error('Error updating localStorage:', localError);
            }
            
            // Broadcast to all other instances of this task
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
    
    try {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj)) return dateStr;
      
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Reset time components for comparison
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      const compareDate = new Date(dateStr);
      compareDate.setHours(0, 0, 0, 0);
      
      if (compareDate.getTime() === today.getTime()) {
        return 'Today';
      } else if (compareDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        // Format as MM/DD/YYYY
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${month}/${day}/${year}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  }

  // Other helper functions would be here...
  
  // Add new task using a single reliable selector for Triage
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
    
    // Create task element (code to build task DOM element would be here)
    const newTaskElement = document.createElement('li');
    newTaskElement.className = 'task-item';
    newTaskElement.dataset.id = newTask.id;
    newTaskElement.dataset.taskData = JSON.stringify(newTask);
    
    // Right inside addNewTask(), instead of all the fallbacks:
    const triageList = document
      .querySelector('.section-header[data-id="section-triage"]')
      .closest('li')
      .querySelector('.task-children .task-list');
    
    if (!triageList) {
      console.error('Triage list not found, aborting');
      showToast('Error', 'Cannot find Triage');
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
    }
    
    // now append your newTaskElement there
    triageList.appendChild(newTaskElement);
    
    // Clear the input field and show confirmation
    newTaskInput.value = '';
    showToast('Success', `Task "${taskText}" added to triage`);
  }

  // Sort tasks by priority
  function sortTasksByPriority() {
    console.log("------------------------");
    console.log("🔄 STARTING PRIORITY SORTING");
    console.log("------------------------");
    
    // Use a simple direct query for all section headers - per instructions
    const sections = document.querySelectorAll('.section-header');
    
    console.log(`Found ${sections.length} section headers to process`);
    
    if (sections.length === 0) {
      console.error('No sections found at all. Cannot continue sorting.');
      return;
    }
    
    // Process each section
    sections.forEach((sectionHeader, index) => {
      // Get section name from the text content or a fallback
      const sectionName = sectionHeader.querySelector('.task-text')?.textContent || 
                          sectionHeader.textContent || 
                          `Section ${index+1}`;
      
      // Try to get the section ID from multiple possible locations
      const sectionId = sectionHeader.id || 
                        sectionHeader.dataset.id || 
                        sectionHeader.getAttribute('data-id') || 
                        '';
      
      console.log(`\n🔶 SORTING SECTION: "${sectionName}" (${sectionId}) [${index+1}/${sections.length}]`);
      
      // Get the parent list item that contains this section header
      const parentSection = sectionHeader.closest('li.task-item');
      if (!parentSection) {
        console.log(`Cannot find parent li.task-item for section "${sectionName}". Skipping.`);
        return;
      }
      
      // Find the direct children container where tasks should be
      const childrenContainer = parentSection.querySelector('.task-children');
      if (!childrenContainer) {
        console.log(`Cannot find .task-children container for section "${sectionName}". Skipping.`);
        return;
      }
      
      // Get the task list from the children container
      const taskList = childrenContainer.querySelector('.task-list');
      if (!taskList) {
        console.log(`Cannot find .task-list within children container for section "${sectionName}". Skipping.`);
        return;
      }
      
      // Get all direct child task items (LI elements) that aren't section headers
      const tasks = Array.from(taskList.children).filter(item => 
        item.classList.contains('task-item') && !item.classList.contains('section-header')
      );
      
      console.log(`Found ${tasks.length} tasks in section "${sectionName}"`);
      
      // If we have 1 or fewer tasks, no sorting needed
      if (tasks.length <= 1) {
        console.log(`Not enough tasks to sort in section "${sectionName}"`);
        return;
      }
      
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
          
          // Ensure all flags are boolean
          aData.fast = aData.fast === true;
          aData.first = aData.first === true;
          aData.fire = aData.fire === true;
          aData.fear = aData.fear === true;
          aData.flow = aData.flow === true;
          
          bData.fast = bData.fast === true;
          bData.first = bData.first === true;
          bData.fire = bData.fire === true;
          bData.fear = bData.fear === true;
          bData.flow = bData.flow === true;
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
    });
    
    console.log("------------------------");
    console.log("✅ PRIORITY SORTING COMPLETE");
    console.log("------------------------");
  }

  // Initialize the application when the DOM is loaded
  document.addEventListener('DOMContentLoaded', async () => {
    // ... load or sample tasks into tasksToUse ...
    const root = document.getElementById('task-tree');
    root.innerHTML = ''; 
    buildTree(tasksToUse, root);
  });