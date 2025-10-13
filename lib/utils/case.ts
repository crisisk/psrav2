const CAMEL_TO_SNAKE_PATTERN = /([a-z0-9])([A-Z])/g;
const ACRONYM_BOUNDARY_PATTERN = /([A-Z]+)([A-Z][a-z0-9]+)/g;
const SNAKE_SEGMENT_PATTERN = /[_-]([a-z0-9])/g;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const camelToSnake = (value: string): string =>
  value
    .replace(ACRONYM_BOUNDARY_PATTERN, '$1_$2')
    .replace(CAMEL_TO_SNAKE_PATTERN, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();

export const snakeToCamel = (value: string): string =>
  value.replace(SNAKE_SEGMENT_PATTERN, (_, segment: string) => segment.toUpperCase());

export const deepCamelToSnake = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map(item => deepCamelToSnake(item));
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
      const transformedKey = camelToSnake(key);
      accumulator[transformedKey] = deepCamelToSnake(value);
      return accumulator;
    }, {});
  }

  return input;
};

export const deepSnakeToCamel = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map(item => deepSnakeToCamel(item));
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
      const transformedKey = snakeToCamel(key);
      accumulator[transformedKey] = deepSnakeToCamel(value);
      return accumulator;
    }, {});
  }

  return input;
};
