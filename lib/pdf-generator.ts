import { jsPDF } from 'jspdf';
import type { Certificate } from '@/lib/repository';

interface CertificateResultPayload {
  isConform: boolean;
  confidence: number;
  explanation?: string;
  appliedRules?: Array<{ id?: string; ruleText: string; priority?: number | null }>;
  calculations?: {
    rvc?: number;
    maxNom?: number;
    changeOfTariff?: boolean;
    whollyObtained?: boolean;
  };
  alternatives?: Array<{
    type: string;
    result: boolean;
    confidence?: number;
    details?: string;
  }>;
  persona?: {
    id: string;
    name: string;
    role: string;
    objective: string;
  };
  materials?: Array<{
    hsCode: string;
    origin: string;
    value: number;
    percentage: number;
    description?: string;
  }>;
  manufacturingProcesses?: string[];
}

export type CertificateData = Certificate & { result?: CertificateResultPayload };

export class PDFCertificateGenerator {
  generateCertificate(certificate: CertificateData): Buffer {
    const doc = new jsPDF({ unit: 'pt' });

    this.renderHeader(doc, certificate);
    this.renderSummary(doc, certificate);
    this.renderRuleInsights(doc, certificate.result);
    this.renderBillOfMaterials(doc, certificate.result);
    this.renderFooter(doc);

    return Buffer.from(doc.output('arraybuffer'));
  }

  private renderHeader(doc: jsPDF, certificate: CertificateData) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Certificate of Origin', 297.5, 60, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Trade Agreement: ${certificate.agreement}`, 297.5, 85, { align: 'center' });
  }

  private renderSummary(doc: jsPDF, certificate: CertificateData) {
    const { result } = certificate;
    const createdDate = new Date(certificate.createdAt);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    const leftColumnX = 40;
    const rightColumnX = 250;
    let yPos = 120;

    const summaryFields: Array<[string, string]> = [
      ['Certificate ID', certificate.id],
      ['Product SKU', certificate.productSku],
      ['HS Code', certificate.hs6],
      ['Status', certificate.status.toUpperCase()],
      ['Issued', createdDate.toISOString().split('T')[0]],
    ];

    summaryFields.forEach(([label, value]) => {
      doc.text(`${label}:`, leftColumnX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, rightColumnX, yPos);
      doc.setFont('helvetica', 'bold');
      yPos += 18;
    });

    if (result) {
      doc.setFont('helvetica', 'bold');
      doc.text('Compliance Outcome:', leftColumnX, yPos + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(result.isConform ? 'CONFORMING' : 'NON-CONFORMING', rightColumnX, yPos + 10);
      doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, rightColumnX, yPos + 28);
    }
  }

  private renderRuleInsights(doc: jsPDF, result?: CertificateResultPayload) {
    if (!result) {
      return;
    }

    let yPos = 220;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rule Interpretation', 40, yPos);
    yPos += 18;

    doc.setFont('helvetica', 'normal');
    const explanation = result.explanation ?? 'No explanation provided';
    const wrapped = doc.splitTextToSize(explanation, 515);
    doc.text(wrapped, 40, yPos);
    yPos += wrapped.length * 14 + 10;

    if (result.appliedRules?.length) {
      doc.setFont('helvetica', 'bold');
      doc.text('Applied Rules', 40, yPos);
      yPos += 16;
      doc.setFont('helvetica', 'normal');
      result.appliedRules.forEach((rule, index) => {
        const priorityText = rule.priority != null ? ` (Priority ${rule.priority})` : '';
        const label = `${index + 1}. ${rule.ruleText}${priorityText}`;
        const wrappedRule = doc.splitTextToSize(label, 515);
        doc.text(wrappedRule, 40, yPos);
        yPos += wrappedRule.length * 14 + 6;
      });
    }

    if (result.calculations) {
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics', 40, yPos + 10);
      yPos += 24;
      doc.setFont('helvetica', 'normal');

      const metrics: string[] = [];
      if (result.calculations.rvc != null) {
        metrics.push(`Regional Value Content: ${result.calculations.rvc.toFixed(1)}%`);
      }
      if (result.calculations.maxNom != null) {
        metrics.push(`Maximum Non-Originating Materials: ${result.calculations.maxNom.toFixed(1)}%`);
      }
      if (result.calculations.changeOfTariff != null) {
        metrics.push(`Change of Tariff: ${result.calculations.changeOfTariff ? 'Yes' : 'No'}`);
      }
      if (result.calculations.whollyObtained != null) {
        metrics.push(`Wholly Obtained: ${result.calculations.whollyObtained ? 'Yes' : 'No'}`);
      }

      metrics.forEach((metric) => {
        doc.text(`• ${metric}`, 40, yPos);
        yPos += 14;
      });
    }

    if (result.alternatives?.length) {
      doc.setFont('helvetica', 'bold');
      doc.text('Alternative Evaluations', 40, yPos + 10);
      yPos += 24;
      doc.setFont('helvetica', 'normal');

      result.alternatives.forEach((alt) => {
        const status = alt.result ? 'PASS' : 'FAIL';
        const confidence = alt.confidence != null ? ` (${(alt.confidence * 100).toFixed(0)}% confidence)` : '';
        const description = alt.details ?? 'No additional detail';
        const wrapped = doc.splitTextToSize(`• ${alt.type}: ${status}${confidence} — ${description}`, 515);
        doc.text(wrapped, 40, yPos);
        yPos += wrapped.length * 14 + 6;
      });
    }

    if (result.persona) {
      doc.setFont('helvetica', 'bold');
      doc.text('Persona Context', 40, yPos + 10);
      yPos += 24;
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${result.persona.name} (${result.persona.role})`, 40, yPos);
      doc.text(`Objective: ${result.persona.objective}`, 40, yPos + 16);
    }
  }

  private renderBillOfMaterials(doc: jsPDF, result?: CertificateResultPayload) {
    if (!result?.materials?.length) {
      return;
    }

    let yPos = 440;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Bill of Materials Snapshot', 40, yPos);
    yPos += 18;

    doc.setFont('helvetica', 'normal');
    result.materials.slice(0, 8).forEach((material, index) => {
      const description = material.description ?? 'Component';
      const line = `${index + 1}. ${description} — HS ${material.hsCode} (${material.origin}) • ${material.percentage}% / €${material.value.toFixed(2)}`;
      const wrapped = doc.splitTextToSize(line, 515);
      doc.text(wrapped, 40, yPos);
      yPos += wrapped.length * 14 + 4;
    });

    if (result.materials.length > 8) {
      doc.text(`+ ${result.materials.length - 8} additional materials`, 40, yPos + 10);
    }

    if (result.manufacturingProcesses?.length) {
      yPos += 24;
      doc.setFont('helvetica', 'bold');
      doc.text('Critical Processes', 40, yPos);
      yPos += 16;
      doc.setFont('helvetica', 'normal');
      doc.text(result.manufacturingProcesses.map((process) => `• ${process}`), 40, yPos);
    }
  }

  private renderFooter(doc: jsPDF) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Generated automatically by the PSRA Origin Checker Enterprise v2 platform.',
      297.5,
      780,
      { align: 'center' }
    );
    doc.text('For verification support contact compliance@sevensa.nl', 297.5, 795, { align: 'center' });
  }
}

export const pdfGenerator = new PDFCertificateGenerator();
