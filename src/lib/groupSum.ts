export function groupSum<T>(items: T[], keyFn: (t: T) => string, valueFn: (t: T) => number): Map<string, number> {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + valueFn(item));
  });
  return map;
}
