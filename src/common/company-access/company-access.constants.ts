const READ_ONLY_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isReadOnlyHttpMethod(method: string): boolean {
  return READ_ONLY_HTTP_METHODS.has(method.toUpperCase());
}
