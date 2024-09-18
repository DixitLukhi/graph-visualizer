const express = require('express');
const path = require('path');
const { getAllFolders } = require('./utils');

const router = express.Router();

router.use(express.static(path.join(__dirname, '../../public')));

router.get('/api/folder-data', async (req, res) => {
    try {
        const currentPath = "D:/Dixit/MMP/GraphFolders"; // Set your directory path here
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

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

module.exports = router;
