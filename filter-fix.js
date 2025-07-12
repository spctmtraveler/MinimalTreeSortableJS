// EMERGENCY FILTER FIX - Standalone working filter
console.log('🚨 FILTER FIX: Loading emergency filter solution...');

// Wait for page to load, then fix the filter
window.addEventListener('load', () => {
  console.log('🚨 FILTER FIX: Page loaded, setting up working filter...');
  
  // Find the filter dropdown
  const filterDropdown = document.getElementById('filter-dropdown');
  if (!filterDropdown) {
    console.error('❌ FILTER FIX: Cannot find filter dropdown');
    return;
  }
  
  console.log('✅ FILTER FIX: Found filter dropdown, attaching listener...');
  
  // Add working filter function
  function workingFilter() {
    const filterValue = filterDropdown.value;
    console.log(`🔍 WORKING FILTER: Applying "${filterValue}" filter`);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 2025-07-12
    console.log(`📅 WORKING FILTER: Today is ${todayStr}`);
    
    // Find all task items
    const taskItems = document.querySelectorAll('.task-item');
    console.log(`📋 WORKING FILTER: Found ${taskItems.length} task elements`);
    
    let shownCount = 0;
    let hiddenCount = 0;
    
    taskItems.forEach((item, index) => {
      console.log(`\n--- PROCESSING TASK ${index + 1} ---`);
      
      // Always show section headers
      if (item.classList.contains('section-header')) {
        item.style.display = '';
        shownCount++;
        console.log(`📁 SECTION: Showing section header`);
        return;
      }
      
      // Get task data
      const taskDataStr = item.dataset.taskData || '{}';
      console.log(`📄 RAW DATA: ${taskDataStr}`);
      
      let taskData;
      try {
        taskData = JSON.parse(taskDataStr);
        console.log(`📊 PARSED: "${taskData.content}" - revisitDate: ${taskData.revisitDate}`);
      } catch (e) {
        console.error(`❌ PARSE ERROR: ${e.message}`);
        item.style.display = '';
        shownCount++;
        return;
      }
      
      let shouldShow = false;
      
      if (filterValue === 'all') {
        shouldShow = true;
        console.log(`✅ ALL FILTER: Showing all tasks`);
      } else if (filterValue === 'today') {
        // Show if revisitDate matches today
        if (taskData.revisitDate) {
          const taskDateStr = taskData.revisitDate.split('T')[0]; // Extract date part
          shouldShow = taskDateStr === todayStr;
          console.log(`🔍 TODAY CHECK: taskDate "${taskDateStr}" vs today "${todayStr}" = ${shouldShow}`);
        } else {
          // Show tasks with no revisit date (need attention)
          shouldShow = true;
          console.log(`🔍 TODAY CHECK: No revisit date, showing for attention`);
        }
      } else if (filterValue === 'triage') {
        // Always show Triage section tasks
        if (taskData.parent_id === 'section-triage') {
          shouldShow = true;
          console.log(`✅ TRIAGE: Task in Triage section`);
        } else {
          // Show tasks needing attention
          shouldShow = !taskData.revisitDate || !taskData.completed;
          console.log(`🔍 TRIAGE CHECK: needsAttention = ${shouldShow}`);
        }
      } else {
        shouldShow = true; // Default show for other filters
        console.log(`🔍 OTHER FILTER: Showing by default`);
      }
      
      // Apply visibility
      item.style.display = shouldShow ? '' : 'none';
      if (shouldShow) {
        shownCount++;
        console.log(`✅ SHOW: "${taskData.content}"`);
      } else {
        hiddenCount++;
        console.log(`❌ HIDE: "${taskData.content}"`);
      }
    });
    
    console.log(`\n🏁 FILTER COMPLETE: ${shownCount} shown, ${hiddenCount} hidden`);
  }
  
  // Attach the working filter
  filterDropdown.addEventListener('change', workingFilter);
  console.log('✅ FILTER FIX: Event listener attached successfully');
  
  // Test it immediately
  console.log('🧪 FILTER FIX: Testing filter function...');
  workingFilter();
});

console.log('🚨 FILTER FIX: Script loaded successfully');