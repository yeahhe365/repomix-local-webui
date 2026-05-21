const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;

export function isValidAbsolutePath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return trimmed.startsWith('/') || WINDOWS_ABSOLUTE_PATH.test(trimmed);
}
