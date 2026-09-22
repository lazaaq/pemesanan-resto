"use client";

import { useRef, useState, useTransition } from "react";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  toggleCategoryActiveAction,
  updateCategoryAction,
} from "@/app/admin/actions";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrip() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="5"  r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5"  r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ActiveToggle({
  categoryId,
  initialValue,
}: {
  categoryId: string;
  initialValue: boolean;
}) {
  const [active, setActive] = useState(initialValue);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !active;
    setActive(next); // optimistic update

    startTransition(async () => {
      const fd = new FormData();
      fd.set("categoryId", categoryId);
      fd.set("isActive", String(next));
      await toggleCategoryActiveAction(fd);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={handleToggle}
      title={active ? "Nonaktifkan kategori" : "Aktifkan kategori"}
      style={{
        width: 40,
        height: 22,
        borderRadius: 99,
        border: "none",
        padding: 2,
        cursor: "pointer",
        background: active ? "var(--admin-primary)" : "#cbd5e1",
        transition: "background 180ms ease",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          transform: active ? "translateX(18px)" : "translateX(0px)",
          transition: "transform 180ms ease",
        }}
      />
    </button>
  );
}

// ─── Inline edit row ──────────────────────────────────────────────────────────

function CategoryRow({
  category,
  isDragging,
  isDragOver,
  dragHandleProps,
}: {
  category: CategoryRow;
  isDragging: boolean;
  isDragOver: boolean;
  dragHandleProps: React.HTMLAttributes<HTMLSpanElement>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.625rem 0.875rem",
        borderRadius: "0.75rem",
        border: `1px solid ${isDragOver ? "var(--admin-primary)" : "var(--admin-border)"}`,
        background: isDragging
          ? "rgba(9,63,180,0.04)"
          : isDragOver
          ? "rgba(9,63,180,0.05)"
          : "#fff",
        boxShadow: isDragging ? "0 4px 20px rgba(9,63,180,0.14)" : undefined,
        opacity: isDragging ? 0.5 : 1,
        transition: "border-color 120ms, background 120ms, box-shadow 120ms",
        userSelect: "none",
      }}
    >
      {/* Drag handle */}
      <span
        {...dragHandleProps}
        title="Seret untuk mengurutkan"
        style={{
          color: "#94a3b8",
          cursor: "grab",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 2px",
          touchAction: "none",
        }}
      >
        <IconGrip />
      </span>

      {/* Col 1: Nama Kategori */}
      <form action={updateCategoryAction} className="flex-1 min-w-0">
        <input type="hidden" name="categoryId" value={category.id} />
        <input type="hidden" name="slug" value={category.slug} />
        <input type="hidden" name="sortOrder" value={category.sort_order} />
        {/* Keep is_active in sync with current DB value */}
        {category.is_active && <input type="hidden" name="isActive" value="on" />}

        <input
          name="name"
          defaultValue={category.name}
          className="admin-input py-1.5 text-sm font-medium"
          style={{ borderRadius: "0.5rem" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </form>

      {/* Col 2: Status Aktif */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <ActiveToggle categoryId={category.id} initialValue={category.is_active} />
        <span
          style={{
            fontSize: 10,
            color: "var(--admin-muted)",
            fontWeight: 500,
          }}
        >
          {category.is_active ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Delete */}
      <form action={deleteCategoryAction} style={{ flexShrink: 0 }}>
        <input type="hidden" name="categoryId" value={category.id} />
        <button
          type="submit"
          title="Hapus kategori"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "0.5rem",
            border: "1px solid rgba(237,53,0,0.25)",
            background: "rgba(237,53,0,0.05)",
            color: "var(--admin-secondary)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 150ms, border-color 150ms",
          }}
        >
          <IconTrash />
        </button>
      </form>
    </div>
  );
}

// ─── Main list with drag-and-drop ─────────────────────────────────────────────

export function CategoryList({
  initialCategories,
}: {
  initialCategories: CategoryRow[];
}) {
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Track which element the drag originated from (only handle)
  const dragSourceRef = useRef<string | null>(null);

  // ── Helpers ──

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    setCategories((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((c) => c.id === fromId);
      const toIdx = next.findIndex((c) => c.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next.map((c, i) => ({ ...c, sort_order: i }));
    });
  }

  async function persistOrder(ordered: CategoryRow[]) {
    const fd = new FormData();
    fd.set("orderedIds", JSON.stringify(ordered.map((c) => c.id)));
    await reorderCategoriesAction(fd);
  }

  // ── Drag event handlers (only triggered via handle) ──

  function handleDragStart(e: React.DragEvent, id: string) {
    if (dragSourceRef.current !== id) {
      // Drag didn't start from the handle — cancel
      e.preventDefault();
      return;
    }
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggingId) setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, toId: string) {
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain");
    if (fromId && fromId !== toId) {
      reorder(fromId, toId);
      startTransition(() => {
        setCategories((current) => {
          persistOrder(current);
          return current;
        });
      });
    }
    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;
  }

  // ── Render ──

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0 0.875rem",
          marginBottom: "0.25rem",
        }}
      >
        <span style={{ width: 24, flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--admin-muted)",
          }}
        >
          Nama Kategori
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--admin-muted)",
            flexShrink: 0,
            width: 56,
            textAlign: "center",
          }}
        >
          Aktif
        </span>
        <span style={{ width: 32, flexShrink: 0 }} />
      </div>

      {categories.map((category) => (
        <div
          key={category.id}
          draggable
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragOver={(e) => handleDragOver(e, category.id)}
          onDrop={(e) => handleDrop(e, category.id)}
          onDragEnd={handleDragEnd}
        >
          <CategoryRow
            category={category}
            isDragging={draggingId === category.id}
            isDragOver={dragOverId === category.id}
            dragHandleProps={{
              onMouseDown: () => {
                dragSourceRef.current = category.id;
              },
              onMouseUp: () => {
                if (draggingId === null) dragSourceRef.current = null;
              },
            }}
          />
        </div>
      ))}

      {categories.length === 0 && (
        <p
          style={{
            padding: "2rem 0",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--admin-muted)",
          }}
        >
          Belum ada kategori. Tambahkan kategori baru di atas.
        </p>
      )}
    </div>
  );
}
