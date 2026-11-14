'use client';

export type DialogRequest = {
  id: number;
  kind: 'confirm' | 'prompt' | 'alert';
  message: string;
  defaultValue?: string;
  selectText?: boolean;
  resolve: (value: string | boolean | null) => void;
};

let requests: DialogRequest[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function requestDialog(request: Omit<DialogRequest, 'resolve' | 'id'>) {
  return new Promise<string | boolean | null>((resolve) => {
    requests = [...requests, { ...request, id: ++nextId, resolve }];
    notify();
  });
}

export async function confirmDialog(message: string): Promise<boolean> {
  return (await requestDialog({ kind: 'confirm', message })) === true;
}

export async function promptDialog(
  message: string,
  defaultValue = '',
  options?: { selectText?: boolean }
): Promise<string | null> {
  const result = await requestDialog({ kind: 'prompt', message, defaultValue, ...options });
  return typeof result === 'string' ? result : null;
}

export async function alertDialog(message: string): Promise<void> {
  await requestDialog({ kind: 'alert', message });
}

export function subscribeDialogs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDialog() {
  return requests[0] ?? null;
}

export function finishDialog(request: DialogRequest, value: string | boolean | null) {
  if (requests[0] !== request) return;
  requests = requests.slice(1);
  notify();
  request.resolve(value);
}
