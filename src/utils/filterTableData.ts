export function pickTableColumns<T extends Record<string, any>>(
  data: any,
  validKeys: (keyof T)[]
): Partial<T> {
  return validKeys.reduce((acc, key) => {
    if (data[key] !== undefined) {
      acc[key] = data[key];
    }
    return acc;
  }, {} as Partial<T>);
}
