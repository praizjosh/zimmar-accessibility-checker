export default async function generateAltTextForLayer(message: {
  type: string;
  [key: string]: unknown;
}) {
  console.log("received message to generate alt text for layer:", message);

  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select a layer to generate alt text for.");
    return;
  }

  if (selection.length > 1) {
    figma.notify("Please select only one layer to generate alt text for.");
    return;
  }

  const selectedNode = selection[0];

  console.log("selectedNode details:", {
    name: selectedNode.name,
    type: selectedNode.type,
    id: selectedNode.id,
    visible: selectedNode.visible,
    width: "width" in selectedNode ? selectedNode.width : "N/A",
    height: "height" in selectedNode ? selectedNode.height : "N/A",
  });

  // Check if the selected node can be exported
  if (!("exportAsync" in selectedNode)) {
    figma.notify(
      "Selected layer cannot be exported. Please select a frame, component, or other exportable layer.",
    );
    return;
  }

  // Additional safety checks
  if ("width" in selectedNode && "height" in selectedNode) {
    if (selectedNode.width <= 0 || selectedNode.height <= 0) {
      figma.notify(
        "Selected layer has invalid dimensions and cannot be exported.",
      );
      return;
    }

    // Check for extremely large dimensions that might cause memory issues
    // Figma supports PNG, JPEG, and GIF. Images can be up to 4096 pixels (4K) in width and height.
    if (selectedNode.width > 4000 || selectedNode.height > 4000) {
      figma.notify(
        "Selected layer is too large to export. Please select a smaller layer.",
      );
      return;
    }
  }

  // Check if the node is visible
  if (!selectedNode.visible) {
    figma.notify(
      "Selected layer is hidden. Please make it visible before generating alt text.",
    );
    return;
  }

  try {
    // Export with reduced size to avoid payload too large errors
    const exportSettings = {
      format: "PNG" as const,
      constraint: {
        type: "SCALE" as const,
        value: 0.25, // Reduce to 25% size
      },
    };

    const bytes = await selectedNode.exportAsync(exportSettings);
    const base64Enc = figma.base64Encode(bytes);
    const imageDataUrl = `data:image/png;base64,${base64Enc}`;

    // Check payload size (approximate size in MB)
    const payloadSizeMB = (imageDataUrl.length * 0.75) / (1024 * 1024); // Base64 is ~33% larger than binary

    // gpt-4-vision-preview image must be less than 20MB
    if (payloadSizeMB > 10) {
      figma.notify(
        "Image is too large for processing. Please select a smaller element.",
      );
      return;
    }

    if (imageDataUrl.length > 4_000_000) {
      figma.notify("Image is too large for AI analysis. Try scaling it down.");
      return;
    }

    const requestData = {
      imageDataUrl,
    };

    figma.ui.postMessage({
      type: "GENERATE_ALT_TEXT",
      data: requestData,
    });
  } catch (error) {
    console.error("Error generating alt text:", error);
  }
}
