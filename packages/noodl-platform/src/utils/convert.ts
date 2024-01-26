export namespace ConvertUtils {
  export function bytesToKilobytes(bytes: number): number {
    const kilobytes = bytes / 1024;
    return kilobytes;
  }

  export function bytesToMegabytes(bytes: number): number {
    const megabytes = bytes / (1024 * 1024);
    return megabytes;
  }

  export function bytesToGigabytes(bytes: number): number {
    const gigabytes = bytes / (1024 * 1024 * 1024);
    return gigabytes;
  }

  export function bytesToMostSuitableSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return bytesToKilobytes(bytes).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return bytesToMegabytes(bytes).toFixed(2) + ' MB';
    } else {
      return bytesToGigabytes(bytes).toFixed(2) + ' GB';
    }
  }
}
