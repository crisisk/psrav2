import type { CtaMapping } from '@/types/cta';

class MockCtaDatabase {
  private storage = new Map<string, CtaMapping>();

  createOrUpdate(cta: Omit<CtaMapping, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CtaMapping {
    const id = cta.id || Date.now().toString();
    const now = new Date();
    const newCta: CtaMapping = {
      ...cta,
      id,
      createdAt: cta.id ? this.storage.get(cta.id)?.createdAt || now : now,
      updatedAt: now,
    };
    this.storage.set(id, newCta);
    return newCta;
  }

  getAll(): CtaMapping[] {
    return Array.from(this.storage.values());
  }
}

const mockDb = new MockCtaDatabase();
export default mockDb;
