// Script to create sample data in the Replit Database
const Database = require('@replit/database');
const db = new Database();

// Database key for the task tree
const TASKS_KEY = 'dun_tasks';

// Sample tasks data with section headers and sample tasks
const sampleTasks = [
  // Triage section
  {
    id: 'section-triage',
    content: 'TRIAGE',
    isSection: true,
    children: [
      {
        id: 'task-1',
        content: 'Review yesterday\'s progress',
        completed: false,
        revisitDate: new Date().toISOString().split('T')[0],
        parent: 'section-triage',
        fire: true,
        fast: false,
        flow: false,
        fear: false,
        first: true,
        timeEstimate: 0.5,
        overview: 'Review what was accomplished yesterday',
        details: 'Look at completed tasks and determine next steps',
        scheduledTime: '09:00',
        children: []
      },
      {
        id: 'task-2',
        content: 'Plan today\'s tasks',
        completed: false,
        revisitDate: new Date().toISOString().split('T')[0],
        parent: 'section-triage',
        fire: false,
        fast: true,
        flow: false,
        fear: false,
        first: false,
        timeEstimate: 0.25,
        overview: 'Create a plan for today',
        details: 'Prioritize tasks and allocate time slots',
        scheduledTime: '09:30',
        children: [
          {
            id: 'task-2-1',
            content: 'Identify top priorities',
            completed: false,
            parent: 'task-2',
            fire: false,
            fast: true,
            flow: false,
            fear: false,
            first: false,
            timeEstimate: 0.1,
            overview: 'Find most important tasks',
            details: 'Look for items with fire or first flags',
            scheduledTime: null,
            children: []
          }
        ]
      }
    ]
  },
  
  // Section A
  {
    id: 'section-a',
    content: 'A',
    isSection: true,
    children: [
      {
        id: 'task-3',
        content: 'Finish project proposal',
        completed: false,
        revisitDate: new Date().toISOString().split('T')[0],
        parent: 'section-a',
        fire: true,
        fast: false,
        flow: true,
        fear: false,
        first: false,
        timeEstimate: 2,
        overview: 'Complete the project proposal document',
        details: 'Include executive summary, timeline, and budget',
        scheduledTime: '10:00',
        children: []
      },
      {
        id: 'task-4',
        content: 'Client meeting preparation',
        completed: false,
        revisitDate: new Date().toISOString().split('T')[0],
        parent: 'section-a',
        fire: true,
        fast: false,
        flow: false,
        fear: true,
        first: false,
        timeEstimate: 1,
        overview: 'Prepare for upcoming client meeting',
        details: 'Review meeting agenda, prepare talking points',
        scheduledTime: '14:00',
        children: []
      }
    ]
  },
  
  // Section B
  {
    id: 'section-b',
    content: 'B',
    isSection: true,
    children: [
      {
        id: 'task-5',
        content: 'Weekly team check-in',
        completed: false,
        revisitDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        parent: 'section-b',
        fire: false,
        fast: false,
        flow: true,
        fear: false,
        first: false,
        timeEstimate: 1,
        overview: 'Hold weekly team meeting',
        details: 'Review progress, blockers, and next steps',
        scheduledTime: '11:00',
        children: []
      }
    ]
  },
  
  // Section C
  {
    id: 'section-c',
    content: 'C',
    isSection: true,
    children: [
      {
        id: 'task-6',
        content: 'Research new tools',
        completed: false,
        revisitDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
        parent: 'section-c',
        fire: false,
        fast: false,
        flow: true,
        fear: false,
        first: false,
        timeEstimate: 3,
        overview: 'Look into new productivity tools',
        details: 'Evaluate alternatives to current project management software',
        scheduledTime: null,
        children: []
      }
    ]
  }
];

// Function to add the sample data to the database
async function createSampleData() {
  try {
    console.log('Creating sample data in Replit Database...');
    await db.set(TASKS_KEY, sampleTasks);
    console.log('Sample data created successfully!');
    console.log(`Added ${sampleTasks.length} sections with tasks`);

    // Count total tasks
    let totalTasks = 0;
    const countTasks = (taskList) => {
      for (const task of taskList) {
        if (!task.isSection) {
          totalTasks++;
        }
        if (task.children && task.children.length > 0) {
          countTasks(task.children);
        }
      }
    };
    
    countTasks(sampleTasks);
    console.log(`Total tasks created: ${totalTasks}`);
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Execute the function
createSampleData();