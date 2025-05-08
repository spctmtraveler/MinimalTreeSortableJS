// -------------  Task Tree Demo  ------------------
// Minimalist visuals • accurate indent • compact drag preview
// Updated: 2025‑05‑07 02:30
//  ✱ drop target & ghost now render at correct child indent
//  ✱ dragged / ghost items are fully compact (no chevron gap)
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Sample Data ----------- */
  const sampleTasks = [
    {
      id: 'task-1',
      content: 'Project Planning',
      children: [
        {
          id: 'task-1-1',
          content: 'Define project scope',
          children: [
            {
              id: 'task-1-1-1',
              content: 'Gather requirements',
              children: [
                {
                  id: 'task-1-1-1-1',
                  content: 'Interview stakeholders',
                  children: [
                    {
                      id: 'task-1-1-1-1-1',
                      content: 'Prepare interview questions',
                      children: [
                        {
                          id: 'task-1-1-1-1-1-1',
                          content: 'Research domain expertise',
                          children: []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'task-1-2',
          content: 'Create timeline',
          children: [
            { id: 'task-1-2-1', content: 'Identify key milestones', children: [] },
            { id: 'task-1-2-2', content: 'Assign resources', children: [] }
          ]
        }
      ]
    },
    {
      id: 'task-2',
      content: 'Development',
      children: [
        { id: 'task-2-1', content: 'Frontend implementation', children: [] },
        { id: 'task-2-2', content: 'Backend services', children: [] }
      ]
    },
    { id: 'task-3', content: 'Testing', children: [] },
    {
      id: 'task-4',
      content: 'Deployment',
      children: [
        { id: 'task-4-1', content: 'Prepare production environment', children: [] }
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
    createSortable(ul);

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;

      /* --- content row --- */
      const row = document.createElement('div');
      row.className = 'task-content';
      li.appendChild(row);

      /* chevron */
      const chevron = document.createElement('span');
      chevron.className = 'toggle-btn';
      chevron.textContent = '▸';
      chevron.style.display = task.children?.length ? 'inline-block' : 'none';

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
      createSortable(childList, chevron, childContainer);

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
});
