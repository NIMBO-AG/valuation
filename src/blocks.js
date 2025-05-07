// src/blocks.js
async function loadBlocks() {
  const res = await fetch(BLOCKS_URL);
  return res.json();
}
