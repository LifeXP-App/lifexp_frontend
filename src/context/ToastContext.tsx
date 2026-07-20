"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Renders the confirm button in a destructive (red) style. */
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

/** Callable as `toast("msg")` or `toast.error("msg")` / `.success` / `.info`. */
export interface ToastApi {
  (message: string, variant?: ToastVariant): void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

interface ToastContextValue {
  toast: ToastApi;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => remove(id), AUTO_DISMISS_MS);
    },
    [remove]
  );

  const toast = useMemo<ToastApi>(() => {
    const fn = ((message: string, variant?: ToastVariant) =>
      push(message, variant)) as ToastApi;
    fn.success = (m: string) => push(m, "success");
    fn.error = (m: string) => push(m, "error");
    fn.info = (m: string) => push(m, "info");
    return fn;
  }, [push]);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setDialog({ id: ++idRef.current, resolve, ...opts });
    });
  }, []);

  const closeDialog = useCallback((result: boolean) => {
    setDialog((cur) => {
      cur?.resolve(result);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="fixed z-[9999] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-center sm:items-end pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>

      {/* Confirm dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 animate-backdrop-in"
          onClick={() => closeDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl shadow-2xl border bg-white dark:bg-dark-2 animate-dialog-in overflow-hidden"
            style={{ borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="px-6 pt-6 pb-4">
              {dialog.title && (
                <h2 className="text-lg font-bold mb-1 text-foreground dark:text-[var(--foreground)]">
                  {dialog.title}
                </h2>
              )}
              <p className="text-sm text-gray-600 dark:text-[var(--muted)] leading-relaxed">
                {dialog.message}
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="flex-1 py-2.5 rounded-2xl font-medium text-sm border bg-transparent text-foreground dark:text-[var(--foreground)] transition-all active:scale-95 cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                {dialog.cancelText ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => closeDialog(true)}
                className={`flex-1 py-2.5 rounded-2xl font-medium text-sm text-white transition-all active:scale-95 cursor-pointer ${
                  dialog.destructive ? "bg-red-600 hover:bg-red-700" : ""
                }`}
                style={
                  dialog.destructive
                    ? undefined
                    : { backgroundColor: "var(--rookie-primary)" }
                }
              >
                {dialog.confirmText ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const styles: Record<ToastVariant, { accent: string; icon: ReactNode }> = {
    success: {
      accent: "#22c55e",
      icon: (
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    error: {
      accent: "#ef4444",
      icon: (
        <path
          d="M12 8v5m0 3.5h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    info: {
      accent: "var(--rookie-primary)",
      icon: (
        <path
          d="M12 16v-5m0-3.5h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  };

  const { accent, icon } = styles[item.variant];

  return (
    <div
      onClick={onDismiss}
      role="status"
      className="pointer-events-auto flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-dark-2 cursor-pointer animate-toast-in"
      style={{ borderColor: "var(--border)" }}
    >
      <span
        className="shrink-0 mt-0.5"
        style={{ color: accent }}
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          {icon}
        </svg>
      </span>
      <p className="text-sm font-medium text-foreground dark:text-[var(--foreground)] leading-snug break-words">
        {item.message}
      </p>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.toast;
}

export function useConfirm() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useConfirm must be used within a ToastProvider");
  return ctx.confirm;
}
