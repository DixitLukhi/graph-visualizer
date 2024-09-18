const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const babelParser = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default; // Import babel traverse

const app = express();
const port = 3000;

// Promisify readdir for use with async/await
const readdir = util.promisify(fs.readdir);

// Promisify readFile for reading file content
const readFile = util.promisify(fs.readFile);

// Function to parse a JavaScript file and extract functions and variables
function parseJavaScriptFile(content) {
    try {
        const ast = babelParser.parse(content, {
            sourceType: "module",
            plugins: ["jsx"] // If you want to support JSX (React)
        });

        const elements = [];

        // Traverse the AST to find function and variable declarations
        babelTraverse(ast, {
            FunctionDeclaration(path) {
                elements.push({
                    type: "function",
                    name: path.node.id.name
                });
            },
            VariableDeclaration(path) {
                path.node.declarations.forEach(declaration => {
                    elements.push({
                        type: "variable",
                        name: declaration.id.name
                    });
                });
            }
        });

        return elements;
    } catch (error) {
        console.error("Error parsing JS file", error);
        return [];
    }
}

// Function to retrieve all folders and files in the given directory path
async function getAllFolders(dirPath) {
    const folders = [];
    const files = [];

    const items = await readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
        const itemName = item.name;
        const itemPath = path.join(dirPath, itemName);

        if (item.isDirectory()) {
            const subFolders = await getAllFolders(itemPath);
            folders.push({
                name: itemName,
                path: itemPath,
                subFolders: subFolders.folders,
                files: subFolders.files,
                type: "dir"
            });
        } else if (item.isFile() && itemName.endsWith(".js")) {
            const content = await readFile(itemPath, 'utf-8');
            const elements = parseJavaScriptFile(content);
            files.push({
                name: itemName,
                path: itemPath,
                type: "file",
                elements, // Add the parsed elements
                content
            });
        }
    }

    return { folders, files };
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to get folder data
app.get('/api/folder-data', async (req, res) => {
    try {
        const currentPath = "D:/Dixit/MMP/GraphFolders";  // Set your directory path here
        const rootFolderName = path.basename(currentPath);

        const folderData = {
            rootName: rootFolderName,
            path: currentPath,
            structure: await getAllFolders(currentPath),
        };
        res.json(folderData);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
