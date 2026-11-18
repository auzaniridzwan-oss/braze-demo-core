import { useState } from "react";
import { BRAZE_ENDPOINTS, isAllowedEndpoint, resolveEndpoint } from "../braze/endpoints";
import type { BrazeConnection } from "../braze/client";
import { Alert, Button, Field, Input, Select } from "./ui";

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

/**
 * Braze instance + REST API key + workspace label. The key is held by the caller in memory;
 * this form never stores it.
 */
export function ConnectionForm({
  value, onChange, permissions, onTest, allowMock = false,
}: {
  value: BrazeConnection;
  onChange: (next: BrazeConnection) => void;
  /** Permissions the key needs, shown under the key field, e.g. ["users.track"]. */
  permissions: string[];
  /** Optional "Test connection" action. */
  onTest?: () => Promise<ConnectionTestResult>;
  /** Accept http://localhost custom endpoints (mock server). */
  allowMock?: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const base = resolveEndpoint(value.endpoint, value.customEndpoint);
  const endpointOk = isAllowedEndpoint(base, allowMock);
  const set = (patch: Partial<BrazeConnection>) => {
    setResult(null);
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Braze instance" hint={value.endpoint === "custom" ? undefined : base}>
          <Select value={value.endpoint} onChange={(e) => set({ endpoint: e.target.value })}>
            {BRAZE_ENDPOINTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
            <option value="custom">Custom URL…</option>
          </Select>
        </Field>
        <Field label="Workspace label" hint="For your reference only.">
          <Input value={value.workspaceLabel} placeholder="e.g. Acme demo – Dev" onChange={(e) => set({ workspaceLabel: e.target.value })} />
        </Field>
      </div>
      {value.endpoint === "custom" && (
        <Field label="REST endpoint URL" hint={value.customEndpoint && !endpointOk ? "Must be a Braze REST host, e.g. https://rest.iad-01.braze.com" : undefined}>
          <Input value={value.customEndpoint} placeholder="https://rest.iad-01.braze.com" onChange={(e) => set({ customEndpoint: e.target.value })} />
        </Field>
      )}
      <Field
        label="REST API key"
        hint={<>Needs {permissions.map((p, i) => <span key={p}>{i > 0 && ", "}<code>{p}</code></span>)}. Kept in memory only, never saved.</>}
      >
        <Input
          type="password" autoComplete="off" spellCheck={false}
          value={value.apiKey} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          onChange={(e) => set({ apiKey: e.target.value })}
        />
      </Field>
      {onTest && (
        <div className="flex items-center gap-3">
          <Button
            disabled={!value.apiKey.trim() || !endpointOk || testing}
            onClick={async () => {
              setTesting(true);
              try {
                setResult(await onTest());
              } catch (e) {
                setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
              } finally {
                setTesting(false);
              }
            }}
          >
            {testing ? "Testing…" : "Test connection"}
          </Button>
        </div>
      )}
      {result && <Alert tone={result.ok ? "success" : "error"}>{result.message}</Alert>}
    </div>
  );
}
