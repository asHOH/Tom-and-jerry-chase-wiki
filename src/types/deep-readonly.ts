type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type DeepReadonlyArray<T extends readonly unknown[]> = number extends T['length']
  ? ReadonlyArray<DeepReadonly<T[number]>>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };

/**
 * Recursively marks all properties of the given type as readonly, preserving callable signatures.
 */
export type DeepReadonly<T> = T extends Primitive | ((...args: readonly unknown[]) => unknown)
  ? T
  : T extends Promise<infer U>
    ? Promise<DeepReadonly<U>>
    : T extends Map<infer K, infer V>
      ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
      : T extends Set<infer U>
        ? ReadonlySet<DeepReadonly<U>>
        : T extends readonly unknown[]
          ? DeepReadonlyArray<T>
          : T extends object
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T;
