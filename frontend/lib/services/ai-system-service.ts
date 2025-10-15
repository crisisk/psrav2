import { type AiSystem, type CreateAiSystemDto } from '@/lib/types/ai-system';

// Re-export types for consumers
export type { AiSystem, CreateAiSystemDto };

let mockData: AiSystem[] = [
  {
    id: '1',
    name: 'Medical Diagnosis AI',
    provider: 'HealthTech Inc',
    complianceStatus: 'compliant',
    riskLevel: 'low',
  },
];

// Simulate async operations
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 100));

export const createAiSystem = async (dto: CreateAiSystemDto): Promise<AiSystem> => {
  await simulateDelay();
  const newSystem: AiSystem = {
    id: Math.random().toString(36).substr(2, 9),
    complianceStatus: dto.complianceStatus || 'in-review',
    riskLevel: dto.riskLevel || 'medium',
    ...dto,
  };
  mockData.push(newSystem);
  return newSystem;
};

export const getAllAiSystems = async (): Promise<AiSystem[]> => {
  await simulateDelay();
  return mockData;
};

export const updateAiSystem = async (system: AiSystem): Promise<AiSystem> => {
  await simulateDelay();
  const index = mockData.findIndex(s => s.id === system.id);
  if (index === -1) throw new Error('System not found');
  mockData[index] = system;
  return system;
};

export const deleteAiSystem = async (id: string): Promise<void> => {
  await simulateDelay();
  mockData = mockData.filter(s => s.id !== id);
};