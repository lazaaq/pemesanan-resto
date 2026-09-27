"use client";

import { useRef, useState } from "react";

type ConfirmDialogProps = {
  trigger: React.ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "danger" | "default";
};

export function ConfirmDialog({
  trigger,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleOpen() {
    setIsOpen(true);
    dialogRef.current?.showModal();
  }

  function handleClose() {
    setIsOpen(false);
    dialogRef.current?.close();
    onCancel?.();
  }

  function handleConfirm() {
    setIsOpen(false);
    dialogRef.current?.close();
    onConfirm();
  }

  return (
    <>
      <div onClick={handleOpen}>{trigger}</div>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
        onClose={handleClose}
      >
        <div className="p-5">
          <h3 className="text-base font-bold" style={{ color: "var(--admin-foreground)" }}>
            {title}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--admin-muted)" }}>
            {message}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="admin-btn-ghost flex-1 rounded-full px-4 py-2 text-sm"
              onClick={handleClose}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2 text-sm ${
                variant === "danger"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "admin-btn-primary"
              }`}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
