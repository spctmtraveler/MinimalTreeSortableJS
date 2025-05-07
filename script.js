// -------------  Task Tree Demo  ------------------
// Visual polish pass – minimalist look
// Drop zones are subtle unless active. Tree lines removed.
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
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

  const treeRoot = document.getElementById('task-tree');
  buildTree(sampleTasks, treeRoot);

  function buildTree(tasks, parentElem) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    parentElem.appendChild(ul);
    createSortable(ul);

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;

      const content = document.createElement('div');
      content.className = 'task-content';
      li.appendChild(content);

      const toggle = document.createElement('span');
      toggle.className = 'toggle-btn';
      toggle.innerHTML = '▸';
      toggle.style.display = task.children?.length ? 'inline-block' : 'none';

      const toggleArea = document.createElement('div');
      toggleArea.className = 'toggle-area';
      toggleArea.setAttribute('data-no-drag', 'true');
      toggleArea.appendChild(toggle);
      content.appendChild(toggleArea);

      toggleArea.addEventListener('click', e => {
        e.stopPropagation();
        const open = toggle.classList.toggle('expanded');
        toggle.innerHTML = open ? '▾' : '▸';
        childCtr.style.display = open ? 'block' : 'none';
      });

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.content;
      content.appendChild(span);

      const childCtr = document.createElement('div');
      childCtr.className = 'task-children';
      li.appendChild(childCtr);

      const childList = document.createElement('ul');
      childList.className = 'task-list';
      childCtr.appendChild(childList);

      createSortable(childList, task, toggle, childCtr);

      if (task.children?.length) {
        buildTree(task.children, childList);
        toggle.classList.add('expanded');
        toggle.innerHTML = '▾';
      }

      ul.appendChild(li);
    });
  }

  function createSortable(listElem, owningTask = null, toggleBtn = null, container = null) {
    if (listElem.dataset.sortable) return;

    new Sortable(listElem, {
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

      onAdd(evt) {
        if (!toggleBtn) return;
        container.style.display = 'block';
        toggleBtn.style.display = 'inline-block';
        toggleBtn.classList.add('expanded');
        toggleBtn.innerHTML = '▾';
      },

      onRemove(evt) {
        const parentLi = evt.from.closest('.task-item');
        if (!parentLi) return;
        const listLeft = evt.from;
        if (listLeft.children.length === 0) {
          const tgl = parentLi.querySelector('.toggle-btn');
          if (tgl) tgl.style.display = 'none';
        }
      }
    });

    listElem.dataset.sortable = '1';
  }
});
