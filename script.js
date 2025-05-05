// Helper function to create children container for a task
function createChildrenContainer(taskElement) {
    if (!taskElement) return;
    
    console.log(`Creating children container for task: ${taskElement.dataset.id}`);
    
    // Remove any existing children container
    const existingContainer = taskElement.querySelector('.task-children');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create the new container
    const childContainer = document.createElement('div');
    childContainer.className = 'task-children';
    
    // Create the list element
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    childContainer.appendChild(ul);
    
    // Add to the task
    taskElement.appendChild(childContainer);
    
    // Initialize Sortable on the new list
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
        onStart: function(evt) {
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            console.log('Started dragging: ' + evt.item.dataset.id);
        },
        onEnd: function(evt) {
            const fromList = evt.from;
            const fromTask = fromList.closest('.task-item');
            
            if (fromTask && fromList.children.length === 0) {
                console.log(`Source list for ${fromTask.dataset.id} is now empty, removing parent status`);
                
                // Get the toggle area
                const toggleArea = fromTask.querySelector('.toggle-area');
                if (toggleArea) {
                    // Remove the toggle button
                    toggleArea.remove();
                }
                
                // Remove the children container
                const childContainer = fromTask.querySelector('.task-children');
                if (childContainer) {
                    childContainer.remove();
                }
            }
        }
    });
    
    // Add the toggle button if not already present
    const taskContent = taskElement.querySelector('.task-content');
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
            
            const childContainer = taskElement.querySelector('.task-children');
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
            
            const childContainer = taskElement.querySelector('.task-children');
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
    
    return childContainer;
}

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
                put: true // Simplify - always allow drops
            },     
            animation: 150,     // Animation speed when sorting
            fallbackOnBody: true,
            delay: 0,           // Needed for mobile
            touchStartThreshold: 3, 
            swapThreshold: 0.65, // Make it easier to swap items
            emptyInsertThreshold: 10, // More aggressive empty list detection
            invertSwap: true,   
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            // Filter out clicks on the toggle button
            filter: '[data-no-drag]',
            preventOnFilter: false,
            forceFallback: true, // Required for consistent drag behavior
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
                
                // Get the parent task (if any) that we moved TO
                const parentList = evt.to;
                const parentTask = parentList.closest('.task-item');
                
                // Check if the FROM list is now empty, and remove parent status if needed
                const fromList = evt.from;
                const fromTask = fromList.closest('.task-item');
                
                // Debug info about where item was moved
                if (parentTask) {
                    console.log(`Dropped into parent task: ${parentTask.dataset.id}`);
                } else {
                    console.log('Dropped at root level');
                }
                
                // Check if we need to remove parent status from the source container
                if (fromTask && fromList.children.length === 0) {
                    console.log(`Source list for ${fromTask.dataset.id} is now empty, removing parent status`);
                    
                    // Get the toggle area
                    const toggleArea = fromTask.querySelector('.toggle-area');
                    if (toggleArea) {
                        // Remove the toggle button
                        toggleArea.remove();
                    }
                    
                    // Remove the children container
                    const childContainer = fromTask.querySelector('.task-children');
                    if (childContainer) {
                        childContainer.remove();
                    }
                }
                
                // Scan for ALL tasks that might need to become parents
                // This is a more aggressive approach to ensure no drop events are missed
                setTimeout(() => {
                    // First, check all tasks marked with our special classes
                    const potentialParents = document.querySelectorAll('.force-become-parent, .potential-parent, .received-drop, .is-now-parent');
                    console.log(`Found ${potentialParents.length} potential parents to check`);
                    
                    potentialParents.forEach(el => {
                        if (!el.querySelector('.task-children')) {
                            console.log(`Found task ${el.dataset.id} that wants to become a parent - creating container`);
                            createChildrenContainer(el);
                        }
                        // Clean up all marker classes
                        ['received-drop', 'force-become-parent', 'potential-parent', 'is-now-parent'].forEach(cls => {
                            if (el.classList.contains(cls)) {
                                el.classList.remove(cls);
                            }
                        });
                    });
                
                    // Next, specifically check the parent task from the drop operation
                    if (parentTask && !parentTask.querySelector('.task-children')) {
                        console.log(`Creating children container for parent task: ${parentTask.dataset.id}`);
                        createChildrenContainer(parentTask);
                    }
                }, 10);
                
                // Immediately make sure the parent task has children container
                if (parentTask && !parentTask.querySelector('.task-children')) {
                    console.log(`Direct parent handling for: ${parentTask.dataset.id}`);
                    createChildrenContainer(parentTask);
                }
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
                // Also mark this as potential parent - very important!
                this.classList.add('potential-parent');
                e.preventDefault(); // Important for drop to work
            });
            
            // Remove highlight when dragging leaves this item
            taskItem.addEventListener('dragleave', function(e) {
                this.classList.remove('drag-over');
                // Don't remove potential-parent here as we still want it to become a parent
            });
            
            // Ensure highlight is removed when drag ends (fixes stuck highlight bug)
            taskItem.addEventListener('dragend', function(e) {
                // Remove drag-over class from all items
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });
            
            // Specifically handle drop events to make a task become a parent
            taskItem.addEventListener('drop', function(e) {
                // Prevent default to ensure drop events work properly
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`DROP EVENT DETECTED ON TASK: ${this.dataset.id}`);
                
                // FORCEFULLY create a children container with a small delay to ensure SortableJS has completed its operations
                setTimeout(() => {
                    // Get a reference to this task again in case the DOM has changed
                    const task = document.querySelector(`[data-id="${this.dataset.id}"]`);
                    
                    if (task && !task.querySelector('.task-children')) {
                        console.log(`DELAYED DIRECT CREATION for task ${task.dataset.id}`);
                        
                        // Create a child container
                        const childContainer = document.createElement('div');
                        childContainer.className = 'task-children';
                        
                        // Create the list element
                        const ul = document.createElement('ul');
                        ul.className = 'task-list';
                        childContainer.appendChild(ul);
                        
                        // Add to the task
                        task.appendChild(childContainer);
                        
                        // Now add the toggle button
                        const taskContent = task.querySelector('.task-content');
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
                            
                            // Add toggle click event
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
                            
                            // Insert toggle area before the task text
                            const taskText = taskContent.querySelector('.task-text');
                            taskContent.insertBefore(toggleArea, taskText);
                        }
                        
                        // Initialize sortable
                        new Sortable(ul, {
                            group: { name: 'nested', pull: true, put: true },
                            animation: 150,
                            fallbackOnBody: true,
                            swapThreshold: 0.65,
                            emptyInsertThreshold: 10,
                            invertSwap: true,
                            ghostClass: 'task-ghost',
                            chosenClass: 'task-chosen',
                            dragClass: 'task-drag',
                            filter: '[data-no-drag]',
                            forceFallback: true
                        });
                        
                        console.log(`Child container created and initialized for ${task.dataset.id}`);
                    }
                }, 50);
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