import type { Ref } from 'vue';

export interface UseLocalPathBrowserOptions {
  open: Ref<boolean>;
  rootLabel: Ref<string>;
  unexpectedErrorMessage: Ref<string>;
  close: () => void;
  select: (path: string) => void;
}
