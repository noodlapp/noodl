export function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function timeSince(date: Date | number) {
  const date_unix = typeof date === 'number' ? date : date.getTime();
  const seconds = Math.floor((new Date().getTime() - date_unix) / 1000);

  let interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + ' years';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
}

export function windowTitleBarHeight() {
  let height = 28; //windows or linux

  if (process.platform === 'darwin') {
    const isBigSurOrAbove = require('os').release().split('.')[0] >= 20;
    height = isBigSurOrAbove ? 28 : 22;
  }

  return height + 2; //add 2 pixels for the black border
}

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function rectanglesOverlap(a: Rectangle, b: Rectangle) {
  const corners = [
    [a.x, a.y],
    [a.x + a.width, a.y],
    [a.x + a.width, a.y + a.height],
    [a.x, a.y + a.height]
  ];

  const x = b.x;
  const x2 = b.x + b.width;
  const y = b.y;
  const y2 = b.y + b.height;

  return corners.some((c, i) => {
    const inside = c[0] >= x && c[0] <= x2 && c[1] >= y && c[1] <= y2;

    if (inside) return true;

    // Check for line intersection
    const c2 = corners[(i + 1) & 3];
    return (
      (c[0] === c2[0] && x <= c[0] && x2 >= c[0] && y >= Math.min(c[1], c2[1]) && y2 <= Math.max(c[1], c2[1])) ||
      (c[1] === c2[1] && y <= c[1] && y2 >= c[1] && x >= Math.min(c[0], c2[0]) && x2 <= Math.max(c[0], c2[0]))
    );
  });
}

export function pointInsideRectangle(point: { x: number; y: number }, rect: Rectangle) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

// Converting an array of objects into CSV text.
// Expects all objects to have the same properties
export function objectsArrayToCsv(objectsArray) {
  const headers = Object.keys(objectsArray[0]);
  const csvData = [headers.join(',')];

  for (const obj of objectsArray) {
    const values = headers.map((header) => obj[header]);
    csvData.push(values.join(','));
  }

  return csvData.join('\n');
}

export function getFileExtension(filename) {
  return filename.toLowerCase().slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// Check if string ends in an image file extension
export function isFilenameImage(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
  const fileExtension = getFileExtension(filename);
  return imageExtensions.includes(`.${fileExtension}`);
}

/** @deprecated Skip default import */
const Utils = {
  guid,
  timeSince,
  windowTitleBarHeight,
  rectanglesOverlap
};
export default Utils;
