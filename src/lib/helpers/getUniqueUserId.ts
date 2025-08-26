function uuidv4() {
  // Simple RFC4122 version 4 compliant UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function getUniqueUserId() {
  if (figma.currentUser) {
    return figma.currentUser.id;
  } else {
    // Fallback: local storage
    return figma.clientStorage.getAsync("userId").then(async (id) => {
      if (!id) {
        id = uuidv4();
        await figma.clientStorage.setAsync("userId", id);
      }
      return id;
    });
  }
}
