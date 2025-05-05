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
            put: true // Simplify - always allow drops
        },     
        animation: 150,
        fallbackOnBody: true,
        delay: 0,
        touchStartThreshold: 3,
        swapThreshold: 0.65, // Make it easier to swap items
        emptyInsertThreshold: 10, // More aggressive empty list detection
        invertSwap: true,
        ghostClass: 'task-ghost',
        chosenClass: 'task-chosen',
        dragClass: 'task-drag',
        filter: '[data-no-drag]',
        preventOnFilter: false,
        forceFallback: true,
        
        // Add horizontal movement detection for indenting
        onMove: function(evt, originalEvent) {
            // Get the coordinates and elements
            const dragRect = evt.dragged.getBoundingClientRect();
            const relatedRect = evt.related.getBoundingClientRect();
            
            // Calculate horizontal and vertical position differences
            const horizontalDiff = dragRect.left - relatedRect.left;
            const verticalDiff = dragRect.top - relatedRect.top;
            
            // Get the related task's ID
            const relatedId = evt.related.dataset.id;
            
            console.log(`MOVE: Task ${evt.dragged.dataset.id} near ${relatedId} - H diff: ${horizontalDiff}px, V diff: ${verticalDiff}px`);
            
            // Check if we're moving horizontally to the right (indenting)
            if (horizontalDiff > 20) {
                console.log(`RIGHT INDENT DETECTED - Task ${evt.dragged.dataset.id} indenting under ${relatedId}`);
                
                // Mark this as a potential parent for later use
                evt.related.classList.add('should-become-parent');
                
                // Try to immediately create a children container for the related element
                if (!evt.related.querySelector('.task-children')) {
                    createChildrenContainer(evt.related);
                }
            }
        },
        
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
            
            // Calculate the bounding rectangles for the from/to containers
            const fromListRect = fromList.getBoundingClientRect();
            const toListRect = parentList.getBoundingClientRect();
            
            console.log(`FROM list rect: x=${fromListRect.left}, width=${fromListRect.width}`);
            console.log(`TO list rect: x=${toListRect.left}, width=${toListRect.width}`);
            
            // If there's a significant horizontal difference, it might indicate an indent operation
            const horizontalDiff = toListRect.left - fromListRect.left;
            console.log(`Horizontal difference between lists: ${horizontalDiff}px`);
            
            if (horizontalDiff > 20) {
                console.log(`*** SIGNIFICANT INDENT DETECTED: ${horizontalDiff}px indent`);
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
            
            // Special handler for the container that was created during the drag operation
            if (window.lastCreatedContainer && window.lastCreatedContainerParent) {
                console.log(`*** CHECKING CREATED CONTAINER for ${window.lastCreatedContainerParent.dataset.id}`);
                
                // Get the UL inside the container
                const containerList = window.lastCreatedContainer.querySelector('ul');
                
                // If the container is empty, and the current task didn't end up inside it, 
                // move the task into it now
                if (containerList && containerList.children.length === 0 && evt.to !== containerList) {
                    console.log(`*** FORCING TASK ${taskId} INTO CONTAINER for ${window.lastCreatedContainerParent.dataset.id}`);
                    
                    // First, remove the item from its current location
                    if (evt.item.parentNode) {
                        evt.item.parentNode.removeChild(evt.item);
                    }
                    
                    // Then add it to the container
                    containerList.appendChild(evt.item);
                }
                
                // Clear the references
                window.lastCreatedContainer = null;
                window.lastCreatedContainerParent = null;
            }
            
            // Scan for ALL tasks that might need to become parents
            setTimeout(() => {
                // Now check for all potential parents using various indicators we've set
                const potentialParents = document.querySelectorAll(
                    '.should-become-parent, .force-become-parent, .potential-parent, ' + 
                    '.confirmed-parent, .drag-over-right, [data-should-become-parent="true"], ' +
                    '.drop-created-container'
                );
                console.log(`Found ${potentialParents.length} potential parents to check`);
                
                potentialParents.forEach(el => {
                    if (!el.querySelector('.task-children')) {
                        console.log(`Converting task ${el.dataset.id} to parent`);
                        createChildrenContainer(el);
                    }
                    
                    // Clean up all marker classes and attributes
                    [
                        'should-become-parent', 'force-become-parent', 'potential-parent',
                        'confirmed-parent', 'drag-over-right', 'drop-created-container'
                    ].forEach(cls => {
                        if (el.classList.contains(cls)) {
                            el.classList.remove(cls);
                        }
                    });
                    
                    // Also clean up data attributes
                    delete el.dataset.shouldBecomeParent;
                });
            
                // Specifically make sure the parent task has a container
                if (parentTask && !parentTask.querySelector('.task-children')) {
                    console.log(`Creating children container for parent task: ${parentTask.dataset.id}`);
                    createChildrenContainer(parentTask);
                }
            }, 50);
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
            animation: 150,     
            fallbackOnBody: true,
            delay: 0,           
            touchStartThreshold: 3, 
            swapThreshold: 0.65, // Make it easier to swap items
            emptyInsertThreshold: 10, // More aggressive empty list detection
            invertSwap: true,   
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            filter: '[data-no-drag]',
            preventOnFilter: false,
            forceFallback: true,
            
            // Add horizontal movement detection for indenting
            onMove: function(evt, originalEvent) {
                // Get the coordinates and elements
                const dragRect = evt.dragged.getBoundingClientRect();
                const relatedRect = evt.related.getBoundingClientRect();
                
                // Calculate horizontal and vertical position differences
                const horizontalDiff = dragRect.left - relatedRect.left;
                const verticalDiff = dragRect.top - relatedRect.top;
                
                // Get the related task's ID
                const relatedId = evt.related.dataset.id;
                
                console.log(`MOVE: Task ${evt.dragged.dataset.id} near ${relatedId} - H diff: ${horizontalDiff}px, V diff: ${verticalDiff}px`);
                
                // Check if we're moving horizontally to the right (indenting)
                if (horizontalDiff > 20) {
                    console.log(`RIGHT INDENT DETECTED - Task ${evt.dragged.dataset.id} indenting under ${relatedId}`);
                    
                    // Mark this as a potential parent for later use
                    evt.related.classList.add('should-become-parent');
                    
                    // Try to immediately create a children container for the related element
                    if (!evt.related.querySelector('.task-children')) {
                        createChildrenContainer(evt.related);
                    }
                }
            },
            
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
                setTimeout(() => {
                    // Check for tasks marked as potential parents
                    const potentialParents = document.querySelectorAll('.should-become-parent, .force-become-parent, .potential-parent');
                    console.log(`Found ${potentialParents.length} potential parents to check`);
                    
                    potentialParents.forEach(el => {
                        if (!el.querySelector('.task-children')) {
                            console.log(`Converting task ${el.dataset.id} to parent`);
                            createChildrenContainer(el);
                        }
                        
                        // Clean up all marker classes
                        ['should-become-parent', 'force-become-parent', 'potential-parent'].forEach(cls => {
                            if (el.classList.contains(cls)) {
                                el.classList.remove(cls);
                            }
                        });
                    });
                
                    // Make sure the parent task from the drop operation has a children container
                    if (parentTask && !parentTask.querySelector('.task-children')) {
                        console.log(`Creating children container for parent task: ${parentTask.dataset.id}`);
                        createChildrenContainer(parentTask);
                    }
                }, 50);
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
            
            // HANDLE DRAG INTERACTIONS FOR ALL TASKS
            
            // Keep track of the drag position on the page
            let lastDragX = 0;
            let lastDragY = 0;
            let lastOverElement = null;
            
            // On dragover, flag the task for potential parenthood
            taskItem.addEventListener('dragover', function(e) {
                // IMPORTANT - Always do this first to allow drops
                e.preventDefault();
                e.stopPropagation();
                
                // Save position globals
                lastDragX = e.clientX;
                lastDragY = e.clientY;
                lastOverElement = this;
                
                const taskId = this.dataset.id;
                
                // Calculate position within the task
                const rect = this.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const horizontalPercentage = offsetX / rect.width;
                
                // Visual feedback - basic dragover first
                this.classList.add('drag-over');
                
                // Determine if we're in the right half of the task
                if (horizontalPercentage > 0.5) {
                    console.log(`*** RIGHT HALF DETECTED: ${taskId} at ${horizontalPercentage.toFixed(2)}`);
                    
                    // Try to immediately convert this to a parent
                    if (!this.classList.contains('drag-over-right')) {
                        console.log(`*** ADDING RIGHT SIDE HIGHLIGHT to ${taskId}`);
                        this.classList.add('drag-over-right');
                        this.dataset.shouldBecomeParent = "true";
                        
                        // Direct immediate container creation
                        if (!this.querySelector('.task-children')) {
                            console.log(`*** CRITICAL - CREATING PARENT CONTAINER DURING DRAGOVER FOR: ${taskId}`);
                            
                            // Create a container immediately
                            const childContainer = document.createElement('div');
                            childContainer.className = 'task-children';
                            childContainer.style.borderLeft = '2px solid #00CEF7';
                            
                            // Create the list element
                            const ul = document.createElement('ul');
                            ul.className = 'task-list';
                            ul.style.minHeight = '30px';
                            childContainer.appendChild(ul);
                            
                            // Add to the task
                            this.appendChild(childContainer);
                            
                            // Add toggle button 
                            const taskContent = this.querySelector('.task-content');
                            if (taskContent && !taskContent.querySelector('.toggle-area')) {
                                const toggleBtn = document.createElement('span');
                                toggleBtn.className = 'toggle-btn expanded';
                                toggleBtn.innerHTML = '▶';
                                toggleBtn.style.transform = 'rotate(90deg)';
                                
                                const toggleArea = document.createElement('div');
                                toggleArea.className = 'toggle-area';
                                toggleArea.setAttribute('data-no-drag', 'true');
                                toggleArea.appendChild(toggleBtn);
                                
                                // Insert before text
                                const taskText = taskContent.querySelector('.task-text');
                                if (taskText) {
                                    taskContent.insertBefore(toggleArea, taskText);
                                }
                            }
                            
                            // Initialize Sortable
                            new Sortable(ul, {
                                group: { name: 'nested', pull: true, put: true },
                                animation: 150,
                                fallbackOnBody: true, 
                                swapThreshold: 0.65,
                                invertSwap: true,
                                ghostClass: 'task-ghost',
                                filter: '[data-no-drag]',
                                forceFallback: true
                            });
                            
                            // Store it for direct access in onEnd
                            window.lastCreatedContainer = childContainer;
                            window.lastCreatedContainerParent = this;
                        }
                    }
                } else {
                    // We're in the left half, remove the right-side highlight if it exists
                    if (this.classList.contains('drag-over-right')) {
                        this.classList.remove('drag-over-right');
                    }
                }
            });
            
            // When drag leaves the item
            taskItem.addEventListener('dragleave', function(e) {
                // Only remove the general highlight, keep the right-side indicator
                this.classList.remove('drag-over');
            });
            
            // When drag ends, clean up all highlights
            taskItem.addEventListener('dragend', function(e) {
                // Clean up all drag indicators
                document.querySelectorAll('.drag-over, .drag-over-right').forEach(el => {
                    el.classList.remove('drag-over');
                    el.classList.remove('drag-over-right');
                });
                
                // This helps identify where the most recent drop occurred
                if (lastOverElement && lastOverElement.dataset.shouldBecomeParent === 'true') {
                    console.log(`CONFIRMED: Element ${lastOverElement.dataset.id} should become a parent`);
                    lastOverElement.classList.add('confirmed-parent');
                    
                    // Create the parent container right away
                    if (!lastOverElement.querySelector('.task-children')) {
                        console.log(`Creating children container for target: ${lastOverElement.dataset.id}`);
                        createChildrenContainer(lastOverElement);
                    }
                    
                    // Clear the flag
                    delete lastOverElement.dataset.shouldBecomeParent;
                }
            });
            
            // Drop event 
            taskItem.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const taskId = this.dataset.id;
                console.log(`DROP EVENT ON: ${taskId}`);
                
                // Immediately create a container if we have the right-side highlight 
                if (this.classList.contains('drag-over-right') || this.dataset.shouldBecomeParent === 'true') {
                    console.log(`*** CRITICAL: Detected that ${taskId} was highlighted as a parent target`);
                    
                    if (!this.querySelector('.task-children')) {
                        console.log(`*** CREATING PARENT CONTAINER DURING DROP for ${taskId}`);
                        const container = createChildrenContainer(this);
                        
                        // Flag this for the onEnd handler
                        this.classList.add('drop-created-container');
                        this.classList.add('force-become-parent');
                        
                        // Store references
                        window.lastCreatedContainer = container;
                        window.lastCreatedContainerParent = this;
                    }
                } else {
                    // Try to calculate where the drop is happening
                    // But note this is less reliable during the actual drop
                    try {
                        const rect = this.getBoundingClientRect();
                        const offsetX = e.clientX - rect.left;
                        const horizontalPercentage = offsetX / rect.width;
                        
                        if (horizontalPercentage > 0.5) {
                            console.log(`RIGHT SIDE DROP detected (${horizontalPercentage.toFixed(2)}) on ${taskId}`);
                            
                            if (!this.querySelector('.task-children')) {
                                console.log(`*** Creating container during drop for ${taskId} based on position`);
                                const container = createChildrenContainer(this);
                                
                                this.classList.add('force-become-parent');
                                window.lastCreatedContainer = container;
                                window.lastCreatedContainerParent = this;
                            }
                        }
                    } catch (err) {
                        console.log('Error in drop position calculation:', err);
                    }
                }
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