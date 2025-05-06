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
                // Get the dragged task and the task we're over/near
                const draggedTask = evt.dragged;
                const relatedTask = evt.related;
                
                if (!draggedTask || !relatedTask) return true;
                
                // Get mouse position from the original event
                const mouseX = originalEvent.clientX;
                const mouseY = originalEvent.clientY;
                
                // Get the related task rect and ID
                const relatedRect = relatedTask.getBoundingClientRect();
                const relatedId = relatedTask.dataset.id;
                
                // Calculate horizontal difference from the left edge
                const horizontalPosition = mouseX - relatedRect.left;
                const horizontalPercentage = horizontalPosition / relatedRect.width * 100;
                
                console.log(`MOVE: Task ${draggedTask.dataset.id} near ${relatedId} - H pos: ${horizontalPercentage.toFixed(0)}%`);
                
                // If mouse is in the right third of the task, flag it to become a parent
                if (horizontalPercentage > 70) {
                    console.log(`RIGHT SIDE DETECTED - Task ${draggedTask.dataset.id} should indent under ${relatedId}`);
                    
                    // Mark this task as a potential parent
                    relatedTask.classList.add('indent-hover');
                    relatedTask.classList.add('should-become-parent');
                    relatedTask.dataset.shouldBecomeParent = "true";
                    
                    // Try to immediately create a children container
                    if (!relatedTask.querySelector('.task-children')) {
                        createChildrenContainer(relatedTask);
                    }
                    
                    // Highlight the parent button
                    const parentBtn = relatedTask.querySelector('.make-parent-btn');
                    if (parentBtn) {
                        parentBtn.classList.add('active');
                    }
                } else {
                    // Remove highlight if we're not in the right third
                    relatedTask.classList.remove('indent-hover');
                    
                    // Unhighlight the parent button
                    const parentBtn = relatedTask.querySelector('.make-parent-btn');
                    if (parentBtn) {
                        parentBtn.classList.remove('active');
                    }
                }
                
                // Always return true to allow the default move behavior
                return true;
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
                
                // FIRST CHECK: Look for any tasks with active parent buttons
                const activeBtns = document.querySelectorAll('.make-parent-btn.active');
                if (activeBtns.length > 0) {
                    console.log(`Found ${activeBtns.length} active parent buttons`);
                    
                    // Get the first active button and its parent task
                    const activeBtn = activeBtns[0];
                    const targetParent = activeBtn.closest('.task-item');
                    
                    if (targetParent) {
                        console.log(`BUTTON PARENT: Will move ${evt.item.dataset.id} to become child of ${targetParent.dataset.id}`);
                        
                        // Create a children container if needed
                        let childrenContainer = targetParent.querySelector('.task-children');
                        if (!childrenContainer) {
                            childrenContainer = createChildrenContainer(targetParent);
                        }
                        
                        // Get the list inside the container
                        const childList = childrenContainer.querySelector('.task-list');
                        
                        // Move the dragged item there
                        childList.appendChild(evt.item);
                        
                        // Expand the parent
                        const toggleBtn = targetParent.querySelector('.toggle-btn');
                        if (toggleBtn && !toggleBtn.classList.contains('expanded')) {
                            toggleBtn.classList.add('expanded');
                            childrenContainer.style.display = 'block';
                        }
                    }
                } 
                // SECOND CHECK: Look for tasks flagged as potential parents
                else {
                    // Check for tasks marked as potential parents
                    const potentialParents = document.querySelectorAll(
                        '.should-become-parent, .force-become-parent, .potential-parent, ' +
                        '.indent-hover, .confirmed-parent, [data-should-become-parent="true"]'
                    );
                    console.log(`Found ${potentialParents.length} potential parents to check`);
                    
                    // If we have potential parents, use the first one
                    if (potentialParents.length > 0) {
                        const targetParent = potentialParents[0];
                        console.log(`POTENTIAL PARENT: Will move ${evt.item.dataset.id} to become child of ${targetParent.dataset.id}`);
                        
                        // Create a children container if needed
                        let childrenContainer = targetParent.querySelector('.task-children');
                        if (!childrenContainer) {
                            childrenContainer = createChildrenContainer(targetParent);
                        }
                        
                        // Get the list and move the item
                        const childList = childrenContainer.querySelector('.task-list');
                        childList.appendChild(evt.item);
                        
                        // Expand the parent
                        const toggleBtn = targetParent.querySelector('.toggle-btn');
                        if (toggleBtn && !toggleBtn.classList.contains('expanded')) {
                            toggleBtn.classList.add('expanded');
                            childrenContainer.style.display = 'block';
                        }
                    }
                }
                
                // Clean up all marker classes and active states
                document.querySelectorAll(
                    '.should-become-parent, .force-become-parent, .potential-parent, ' +
                    '.indent-hover, .confirmed-parent, .make-parent-btn.active'
                ).forEach(el => {
                    el.classList.remove('should-become-parent');
                    el.classList.remove('force-become-parent');
                    el.classList.remove('potential-parent');
                    el.classList.remove('indent-hover');
                    el.classList.remove('confirmed-parent');
                    el.classList.remove('active');
                    
                    // Clean up data attributes
                    if (el.dataset && el.dataset.shouldBecomeParent) {
                        delete el.dataset.shouldBecomeParent;
                    }
                });
                
                // Make sure the parent task from the drop operation has a children container
                if (parentTask && !parentTask.querySelector('.task-children')) {
                    console.log(`Creating children container for parent task: ${parentTask.dataset.id}`);
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
            
            // HANDLE DRAG INTERACTIONS FOR ALL TASKS
            
            // Keep track of the drag position on the page
            let lastDragX = 0;
            let lastDragY = 0;
            let lastOverElement = null;
            
            // Create a dedicated indent button for each task
            const makeParentBtn = document.createElement('button');
            makeParentBtn.className = 'make-parent-btn';
            makeParentBtn.setAttribute('data-parent-id', task.id);
            makeParentBtn.innerHTML = '➕'; // Plus sign indicating "add child"
            makeParentBtn.title = "Drop here to make this a parent";
            
            // Add the button at the end of task content
            taskContent.appendChild(makeParentBtn);
            
            // Add click handler for the indent button
            makeParentBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Create a children container if one doesn't exist
                if (!taskItem.querySelector('.task-children')) {
                    console.log(`Creating parent container for ${task.id} via button click`);
                    createChildrenContainer(taskItem);
                }
            });
            
            // Also make the button droppable for parent creation
            makeParentBtn.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Dragover on PARENT BUTTON for ${task.id}`);
                
                taskItem.classList.add('indent-hover');
                this.classList.add('active');
                taskItem.dataset.shouldBecomeParent = "true";
            });
            
            makeParentBtn.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`DROP ON PARENT BUTTON for ${task.id}!!!`);
                
                // Force parent container creation
                if (!taskItem.querySelector('.task-children')) {
                    const container = createChildrenContainer(taskItem);
                    taskItem.classList.add('force-become-parent');
                    
                    window.lastCreatedContainer = container;
                    window.lastCreatedContainerParent = taskItem;
                }
            });

            // Add dragover handler - detect if we're near the add button
            taskItem.addEventListener('dragover', function(e) {
                // Always prevent default first to enable drop
                e.preventDefault();
                e.stopPropagation();
                
                // Keep track of the last element
                lastOverElement = this;
                const taskId = this.dataset.id;
                
                // Basic highlight
                this.classList.add('drag-over');
                
                // Check if we have our parent button and get its position
                const parentBtn = this.querySelector('.make-parent-btn');
                if (parentBtn) {
                    // Get mouse position
                    const mouseX = e.clientX;
                    const mouseY = e.clientY;
                    
                    // Get button position
                    const btnRect = parentBtn.getBoundingClientRect();
                    
                    // Check if we're near the button (within 30px)
                    const nearButton = (
                        Math.abs(mouseX - btnRect.left - btnRect.width/2) < 30 &&
                        Math.abs(mouseY - btnRect.top - btnRect.height/2) < 30
                    );
                    
                    if (nearButton) {
                        // We're near the parent button!
                        console.log(`*** NEAR PARENT BUTTON for ${taskId}`);
                        this.classList.add('indent-hover');
                        parentBtn.classList.add('active');
                        
                        // Flag this to become a parent
                        this.dataset.shouldBecomeParent = "true";
                    } else {
                        // Not near the button
                        this.classList.remove('indent-hover');
                        parentBtn.classList.remove('active');
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
                console.log(`DROP EVENT ON TASK: ${taskId}`);
                
                // Get mouse position
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                // Check if we're near the parent button
                const parentBtn = this.querySelector('.make-parent-btn');
                let isNearButton = false;
                
                if (parentBtn) {
                    const btnRect = parentBtn.getBoundingClientRect();
                    
                    // Check if we're near the button (within 40px - wider margin for drop)
                    isNearButton = (
                        Math.abs(mouseX - btnRect.left - btnRect.width/2) < 40 &&
                        Math.abs(mouseY - btnRect.top - btnRect.height/2) < 40
                    );
                    
                    if (isNearButton) {
                        console.log(`*** DROP NEAR PARENT BUTTON for ${taskId}`);
                    }
                }
                
                // Create a parent container if needed
                if (isNearButton || this.classList.contains('indent-hover') || this.dataset.shouldBecomeParent === 'true') {
                    console.log(`*** TASK ${taskId} SHOULD BECOME A PARENT`);
                    
                    // Create a new container if one doesn't exist
                    if (!this.querySelector('.task-children')) {
                        console.log(`*** CREATING PARENT CONTAINER FOR TASK: ${taskId}`);
                        const container = createChildrenContainer(this);
                        
                        // Flag this for the onEnd handler
                        this.classList.add('force-become-parent');
                        
                        // Store references for later access
                        window.lastCreatedContainer = container;
                        window.lastCreatedContainerParent = this;
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