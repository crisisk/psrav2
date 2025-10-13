export interface IntegrationOption {
  id: string;
  label: string;
  format: 'csv' | 'xlsx' | 'pdf' | 'api';
  description: string;
  endpoint: string;
  personas: string[];
}

const BASE_URL = 'https://api.psra.sevensa.nl';

export function getInvoiceIntegrationOptions(): IntegrationOption[] {
  return [
    {
      id: 'csv-dropbox',
      label: 'Secure CSV upload',
      format: 'csv',
      description: 'Automatisch ophalen van CSV-exporten vanuit ERP-systemen (SAP, Exact Online, AFAS).',
      endpoint: `${BASE_URL}/integrations/invoices/csv`,
      personas: ['supplier', 'analyst'],
    },
    {
      id: 'xlsx-connector',
      label: 'XLSX / Excel connector',
      format: 'xlsx',
      description: 'Bi-directionele synchronisatie met Excel PowerQuery voor BOM-lijsten en factuurregels.',
      endpoint: `${BASE_URL}/integrations/invoices/xlsx`,
      personas: ['analyst', 'finance'],
    },
    {
      id: 'pdf-ingestion',
      label: 'OCR + PDF parsing',
      format: 'pdf',
      description: 'Inlezen van gescande facturen met OCR en extraction templates (UBL, Peppol).',
      endpoint: `${BASE_URL}/integrations/invoices/pdf`,
      personas: ['supplier', 'compliance'],
    },
    {
      id: 'erp-rest-hook',
      label: 'REST API webhook',
      format: 'api',
      description: 'Realtime push van facturen via ERP-webhooks (SAP S/4HANA, Microsoft Dynamics, Oracle NetSuite).',
      endpoint: `${BASE_URL}/integrations/invoices/webhook`,
      personas: ['sysadmin', 'analyst'],
    },
  ];
}
