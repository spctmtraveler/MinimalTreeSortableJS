// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Sample task data with nested structure (5+ levels deep)
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
                        {
                            id: 'task-1-2-1',
                            content: 'Identify key milestones',
                            children: []
                        },
                        {
                            id: 'task-1-2-2',
                            content: 'Assign resources',
                            children: []
                        }
                    ]
                }
            ]
        },
        {
            id: 'task-2',
            content: 'Development',
            children: [
                {
                    id: 'task-2-1',
                    content: 'Frontend implementation',
                    children: []
                },
                {
                    id: 'task-2-2',
                    content: 'Backend services',
                    children: []
                }
            ]
        },
        {
            id: 'task-3',
            content: 'Testing',
            children: []
        },
        {
            id: 'task-4',
            content: 'Deployment',
            children: [
                {
                    id: 'task-4-1',
                    content: 'Prepare production environment',
                    children: []
                }
            ]
        }
    ];

    // Get the task tree container
    const taskTreeContainer = document.getElementById('task-tree');
    
    /**
     * Recursive function to build the tree structure
     * @param {Array} tasks - Array of task objects
     * @param {HTMLElement} parentElement - Parent element to append to
     */
    function buildTreeNodes(tasks, parentElement) {
        // Create a list element for this level
        const listElement = document.createElement('ul');
        listElement.className = 'task-list';
        parentElement.appendChild(listElement);
        
        // Initialize Sortable on this list
        new Sortable(listElement, {
            group: {
                name: 'nested',
                pull: true,
                put: true 
            },     
            animation: 150,
            fallbackOnBody: true,
            delay: 0,           
            touchStartThreshold: 3,
            swapThreshold: 0.65,
            emptyInsertThreshold: 10, 
            invertSwap: true,   
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            filter: '[data-no-drag]',
            preventOnFilter: false,
            forceFallback: true,
            
            // Handle when drag ends
            onEnd: function(evt) {
                const taskId = evt.item.dataset.id;
                console.log(`Task moved: ${taskId}`);
                
                // Get the parent task (if any) that we moved TO
                const parentList = evt.to;
                const parentTask = parentList.closest('.task-item');
                
                // Debug info about where item was moved
                if (parentTask) {
                    console.log(`Dropped into parent task: ${parentTask.dataset.id}`);
                } else {
                    console.log('Dropped at root level');
                }
                
                // Check if the FROM list is now empty, and remove parent status if needed
                const fromList = evt.from;
                const fromTask = fromList.closest('.task-item');
                
                if (fromTask && fromList.children.length === 0) {
                    console.log(`Source list for ${fromTask.dataset.id} is now empty, removing parent status`);
                    
                    // Hide the children container but keep it in the DOM for future drops
                    const childContainer = fromTask.querySelector('.task-children');
                    if (childContainer) {
                        childContainer.style.display = 'none';
                    }
                    
                    // Hide the toggle 
                    const toggleBtn = fromTask.querySelector('.toggle-btn');
                    if (toggleBtn) {
                        toggleBtn.style.display = 'none';
                    }
                }
            }
        });
        
        // Loop through each task and create list items
        tasks.forEach(task => {
            // Create list item
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id;
            
            // Create the task content container (draggable part)
            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            
            // Create child container UP FRONT for ALL tasks, even those without children
            // This is CRITICAL - it ensures SortableJS can drop into any task
            const childContainer = document.createElement('div');
            childContainer.className = 'task-children';
            
            // Only display if we have children
            childContainer.style.display = (task.children && task.children.length > 0) ? 'block' : 'none';
            
            // Create the empty list that will be a drop target
            const childList = document.createElement('ul');
            childList.className = 'task-list';
            
            // Add the child list to the container
            childContainer.appendChild(childList);
            
            // Create toggle button for all tasks
            const toggleBtn = document.createElement('span');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.innerHTML = '▶';
            
            // Only show toggle for tasks with children initially
            toggleBtn.style.display = (task.children && task.children.length > 0) ? 'inline-block' : 'none';
            if (task.children && task.children.length > 0) {
                toggleBtn.classList.add('expanded');
                toggleBtn.style.transform = 'rotate(90deg)';
            }
            
            // Create a separate area for toggle click to improve mobile usability
            const toggleArea = document.createElement('div');
            toggleArea.className = 'toggle-area';
            toggleArea.setAttribute('data-no-drag', 'true');
            toggleArea.appendChild(toggleBtn);
            
            // Toggle functionality 
            toggleArea.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const isExpanded = toggleBtn.classList.contains('expanded');
                
                if (isExpanded) {
                    childContainer.style.display = 'none';
                    toggleBtn.classList.remove('expanded');
                    toggleBtn.style.transform = 'rotate(0deg)';
                } else {
                    childContainer.style.display = 'block';
                    toggleBtn.classList.add('expanded');
                    toggleBtn.style.transform = 'rotate(90deg)';
                }
            });
            
            // Create text content
            const taskText = document.createElement('span');
            taskText.textContent = task.content;
            taskText.className = 'task-text';
            
            // Assemble the content
            taskContent.appendChild(toggleArea);
            taskContent.appendChild(taskText);
            taskItem.appendChild(taskContent);
            taskItem.appendChild(childContainer);
            
            // Initialize Sortable on the child list
            new Sortable(childList, {
                group: { 
                    name: 'nested', 
                    pull: true, 
                    put: true 
                },
                animation: 150,
                fallbackOnBody: true,
                delay: 0,
                touchStartThreshold: 3,
                swapThreshold: 0.65,
                emptyInsertThreshold: 10,
                invertSwap: true,
                ghostClass: 'task-ghost',
                chosenClass: 'task-chosen',
                dragClass: 'task-drag',
                filter: '[data-no-drag]',
                preventOnFilter: false,
                forceFallback: true,
                
                // Special handler for when an item is added to this list from another list
                onAdd: function(evt) {
                    console.log(`Item ${evt.item.dataset.id} added to task ${task.id}`);
                    
                    // Show this container since it now has an item
                    childContainer.style.display = 'block';
                    
                    // Show the toggle since it's now a parent
                    toggleBtn.style.display = 'inline-block';
                    toggleBtn.classList.add('expanded');
                    toggleBtn.style.transform = 'rotate(90deg)';
                }
            });
            
            // Recursively build any existing children
            if (task.children && task.children.length > 0) {
                buildTreeNodes(task.children, childList);
            }
            
            // Add the task item to the list
            listElement.appendChild(taskItem);
        });
    }
    
    // Initialize the tree with the sample data
    buildTreeNodes(sampleTasks, taskTreeContainer);
    
    // Log a message when the tree is initialized
    console.log('Task tree initialized with drag-and-drop and collapsible functionality');
});