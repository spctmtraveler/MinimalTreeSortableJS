// -------------  DUN Task Management Application  ------------------
// A task management application with collapsible tree and priority flags
// Updated: 2025‑05‑12 05:40
//  ✱ Implemented the DUN application UI according to mockup
//  ✱ Four sections: Triage, A, B, C with special styling
//  ✱ Added priority flags (Fire, Fast, Flow, Fear, First)
//  ✱ Added Task Modal for editing details
// ---------------------------------------------------

// Global debug flag for logging
const debug = true;

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Sample Data with Sections & Priorities ----------- */
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
          revisitDate: '2025-05-07',
          flags: {
            fire: true,
            fast: false,
            flow: false,
            fear: false,
            first: false
          },
          overview: 'Check mail daily for important deliveries',
          details: 'Remember to bring any important documents to office',
          timeEstimate: '5min',
          scheduledTime: '09:00',
          children: []
        },
        {
          id: 'task-triage-2',
          content: 'Clean Kitchen',
          completed: true,
          revisitDate: null,
          flags: {
            fire: false,
            fast: true,
            flow: true,
            fear: false,
            first: false
          },
          overview: 'Clean kitchen surfaces',
          details: 'Wipe counters, clean stove, take out trash',
          timeEstimate: '15min',
          scheduledTime: null,
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
          revisitDate: getFutureDateString(0), // Today
          flags: {
            fire: true,
            fast: false,
            flow: true,
            fear: false,
            first: false
          },
          overview: 'Bake cake for birthday party',
          details: 'Vanilla cake with chocolate frosting',
          timeEstimate: '2hr',
          scheduledTime: '14:00',
          children: [
            {
              id: 'task-a-1-1',
              content: 'Buy Ingredients',
              completed: false,
              revisitDate: getFutureDateString(1), // Tomorrow
              flags: {
                fire: false,
                fast: true,
                flow: false,
                fear: true,
                first: false
              },
              overview: 'Get all ingredients needed for cake',
              details: 'Flour, sugar, eggs, butter, vanilla, chocolate',
              timeEstimate: '30min',
              scheduledTime: null,
              children: [
                {
                  id: 'task-a-1-1-1',
                  content: 'Make a list',
                  completed: false,
                  revisitDate: getFutureDateString(0), // Today
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
                  id: 'task-a-1-1-2',
                  content: 'Go shopping',
                  completed: false,
                  revisitDate: getFutureDateString(7), // Next week
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
            },
            {
              id: 'task-a-1-2',
              content: 'Mix Ingredients',
              completed: false,
              revisitDate: '2025-04-22',
              flags: {
                fire: true,
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
              revisitDate: '2025-03-12',
              flags: {
                fire: false,
                fast: true,
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
          revisitDate: getFutureDateString(0), // Today
          flags: {
            fire: false,
            fast: false,
            flow: false,
            fear: true,
            first: true
          },
          children: []
        },
        {
          id: 'task-b-2',
          content: 'Shower',
          completed: true,
          revisitDate: getFutureDateString(1), // Tomorrow
          flags: {
            fire: false,
            fast: true,
            flow: true,
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
          revisitDate: getFutureDateString(7), // Next week
          flags: {
            fire: false,
            fast: false,
            flow: false,
            fear: false,
            first: true
          },
          children: []
        },
        {
          id: 'task-c-2',
          content: 't17',
          completed: false,
          revisitDate: '2025-04-22',
          flags: {
            fire: true,
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
          revisitDate: '2025-03-12',
          flags: {
            fire: false,
            fast: true,
            flow: false,
            fear: true,
            first: false
          },
          children: []
        }
      ]
    }
  ];
  
  // Helper function to get formatted date strings
  function getFutureDateString(daysInFuture) {
    const date = new Date();
    date.setDate(date.getDate() + daysInFuture);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }
  
  // Format revisit date for display
  function formatRevisitDate(dateString) {
    if (!dateString) return '-';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + (7 - today.getDay()));
    
    const date = new Date(dateString);
    
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    } else if (date >= nextWeekStart && date < new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return 'Next week';
    } else {
      // Return MM/DD format
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

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
      
      // Store task data reference for modal editing
      li.taskData = task;
      
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
      });

      /* text */
      const txt = document.createElement('span');
      txt.className = 'task-text';
      txt.textContent = task.content;
      row.appendChild(txt);
      
      /* revisit date (if it exists) for non-section tasks */
      if (!task.isSection && task.revisitDate) {
        const revisitEl = document.createElement('span');
        revisitEl.className = 'revisit-date';
        revisitEl.textContent = formatRevisitDate(task.revisitDate);
        row.appendChild(revisitEl);
      }
      
      /* task controls for non-section tasks */
      if (!task.isSection) {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'task-controls';
        controlsContainer.setAttribute('data-no-drag', 'true');
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-control-btn';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.title = 'Edit Task';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openTaskModal(task);
        });
        
        // Play button 
        const playBtn = document.createElement('button');
        playBtn.className = 'task-control-btn';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.title = 'Start Task';
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openTaskModal(task);
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-control-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete Task';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this task?')) {
            li.remove();
            showToast('Task deleted', 'Undo', () => {
              // Re-add task (undo functionality)
              createSortable(ul);
              ul.appendChild(li);
            });
          }
        });
        
        controlsContainer.appendChild(editBtn);
        controlsContainer.appendChild(playBtn);
        controlsContainer.appendChild(deleteBtn);
        
        row.appendChild(controlsContainer);
      }
      
      /* Priority flags for regular tasks */
      if (!task.isSection) {
        const flagsContainer = document.createElement('div');
        flagsContainer.className = 'task-flags';
        flagsContainer.setAttribute('data-no-drag', 'true');
        
        // Create flag buttons
        createFlagButton('fire', 'Is this task urgent and needs immediate attention?', 'fa-fire', task.flags, flagsContainer);
        createFlagButton('fast', 'Can this task be completed in under three minutes?', 'fa-rabbit-fast', task.flags, flagsContainer);
        createFlagButton('flow', 'Am I at risk of overindulging in this task instead of maintaining balance?', 'fa-water', task.flags, flagsContainer);
        createFlagButton('fear', 'Is this task something I should avoid due to potential negative outcomes?', 'fa-skull', task.flags, flagsContainer);
        createFlagButton('first', 'Does this task offer an 80% result with minimal effort?', 'fa-trophy', task.flags, flagsContainer);
        
        li.appendChild(flagsContainer);
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
      
      /* Open task modal on click if not a section header */
      if (!task.isSection) {
        txt.addEventListener('click', () => {
          openTaskModal(task);
        });
      }

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
  
  // Helper function to create flag buttons
  function createFlagButton(flagName, tooltip, iconClass, flags, container) {
    const btn = document.createElement('button');
    btn.className = `flag-btn ${flags && flags[flagName] ? 'active' : ''}`;
    btn.title = tooltip;
    btn.setAttribute('data-flag', flagName);
    btn.setAttribute('data-no-drag', 'true');
    
    const icon = document.createElement('i');
    icon.className = `fas ${iconClass}`;
    btn.appendChild(icon);
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (flags) {
        flags[flagName] = !flags[flagName];
        btn.classList.toggle('active', flags[flagName]);
        if (debug) console.log(`Flag "${flagName}" set to ${flags[flagName]}`);
      }
    });
    
    container.appendChild(btn);
    return btn;
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
});
