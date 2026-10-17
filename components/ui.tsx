"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── Button ────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md hover:shadow-lg hover:brightness-110",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        outline:
          "border border-zinc-200 bg-transparent hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
        ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        link: "text-blush-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

// ── Card ──────────────────────────────────────────────────────────────────

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
        "dark:border-zinc-800 dark:bg-zinc-900/70",
        className
      )}
      {...props}
    />
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
        pink: "bg-blush-100 text-blush-600 dark:bg-blush-500/15 dark:text-blush-300",
        lavender: "bg-lav-100 text-lav-500 dark:bg-lav-500/15 dark:text-lav-300",
        green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        outline: "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ── Input / Textarea ──────────────────────────────────────────────────────

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blush-400 disabled:opacity-50",
      "dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blush-400 disabled:opacity-50",
      "dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ── Skeleton ──────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:800px_100%]",
        "dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800",
        className
      )}
    />
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blush-400 to-lav-500 font-semibold text-white",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label={name ?? "avatar"}
    >
      {src ? (
        <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md animate-fade-up rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Empty / Error states ──────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
      {icon && <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-zinc-500">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center dark:border-red-900/40 dark:bg-red-950/20">
      <h3 className="text-base font-semibold text-red-700 dark:text-red-300">{title}</h3>
      <p className="max-w-sm text-sm text-red-600/80 dark:text-red-400/80">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

const ToastCtx = React.createContext<(message: string, kind?: ToastItem["kind"]) => void>(
  () => {}
);

export const useToast = () => React.useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((message: string, kind: ToastItem["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto animate-fade-up rounded-xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur",
              t.kind === "success" && "bg-emerald-600/90 text-white",
              t.kind === "error" && "bg-red-600/90 text-white",
              t.kind === "info" && "bg-zinc-900/90 text-white dark:bg-zinc-100/90 dark:text-zinc-900"
            )}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
