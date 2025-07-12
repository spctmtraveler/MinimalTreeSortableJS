// SIMPLE DIRECT FILTER - No dependencies
console.log('🔧 SIMPLE FILTER: Loading...');

// Direct approach - override any existing filter
setTimeout(() => {
  const dropdown = document.getElementById('filter-dropdown');
  if (dropdown) {
    console.log('🔧 SIMPLE FILTER: Found dropdown, adding direct listener');
    
    // Remove existing listeners by cloning
    const newDropdown = dropdown.cloneNode(true);
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
    
    newDropdown.addEventListener('change', () => {
      const filterValue = newDropdown.value;
      console.log(`🔧 SIMPLE FILTER: Filtering by "${filterValue}"`);
      
      const tasks = document.querySelectorAll('.task-item');
      console.log(`🔧 SIMPLE FILTER: Found ${tasks.length} task elements`);
      
      const today = '2025-07-12';
      
      tasks.forEach(task => {
        if (task.classList.contains('section-header')) {
          task.style.display = '';
          return;
        }
        
        const taskData = task.dataset.taskData;
        if (!taskData) {
          task.style.display = '';
          return;
        }
        
        let data;
        try {
          data = JSON.parse(taskData);
        } catch (e) {
          task.style.display = '';
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
            console.log(`🔧 Task "${data.content}": date ${taskDate} vs ${today} = ${show}`);
          }
        } else if (filterValue === 'triage') {
          // Triage section OR past due OR no date
          if (data.parent_id === 'section-triage') {
            show = true;
          } else if (!data.revisitDate) {
            show = true;
          } else if (!data.completed) {
            const taskDate = data.revisitDate.split('T')[0];
            show = taskDate < today;
          }
          console.log(`🔧 Task "${data.content}": triage logic = ${show}`);
        }
        
        task.style.display = show ? '' : 'none';
      });
    });
    
    console.log('✅ SIMPLE FILTER: Direct filter attached');
  }
}, 1500);