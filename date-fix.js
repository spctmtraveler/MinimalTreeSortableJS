// PERSISTENT DATE DISPLAY FIX
console.log('📅 DATE FIX: Loading persistent date display solution...');

// Load saved state immediately
const savedDateState = localStorage.getItem('showDatesAlways');
if (savedDateState === 'true') {
  document.body.setAttribute('data-show-dates', 'true');
  document.body.classList.add('show-dates-always');
  console.log('📅 DATE FIX: Restored persistent date display from localStorage');
}

// Setup toggle when page loads
function initDateToggle() {
  // Wait for debug modal elements
  const debugModal = document.getElementById('debug-modal');
  const showDatesToggle = document.getElementById('show-dates-toggle-checkbox');
  
  if (!debugModal || !showDatesToggle) {
    console.log('📅 DATE FIX: Elements not ready, retrying in 200ms...');
    setTimeout(initDateToggle, 200);
    return;
  }
  
  console.log('📅 DATE FIX: Toggle found, setting up persistent date display...');
  
  // Set initial state from localStorage
  const savedState = localStorage.getItem('showDatesAlways') === 'true';
  showDatesToggle.checked = savedState;
  
  // Apply initial state
  if (savedState) {
    document.body.setAttribute('data-show-dates', 'true');
    document.body.classList.add('show-dates-always');
    console.log('📅 DATE FIX: Initial state - showing dates persistently');
  }
  
  // Handle toggle changes
  showDatesToggle.addEventListener('change', () => {
    const isEnabled = showDatesToggle.checked;
    console.log(`📅 DATE FIX: ${isEnabled ? 'Enabling' : 'Disabling'} persistent date display`);
    
    // Save to localStorage for persistence
    localStorage.setItem('showDatesAlways', isEnabled.toString());
    
    // Apply CSS changes
    if (isEnabled) {
      document.body.setAttribute('data-show-dates', 'true');
      document.body.classList.add('show-dates-always');
      console.log('📅 DATE FIX: Added persistent date display classes');
    } else {
      document.body.removeAttribute('data-show-dates');
      document.body.classList.remove('show-dates-always');
      console.log('📅 DATE FIX: Removed persistent date display classes');
    }
  });
  
  console.log('✅ DATE FIX: Persistent date display toggle configured successfully');
}

// Try multiple loading strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDateToggle);
} else {
  initDateToggle();
}

window.addEventListener('load', initDateToggle);
setTimeout(initDateToggle, 500);
setTimeout(initDateToggle, 1000);

console.log('📅 DATE FIX: Script loaded successfully');