// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Sample task data with nested structure
    const sampleTasks = [
        {
            id: 'task-1',
            content: 'Project Planning',
            children: [
                {
                    id: 'task-1-1',
                    content: 'Define project scope',
                    children: []
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

    // Initialize the dnd-tree-view
    const taskTree = document.getElementById('task-tree');
    
    // Create and configure the tree view instance
    const treeView = new DndTreeView({
        container: taskTree,
        data: sampleTasks,
        
        // Configuration options
        dragAndDrop: true,      // Enable drag and drop
        collapsible: true,      // Enable collapsible nodes
        initiallyExpanded: true // Start with all nodes expanded
    });

    // Custom node renderer function to display task content
    treeView.nodeRenderer = function(node, element) {
        // Create a span for the task content
        const taskContent = document.createElement('span');
        taskContent.textContent = node.content;
        taskContent.className = 'task-content';
        
        // Add the content to the node element
        element.appendChild(taskContent);

        return element;
    };

    // Initialize the tree view
    treeView.render();

    // Event listener for when a node is moved (optional, for demonstration)
    treeView.on('nodeMoved', function(nodeId, parentId, index) {
        console.log(`Node ${nodeId} moved to parent ${parentId} at index ${index}`);
        // In a real application, you might want to save the updated structure
    });
});
