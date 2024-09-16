  // Convert folder data to Cytoscape format
  exports.convertToGraphData = (folderData) => {
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
