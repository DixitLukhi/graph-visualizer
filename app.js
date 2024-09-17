const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');

const app = express();
const port = 3000;

// Promisify readdir for use with async/await
const readdir = util.promisify(fs.readdir);

// Function to retrieve both folders and files in the given directory path
async function getAllFolders(dirPath) {
    const folders = [];
    const files = [];

    // Read the contents of the directory
    const items = await readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
        const itemName = item.name;
        const itemPath = path.join(dirPath, itemName);

        if (item.isDirectory()) {
            // If it's a directory, recurse into the directory to get subfolders and files
            const subFolders = await getAllFolders(itemPath);

            folders.push({
                name: itemName,
                path: itemPath,
                subFolders: subFolders.folders,
                files: subFolders.files,
                type: "dir"
            });
        } else if (item.isFile()) {
            // If it's a file, add it to the list of files
            files.push({
                name: itemName,
                path: itemPath,
                type: "file"
            });
        }
    }

    // Return both folders and files
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
