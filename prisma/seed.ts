import { PrismaClient, Prisma } from '@prisma/client';
import hsCodes from '../data/hs-codes.json';
import tradeAgreements from '../data/trade-agreements.json';
import originRules from '../data/origin-rules.json';
import { personaScenarios } from '../data/persona-scenarios';

const prisma = new PrismaClient();

async function seedHsCodes() {
  await prisma.hsCode.createMany({
    data: (hsCodes as Array<{ code: string; chapter: string; description: string }>).map(
      (entry): Prisma.HsCodeCreateManyInput => ({
        code: entry.code,
        chapter: entry.chapter,
        description: entry.description,
        section: entry.chapter.slice(0, 1),
      })
    ),
    skipDuplicates: true,
  });
}

async function seedTradeAgreements() {
  for (const agreement of tradeAgreements as Array<{
    code: string;
    name: string;
    description?: string;
    active?: boolean;
  }>) {
    await prisma.tradeAgreement.upsert({
      where: { code: agreement.code },
      update: {
        name: agreement.name,
        description: agreement.description ?? null,
        active: agreement.active ?? true,
      },
      create: {
        code: agreement.code,
        name: agreement.name,
        description: agreement.description ?? null,
        active: agreement.active ?? true,
      },
    });
  }
}

async function seedOriginRules() {
  const identifiers = (originRules as Array<{ hsCode: string; tradeAgreement: string }>).map(
    (rule) => `${rule.hsCode}-${rule.tradeAgreement}`
  );

  if (identifiers.length > 0) {
    await prisma.originRule.deleteMany({ where: { id: { in: identifiers } } });
  }

  await prisma.originRule.createMany({
    data: (originRules as Array<{
      hsCode: string;
      tradeAgreement: string;
      ruleText: string;
      priority: number;
      conditions: Record<string, unknown>;
    }>).map(
      (rule): Prisma.OriginRuleCreateManyInput => ({
        id: `${rule.hsCode}-${rule.tradeAgreement}`,
        hsCode: rule.hsCode,
        tradeAgreement: rule.tradeAgreement,
        ruleText: rule.ruleText,
        conditions: {
          priority: rule.priority,
          ...rule.conditions,
        } as unknown as Prisma.InputJsonValue,
      })
    ),
    skipDuplicates: true,
  });
}

async function seedCertificates() {
  const personas = personaScenarios.filter((persona) => persona.id !== 'custom').slice(0, 5);

  await prisma.certificate.createMany({
    data: personas.map(
      (persona, index): Prisma.CertificateCreateManyInput => ({
        productSku: persona.productSku,
        hs6: persona.hsCode,
        agreement: persona.agreement,
        status: index % 3 === 0 ? 'processing' : 'done',
        result: {
          persona: {
            id: persona.id,
            name: persona.name,
            role: persona.role,
            objective: persona.objective,
          },
          materials: persona.materials,
          successCriteria: persona.successCriteria,
          insights: persona.insights,
        } as unknown as Prisma.InputJsonValue,
      })
    ),
    skipDuplicates: true,
  });
}

async function main() {
  console.info('Seeding HS codes...');
  await seedHsCodes();
  console.info('Seeding trade agreements...');
  await seedTradeAgreements();
  console.info('Seeding origin rules...');
  await seedOriginRules();
  console.info('Seeding sample certificates...');
  await seedCertificates();
}

main()
  .then(() => {
    console.info('Seed complete');
  })
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
