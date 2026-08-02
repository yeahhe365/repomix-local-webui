import { computed, nextTick, ref, watch } from 'vue';
import { ApiError, browseLocalPathDirectories } from '../api/client';
import type { LocalPathDirectoryListing } from '../types/api';
import type { UseLocalPathBrowserOptions } from '../types/localPathBrowser';
import {
  buildLocalPathBreadcrumbs,
  filterLocalPathEntries,
  moveLocalPathSelection,
  pushRecentLocalPath,
} from '../utils/tryIt/localPathBrowserNavigation';
import {
  createDefaultLocalPathBrowserState,
  type LocalPathBrowserState,
  loadLocalPathBrowserState,
  saveLocalPathBrowserState,
} from '../utils/tryItPersistence';

export function useLocalPathBrowser({
  open,
  rootLabel,
  unexpectedErrorMessage,
  close,
  select,
}: UseLocalPathBrowserOptions) {
  const listing = ref<LocalPathDirectoryListing | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedIndex = ref(-1);
  const dialogRef = ref<HTMLDivElement | null>(null);
  const listRef = ref<HTMLUListElement | null>(null);
  const browserState = ref<LocalPathBrowserState>(createDefaultLocalPathBrowserState());
  const searchQuery = ref('');

  const currentLabel = computed(() => listing.value?.currentPath ?? rootLabel.value);
  const breadcrumbs = computed(() => buildLocalPathBreadcrumbs(listing.value?.currentPath ?? null));
  const visibleEntries = computed(() => filterLocalPathEntries(listing.value?.entries ?? [], searchQuery.value));
  const selectedEntry = computed(() => {
    if (selectedIndex.value < 0) {
      return null;
    }

    return visibleEntries.value[selectedIndex.value] ?? null;
  });

  function persistBrowserState(partial: Partial<LocalPathBrowserState>) {
    browserState.value = {
      ...browserState.value,
      ...partial,
    };
    saveLocalPathBrowserState(browserState.value);
  }

  async function loadDirectory(targetPath?: string) {
    loading.value = true;
    error.value = null;
    const previousPath = browserState.value.currentPath;
    const previousScrollTop = browserState.value.scrollTop;

    try {
      listing.value = await browseLocalPathDirectories(targetPath);
      const shouldRestoreScroll = previousPath === listing.value.currentPath;
      persistBrowserState({
        currentPath: listing.value.currentPath,
        scrollTop: shouldRestoreScroll ? previousScrollTop : 0,
      });
      await nextTick();
      if (listRef.value) {
        listRef.value.scrollTop = shouldRestoreScroll ? previousScrollTop : 0;
      }
    } catch (err) {
      error.value = err instanceof ApiError || err instanceof Error ? err.message : unexpectedErrorMessage.value;
    } finally {
      loading.value = false;
    }
  }

  function selectEntry(index: number) {
    selectedIndex.value = index;
  }

  async function enterDirectory(targetPath: string) {
    await loadDirectory(targetPath);
    persistBrowserState({
      recentPaths: pushRecentLocalPath(browserState.value.recentPaths, targetPath),
    });
  }

  async function enterSelectedDirectory() {
    if (!selectedEntry.value) {
      return;
    }

    await enterDirectory(selectedEntry.value.path);
  }

  async function loadParent() {
    if (listing.value?.parentPath) {
      await loadDirectory(listing.value.parentPath);
      return;
    }

    await loadDirectory();
  }

  function selectCurrentPath() {
    if (!listing.value?.currentPath) {
      return;
    }

    persistBrowserState({
      recentPaths: pushRecentLocalPath(browserState.value.recentPaths, listing.value.currentPath),
    });
    select(listing.value.currentPath);
    close();
  }

  async function retry() {
    await loadDirectory(listing.value?.currentPath ?? undefined);
  }

  async function jumpToBreadcrumb(path: string) {
    await loadDirectory(path);
  }

  async function openRecentPath(path: string) {
    searchQuery.value = '';
    persistBrowserState({
      recentPaths: pushRecentLocalPath(browserState.value.recentPaths, path),
    });
    await loadDirectory(path);
  }

  async function handleKeydown(event: KeyboardEvent) {
    if (!open.value || loading.value) {
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      selectCurrentPath();
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex.value = moveLocalPathSelection(selectedIndex.value, visibleEntries.value.length, 'next');
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex.value = moveLocalPathSelection(selectedIndex.value, visibleEntries.value.length, 'previous');
        break;
      case 'Enter':
        event.preventDefault();
        await enterSelectedDirectory();
        break;
      case 'Backspace':
        event.preventDefault();
        await loadParent();
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleListScroll() {
    if (!listRef.value) {
      return;
    }

    persistBrowserState({
      scrollTop: listRef.value.scrollTop,
    });
  }

  watch(open, async (isOpen) => {
    if (isOpen) {
      browserState.value = loadLocalPathBrowserState();
      searchQuery.value = '';
      await loadDirectory(browserState.value.currentPath ?? undefined);
      dialogRef.value?.focus();
    } else if (listRef.value) {
      persistBrowserState({
        scrollTop: listRef.value.scrollTop,
      });
    }
  });

  watch([() => listing.value?.entries, searchQuery], () => {
    const activeEntries = visibleEntries.value;
    if (!activeEntries.length) {
      selectedIndex.value = -1;
      persistBrowserState({ selectedPath: null });
      return;
    }

    const restoredIndex = browserState.value.selectedPath
      ? activeEntries.findIndex((entry) => entry.path === browserState.value.selectedPath)
      : -1;

    selectedIndex.value = restoredIndex >= 0 ? restoredIndex : 0;
  });

  watch(selectedIndex, (index) => {
    if (index >= 0 && visibleEntries.value[index]) {
      persistBrowserState({
        selectedPath: visibleEntries.value[index].path,
      });
    }
  });

  return {
    browserState,
    breadcrumbs,
    currentLabel,
    dialogRef,
    error,
    handleKeydown,
    handleListScroll,
    handleOverlayClick,
    jumpToBreadcrumb,
    listRef,
    listing,
    loadParent,
    loading,
    openRecentPath,
    retry,
    searchQuery,
    selectCurrentPath,
    selectEntry,
    selectedEntry,
    selectedIndex,
    visibleEntries,
    enterDirectory,
  };
}
