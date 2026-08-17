const fs = require('fs');
const path = require('path');

const dropsDir = path.join(__dirname, 'JS', 'drops');
let imagesDir = path.join(dropsDir, 'Images');
if (!fs.existsSync(imagesDir)) {
  imagesDir = path.join(dropsDir, 'images');
}

const outputFile = path.join(__dirname, 'drops.json');

if (!fs.existsSync(dropsDir)) fs.mkdirSync(dropsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const dropFiles = fs.readdirSync(dropsDir).filter(f => f.endsWith('.js') || f.endsWith('.json'));
const imageFiles = fs.readdirSync(imagesDir);
const imagesFolderName = path.basename(imagesDir);

const allDrops = [];

dropFiles.forEach(file => {
  const filePath = path.join(dropsDir, file);
  const baseName = path.parse(file).name; // e.g., "drop-01" or "drop_01"

  let dropData = null;

  try {
    if (file.endsWith('.json')) {
      dropData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      delete require.cache[require.resolve(filePath)];
      const loaded = require(filePath);
      dropData = typeof loaded === 'function' ? loaded() : loaded;
    }
  } catch (err) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const fn = new Function(`return ${match[0]};`);
        dropData = fn();
      }
    } catch (parseErr) {
      console.warn(`Could not parse ${file}:`, parseErr.message);
    }
  }

  if (dropData && typeof dropData === 'object') {
    const idNum = dropData.id || parseInt(baseName.replace(/\D/g, ''), 10) || 1;
    const paddedNum = String(dropData.dropNumber || idNum).padStart(2, '0');
    const rawNum = String(idNum);

    // Auto-match image by number (e.g., "01.jpeg", "01.jpg", "01.png", "drop_01.jpg")
    const matchedImg = imageFiles.find(img => {
      const imgBase = path.parse(img).name.toLowerCase();
      return (
        imgBase === paddedNum ||
        imgBase === rawNum ||
        imgBase === `drop_${paddedNum}` ||
        imgBase === `drop-${paddedNum}` ||
        imgBase === baseName.toLowerCase()
      );
    });

    if (matchedImg) {
      dropData.image = `JS/drops/${imagesFolderName}/${matchedImg}`;
    } else if (!dropData.image) {
      dropData.image = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';
    }

    dropData.id = idNum;
    if (!dropData.dropNumber) dropData.dropNumber = paddedNum;

    allDrops.push(dropData);
  }
});

// Sort descending (newest drops first)
allDrops.sort((a, b) => (b.id || 0) - (a.id || 0));

fs.writeFileSync(outputFile, JSON.stringify(allDrops, null, 2), 'utf8');
console.log(`[Netlify Build] Successfully generated drops.json with ${allDrops.length} drops.`);
