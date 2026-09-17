/**
 * Utility to process images and remove solid/near-white backgrounds,
 * converting them into clean transparent PNGs.
 * Uses edge-seeded flood-fill so interior whites (eyes, flowers, patterns)
 * are never deleted.
 */

export async function removeImageBackground(
  imageSource: File | string,
  tolerance: number = 38
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample corner colors to determine background color
        const corners = [
          0, // (0,0)
          (width - 1) * 4, // (w-1, 0)
          (height - 1) * width * 4, // (0, h-1)
          ((height - 1) * width + (width - 1)) * 4, // (w-1, h-1)
        ];

        let bgR = 255;
        let bgG = 255;
        let bgB = 255;

        // Calculate average corner RGB
        let totalR = 0, totalG = 0, totalB = 0;
        corners.forEach((idx) => {
          totalR += data[idx];
          totalG += data[idx + 1];
          totalB += data[idx + 2];
        });
        bgR = Math.round(totalR / corners.length);
        bgG = Math.round(totalG / corners.length);
        bgB = Math.round(totalB / corners.length);

        const colorDist = (r: number, g: number, b: number) => {
          const dr = r - bgR;
          const dg = g - bgG;
          const db = b - bgB;
          return Math.sqrt(dr * dr + dg * dg + db * db);
        };

        const isBgColor = (idx: number) => {
          // Check distance to corner background or near-white
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const d1 = colorDist(r, g, b);
          const dWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
          return Math.min(d1, dWhite) <= tolerance;
        };

        const totalPixels = width * height;
        const visited = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let head = 0;
        let tail = 0;

        // Seed flood-fill from all 4 borders
        for (let x = 0; x < width; x++) {
          // Top row
          const topIdx = x * 4;
          if (isBgColor(topIdx)) {
            visited[x] = 1;
            queue[tail++] = x;
          }
          // Bottom row
          const botIdx = ((height - 1) * width + x) * 4;
          const botPixel = (height - 1) * width + x;
          if (isBgColor(botIdx)) {
            visited[botPixel] = 1;
            queue[tail++] = botPixel;
          }
        }

        for (let y = 0; y < height; y++) {
          // Left col
          const leftPixel = y * width;
          const leftIdx = leftPixel * 4;
          if (!visited[leftPixel] && isBgColor(leftIdx)) {
            visited[leftPixel] = 1;
            queue[tail++] = leftPixel;
          }
          // Right col
          const rightPixel = y * width + (width - 1);
          const rightIdx = rightPixel * 4;
          if (!visited[rightPixel] && isBgColor(rightIdx)) {
            visited[rightPixel] = 1;
            queue[tail++] = rightPixel;
          }
        }

        // BFS flood fill to erase contiguous background
        while (head < tail) {
          const pixel = queue[head++];
          const idx = pixel * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const dist = Math.min(
            colorDist(r, g, b),
            Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
          );

          // Feather edges smoothly
          if (dist > tolerance * 0.75) {
            const alphaFactor = (tolerance - dist) / (tolerance * 0.25);
            data[idx + 3] = Math.max(0, Math.round(data[idx + 3] * (1 - alphaFactor)));
          } else {
            data[idx + 3] = 0;
          }

          const x = pixel % width;
          const y = Math.floor(pixel / width);

          // 4 neighbors
          if (x > 0) {
            const n = pixel - 1;
            if (!visited[n] && isBgColor(n * 4)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
          if (x < width - 1) {
            const n = pixel + 1;
            if (!visited[n] && isBgColor(n * 4)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
          if (y > 0) {
            const n = pixel - width;
            if (!visited[n] && isBgColor(n * 4)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
          if (y < height - 1) {
            const n = pixel + width;
            if (!visited[n] && isBgColor(n * 4)) {
              visited[n] = 1;
              queue[tail++] = n;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      reject(new Error('Failed to load image for background removal: ' + e));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    }
  });
}
