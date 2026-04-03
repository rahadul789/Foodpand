/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastTone = "success" | "error";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (payload: {
    title: string;
    description?: string;
    tone?: ToastTone;
  }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const idRef = useRef(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((toastId: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToast = useCallback(
    (payload: { title: string; description?: string; tone?: ToastTone }) => {
      const id = ++idRef.current;
      const nextToast: ToastItem = {
        id,
        title: payload.title,
        description: payload.description,
        tone: payload.tone ?? "success",
      };

      setToasts((current) => [...current, nextToast].slice(-4));

      window.setTimeout(() => {
        dismissToast(id);
      }, 2800);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.tone === "error"
                ? "toast-card toast-card-error"
                : "toast-card toast-card-success"
            }
          >
            <div className="toast-copy">
              <strong>{toast.title}</strong>
              {toast.description ? <span>{toast.description}</span> : null}
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss toast"
              onClick={() => dismissToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
