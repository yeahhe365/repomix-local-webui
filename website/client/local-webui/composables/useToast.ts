import { ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ToastOptions {
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const DEFAULT_DURATION = 4000;

// Module-level singleton so all components that call useToast() share one queue.
const toasts = ref<ToastItem[]>([]);
let nextId = 1;

const timers = new Map<number, ReturnType<typeof setTimeout>>();

function clearTimer(id: number) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function scheduleDismiss(id: number, duration: number) {
  if (duration <= 0) {
    return;
  }
  clearTimer(id);
  timers.set(
    id,
    setTimeout(() => {
      dismissToast(id);
    }, duration),
  );
}

export function showToast(message: string, opts: ToastOptions = {}): void {
  const id = nextId;
  nextId += 1;

  const toast: ToastItem = {
    id,
    message,
    type: opts.type ?? 'info',
    actionLabel: opts.actionLabel,
    onAction: opts.onAction,
    duration: opts.duration ?? DEFAULT_DURATION,
  };

  toasts.value = [...toasts.value, toast];
  scheduleDismiss(id, toast.duration ?? DEFAULT_DURATION);
}

export function dismissToast(id: number): void {
  clearTimer(id);
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

export function triggerToastAction(id: number): void {
  const toast = toasts.value.find((item) => item.id === id);
  if (!toast) {
    return;
  }
  toast.onAction?.();
  dismissToast(id);
}

export function useToast() {
  return {
    toasts,
    showToast,
    dismissToast,
    triggerToastAction,
  };
}
