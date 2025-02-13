const findIssues = (node, issues) => {
  // Check if the node is a TextNode
  if (node.type === 'TEXT') {
    // Example: Check font size
    const fontSize = node.fontSize || 0;
    if (fontSize < 12) {
      issues.push({
        type: 'Typography',
        description: `Text size (${fontSize}px) is too small.`,
        nodeId: node.id,
      });
    }
  }

  // Traverse children if the node can have them
  if ("children" in node) {
    for (const child of node.children) {
      findIssues(child, issues);
    }
  }
};

// Start scanning the current page's children
figma.ui.onmessage = async (message) => {
  if (message.type === 'scan') {
    const issues = [];

    // Scan all top-level nodes and their descendants
    for (const node of figma.currentPage.children) {
      findIssues(node, issues);
    }

    // Send results back to the UI
    figma.ui.postMessage({ type: 'results', issues });
  }
};
