/** Accept the array responses used by older routes and the named paginated routes. */
export function recordList<T>(payload: unknown, key?: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    if (key && Array.isArray(body[key])) return body[key] as T[];
    if (Array.isArray(body.data)) return body.data as T[];
  }
  return [];
}
