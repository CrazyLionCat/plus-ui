export const hasOnlyPasswordGrant = (value: unknown): boolean => {
  return Array.isArray(value) && value.length === 1 && value[0] === 'password';
};
