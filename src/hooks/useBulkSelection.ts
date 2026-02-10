import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionReturn {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  selectedCount: number;
  hasSelection: boolean;
  isSelected: (id: string) => boolean;
}

export function useBulkSelection(): UseBulkSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  return useMemo(
    () => ({ selectedIds, toggle, selectAll, deselectAll, selectedCount, hasSelection, isSelected }),
    [selectedIds, toggle, selectAll, deselectAll, selectedCount, hasSelection, isSelected]
  );
}
