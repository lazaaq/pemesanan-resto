"use client";

import { useTransition } from "react";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";

type DeleteButtonProps = {
  action: (formData: FormData) => void;
  itemId: string;
  label: string;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function DeleteButton({
  action,
  itemId,
  label,
  confirmTitle = "Konfirmasi",
  confirmMessage = "Yakin ingin menghapus?",
  confirmLabel = "Ya, hapus",
  cancelLabel = "Batal",
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.append("menuItemId", itemId);
    startTransition(() => action(formData));
  }

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          disabled={isPending}
          className="admin-btn-danger rounded-full px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Menghapus..." : label}
        </button>
      }
      title={confirmTitle}
      message={confirmMessage}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={handleDelete}
      variant="danger"
    />
  );
}
