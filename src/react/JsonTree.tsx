"use client";

import type { AttrValue } from "../types";

/** Compact one-line JSON for table cells. */
export function compact(v: AttrValue | undefined, max = 60): string {
  if (v === undefined) return "";
  const s = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function isTime(v: AttrValue): v is { $time: AttrValue } {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "$time" in v;
}

/** Expandable tree for objects and arrays; {"$time": …} dates render as dates. */
export function JsonTree({ value, name, depth = 0 }: { value: AttrValue; name?: string; depth?: number }) {
  const label = name !== undefined && <span className="text-slate-500 dark:text-slate-400">{name}: </span>;
  if (value === null || typeof value !== "object") {
    return (
      <div className="font-mono text-xs">
        {label}
        <span className={typeof value === "string" ? "text-emerald-700 dark:text-emerald-400" : "text-sky-700 dark:text-sky-400"}>{JSON.stringify(value)}</span>
      </div>
    );
  }
  if (isTime(value)) {
    return <div className="font-mono text-xs">{label}<span className="text-emerald-700 dark:text-emerald-400">{String(value.$time)}</span> <span className="text-slate-400">$time</span></div>;
  }
  const entries: [string, AttrValue][] = Array.isArray(value) ? value.map((v, i) => [String(i), v]) : Object.entries(value);
  const primitiveArray = Array.isArray(value) && value.every((v) => v === null || typeof v !== "object");
  if (primitiveArray) {
    return <div className="font-mono text-xs">{label}<span className="text-slate-700 dark:text-slate-300">{JSON.stringify(value)}</span></div>;
  }
  return (
    <details open={depth < 2} className="font-mono text-xs">
      <summary className="cursor-pointer">
        {label}
        <span className="text-slate-400">{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
      </summary>
      <div className="ml-3 border-l border-slate-200 pl-3 dark:border-slate-700">
        {entries.map(([k, v]) => <JsonTree key={k} name={k} value={v} depth={depth + 1} />)}
      </div>
    </details>
  );
}
