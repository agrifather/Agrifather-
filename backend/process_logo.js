const Jimp = require('jimp');

async function removeWhiteBackground() {
  console.log('Loading image...');
  const image = await Jimp.read('C:\\Users\\rohit\\.gemini\\antigravity\\brain\\ec591e21-f972-4770-bb3a-a84c497c4cb6\\media__1778608897807.png');
  
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const hex = image.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(hex);
      
      // Calculate how close to white the pixel is
      const distFromWhite = Math.sqrt(
        Math.pow(255 - rgba.r, 2) + 
        Math.pow(255 - rgba.g, 2) + 
        Math.pow(255 - rgba.b, 2)
      );

      // If it's perfectly white or very close
      if (distFromWhite < 15) {
        image.setPixelColor(Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, 0), x, y);
      } else if (distFromWhite < 80) {
        // Anti-aliasing fringe: map dist 15-80 to alpha 0-255
        const alpha = Math.floor(((distFromWhite - 15) / 65) * 255);
        image.setPixelColor(Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, alpha), x, y);
      }
    }
  }

  // Also crop any transparent border
  image.autocrop();

  await image.writeAsync('d:\\Agrifather\\frontend\\src\\assets\\logo.png');
  console.log('Logo processed successfully.');
}

removeWhiteBackground().catch(console.error);
