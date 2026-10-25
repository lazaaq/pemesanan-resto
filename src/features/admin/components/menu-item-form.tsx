"use client";

import { useState, useTransition } from "react";
import { TextInput } from "@/features/admin/components/admin-ui";
import { slugify } from "@/lib/utils/slugify";

type CategoryOption = {
  id: string;
  name: string;
};

type MenuItemFormProps = {
  categories: CategoryOption[];
  action: (formData: FormData) => void;
  submitLabel: string;
  onSuccess?: () => void;
  header?: {
    eyebrow?: string;
    title: string;
    showCloseButton?: boolean;
    onClose?: () => void;
  };
  initialValues?: {
    menuItemId?: string;
    name?: string;
    slug?: string;
    price?: number;
    description?: string;
    preparationTimeMinutes?: number;
    sortOrder?: number;
    imageUrl?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
    categoryIds?: string[];
  };
};

export function MenuItemForm({
  categories,
  action,
  submitLabel,
  onSuccess,
  header,
  initialValues,
}: MenuItemFormProps) {
  const [menuName, setMenuName] = useState(initialValues?.name ?? "");
  const [menuSlug, setMenuSlug] = useState(initialValues?.slug ?? "");
  const [isAvailable, setIsAvailable] = useState(initialValues?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(initialValues?.isFeatured ?? false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Override checkbox values with current state since hidden inputs don't update reactively
    formData.set("isAvailable", isAvailable ? "on" : "off");
    formData.set("isFeatured", isFeatured ? "on" : "off");
    startTransition(async () => {
      await action(formData);
      onSuccess?.();
      // For add (with onSuccess dialog close), reset to empty
      // For edit, reset to initial values
      if (onSuccess) {
        e.currentTarget.reset();
        setMenuName("");
        setMenuSlug("");
        setIsAvailable(true);
        setIsFeatured(false);
      } else {
        setMenuName(initialValues?.name ?? "");
        setMenuSlug(initialValues?.slug ?? "");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {header && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {header.eyebrow && (
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--admin-muted)" }}
              >
                {header.eyebrow}
              </p>
            )}
            <h3 className="mt-1 text-lg font-bold" style={{ color: "var(--admin-foreground)" }}>
              {header.title}
            </h3>
          </div>
          {header.showCloseButton && (
            <button
              type="button"
              className="admin-btn-ghost px-3 py-1.5 text-xs"
              onClick={header.onClose}
            >
              Tutup
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <TextInput
          label="Nama menu"
          name="name"
          placeholder="Ayam Bakar Madu"
          required
          value={menuName}
          onChange={(val) => {
            setMenuName(val);
            setMenuSlug(slugify(val));
          }}
        />
        <TextInput
          label="Slug"
          name="slug"
          placeholder="ayam-bakar-madu"
          value={menuSlug}
          onChange={(val) => setMenuSlug(val)}
        />
        <TextInput
          label="Harga"
          name="price"
          placeholder="38000"
          required
          type="number"
          defaultValue={initialValues?.price}
        />
        <TextInput
          label="Waktu masak (menit)"
          name="preparationTimeMinutes"
          type="number"
          defaultValue={initialValues?.preparationTimeMinutes ?? 15}
        />
        <TextInput
          label="Urutan tampil"
          name="sortOrder"
          type="number"
          defaultValue={initialValues?.sortOrder ?? 0}
        />
        <TextInput
          label="URL gambar"
          name="imageUrl"
          placeholder="https://..."
          defaultValue={initialValues?.imageUrl}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
          Deskripsi
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          className="admin-input"
          placeholder="Deskripsi singkat menu"
          style={{ resize: "vertical" }}
        />
      </label>

      <fieldset>
        <legend className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
          Kategori
        </legend>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((category) => {
            const isChecked = initialValues?.categoryIds?.includes(category.id) ?? false;
            return (
              <label
                key={category.id}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--admin-foreground)" }}
              >
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={isChecked}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--admin-primary)" }}
                />
                {category.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm">
          <input
            type="hidden"
            name="isAvailable"
            value={isAvailable ? "on" : "off"}
          />
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: "var(--admin-primary)" }}
          />
          <span className="text-sm" style={{ color: "var(--admin-foreground)" }}>
            Menu tersedia
          </span>
        </label>
        <label className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm">
          <input
            type="hidden"
            name="isFeatured"
            value={isFeatured ? "on" : "off"}
          />
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: "var(--admin-primary)" }}
          />
          <span className="text-sm" style={{ color: "var(--admin-foreground)" }}>
            Tandai sebagai featured
          </span>
        </label>
      </div>

      {initialValues?.menuItemId && (
        <input type="hidden" name="menuItemId" value={initialValues.menuItemId} />
      )}

      <button type="submit" className="admin-btn-primary w-full py-2.5" disabled={isPending}>
        {isPending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
