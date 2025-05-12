// -------------  Task Tree Demo  ------------------
// Minimalist visuals • accurate indent • compact drag preview
// Updated: 2025‑05‑12 04:30
//  ✱ Implemented section headers according to mockup
//  ✱ Four sections: Triage, A, B, C with special styling
//  ✱ Added completed task status with styling
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Sample Data with Sections ----------- */
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
          children: []
        },
        {
          id: 'task-triage-2',
          content: 'Clean Kitchen',
          completed: true,
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
          children: [
            {
              id: 'task-a-1-1',
              content: 'Buy Ingredients',
              completed: false,
              children: [
                {
                  id: 'task-a-1-1-1',
                  content: 'Make a list',
                  completed: false,
                  children: []
                },
                {
                  id: 'task-a-1-1-2',
                  content: 'Go shopping',
                  completed: false,
                  children: []
                }
              ]
            },
            {
              id: 'task-a-1-2',
              content: 'Mix Ingredients',
              completed: false,
              children: []
            },
            {
              id: 'task-a-1-3',
              content: 'Bake',
              completed: false,
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
          children: []
        },
        {
          id: 'task-b-2',
          content: 'Shower',
          completed: true,
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
          children: []
        },
        {
          id: 'task-c-2',
          content: 't17',
          completed: false,
          children: []
        },
        {
          id: 'task-c-3',
          content: 'Test task from SQL',
          completed: false,
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

      /* show dotted box when hovering an empty list */
      onMove(evt) {
        // Clear all active drop targets
        document.querySelectorAll('.drop-target-active')
                .forEach(el => el.classList.remove('drop-target-active'));
                
        // Show dotted box for empty lists
        if (evt.to.children.length === 0) {
          evt.to.classList.add('drop-target-active');
          console.log('Empty target: Make it an active drop target');
        }
        
        // Log the drag movement for debugging
        console.log(`Dragging item ${evt.dragged.textContent.trim()} over/near ${evt.related ? evt.related.textContent.trim() : 'unknown'}`);
        
        // Add special class to ALL empty lists to make them visible as potential drop targets
        document.querySelectorAll('.task-list:empty').forEach(list => {
          if (list !== evt.to) { // Don't double-highlight the current target
            list.classList.add('drop-target-hint');
          }
        });
        
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
        // Inherit the same dotted box behavior
        document.querySelectorAll('.drop-target-active')
                .forEach(el => el.classList.remove('drop-target-active'));
                
        if (evt.to.children.length === 0) {
          evt.to.classList.add('drop-target-active');
        }
        
        // Add special class to ALL empty lists to make them visible as potential drop targets
        document.querySelectorAll('.task-list:empty').forEach(list => {
          if (list !== evt.to) {
            list.classList.add('drop-target-hint');
          }
        });
        
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
