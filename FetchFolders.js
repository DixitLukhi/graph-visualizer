const fs = require('fs');
const path = require('path');

// Function to get all folders in the current path
// Function to get all folders in the current path
async function getAllFolders(dirPath) {
    const folders = [];
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

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

// Export the function so it can be used in other files
module.exports = getAllFolders;