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
                        'text-outline-width': 2,
                        'text-outline-color': '#000'
                    }
                },
                {
                    selector: 'node[type="dir"]',
                    style: {
                        'shape': 'rectangle',
                        'label': 'data(label)',
                        'background-color': function (ele) {
                            return ele.data('hasChildren') ? '#28a745' : '#0074D9'; // Green if it has children, blue otherwise
                        },
                        'text-valign': 'center',
                        'color': '#fff',
                        'width': '80px',
                        'height': '80px',
                        'border-width': '2px',
                        'border-color': '#333',
                        'font-size': '12px',
                        'text-outline-width': 2,
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
                        'border-width': '1px',
                        'border-color': '#888',
                        'font-size': '8px',
                        'text-outline-width': 1,
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
                padding: 30,
                fit: true,
                randomize: true,
                nodeOverlap: 10
            }
        });

        // Function to display or hide child nodes based on click
        // Function to display or hide child nodes based on click
        cy.on('tap', 'node[type="dir"]', function (event) {
            const node = event.target;
            const children = cy.elements().filter(ele => ele.data('source') === node.data('id'));

            // Check if the node has children before applying any changes
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

    } catch (error) {
        console.error('Error initializing Cytoscape:', error);
    }
}

// Call the main function
main();