"use client";

import { useRef } from "react";
import { createMenuItemAction } from "@/app/admin/actions";
import { MenuItemForm } from "@/features/admin/components/menu-item-form";

type CategoryOption = {
  id: string;
  name: string;
};

export function AddMenuDialog({ categories }: { categories: CategoryOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          className="admin-btn-primary px-5 py-2.5"
          onClick={() => dialogRef.current?.showModal()}
        >
          Tambah menu baru
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
      >
        <div className="p-5">
          <MenuItemForm
            categories={categories}
            action={createMenuItemAction}
            submitLabel="Tambah menu baru"
            onSuccess={() => dialogRef.current?.close()}
            header={{
              eyebrow: "Menu baru",
              title: "Tambah menu baru",
              showCloseButton: true,
              onClose: () => dialogRef.current?.close(),
            }}
          />
        </div>
      </dialog>
    </>
  );
}
