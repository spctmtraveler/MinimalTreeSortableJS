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
            group: 'nested',     // Set both lists to same group
            animation: 150,      // Animation speed when sorting
            fallbackOnBody: true,
            swapThreshold: 0.65,
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            // Handle when items are moved between lists
            onEnd: function(evt) {
                console.log(`Task moved: ${evt.item.dataset.id}`);
                // In a real app, you would update your data structure here
            }
        });
        
        // Loop through each task and create list items
        tasks.forEach(task => {
            // Create list item
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id;
            
            // Create the task content container
            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            
            // Add toggle button if the task has children
            if (task.children && task.children.length > 0) {
                const toggleBtn = document.createElement('span');
                toggleBtn.className = 'toggle-btn expanded';
                toggleBtn.innerHTML = '▶';
                
                // Create a separate area for toggle click to improve mobile usability
                const toggleArea = document.createElement('div');
                toggleArea.className = 'toggle-area';
                toggleArea.appendChild(toggleBtn);
                
                // Unified toggle function for reuse
                const toggleFunction = function(event) {
                    // Prevent event bubbling (important for nested elements)
                    event.stopPropagation();
                    
                    const childContainer = taskItem.querySelector('.task-children');
                    const isExpanded = toggleBtn.classList.contains('expanded');
                    
                    console.log('Toggle clicked for task: ' + task.id + ', currently expanded: ' + isExpanded);
                    
                    if (isExpanded) {
                        childContainer.style.display = 'none';
                        toggleBtn.classList.remove('expanded');
                        toggleBtn.style.transform = 'rotate(0deg)';
                    } else {
                        childContainer.style.display = 'block';
                        toggleBtn.classList.add('expanded');
                        toggleBtn.style.transform = 'rotate(90deg)';
                    }
                };
                
                // Add multiple event listeners for better mobile compatibility
                toggleArea.addEventListener('click', toggleFunction);
                toggleArea.addEventListener('touchstart', function(e) {
                    // Prevent scrolling when touching the toggle
                    e.preventDefault();
                    toggleFunction(e);
                }, { passive: false });
                
                taskContent.appendChild(toggleArea);
            }
            
            // Create text content
            const taskText = document.createElement('span');
            taskText.textContent = task.content;
            taskText.className = 'task-text';
            taskContent.appendChild(taskText);
            
            // Add task content to the list item
            taskItem.appendChild(taskContent);
            
            // If this task has children, build them recursively
            if (task.children && task.children.length > 0) {
                const childContainer = document.createElement('div');
                childContainer.className = 'task-children';
                taskItem.appendChild(childContainer);
                
                // Build children nodes
                buildTreeNodes(task.children, childContainer);
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
