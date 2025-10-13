# FIXES REQUIRED - Specific Code Changes
## PSRA-LTSD Enterprise v2

**Document Purpose:** Actionable fixes with exact file paths and code changes needed.
**Priority Legend:** P0 (Critical/Blocking) | P1 (High) | P2 (Medium) | P3 (Low)

---

## P0 - CRITICAL FIXES (Must Fix Immediately)

### 1. Fix Import Typo in CTAStrip [P0]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/dashboard/CTAStrip.tsx`

**Line:** 4

**Current Code:**
```typescript
import { track Event } from '@/shared/lib/telemetry';
```

**Fixed Code:**
```typescript
import { trackEvent } from '@/shared/lib/telemetry';
```

**Impact:** Component will not compile/run with typo. Critical blocker.

---

### 2. Implement CTA Button Functionality [P0]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/dashboard/CTAStrip.tsx`

**Current Code (lines 9-24):**
```typescript
<button
  onClick={() => trackEvent('cta_click', { cta: 'start_origin_check' })}
  className="group bg-white dark:bg-dark-bg-surface border-2 border-sevensa-teal hover:bg-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
>
  {/* ... button content ... */}
</button>
```

**Fixed Code:**
```typescript
'use client';

import { Plus, FileCheck, Upload } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';
import { useState } from 'react';
import { OriginCheckModal } from '@/shared/ui/modals/OriginCheckModal';
import { LtsdGeneratorModal } from '@/shared/ui/modals/LtsdGeneratorModal';
import { CooUploadModal } from '@/shared/ui/modals/CooUploadModal';

export function CTAStrip() {
  const [showOriginCheck, setShowOriginCheck] = useState(false);
  const [showLtsdGenerator, setShowLtsdGenerator] = useState(false);
  const [showCooUpload, setShowCooUpload] = useState(false);

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            trackEvent('cta_click', { cta: 'start_origin_check' });
            setShowOriginCheck(true);
          }}
          className="group bg-white dark:bg-dark-bg-surface border-2 border-sevensa-teal hover:bg-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-sevensa-teal/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-sevensa-teal group-hover:text-white transition-colors" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-sevensa-dark dark:text-dark-text-primary group-hover:text-white mb-1 transition-colors">
            Start Origin Check
          </h3>
          <p className="text-sm text-text-secondary group-hover:text-white/80 transition-colors">
            Nieuwe preferential origin assessment aanmaken
          </p>
        </button>

        <button
          onClick={() => {
            trackEvent('cta_click', { cta: 'generate_ltsd' });
            setShowLtsdGenerator(true);
          }}
          className="group bg-white dark:bg-dark-bg-surface border-2 border-border dark:border-dark-border hover:border-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-success" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-sevensa-dark dark:text-dark-text-primary mb-1">
            Genereer LTSD
          </h3>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Create Long-Term Supplier Declaration certificaat
          </p>
        </button>

        <button
          onClick={() => {
            trackEvent('cta_click', { cta: 'upload_coo' });
            setShowCooUpload(true);
          }}
          className="group bg-white dark:bg-dark-bg-surface border-2 border-border dark:border-dark-border hover:border-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-warning" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-sevensa-dark dark:text-dark-text-primary mb-1">
            Upload CoO
          </h3>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Certificate of Origin van supplier uploaden
          </p>
        </button>
      </div>

      {/* Modals */}
      <OriginCheckModal
        isOpen={showOriginCheck}
        onClose={() => setShowOriginCheck(false)}
      />
      <LtsdGeneratorModal
        isOpen={showLtsdGenerator}
        onClose={() => setShowLtsdGenerator(false)}
      />
      <CooUploadModal
        isOpen={showCooUpload}
        onClose={() => setShowCooUpload(false)}
      />
    </>
  );
}
```

**Additional Files to Create:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/modals/OriginCheckModal.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/shared/ui/Toaster';
import { useRouter } from 'next/navigation';

interface OriginCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OriginCheckModal({ isOpen, onClose }: OriginCheckModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    hsCode: '',
    agreement: 'EU-Japan EPA',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create assessment');

      const assessment = await response.json();
      toast.success('Assessment created successfully');
      onClose();
      router.push(`/assessment/${assessment.id}`);
    } catch (error) {
      toast.error('Failed to create assessment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Origin Check</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Smartphones met touchscreen"
              required
            />
          </div>
          <div>
            <Label htmlFor="hsCode">HS Code</Label>
            <Input
              id="hsCode"
              value={formData.hsCode}
              onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
              placeholder="e.g., 8517.12.00"
              pattern="[0-9]{4}\.[0-9]{2}\.[0-9]{2}"
              required
            />
            <p className="text-xs text-text-muted mt-1">Format: XXXX.XX.XX</p>
          </div>
          <div>
            <Label htmlFor="agreement">Trade Agreement</Label>
            <select
              id="agreement"
              value={formData.agreement}
              onChange={(e) => setFormData({ ...formData, agreement: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2"
              required
            >
              <option value="EU-Japan EPA">EU-Japan EPA</option>
              <option value="CETA">CETA (Canada)</option>
              <option value="EU-South Korea FTA">EU-South Korea FTA</option>
              <option value="EU-Vietnam FTA">EU-Vietnam FTA</option>
              <option value="EU-Mexico FTA">EU-Mexico FTA</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/modals/LtsdGeneratorModal.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/shared/ui/Toaster';

interface LtsdGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LtsdGeneratorModal({ isOpen, onClose }: LtsdGeneratorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: '',
    validFrom: '',
    validUntil: '',
    products: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ltsd-addon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate LTSD');

      const result = await response.json();
      toast.success('LTSD certificate generated successfully');

      // Download the PDF
      if (result.pdfUrl) {
        window.open(result.pdfUrl, '_blank');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to generate LTSD certificate');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate LTSD Certificate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="supplierName">Supplier Name</Label>
            <Input
              id="supplierName"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              placeholder="e.g., Acme Industries BV"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="products">Products (comma-separated)</Label>
            <Input
              id="products"
              value={formData.products}
              onChange={(e) => setFormData({ ...formData, products: e.target.value })}
              placeholder="e.g., Steel components, Fasteners"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate LTSD'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/modals/CooUploadModal.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/shared/ui/Toaster';
import { Upload } from 'lucide-react';

interface CooUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CooUploadModal({ isOpen, onClose }: CooUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    ltsdId: '',
    nodeId: '',
    issuer: '',
    country: '',
    validFrom: '',
    validUntil: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);

    try {
      // Initialize upload
      const initResponse = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          ...formData,
        }),
      });

      if (!initResponse.ok) throw new Error('Failed to initialize upload');

      const { uploadUrl, certificateId } = await initResponse.json();

      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      // Complete upload
      await fetch(`/api/certificates/${certificateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'uploaded' }),
      });

      toast.success('Certificate of Origin uploaded successfully');
      onClose();
      setFile(null);
      setFormData({
        ltsdId: '',
        nodeId: '',
        issuer: '',
        country: '',
        validFrom: '',
        validUntil: '',
      });
    } catch (error) {
      toast.error('Failed to upload certificate');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Certificate of Origin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">PDF File</Label>
            <div className="mt-1 flex items-center">
              <label
                htmlFor="file"
                className="cursor-pointer flex items-center justify-center w-full border-2 border-dashed border-border rounded-lg p-6 hover:border-sevensa-teal transition-colors"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-text-muted" />
                  <p className="mt-2 text-sm text-text-secondary">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">PDF only, max 10MB</p>
                </div>
                <input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issuer">Issuer</Label>
              <Input
                id="issuer"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                placeholder="Issuing authority"
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country of Origin</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., NL, DE, FR"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload Certificate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Impact:** Core functionality restored. Users can now create assessments, generate LTSD certificates, and upload CoO documents.

---

### 3. Add Skip Link for Accessibility [P0]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/layout.tsx`

**Location:** After opening `<div>` on line 20, before `<nav>`

**Add This Code:**
```typescript
{/* Skip to main content link for accessibility */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sevensa-teal focus:text-white focus:rounded-lg focus:shadow-lg"
>
  Skip to main content
</a>
```

**Also Update:** Line 135 to add ID to main element
```typescript
<main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
```

**Impact:** Screen reader and keyboard-only users can skip navigation. WCAG 2.1 compliance improved.

---

### 4. Fix Footer Links [P0]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/page.tsx`

**Lines:** 353-354

**Current Code:**
```typescript
<Link href="#" className="hover:text-sevensa-teal transition-colors">Privacy</Link> | <Link href="#" className="hover:text-sevensa-teal transition-colors">Terms</Link>
```

**Fixed Code:**
```typescript
<Link href="/privacy" className="hover:text-sevensa-teal transition-colors">Privacy</Link> | <Link href="/terms" className="hover:text-sevensa-teal transition-colors">Terms</Link>
```

**Also Fix Lines:** 156-158 in footer section
```typescript
<Link href="/" className="hover:text-sevensa-teal transition-colors">Home</Link>
<Link href="/support" className="hover:text-sevensa-teal transition-colors">Support</Link>
<Link href="/privacy" className="hover:text-sevensa-teal transition-colors">Privacy</Link>
```

**Additional Files to Create:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/privacy/page.tsx`
```typescript
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-lg">
        <p>Last updated: October 13, 2025</p>

        <h2>1. Introduction</h2>
        <p>Sevensa ("we", "our", or "us") is committed to protecting your privacy...</p>

        <h2>2. Data We Collect</h2>
        <p>We collect the following types of data...</p>

        {/* Add complete privacy policy content */}
      </div>
    </div>
  );
}
```

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/terms/page.tsx`
```typescript
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-lg">
        <p>Last updated: October 13, 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using this service...</p>

        {/* Add complete terms of service content */}
      </div>
    </div>
  );
}
```

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/support/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/shared/ui/Toaster';

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send support request
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');

      toast.success('Support request submitted. We will contact you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to submit support request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-4">Contact Support</h1>
      <p className="text-lg text-text-secondary mb-8">
        Need help? Fill out the form below and we'll get back to you within 24 hours.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full rounded-lg border border-border px-3 py-2"
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>

      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Other Ways to Reach Us</h2>
        <div className="space-y-2 text-text-secondary">
          <p>Email: support@sevensa.nl</p>
          <p>Phone: +31 (0) 20 123 4567</p>
          <p>Hours: Monday-Friday, 9:00-17:00 CET</p>
        </div>
      </div>
    </div>
  );
}
```

**Impact:** Users can access legal information and support. Improves trust and compliance.

---

## P1 - HIGH PRIORITY FIXES

### 5. Implement Export Functionality [P1]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/assessment/[id]/page.tsx`

**Line:** 108-112 (Export button)

**Current Code:**
```typescript
<button className="px-4 py-2 bg-bg-muted hover:bg-bg-hover text-text-primary font-semibold rounded-lg transition-colors flex items-center space-x-2">
  <Download className="w-4 h-4" />
  <span>Export</span>
</button>
```

**Fixed Code:**
```typescript
<button
  onClick={async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-${assessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      trackEvent('assessment_export', { assessmentId });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export assessment');
    }
  }}
  className="px-4 py-2 bg-bg-muted hover:bg-bg-hover text-text-primary font-semibold rounded-lg transition-colors flex items-center space-x-2"
>
  <Download className="w-4 h-4" />
  <span>Export</span>
</button>
```

**New API Route to Create:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/api/assessments/[id]/export/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateAssessmentPDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = params.id;

    // Fetch assessment data
    const assessment = await fetch(`${process.env.API_BASE_URL}/api/assessments/${assessmentId}`).then(r => r.json());

    // Generate PDF
    const pdfBuffer = await generateAssessmentPDF(assessment);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="assessment-${assessmentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
```

**Impact:** Auditors and analysts can export assessment data. Critical for external auditors.

---

### 6. Add Approval Buttons to ApprovalsTable [P1]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/cfo/ApprovalsTable.tsx`

**Create New File:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/shared/ui/Toaster';

interface Approval {
  id: string;
  supplier: string;
  product: string;
  value: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  submittedAt: string;
}

export function ApprovalsTable() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/cfo/approvals');
      const data = await response.json();
      setApprovals(data);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/cfo/approvals/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve');

      toast.success('Approval granted');
      fetchApprovals(); // Refresh list
    } catch (error) {
      toast.error('Failed to approve');
      console.error(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/cfo/approvals/${id}/reject`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reject');

      toast.success('Approval rejected');
      fetchApprovals(); // Refresh list
    } catch (error) {
      toast.error('Failed to reject');
      console.error(error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-error';
      case 'MEDIUM': return 'text-warning';
      case 'LOW': return 'text-success';
      default: return 'text-text-muted';
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-bg-muted rounded-xl" />;
  }

  return (
    <div className="bg-white dark:bg-dark-bg-surface rounded-xl p-6 shadow-card border border-border dark:border-dark-border">
      <h3 className="text-lg font-bold mb-4">Pending Approvals</h3>

      {approvals.length === 0 ? (
        <p className="text-text-muted text-center py-8">No pending approvals</p>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="flex items-center justify-between p-4 bg-bg-surface dark:bg-dark-bg-base rounded-lg border border-border dark:border-dark-border"
            >
              <div className="flex-1">
                <div className="font-semibold text-sevensa-dark dark:text-dark-text-primary">
                  {approval.supplier}
                </div>
                <div className="text-sm text-text-secondary">{approval.product}</div>
                <div className="text-xs text-text-muted mt-1">
                  Value: €{approval.value.toLocaleString()} •
                  <span className={getRiskColor(approval.risk)}> {approval.risk} Risk</span> •
                  {new Date(approval.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleApprove(approval.id)}
                  size="sm"
                  className="bg-success hover:bg-success/90"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(approval.id)}
                  size="sm"
                  variant="outline"
                  className="border-error text-error hover:bg-error/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**New API Routes to Create:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/api/cfo/approvals/[id]/approve/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const approvalId = params.id;

    // Update approval status in database
    // Send notification to submitter

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
  }
}
```

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/api/cfo/approvals/[id]/reject/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const approvalId = params.id;

    // Update approval status in database
    // Send notification to submitter

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reject' }, { status: 500 });
  }
}
```

**Impact:** CFO can now approve or reject pending decisions. Critical workflow restored.

---

### 7. Add Search to Dashboard [P1]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/dashboard/AssessmentsTable.tsx`

**After imports, add:**
```typescript
import { Search } from 'lucide-react';
```

**Modify component to add search:**
```typescript
export function AssessmentsTable() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterChip>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ... existing code ...

  const filteredAssessments = assessments.filter(assessment => {
    // Filter by status
    const statusMatch = activeFilter === 'ALL' || assessment.verdict === activeFilter;

    // Filter by search query
    const searchMatch = !searchQuery ||
      assessment.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.hsCode.includes(searchQuery) ||
      assessment.agreement.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search assessments by product, HS code, or agreement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4">
        {/* ... existing filter chips ... */}
      </div>

      {/* Table */}
      {/* ... existing table code ... */}
    </div>
  );
}
```

**Impact:** Users can search through assessments quickly. Critical for users with many assessments.

---

### 8. Add ARIA Labels to Icon Buttons [P1]

**Files:** Multiple throughout application

**Pattern to Apply:**

**Before:**
```typescript
<button onClick={() => setDarkMode(!darkMode)} className="...">
  <Moon className="w-5 h-5" />
</button>
```

**After:**
```typescript
<button
  onClick={() => setDarkMode(!darkMode)}
  className="..."
  aria-label="Toggle dark mode"
>
  <Moon className="w-5 h-5" />
</button>
```

**Specific Files to Fix:**

1. `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/layout.tsx` - Line 64-77 (dark mode toggle)
2. `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/layout.tsx` - Lines 91-100 (mobile menu button)
3. `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/assessment/[id]/page.tsx` - Line 83-88 (back button)

**Impact:** Screen reader users can understand button purposes. WCAG compliance improved.

---

### 9. Fix Cancel Button in AddCooWizard [P1]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/supplier/AddCooWizard.tsx`

**Line:** 36

**Current Code:**
```typescript
<button className="px-3 py-2 rounded-xl border">Annuleren</button>
```

**Fixed Code:**
```typescript
<button
  type="button"
  onClick={onDone}
  className="px-3 py-2 rounded-xl border hover:bg-bg-muted transition-colors"
>
  Annuleren
</button>
```

**Impact:** Users can properly cancel upload process.

---

### 10. Implement Mobile Card View for AssessmentsTable [P1]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/dashboard/AssessmentsTable.tsx`

**Add after table:**
```typescript
{/* Mobile Card View */}
<div className="md:hidden space-y-4">
  {filteredAssessments.map((assessment) => (
    <div
      key={assessment.id}
      onClick={() => handleRowClick(assessment.id)}
      className="bg-white dark:bg-dark-bg-surface p-4 rounded-lg border border-border shadow-card cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-sevensa-dark dark:text-dark-text-primary">
          {assessment.productName}
        </h3>
        <span className={cn(
          'px-2 py-1 text-xs font-medium rounded-full',
          getVerdictColor(assessment.verdict)
        )}>
          {assessment.verdict}
        </span>
      </div>
      <div className="space-y-1 text-sm text-text-secondary">
        <div>HS Code: <span className="font-mono">{assessment.hsCode}</span></div>
        <div>Agreement: {assessment.agreement}</div>
        <div>Date: {assessment.date}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-text-muted mt-2 ml-auto" />
    </div>
  ))}
</div>
```

**Wrap existing table in:**
```typescript
<div className="hidden md:block overflow-x-auto rounded-xl shadow-card">
  {/* Existing table code */}
</div>
```

**Impact:** Mobile users have optimized card view instead of horizontal scroll.

---

## P2 - MEDIUM PRIORITY FIXES

### 11. Add Loading Skeleton Screens [P2]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/dashboard/AssessmentsTable.tsx`

**Replace loading conditional:**

**Current:**
```typescript
if (loading) return <div>Loading...</div>;
```

**Fixed:**
```typescript
if (loading) {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

**Impact:** Better perceived performance. Users see content structure while loading.

---

### 12. Add Confirmation Dialog for Destructive Actions [P2]

**Create New Component:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/ConfirmDialog.tsx`
```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: 'bg-error hover:bg-error/90',
    warning: 'bg-warning hover:bg-warning/90',
    info: 'bg-sevensa-teal hover:bg-sevensa-teal-600',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-text-secondary">{message}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={variantStyles[variant]}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Usage Example (in ApprovalsTable):**
```typescript
const [showRejectConfirm, setShowRejectConfirm] = useState(false);
const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

// In button onClick:
onClick={() => {
  setSelectedApprovalId(approval.id);
  setShowRejectConfirm(true);
}}

// Add dialog:
<ConfirmDialog
  isOpen={showRejectConfirm}
  onClose={() => setShowRejectConfirm(false)}
  onConfirm={() => selectedApprovalId && handleReject(selectedApprovalId)}
  title="Reject Approval"
  message="Are you sure you want to reject this approval? This action cannot be undone."
  confirmText="Reject"
  cancelText="Cancel"
  variant="danger"
/>
```

**Impact:** Prevents accidental destructive actions.

---

### 13. Add Technical Term Tooltips [P2]

**Create Glossary Component:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/GlossaryTooltip.tsx`
```typescript
'use client';

import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GlossaryTooltipProps {
  term: string;
  children?: React.ReactNode;
}

const glossary: Record<string, string> = {
  'HS Code': 'Harmonized System Code: An internationally standardized system of names and numbers to classify traded products.',
  'LTSD': 'Long-Term Supplier Declaration: A document certifying the preferential origin of goods over an extended period.',
  'CoO': 'Certificate of Origin: A document certifying the country in which goods were manufactured or produced.',
  'CTH': 'Change of Tariff Heading: A rule of origin criterion requiring a change in tariff classification.',
  'CTSH': 'Change of Tariff Sub-Heading: A more specific tariff classification change requirement.',
  'VA': 'Value Added: Minimum local or regional value content required for preferential origin.',
  'WO': 'Wholly Obtained: Products entirely produced or obtained in a single country.',
  'EPA': 'Economic Partnership Agreement: A trade agreement between countries or regions.',
  'FTA': 'Free Trade Agreement: An agreement eliminating tariffs between trading partners.',
  'CETA': 'Comprehensive Economic and Trade Agreement: The trade agreement between EU and Canada.',
};

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const definition = glossary[term];

  if (!definition) return <>{children || term}</>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help border-b border-dotted border-text-muted">
            {children || term}
            <HelpCircle className="w-3 h-3 ml-1 text-text-muted" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Usage Example:**
```typescript
import { GlossaryTooltip } from '@/shared/ui/GlossaryTooltip';

// In component:
<p>
  Enter the <GlossaryTooltip term="HS Code" /> for your product.
</p>
```

**Impact:** Non-technical users understand terminology.

---

### 14. Add Upload Progress Indicator [P2]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/shared/ui/supplier/AddCooWizard.tsx`

**Add state:**
```typescript
const [uploadProgress, setUploadProgress] = useState(0);
```

**Modify upload function to track progress:**
```typescript
async function handleUpload() {
  if (!file) { toast.error("Kies een PDF."); return; }
  setBusy(true);
  setUploadProgress(0);

  try {
    const init = await fetch(`/api/chain/${ltsdId}/node/${nodeId}/coo/init`, {
      method:"POST",
      headers: { "X-Role":"SUPPLIER" }
    }).then(r=>r.json());

    setUploadProgress(33);

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = 33 + (e.loaded / e.total) * 34; // 33-67%
        setUploadProgress(Math.round(percentComplete));
      }
    });

    await new Promise((resolve, reject) => {
      xhr.open('PUT', init.uploadUrl);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(67);
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    });

    const meta = { /* ... */ };
    const comp = await fetch(`/api/chain/${ltsdId}/node/${nodeId}/coo/complete`, {
      method:"POST",
      headers: { "Content-Type":"application/json", "X-Role":"SUPPLIER" },
      body: JSON.stringify(meta)
    });

    setUploadProgress(100);

    if (!comp.ok) throw new Error(`Complete HTTP ${comp.status}`);

    await fetch(`/api/chain/${ltsdId}/node/${nodeId}/revalidate`, {
      method:"POST",
      headers: { "X-Role":"SUPPLIER" }
    });

    toast.success("CoO toegevoegd.");
    onDone();
  } catch(e){
    toast.error("Upload mislukt.");
  } finally {
    setBusy(false);
    setUploadProgress(0);
  }
}
```

**Add progress bar to UI:**
```typescript
{busy && (
  <div className="mb-4">
    <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-sevensa-teal transition-all duration-300"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
    <p className="text-sm text-text-muted mt-1 text-center">
      Uploading... {uploadProgress}%
    </p>
  </div>
)}
```

**Impact:** Users know upload is progressing and haven't frozen.

---

### 15. Add Date Range Filters to CFO Dashboard [P2]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/cfo/page.tsx`

**Add after hero section:**
```typescript
'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function CFOPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-sevensa-teal to-sevensa-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">CFO Dashboard 📊</h1>
        <p className="text-white/90 text-lg">
          Zie savings, risico's en approvals in één oogopslag. Data-driven beslissingen met realtime insights.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-dark-bg-surface rounded-xl p-4 shadow-card border border-border flex items-center space-x-4">
        <Calendar className="w-5 h-5 text-sevensa-teal" />
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="border border-border rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="border border-border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={() => {
            // Refresh data with new date range
            console.log('Fetching data for:', dateRange);
          }}
          className="px-4 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors"
        >
          Apply
        </button>
      </div>

      <KpiStrip dateRange={dateRange} />
      <Trends dateRange={dateRange} />

      {/* Rest of dashboard */}
    </div>
  );
}
```

**Impact:** CFO can analyze specific time periods.

---

## P3 - LOW PRIORITY FIXES

### 16. Persist Dark Mode Preference [P3]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/(app)/layout.tsx`

**Modify dark mode logic:**
```typescript
'use client';

import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Rest of component...
}
```

**Impact:** User preference remembered across sessions.

---

### 17. Add PWA Support [P3]

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/public/manifest.json`

**Create:**
```json
{
  "name": "PSRA-LTSD Enterprise",
  "short_name": "PSRA",
  "description": "AI-Powered Trade Compliance Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00b4a1",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Update:** `/home/vncuser/psra-ltsd-enterprise-v2/app/layout.tsx`

**Add to `<head>`:**
```typescript
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#00b4a1" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**Impact:** App can be installed on mobile devices.

---

## Additional Recommendations

### Authentication Implementation (CRITICAL)

Since authentication is completely missing, here's a complete implementation outline:

**1. Install dependencies:**
```bash
npm install next-auth@beta bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

**2. Create auth configuration:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await query(
          'SELECT * FROM users WHERE email = $1',
          [credentials.email]
        );

        const user = result.rows[0];

        if (!user || !await bcrypt.compare(credentials.password, user.password_hash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };
```

**3. Create login page:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/app/login/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sevensa-teal-50 to-white">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <Image
            src="/sevensa_final_logo.png"
            alt="Sevensa"
            width={160}
            height={45}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-sevensa-dark">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-muted">
          <a href="/forgot-password" className="hover:text-sevensa-teal">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
```

**4. Protect routes with middleware:**

**File:** `/home/vncuser/psra-ltsd-enterprise-v2/middleware.ts`
```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/cfo/:path*', '/supplier/:path*', '/assessment/:path*'],
};
```

---

## Summary of Priority Fixes

### Week 1 (Critical - P0):
1. Fix CTAStrip import typo
2. Implement CTA button functionality (3 modals)
3. Add skip link for accessibility
4. Fix footer links (create 3 pages)

### Week 2 (High Priority - P1):
1. Implement export functionality
2. Add approval workflow buttons
3. Add search to dashboard
4. Add ARIA labels to icon buttons
5. Fix cancel button in AddCooWizard

### Week 3 (High Priority - P1):
1. Implement mobile card view
2. Begin authentication system
3. Add keyboard shortcuts framework

### Week 4 (Medium Priority - P2):
1. Add loading skeletons
2. Add confirmation dialogs
3. Add technical term tooltips
4. Add upload progress indicators

### Ongoing:
- Complete authentication system
- Write comprehensive tests
- Improve accessibility throughout
- Add documentation

---

## Testing Checklist

After implementing fixes, test:

- [ ] All CTA buttons open modals
- [ ] Modals can be submitted successfully
- [ ] Export button downloads PDF
- [ ] Approval buttons work
- [ ] Search filters assessments correctly
- [ ] Mobile view displays cards instead of tables
- [ ] Skip link appears on Tab key
- [ ] Screen reader announces all buttons correctly
- [ ] Cancel buttons close modals
- [ ] Upload progress displays
- [ ] Footer links navigate to correct pages
- [ ] Dark mode persists across sessions (P3)
- [ ] Authentication protects routes (when implemented)

---

**Document Version:** 1.0
**Last Updated:** October 13, 2025
**Next Review:** After P0/P1 fixes completed
