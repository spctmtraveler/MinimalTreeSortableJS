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
                put: function(to, from, dragEl, event) {
                    return true; // Always allow dropping into any list
                },
            },     
            animation: 150,      // Animation speed when sorting
            fallbackOnBody: true,
            delay: 0,            // Needed for mobile
            touchStartThreshold: 3, // Threshold to start drag
            swapThreshold: 0.5,  // Percentage of the item that has to be over the other to swap
            emptyInsertThreshold: 5, // Allow dropping items into empty lists
            invertSwap: true,    // Swap items when going down or up, more intuitive
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            // Filter out clicks on the toggle button
            filter: '[data-no-drag]',
            preventOnFilter: false,
            // Remove flickering outline for dragged elements
            forceFallback: true,
            // Cleanup when drag starts
            onStart: function(evt) {
                // Clear any stuck drag-over highlights
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
                
                console.log('Started dragging: ' + evt.item.dataset.id);
            },
            // Handle when items are moved between lists
            onEnd: function(evt) {
                const taskId = evt.item.dataset.id;
                console.log(`Task moved: ${taskId}`);
                
                // Get the parent task (if any)
                const parentList = evt.to;
                const parentTask = parentList.closest('.task-item');
                
                // Debug info
                if (parentTask) {
                    console.log(`Dropped into parent task: ${parentTask.dataset.id}`);
                } else {
                    console.log('Dropped at root level');
                }
                
                // If we're dropping onto a task with no children yet, we need to create the children container
                if (parentTask && !parentTask.querySelector('.task-children')) {
                    console.log(`Creating new children container for: ${parentTask.dataset.id}`);
                    
                    // Create a task-children div
                    const childContainer = document.createElement('div');
                    childContainer.className = 'task-children';
                    
                    // Get the closest UL to generate a new nested structure
                    const ul = document.createElement('ul');
                    ul.className = 'task-list';
                    childContainer.appendChild(ul);
                    
                    // Add the container to the parent task
                    parentTask.appendChild(childContainer);
                    
                    // Initialize Sortable on this new list - with identical settings to main list
                    new Sortable(ul, {
                        group: {
                            name: 'nested',
                            pull: true,
                            put: function(to, from, dragEl, event) {
                                return true; // Always allow dropping into any list
                            },
                        },
                        animation: 150,
                        fallbackOnBody: true,
                        delay: 0,
                        touchStartThreshold: 3,
                        swapThreshold: 0.5,
                        emptyInsertThreshold: 5,
                        invertSwap: true,
                        ghostClass: 'task-ghost',
                        chosenClass: 'task-chosen',
                        dragClass: 'task-drag',
                        filter: '[data-no-drag]',
                        preventOnFilter: false,
                        forceFallback: true,
                        // Cleanup when drag starts
                        onStart: function(evt) {
                            // Clear any stuck drag-over highlights
                            document.querySelectorAll('.drag-over').forEach(el => {
                                el.classList.remove('drag-over');
                            });
                            
                            console.log('Started dragging: ' + evt.item.dataset.id);
                        }
                    });
                    
                    // Make sure the parent has a toggle button
                    const taskContent = parentTask.querySelector('.task-content');
                    if (!taskContent.querySelector('.toggle-area')) {
                        // Create toggle button
                        const toggleBtn = document.createElement('span');
                        toggleBtn.className = 'toggle-btn expanded';
                        toggleBtn.innerHTML = '▶';
                        
                        // Create the toggle area
                        const toggleArea = document.createElement('div');
                        toggleArea.className = 'toggle-area';
                        toggleArea.appendChild(toggleBtn);
                        toggleArea.setAttribute('data-no-drag', 'true');
                        
                        // Add toggle functionality
                        toggleArea.addEventListener('mousedown', function(e) {
                            e.stopPropagation();
                        });
                        
                        toggleArea.addEventListener('click', function(e) {
                            e.stopPropagation();
                            
                            const childContainer = parentTask.querySelector('.task-children');
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
                        
                        toggleArea.addEventListener('touchstart', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            const childContainer = parentTask.querySelector('.task-children');
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
                        }, { passive: false });
                        
                        // Insert toggle area before the task text
                        const taskText = taskContent.querySelector('.task-text');
                        taskContent.insertBefore(toggleArea, taskText);
                    }
                }
                
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
                // This will be separate from the draggable area
                const toggleArea = document.createElement('div');
                toggleArea.className = 'toggle-area';
                toggleArea.appendChild(toggleBtn);
                
                // Make the toggle area completely separate from the draggable part
                toggleArea.setAttribute('data-no-drag', 'true');
                
                // Unified toggle function for reuse
                const toggleFunction = function(event) {
                    // Prevent event bubbling (important for nested elements)
                    event.stopPropagation();
                    // Prevent starting drag operation when clicking the toggle
                    event.preventDefault();
                    
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
                toggleArea.addEventListener('mousedown', function(e) {
                    e.stopPropagation(); // Prevent drag start
                });
                
                toggleArea.addEventListener('click', function(e) {
                    e.stopPropagation();
                    toggleFunction(e);
                });
                
                toggleArea.addEventListener('touchstart', function(e) {
                    // Prevent scrolling and dragging when touching the toggle
                    e.stopPropagation();
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
            
            // Add drop indication area to all tasks to indicate where things can be dropped
            const dropIndicator = document.createElement('div');
            dropIndicator.className = 'drop-indicator';
            taskItem.appendChild(dropIndicator);
            
            // If this task has children, build them recursively
            if (task.children && task.children.length > 0) {
                const childContainer = document.createElement('div');
                childContainer.className = 'task-children';
                taskItem.appendChild(childContainer);
                
                // Build children nodes
                buildTreeNodes(task.children, childContainer);
            }
            
            // Make the entire task item a potential drop zone
            taskItem.addEventListener('dragover', function(e) {
                // Add a temporary class to highlight this as a potential drop zone
                this.classList.add('drag-over');
            });
            
            // Remove highlight when dragging leaves this item
            taskItem.addEventListener('dragleave', function(e) {
                this.classList.remove('drag-over');
            });
            
            // Ensure highlight is removed when drag ends (fixes stuck highlight bug)
            taskItem.addEventListener('dragend', function(e) {
                // Remove drag-over class from all items
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });
            
            // Add the task item to the list
            listElement.appendChild(taskItem);
        });
    }
    
    // Initialize the tree with the sample data
    buildTreeNodes(sampleTasks, taskTreeContainer);
    
    // Log a message when the tree is initialized
    console.log('Task tree initialized with drag-and-drop and collapsible functionality');
    
    // Global cleanup for any stuck highlights
    document.addEventListener('mouseup', function() {
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    });
    
    // Global dragend event listener to clean up any remaining highlight styles
    document.addEventListener('dragend', function() {
        setTimeout(() => {
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        }, 10);
    });
});
