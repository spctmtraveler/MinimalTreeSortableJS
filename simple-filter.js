// SIMPLE DIRECT FILTER - No dependencies
console.log('🔧 SIMPLE FILTER: Loading...');

function setupWorkingFilter() {
  const dropdown = document.getElementById('filter-dropdown');
  if (!dropdown) {
    console.log('🔧 SIMPLE FILTER: Dropdown not found, retrying...');
    setTimeout(setupWorkingFilter, 200);
    return;
  }
  
  console.log('🔧 SIMPLE FILTER: Found dropdown, setting up filter');
  
  function applyFilter() {
    const filterValue = dropdown.value;
    console.log(`🔧 SIMPLE FILTER: Filtering by "${filterValue}"`);
    
    const tasks = document.querySelectorAll('.task-item');
    console.log(`🔧 SIMPLE FILTER: Found ${tasks.length} task elements`);
    
    // Get current date dynamically
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔧 SIMPLE FILTER: Today is ${today}`);
    
    let shownCount = 0;
    let hiddenCount = 0;
    
    tasks.forEach((task, index) => {
      // Always show section headers
      if (task.classList.contains('section-header')) {
        task.style.display = '';
        shownCount++;
        return;
      }
      
      const taskData = task.dataset.taskData;
      if (!taskData) {
        task.style.display = '';
        shownCount++;
        return;
      }
      
      let data;
      try {
        data = JSON.parse(taskData);
      } catch (e) {
        console.warn(`🔧 Parse error for task ${index}:`, e);
        task.style.display = '';
        shownCount++;
        return;
      }
      
      let show = false;
      
      if (filterValue === 'all') {
        show = true;
      } else if (filterValue === 'today') {
        // Only tasks with today's date
        if (data.revisitDate) {
          const taskDate = data.revisitDate.split('T')[0];
          show = taskDate === today;
          console.log(`🔧 TODAY: "${data.content}" date ${taskDate} vs ${today} = ${show}`);
        } else {
          show = false;
          console.log(`🔧 TODAY: "${data.content}" no date = ${show}`);
        }
      } else if (filterValue === 'triage') {
        // Triage section OR past due OR no date
        if (data.parent_id === 'section-triage') {
          show = true;
          console.log(`🔧 TRIAGE: "${data.content}" in triage section = ${show}`);
        } else if (!data.revisitDate) {
          show = true;
          console.log(`🔧 TRIAGE: "${data.content}" no date = ${show}`);
        } else if (!data.completed) {
          const taskDate = data.revisitDate.split('T')[0];
          show = taskDate < today;
          console.log(`🔧 TRIAGE: "${data.content}" past due ${taskDate} < ${today} = ${show}`);
        } else {
          show = false;
          console.log(`🔧 TRIAGE: "${data.content}" completed = ${show}`);
        }
      } else {
        show = true; // Default show for other filters
      }
      
      task.style.display = show ? '' : 'none';
      if (show) {
        shownCount++;
      } else {
        hiddenCount++;
      }
    });
    
    console.log(`🔧 SIMPLE FILTER: Complete - ${shownCount} shown, ${hiddenCount} hidden`);
  }
  
  // Remove existing event listeners and add new one
  const newDropdown = dropdown.cloneNode(true);
  dropdown.parentNode.replaceChild(newDropdown, dropdown);
  
  newDropdown.addEventListener('change', applyFilter);
  
  // Apply initial filter
  applyFilter();
  
  console.log('✅ SIMPLE FILTER: Working filter attached and tested');
}

// Start setup with multiple attempts
setupWorkingFilter();