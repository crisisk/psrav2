declare module '@playwright/test' {
  export type Page = Record<string, any>;

  export interface TestFixtures {
    page: Page;
    [key: string]: any;
  }

  export interface TestType {
    (name: string, fn: (fixtures: TestFixtures) => Promise<void> | void): void;
    beforeEach(fn: (fixtures: TestFixtures) => Promise<void> | void): void;
    describe(name: string, fn: () => void): void;
    step(name: string, fn: () => Promise<void> | void): Promise<void>;
    [key: string]: any;
  }

  export const test: TestType;
  export function expect(actual: unknown): Record<string, (...args: any[]) => void>;
}
