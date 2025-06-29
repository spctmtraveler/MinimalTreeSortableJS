// DUN Hours Standalone - Interactive Timeline Scheduler
// Global debug flag
const DEBUG = true;

// Global task counter and data store
let taskCounter = 1;
let tasks = [];

// Time constants
const PIXELS_PER_HOUR = 60;
const PIXELS_PER_15MIN = 15;
const TOTAL_HOURS = 24;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    if (DEBUG) console.log('DUN Hours Standalone - Initializing...');
    
    generateTimelineGrid();
    setupInteractions();
    updateCurrentTimeLine();
    updateLimitLines();
    
    // Update current time every 5 minutes
    setInterval(updateCurrentTimeLine, 5 * 60 * 1000);
    
    if (DEBUG) console.log('DUN Hours Standalone - Ready!');
});

// Generate the timeline grid with hour labels
function generateTimelineGrid() {
    const grid = document.getElementById('timeline-grid');
    
    // Create hour labels
    for (let hour = 0; hour < TOTAL_HOURS; hour++) {
        const label = document.createElement('div');
        label.className = 'hour-label' + (hour >= 12 ? ' pm' : '');
        label.style.top = (hour * PIXELS_PER_HOUR) + 'px';
        
        // Format hour display (12-hour format)
        let displayHour = hour;
        if (hour === 0) displayHour = 12;
        else if (hour > 12) displayHour = hour - 12;
        
        label.textContent = displayHour;
        grid.appendChild(label);
    }
}

// Update current time line position
function updateCurrentTimeLine() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Calculate position (snap to nearest 5 minutes for smooth updates)
    const totalMinutes = hours * 60 + Math.floor(minutes / 5) * 5;
    const pixelPosition = (totalMinutes / 60) * PIXELS_PER_HOUR;
    
    const timeLine = document.getElementById('current-time-line');
    timeLine.style.top = pixelPosition + 'px';
}

// Update limit lines and remaining time calculations
function updateLimitLines() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Calculate remaining time to STOP (6 PM = 18:00)
    const stopMinutes = 18 * 60;
    const stopRemaining = calculateRemainingTime(currentMinutes, stopMinutes);
    document.getElementById('stop-remaining').textContent = stopRemaining;
    
    // Calculate remaining time to SLEEP (11 PM = 23:00)
    const sleepMinutes = 23 * 60;
    const sleepRemaining = calculateRemainingTime(currentMinutes, sleepMinutes);
    document.getElementById('sleep-remaining').textContent = sleepRemaining;
}

// Calculate remaining time display
function calculateRemainingTime(current, target) {
    let diff = target - current;
    if (diff <= 0) diff += 24 * 60; // Next day
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')} rem`;
}

// Setup all interactions
function setupInteractions() {
    setupDoubleClick();
    setupQuickAdd();
    setupLimitLineDragging();
}

// Setup double-click to create tasks
function setupDoubleClick() {
    const grid = document.getElementById('timeline-grid');
    
    grid.addEventListener('dblclick', function(e) {
        // Calculate time slot from click position
        const rect = grid.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        
        // Snap to nearest 15-minute increment
        const totalMinutes = Math.round((clickY / PIXELS_PER_HOUR) * 60 / 15) * 15;
        const startTime = Math.max(0, Math.min(totalMinutes, 24 * 60 - 15));
        
        // Prompt for task name
        const taskName = prompt('Enter task name:');
        if (taskName && taskName.trim()) {
            createTask(taskName.trim(), startTime, 60); // 60 minutes default
            if (DEBUG) console.log('create', { name: taskName, startTime, duration: 60 });
        }
    });
}

// Setup quick add functionality
function setupQuickAdd() {
    const input = document.getElementById('quick-add-input');
    const addBtn = document.getElementById('add-btn');
    
    function quickAdd() {
        const taskName = input.value.trim();
        if (taskName) {
            // Add at current time, snapped to 15-minute increment
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startTime = Math.round(currentMinutes / 15) * 15;
            
            createTask(taskName, startTime, 60);
            input.value = '';
            if (DEBUG) console.log('create', { name: taskName, startTime, duration: 60, source: 'quick-add' });
        }
    }
    
    addBtn.addEventListener('click', quickAdd);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') quickAdd();
    });
}

// Create a new task
function createTask(title, startMinutes, durationMinutes) {
    const task = {
        id: taskCounter++,
        title: title,
        startIndex: Math.floor(startMinutes / 15), // 15-minute units
        durationSteps: Math.floor(durationMinutes / 15) // 15-minute units
    };
    
    // Check for overlaps
    if (hasOverlap(task)) {
        if (DEBUG) console.log('create failed - overlap detected', task);
        alert('Cannot create task: overlaps with existing task');
        return null;
    }
    
    tasks.push(task);
    renderTask(task);
    return task;
}

// Check if task overlaps with existing tasks
function hasOverlap(task, excludeId = null) {
    const taskStart = task.startIndex;
    const taskEnd = task.startIndex + task.durationSteps;
    
    return tasks.some(existingTask => {
        if (excludeId && existingTask.id === excludeId) return false;
        
        const existingStart = existingTask.startIndex;
        const existingEnd = existingTask.startIndex + existingTask.durationSteps;
        
        return !(taskEnd <= existingStart || taskStart >= existingEnd);
    });
}

// Render a task block in the timeline
function renderTask(task) {
    const container = document.querySelector('.hours-container');
    const taskElement = document.createElement('div');
    taskElement.className = 'task-block';
    taskElement.id = `task-${task.id}`;
    
    // Position the task
    const topPosition = task.startIndex * PIXELS_PER_15MIN;
    const height = task.durationSteps * PIXELS_PER_15MIN;
    
    taskElement.style.top = topPosition + 'px';
    taskElement.style.height = height + 'px';
    
    // Task content
    taskElement.innerHTML = `
        <div class="task-title" data-task-id="${task.id}">${task.title}</div>
        <div class="task-controls">
            <button class="edit-btn" title="Edit">✏️</button>
            <button class="delete-btn" title="Delete">✕</button>
        </div>
        <div class="resize-handle"></div>
    `;
    
    container.appendChild(taskElement);
    
    // Setup task interactions
    setupTaskInteractions(taskElement, task);
}

// Setup interactions for a specific task
function setupTaskInteractions(element, task) {
    // Inline title editing
    const titleElement = element.querySelector('.task-title');
    titleElement.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        startInlineEdit(titleElement, task);
    });
    
    // Edit button
    element.querySelector('.edit-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        openTaskModal(task);
    });
    
    // Delete button
    element.querySelector('.delete-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    // Double-click on task body opens modal
    element.addEventListener('dblclick', function(e) {
        if (e.target === titleElement) return; // Already handled
        openTaskModal(task);
    });
    
    // Setup dragging
    interact(element).draggable({
        listeners: {
            start(event) {
                event.target.classList.add('dragging');
                if (DEBUG) console.log('dragStart', { id: task.id, title: task.title });
            },
            move(event) {
                const target = event.target;
                const rect = target.getBoundingClientRect();
                const container = document.querySelector('.hours-container');
                const containerRect = container.getBoundingClientRect();
                
                // Calculate new position, snapped to 15-minute increments
                let newTop = rect.top - containerRect.top + event.dy;
                newTop = Math.max(0, Math.min(newTop, TOTAL_HOURS * PIXELS_PER_HOUR - task.durationSteps * PIXELS_PER_15MIN));
                newTop = Math.round(newTop / PIXELS_PER_15MIN) * PIXELS_PER_15MIN;
                
                target.style.top = newTop + 'px';
            },
            end(event) {
                event.target.classList.remove('dragging');
                
                // Update task data
                const newTop = parseInt(event.target.style.top);
                const newStartIndex = Math.round(newTop / PIXELS_PER_15MIN);
                
                // Create temporary task object to check overlap
                const tempTask = { ...task, startIndex: newStartIndex };
                
                if (hasOverlap(tempTask, task.id)) {
                    // Revert position - overlap detected
                    event.target.classList.add('overlap-error');
                    event.target.style.top = (task.startIndex * PIXELS_PER_15MIN) + 'px';
                    
                    setTimeout(() => {
                        event.target.classList.remove('overlap-error');
                    }, 400);
                    
                    if (DEBUG) console.log('dragEnd failed - overlap', { id: task.id, attempted: newStartIndex });
                } else {
                    // Update task data
                    task.startIndex = newStartIndex;
                    if (DEBUG) console.log('dragEnd', { id: task.id, newStartIndex });
                }
            }
        }
    });
    
    // Setup resizing
    const resizeHandle = element.querySelector('.resize-handle');
    interact(resizeHandle).draggable({
        listeners: {
            start(event) {
                element.classList.add('resizing');
                if (DEBUG) console.log('resize start', { id: task.id });
            },
            move(event) {
                const currentHeight = parseInt(element.style.height);
                let newHeight = currentHeight + event.dy;
                
                // Snap to 15-minute increments, minimum 15 minutes
                newHeight = Math.max(PIXELS_PER_15MIN, newHeight);
                newHeight = Math.round(newHeight / PIXELS_PER_15MIN) * PIXELS_PER_15MIN;
                
                // Don't exceed timeline bounds
                const currentTop = parseInt(element.style.top);
                const maxHeight = (TOTAL_HOURS * PIXELS_PER_HOUR) - currentTop;
                newHeight = Math.min(newHeight, maxHeight);
                
                element.style.height = newHeight + 'px';
            },
            end(event) {
                element.classList.remove('resizing');
                
                const newHeight = parseInt(element.style.height);
                const newDurationSteps = Math.round(newHeight / PIXELS_PER_15MIN);
                
                // Check if resize causes overlap
                const tempTask = { ...task, durationSteps: newDurationSteps };
                
                if (hasOverlap(tempTask, task.id)) {
                    // Revert size - overlap detected
                    element.classList.add('overlap-error');
                    element.style.height = (task.durationSteps * PIXELS_PER_15MIN) + 'px';
                    
                    setTimeout(() => {
                        element.classList.remove('overlap-error');
                    }, 400);
                    
                    if (DEBUG) console.log('resize failed - overlap', { id: task.id, attempted: newDurationSteps });
                } else {
                    // Update task data
                    task.durationSteps = newDurationSteps;
                    if (DEBUG) console.log('resize', { id: task.id, newDurationSteps });
                }
            }
        }
    });
}

// Start inline editing of task title
function startInlineEdit(titleElement, task) {
    const originalText = titleElement.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'task-title editing';
    
    function finishEdit() {
        const newTitle = input.value.trim() || originalText;
        task.title = newTitle;
        titleElement.textContent = newTitle;
        titleElement.classList.remove('editing');
        input.replaceWith(titleElement);
    }
    
    function cancelEdit() {
        titleElement.classList.remove('editing');
        input.replaceWith(titleElement);
    }
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
    
    input.addEventListener('blur', finishEdit);
    
    titleElement.classList.add('editing');
    titleElement.replaceWith(input);
    input.focus();
    input.select();
}

// Delete a task
function deleteTask(taskId) {
    if (confirm('Delete this task?')) {
        // Remove from data
        tasks = tasks.filter(task => task.id !== taskId);
        
        // Remove from DOM
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.remove();
        }
        
        if (DEBUG) console.log('delete', { id: taskId });
    }
}

// Open task edit modal
function openTaskModal(task) {
    const modal = createTaskModal(task);
    document.body.appendChild(modal);
    
    // Focus first input
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
}

// Create task edit modal
function createTaskModal(task) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Convert task time to hours and minutes
    const startMinutes = task.startIndex * 15;
    const startHours = Math.floor(startMinutes / 60);
    const startMins = startMinutes % 60;
    const durationMinutes = task.durationSteps * 15;
    
    overlay.innerHTML = `
        <div class="modal">
            <h2>Edit Task</h2>
            <div class="modal-field">
                <label>Title</label>
                <input type="text" id="modal-title" value="${task.title}" required>
            </div>
            <div class="modal-field">
                <label>Start Time</label>
                <input type="time" id="modal-start-time" value="${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}" step="900">
            </div>
            <div class="modal-field">
                <label>Duration (minutes)</label>
                <input type="number" id="modal-duration" value="${durationMinutes}" min="15" step="15">
            </div>
            <div class="modal-field">
                <label>Description</label>
                <textarea id="modal-description" rows="3" placeholder="Optional notes..."></textarea>
            </div>
            <div class="modal-actions">
                <button class="danger" id="modal-delete">Delete</button>
                <button class="secondary" id="modal-cancel">Cancel</button>
                <button class="primary" id="modal-save">Save</button>
            </div>
        </div>
    `;
    
    // Setup modal interactions
    overlay.querySelector('#modal-cancel').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.querySelector('#modal-delete').addEventListener('click', () => {
        overlay.remove();
        deleteTask(task.id);
    });
    
    overlay.querySelector('#modal-save').addEventListener('click', () => {
        saveTaskFromModal(task, overlay);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Close on Escape key
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
        }
    });
    
    return overlay;
}

// Save task changes from modal
function saveTaskFromModal(task, modalOverlay) {
    const title = modalOverlay.querySelector('#modal-title').value.trim();
    const startTime = modalOverlay.querySelector('#modal-start-time').value;
    const duration = parseInt(modalOverlay.querySelector('#modal-duration').value);
    
    if (!title) {
        alert('Title is required');
        return;
    }
    
    // Parse start time
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const newStartIndex = Math.floor(startMinutes / 15);
    const newDurationSteps = Math.floor(duration / 15);
    
    // Check for overlaps with the new values
    const tempTask = { ...task, startIndex: newStartIndex, durationSteps: newDurationSteps };
    if (hasOverlap(tempTask, task.id)) {
        alert('Cannot save: time slot conflicts with another task');
        return;
    }
    
    // Update task
    task.title = title;
    task.startIndex = newStartIndex;
    task.durationSteps = newDurationSteps;
    
    // Update DOM
    const taskElement = document.getElementById(`task-${task.id}`);
    if (taskElement) {
        taskElement.querySelector('.task-title').textContent = title;
        taskElement.style.top = (newStartIndex * PIXELS_PER_15MIN) + 'px';
        taskElement.style.height = (newDurationSteps * PIXELS_PER_15MIN) + 'px';
    }
    
    modalOverlay.remove();
    if (DEBUG) console.log('modal save', { id: task.id, title, startIndex: newStartIndex, durationSteps: newDurationSteps });
}

// Setup limit line dragging
function setupLimitLineDragging() {
    const stopLine = document.getElementById('stop-line');
    const sleepLine = document.getElementById('sleep-line');
    
    // Make limit lines draggable
    [stopLine, sleepLine].forEach(line => {
        interact(line).draggable({
            listeners: {
                start(event) {
                    if (DEBUG) console.log('limitDrag start', { line: event.target.id });
                },
                move(event) {
                    const currentTop = parseInt(event.target.style.top || getComputedStyle(event.target).top);
                    let newTop = currentTop + event.dy;
                    
                    // Snap to 15-minute increments
                    newTop = Math.round(newTop / PIXELS_PER_15MIN) * PIXELS_PER_15MIN;
                    
                    // Keep within bounds (not before 12 PM, not after 11:45 PM)
                    newTop = Math.max(12 * PIXELS_PER_HOUR, Math.min(newTop, 23.75 * PIXELS_PER_HOUR));
                    
                    event.target.style.top = newTop + 'px';
                },
                end(event) {
                    updateLimitLines();
                    if (DEBUG) console.log('limitDrag end', { line: event.target.id, position: event.target.style.top });
                }
            }
        });
    });
}