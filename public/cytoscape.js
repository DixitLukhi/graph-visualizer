async function fetchFolderData() {
    const response = await fetch('/api/folder-data');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const folderData = await response.json();
    return folderData;
}

const convertToGraphData = (folderData) => {
    const nodes = [];
    const edges = [];

    const { rootName, structure } = folderData;
    // Add the root folder "TestFolders"
    const rootFolderId = rootName;
    nodes.push({
        data: {
            id: rootFolderId,
            label: rootFolderId,
            type: 'root'
        }
    });

    // Function to handle adding file content (functions/variables)
    const addFileContentToGraph = (file, parentId) => {
        const fileId = file.path;
    
        file.elements.forEach(element => {
            const elementId = `${fileId}-${element.name}`;
            console.log("e :", element );
            
            // Add element node (function or variable)
            nodes.push({
                data: {
                    id: elementId,
                    label: `${element.name} (${element.type})`,
                    type: element.type,
                    body: element.body || 'No body available'
                }
            });
    
            // Connect file to its elements
            edges.push({
                data: {
                    source: fileId,
                    target: elementId
                }
            });
        });
    };

    // Function to handle adding folders and subfolders
    const addFolderToGraph = (folder, parentId) => {
        const folderId = folder.path;

        // Add folder node
        nodes.push({
            data: {
                id: folderId,
                label: folder.name,
                type: 'dir',
                hasChildren: (folder.subFolders.length > 0 || folder.files.length > 0)
            }
        });

        // Create edge from parent folder to this folder
        edges.push({
            data: {
                source: parentId,
                target: folderId
            }
        });

        // Add files in this folder
        if (folder.files && folder.files.length > 0) {
            folder.files.forEach(file => {
                const fileId = file.path;

                // Add file node
                nodes.push({
                    data: {
                        id: fileId,
                        label: file.name,
                        type: 'file'
                    }
                });

                // Edge from folder to file
                edges.push({
                    data: {
                        source: folderId,
                        target: fileId
                    }
                });

                // Add file's content like functions and variables
                if (file.elements && file.elements.length > 0) {
                    addFileContentToGraph(file, fileId);
                }
            });
        }

        // Recursively add subfolders
        if (folder.subFolders && folder.subFolders.length > 0) {
            folder.subFolders.forEach(subFolder => addFolderToGraph(subFolder, folderId));
        }
    };

    // Add all top-level folders to the root node
    structure.folders.forEach(folder => addFolderToGraph(folder, rootFolderId));

    // Add top-level files that are not in folders
    if (structure.files && structure.files.length > 0) {
        structure.files.forEach(file => {
            const fileId = file.path;

            // Add file node
            nodes.push({
                data: {
                    id: fileId,
                    label: file.name,
                    type: 'file'
                }
            });

            // Connect these files to the root folder
            edges.push({
                data: {
                    source: rootFolderId,
                    target: fileId
                }
            });

            // Add file's content like functions and variables
            if (file.elements && file.elements.length > 0) {
                addFileContentToGraph(file, fileId);
            }
        });
    }

    return { nodes, edges };
};

async function main() {
    try {
        const folderData = await fetchFolderData();
        const graphData = convertToGraphData(folderData);
        console.log(graphData);

        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: [
                ...graphData.nodes,
                ...graphData.edges
            ],
            style: [
                {
                    selector: 'node[type="root"]',
                    style: {
                        'shape': 'roundrectangle',
                        'label': 'data(label)',
                        'background-color': '#FF4136', // Red for the root folder
                        'text-valign': 'center',
                        'color': '#fff',
                        'width': '100px',
                        'height': '60px',
                        'border-width': '3px',
                        'border-color': '#333',
                        'font-size': '14px',
                        'text-outline-width': 0,
                        'text-outline-color': '#000'
                    }
                },
                {
                    selector: 'node[type="dir"]',
                    style: {
                        'shape': 'rectangle',
                        'label': 'data(label)',
                        'background-color': function (ele) {
                            return ele.data('hasChildren') ? '#28a745' : '#9fc9ed'; // Green if it has children, blue otherwise
                        },
                        'text-valign': 'center',
                        'color': '#fff',
                        'width': '80px',
                        'height': '80px',
                        'border-width': '2px',
                        'border-color': '#333',
                        'font-size': '12px',
                        'text-outline-width': 0,
                        'text-outline-color': '#000'
                    }
                },
                {
                    selector: 'node[type="file"]',
                    style: {
                        'shape': 'ellipse',
                        'label': 'data(label)',
                        'background-color': '#FFD700',  // Yellow for files
                        'text-valign': 'center',
                        'color': '#333',
                        'width': '60px',
                        'height': '60px',
                        'font-size': '14px',
                        'text-outline-width': 0,
                        'text-outline-color': '#fff'
                    }
                },
                {
                    selector: 'node[type="function"]',
                    style: {
                        'shape': 'ellipse',
                        'label': 'data(label)',
                        'background-color': '#0074D9',  // Blue for functions
                        'text-valign': 'center',
                        'color': '#fff',
                        'width': '100px',
                        'height': '100px',
                        'font-size': '12px',
                        'text-outline-width': 0,
                        'text-outline-color': '#fff'
                    }
                },
                {
                    selector: 'node[type="variable"]',
                    style: {
                        'shape': 'hexagon',
                        'label': 'data(label)',
                        'background-color': '#ff851b',  // Orange for variables
                        'text-valign': 'center',
                        'color': '#fff',
                        'width': '100px',
                        'height': '100px',
                        'font-size': '12px',
                        'text-outline-width': 0,
                        'text-outline-color': '#fff'
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
                padding: 50,  // Increase padding around elements
                fit: true,    // Fit the graph to the viewport
                nodeRepulsion: 8000,  // Increase repulsion for better spacing between nodes
                idealEdgeLength: 100, // Set ideal length of edges for better visibility
                edgeElasticity: 100,  // Control how much edges stretch
                gravity: 0.1,  // Lower gravity for more spread-out layout
                initialTemp: 200, // Higher temperature for more movement at the start
                coolingFactor: 0.99,  // Slow down the layout cooling
                randomize: false, // Turn off randomization for consistent layouts
            },
            // layout: {
            //     name: 'breadthfirst',
            //     directed: true,  // Makes edges go from parent to child in one direction
            //     padding: 50,  // Increase padding around elements
            //     fit: true,    // Fit the graph to the viewport
            //     spacingFactor: 1.5,  // Increase spacing between nodes
            //     avoidOverlap: true,  // Avoid nodes overlapping
            //     circle: false,  // Set to false to avoid circular layouts
            //     maximalAdjustments: 10,  // Number of layout adjustments to improve layout
            //     nodeDimensionsIncludeLabels: true // Ensure layout accounts for label size
            // }
        });

        // Function to display or hide child nodes based on click
        cy.on('tap', 'node[type="dir"]', function (event) {
            const node = event.target;
            const children = cy.elements().filter(ele => ele.data('source') === node.data('id'));

            if (node.data('hasChildren')) {
                if (children.length > 0 && children.visible()) {
                    children.style('display', 'none'); // Hide children
                    node.style('background-color', '#0074D9'); // Revert color to blue when hidden
                } else {
                    children.style('display', 'element'); // Show children
                    node.style('background-color', '#28a745'); // Highlight the node that was clicked
                }
            }
        });

        // Reset view: Click on the background to reset
        cy.on('tap', function (event) {
            if (event.target === cy) {
                cy.elements().style('display', 'element'); // Show all elements
                cy.elements('node[type="dir"]').style('background-color', function (ele) {
                    return ele.data('hasChildren') ? '#28a745' : '#0074D9'; // Reset node colors based on children
                });
            }
        });

        cy.on('mouseover', 'node[type="function"], node[type="variable"]', function (event) {
            const node = event.target;
            const popup = document.getElementById('nodePopup');
            const popupContent = document.getElementById('popupContent');
        
            // Set the content of the popup based on the node's data, including the full function body
            popupContent.innerHTML = `
                <strong>Name:</strong> ${node.data('label')}<br>
                <strong>Type:</strong> ${node.data('type')}<br>
                <strong>Body:</strong><pre>${node.data('body')}</pre>
            `;
        
            // Position the popup near the mouse pointer
            const mouseX = event.originalEvent.clientX;
            const mouseY = event.originalEvent.clientY;
            popup.style.left = mouseX + 'px';
            popup.style.top = mouseY + 'px';
        
            // Show the popup
            popup.style.display = 'block';
        });
        
        cy.on('mouseout', 'node[type="function"], node[type="variable"]', function (event) {
            const popup = document.getElementById('nodePopup');
            // Hide the popup when the mouse leaves the node
            popup.style.display = 'none';
        });

    } catch (error) {
        console.error('Error initializing Cytoscape:', error);
    }
}

// Call the main function
main();
