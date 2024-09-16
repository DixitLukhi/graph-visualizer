async function fetchFolderData() {
    const response = await fetch('/api/folder-data');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

const convertToGraphData = (folderData) => {
    const nodes = [];
    const edges = [];

    const addFolderToGraph = (folder, parentId = null) => {
        const folderId = folder.path;

        nodes.push({
            data: {
                id: folderId,
                label: folder.name
            }
        });

        if (parentId) {
            edges.push({
                data: {
                    source: parentId,
                    target: folderId
                }
            });
        }

        if (folder.subFolders && folder.subFolders.length > 0) {
            folder.subFolders.forEach(subFolder => addFolderToGraph(subFolder, folderId));
        }
    };

    folderData.forEach(folder => addFolderToGraph(folder));

    return { nodes, edges };
};

async function main() {
    try {
        const folderData = await fetchFolderData();
        
        const graphData = convertToGraphData(folderData);
        
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: [
                ...graphData.nodes,
                ...graphData.edges
            ],
            style: [
                {
                    selector: 'node',
                    style: {
                        'shape': 'rectangle',
                        'label': 'data(label)',
                        'background-color': function(ele) {
                            return ele.degree(false) > 0 ? '#28a745' : '#0074D9'; // Green if it has children, blue if it doesn't
                        },
                        'text-valign': 'center',
                        'color': '#fff',
                        'width': '50px',
                        'height': '50px',
                        'border-width': '2px',
                        'border-color': '#333',
                        'font-size': '12px',
                        'text-outline-width': 2,
                        'text-outline-color': '#000'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#888',
                        'target-arrow-color': '#888',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: true,
                padding: 30,
                fit: true,
                randomize: true,
                nodeOverlap: 10
            }
        });
        
        // Function to display or hide child nodes based on click
        cy.on('tap', 'node', function(event) {
            const node = event.target;
            const children = cy.elements().filter(ele => ele.data('source') === node.data('id'));
        
            // If children are already visible, hide them, else show them
            if (children.length > 0 && children.visible()) {
                children.style('display', 'none'); // Hide children
                node.style('background-color', '#0074D9'); // Revert color to blue when hidden
            } else {
                children.style('display', 'element'); // Show children
                node.style('background-color', '#28a745'); // Highlight the node that was clicked
            }
        
            console.log('Clicked node:', node.data('label'));
            console.log('Children:', children.map(child => child.data('label')));
        });
        
        // Reset view: Click on the background to reset
        cy.on('tap', function(event) {
            if (event.target === cy) {
                cy.elements().style('display', 'element'); // Show all elements
                cy.elements('node').style('background-color', function(ele) {
                    return ele.degree(false) > 0 ? '#28a745' : '#0074D9'; // Reset node colors based on children
                });
            }
        });
        
        
    } catch (error) {
        console.error('Error initializing Cytoscape:', error);
    }
}

// Call the main function
main();
