import React from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1.5">
      <p
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--admin-primary)" }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-xl font-bold tracking-tight"
        style={{ color: "var(--admin-foreground)" }}
      >
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
        {description}
      </p>
    </div>
  );
}

export function TextInput({
  defaultValue,
  label,
  name,
  placeholder,
  required = false,
  type = "text",
  value,
  onChange,
}: {
  defaultValue?: string | number | null;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const isControlled = onChange !== undefined;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: "var(--admin-foreground)" }}>
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="admin-input"
        {...(isControlled
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : { defaultValue: defaultValue ?? "" })}
      />
    </label>
  );
}

export function CheckboxInput({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer"
      style={{
        border: "1px solid var(--admin-border)",
        background: "#f8fafc",
        color: "var(--admin-foreground)",
      }}
    >
      <input
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        className="h-4 w-4 rounded"
        style={{ accentColor: "var(--admin-primary)" }}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
