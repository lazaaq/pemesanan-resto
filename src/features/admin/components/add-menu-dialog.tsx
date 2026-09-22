"use client";

import { useRef } from "react";
import { createMenuItemAction } from "@/app/admin/actions";
import { CheckboxInput, TextInput } from "@/features/admin/components/admin-ui";

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
        className="w-[min(720px,calc(100vw-2rem))] rounded-xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
      >
        <form action={createMenuItemAction} className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                Menu baru
              </p>
              <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
                Tambah menu baru
              </h3>
            </div>
            <button
              type="button"
              className="admin-btn-ghost px-3 py-1.5 text-xs"
              onClick={() => dialogRef.current?.close()}
            >
              Tutup
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Nama menu" name="name" placeholder="Ayam Bakar Madu" required />
            <TextInput label="Slug" name="slug" placeholder="ayam-bakar-madu" />
            <TextInput label="Harga" name="price" placeholder="38000" required type="number" />
            <TextInput
              defaultValue={15}
              label="Waktu masak (menit)"
              name="preparationTimeMinutes"
              type="number"
            />
            <TextInput label="Urutan tampil" name="sortOrder" type="number" defaultValue={0} />
            <TextInput label="URL gambar" name="imageUrl" placeholder="https://..." />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
              Deskripsi
            </span>
            <textarea
              name="description"
              rows={3}
              className="admin-input"
              placeholder="Deskripsi singkat menu"
              style={{ resize: "vertical" }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
              Kategori
            </span>
            <select
              multiple
              name="categoryIds"
              className="admin-input"
              style={{ minHeight: "9rem" }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
              Gunakan Cmd / Ctrl saat memilih lebih dari satu kategori.
            </p>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxInput defaultChecked label="Menu tersedia" name="isAvailable" />
            <CheckboxInput label="Tandai sebagai featured" name="isFeatured" />
          </div>

          <button type="submit" className="admin-btn-primary w-full py-2.5">
            Tambah menu baru
          </button>
        </form>
      </dialog>
    </>
  );
}
