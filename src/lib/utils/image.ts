/**
 * Utility to convert any Google Drive share link into a direct CDN image URL.
 * Supports:
 * - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 * - https://lh3.googleusercontent.com/d/{FILE_ID}
 * - Internal paths like /images/menu/...
 * - Standard web URLs like https://...
 */
export function parseImageUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Pattern 1: drive.google.com/file/d/{id}
  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Pattern 2: drive.google.com/open?id={id} or drive.google.com/uc?id={id}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (trimmed.includes('drive.google.com') && idParamMatch && idParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  return trimmed;
}

/**
 * Checks whether an input string is a Google Drive share link.
 */
export function isGoogleDriveLink(input: string): boolean {
  if (!input) return false;
  return input.includes('drive.google.com');
}
