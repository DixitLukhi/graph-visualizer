const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');

const app = express();
const port = 3000;

// Promisify readdir for use with async/await
const readdir = util.promisify(fs.readdir);

async function getAllFolders(dirPath) {
    const folders = [];

    const files = await readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
        const folderName = file.name;

        if (file.isDirectory()) {
            const folderPath = path.join(dirPath, folderName);
            
            const subFolders = await getAllFolders(folderPath);  // Recurse into subdirectories
            
            folders.push({
                name: folderName,
                path: folderPath,
                subFolders: subFolders  // Subfolders are nested within
            });
        }
    }

    return folders;
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to get folder data
app.get('/api/folder-data', async (req, res) => {
    try {
        const currentPath = "D:/Dixit/MMP/Papers";  // Set your directory path here
        const folderData = await getAllFolders(currentPath);
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
