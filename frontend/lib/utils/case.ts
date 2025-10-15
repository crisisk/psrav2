/**
 * Case conversion utilities
 */

export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

export default {
  toSnakeCase,
  toCamelCase,
  toPascalCase,
  toKebabCase
};


/**
 * Convert deep camelCase object to snake_case
 */
export function deepCamelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepCamelToSnake);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = deepCamelToSnake(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

/**
 * Convert deep snake_case object to camelCase
 */
export function deepSnakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepSnakeToCamel);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = deepSnakeToCamel(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}
