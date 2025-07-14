// EMERGENCY FILTER AND DATE FIX - Direct DOM intervention
console.log('🚨 EMERGENCY FIX: Loading immediate solutions...');

// Get today's date
const today = new Date().toISOString().split('T')[0];
console.log(`🚨 Today is: ${today}`);

// Emergency filter function
function emergencyFilter() {
  let dropdown = document.getElementById('filter-dropdown');
  if (!dropdown) {
    console.log('🚨 CRITICAL: Dropdown missing from DOM! Recreating...');
    
    // Find the filter container and add dropdown if missing
    const filterContainer = document.querySelector('.filter-container');
    if (filterContainer) {
      console.log('🚨 Found filter container, recreating dropdown...');
      filterContainer.innerHTML = `
        <select id="filter-dropdown">
          <option value="all">All</option>
          <option value="triage">Triage</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="this-week">This Week</option>
          <option value="next-week">Next Week</option>
          <option value="this-month">This Month</option>
          <option value="next-month">Next Month</option>
        </select>
      `;
      dropdown = document.getElementById('filter-dropdown');
      console.log('🚨 Dropdown recreated successfully');
    } else {
      console.log('🚨 No filter container found, retrying in 300ms...');
      setTimeout(emergencyFilter, 300);
      return;
    }
  }
  
  const currentFilter = dropdown.value;
  console.log(`🚨 EMERGENCY FILTER: Current filter is "${currentFilter}"`);
  
  // Force show all tasks first
  const allTasks = document.querySelectorAll('.task-item');
  console.log(`🚨 Found ${allTasks.length} total task elements`);
  
  allTasks.forEach(task => {
    if (task.classList.contains('section-header')) {
      task.style.display = '';
      return;
    }
    
    const taskData = task.dataset.taskData;
    if (!taskData) {
      task.style.display = '';
      return;
    }
    
    try {
      const data = JSON.parse(taskData);
      let show = true;
      
      if (currentFilter === 'today') {
        if (data.revisitDate) {
          const taskDate = data.revisitDate.split('T')[0];
          show = taskDate === today;
          console.log(`🚨 TODAY: "${data.content}" ${taskDate} === ${today} ? ${show}`);
        } else {
          show = false;
          console.log(`🚨 TODAY: "${data.content}" no date = false`);
        }
      } else if (currentFilter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        if (data.revisitDate) {
          const taskDate = data.revisitDate.split('T')[0];
          show = taskDate === tomorrowStr;
          console.log(`🚨 TOMORROW: "${data.content}" ${taskDate} === ${tomorrowStr} ? ${show}`);
        } else {
          show = false;
        }
      } else if (currentFilter === 'triage') {
        // Show if in triage section OR no date OR past due
        if (data.parent_id === 'section-triage') {
          show = true;
          console.log(`🚨 TRIAGE: "${data.content}" in triage section = true`);
        } else if (!data.revisitDate) {
          show = true;
          console.log(`🚨 TRIAGE: "${data.content}" no date = true`);
        } else {
          const taskDate = data.revisitDate.split('T')[0];
          show = taskDate < today && !data.completed;
          console.log(`🚨 TRIAGE: "${data.content}" past due check: ${taskDate} < ${today} && !completed = ${show}`);
        }
      } else if (currentFilter === 'all') {
        show = true;
      }
      
      task.style.display = show ? '' : 'none';
      
    } catch (e) {
      console.error('🚨 Parse error:', e);
      task.style.display = '';
    }
  });
  
  console.log(`🚨 EMERGENCY FILTER: Applied "${currentFilter}" filter`);
}

// Emergency date display function
function emergencyDateDisplay() {
  const toggle = document.getElementById('show-dates-toggle-checkbox');
  if (!toggle) {
    console.log('🚨 Date toggle not found, retrying...');
    setTimeout(emergencyDateDisplay, 300);
    return;
  }
  
  console.log('🚨 EMERGENCY DATE: Setting up persistent date display...');
  
  // Load saved state
  const saved = localStorage.getItem('showDatesAlways') === 'true';
  toggle.checked = saved;
  
  function applyDateDisplay(show) {
    if (show) {
      document.body.classList.add('show-dates-always');
      document.body.setAttribute('data-show-dates', 'true');
      console.log('🚨 DATE: Enabled persistent date display');
    } else {
      document.body.classList.remove('show-dates-always');
      document.body.removeAttribute('data-show-dates');
      console.log('🚨 DATE: Disabled persistent date display');
    }
  }
  
  // Apply initial state
  applyDateDisplay(saved);
  
  // Handle toggle changes
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    localStorage.setItem('showDatesAlways', isEnabled.toString());
    applyDateDisplay(isEnabled);
  });
  
  console.log('✅ EMERGENCY DATE: Persistent date display configured');
}

// Override dropdown change handler
function setupEmergencyDropdown() {
  const dropdown = document.getElementById('filter-dropdown');
  if (!dropdown) {
    setTimeout(setupEmergencyDropdown, 300);
    return;
  }
  
  // Clone dropdown to remove existing listeners
  const newDropdown = dropdown.cloneNode(true);
  dropdown.parentNode.replaceChild(newDropdown, dropdown);
  
  newDropdown.addEventListener('change', () => {
    console.log(`🚨 DROPDOWN: Changed to "${newDropdown.value}"`);
    setTimeout(emergencyFilter, 50); // Small delay to ensure DOM is ready
  });
  
  // Apply current filter immediately
  emergencyFilter();
  
  console.log('✅ EMERGENCY DROPDOWN: Override complete');
}

// Debug Hours Panel Structure
function debugHoursPanel() {
  console.log('🕐 DEBUG: Checking Hours panel structure...');
  
  const hoursColumn = document.querySelector('.hours-column');
  const hoursTimeline = document.getElementById('hours-timeline');
  const hourGrid = document.getElementById('hour-grid');
  const taskBlocksContainer = document.getElementById('task-blocks-container');
  
  console.log('🕐 Hours Column exists:', !!hoursColumn);
  console.log('🕐 Hours Timeline exists:', !!hoursTimeline);
  console.log('🕐 Hour Grid exists:', !!hourGrid);
  console.log('🕐 Task Blocks Container exists:', !!taskBlocksContainer);
  
  if (hourGrid) {
    console.log('🕐 Hour Grid children count:', hourGrid.children.length);
    console.log('🕐 Hour Grid innerHTML length:', hourGrid.innerHTML.length);
  }
  
  if (hoursTimeline) {
    console.log('🕐 Timeline computed style display:', getComputedStyle(hoursTimeline).display);
    console.log('🕐 Timeline computed style position:', getComputedStyle(hoursTimeline).position);
    console.log('🕐 Timeline computed style height:', getComputedStyle(hoursTimeline).minHeight);
  }
  
  // Force generate hour grid if empty
  if (hourGrid && hourGrid.children.length === 0) {
    console.log('🕐 FORCE: Hour grid is empty, manually generating...');
    
    // Create 48 half-hour slots (24 hours * 2)
    for (let i = 0; i < 48; i++) {
      const hour = Math.floor(i / 2);
      const isHalfHour = i % 2 === 1;
      const position = i * 30; // 30px per half hour
      
      // Create hour line
      const hourLine = document.createElement('div');
      hourLine.className = isHalfHour ? 'hour-line half-hour' : 'hour-line';
      hourLine.style.position = 'absolute';
      hourLine.style.top = position + 'px';
      hourLine.style.left = '0';
      hourLine.style.width = '100%';
      hourLine.style.height = '1px';
      hourLine.style.background = isHalfHour ? '#2a2a2a' : '#333333';
      hourLine.style.zIndex = '1';
      hourGrid.appendChild(hourLine);
      
      // Add hour label for full hours only
      if (!isHalfHour) {
        const hourLabel = document.createElement('div');
        hourLabel.className = hour >= 12 ? 'hour-label pm' : 'hour-label';
        hourLabel.style.position = 'absolute';
        hourLabel.style.top = position + 'px';
        hourLabel.style.left = '-50px';
        hourLabel.style.width = '45px';
        hourLabel.style.textAlign = 'right';
        hourLabel.style.fontSize = '0.875rem';
        hourLabel.style.color = '#dddddd';
        hourLabel.style.zIndex = '2';
        
        let displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        hourLabel.textContent = displayHour;
        
        hourGrid.appendChild(hourLabel);
      }
    }
    
    console.log('✅ FORCE: Hour grid manually generated with', hourGrid.children.length, 'elements');
  }
}

// Start all emergency fixes
setTimeout(() => {
  console.log('🚨 EMERGENCY: Starting all fixes...');
  emergencyFilter();
  emergencyDateDisplay();
  setupEmergencyDropdown();
  debugHoursPanel();
}, 1000);

// Backup attempts
setTimeout(emergencyFilter, 2000);
setTimeout(emergencyDateDisplay, 2000);
setTimeout(setupEmergencyDropdown, 2000);

console.log('🚨 EMERGENCY FIX: Script loaded');