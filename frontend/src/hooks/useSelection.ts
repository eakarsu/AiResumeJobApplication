import { useState, useCallback } from 'react';

export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;
  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  return {
    selectedIds,
    toggle,
    toggleAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    selectedCount,
    selectedItems,
  };
}
