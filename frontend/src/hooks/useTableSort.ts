import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export function useTableSort<T>(data: T[], defaultKey?: string) {
  const [sort, setSort] = useState<SortState | null>(
    defaultKey ? { key: defaultKey, direction: 'desc' } : null
  );

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.key];
      const bVal = (b as any)[sort.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal instanceof Date || (typeof aVal === 'string' && !isNaN(Date.parse(aVal)))) {
        comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
      } else {
        comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sort]);

  return { sort, toggleSort, sortedData };
}
