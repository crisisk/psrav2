'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';

type Step = 'account' | 'organization' | 'persona';

const PERSONAS = [
  {
    id: 'finance',
    label: 'Finance',
    description: 'Controleer ROI, eligibility en besparingen per factuur.',
    route: '/dashboard'
  },
  {
    id: 'compliance',
    label: 'Compliance Manager',
    description: 'Beheer HS39/40 dossiers met inline factuur- en bewijscontroles.',
    route: '/dashboard'
  },
  {
    id: 'analyst',
    label: 'Analyst / Operator',
    description: 'Voer berekeningen uit met explainability en BOM-validatoren.',
    route: '/dashboard'
  },
  { id: 'auditor', label: 'Auditor', description: 'SLA’s, sampling en audit trails.', route: '/dashboard' },
  {
    id: 'supplier',
    label: 'Supplier',
    description: 'Upload facturen, BOM-lijsten en monitor SLA’s/eligibility.',
    route: '/onboarding/import'
  },
  { id: 'sysadmin', label: 'System Admin', description: 'Controleer platform health en notificaties.', route: '/dashboard' }
];

const STEP_SEQUENCE: Array<{ id: Step; label: string; description: string }> = [
  {
    id: 'account',
    label: 'Account',
    description: 'Werk e-mailadres en sterk wachtwoord'
  },
  {
    id: 'organization',
    label: 'Organisatie',
    description: 'Naam, land en industrieprofiel'
  },
  {
    id: 'persona',
    label: 'Persona',
    description: 'Kies de ideale demo-ervaring'
  }
];

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEP_SEQUENCE.findIndex(step => step.id === currentStep);

  return (
    <ol className="grid gap-3 rounded-3xl border border-[rgba(148,163,184,0.35)] bg-[var(--color-surface)]/80 px-6 py-5 text-sm text-subtle md:grid-cols-3">
      {STEP_SEQUENCE.map((step, index) => {
        const status = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
        return (
          <li
            key={step.id}
            className={clsx(
              'flex flex-col gap-2 rounded-2xl border px-4 py-3 transition-colors',
              status === 'current' && 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]',
              status === 'done' && 'border-[rgba(34,197,94,0.4)] bg-[var(--color-success-soft)] text-[var(--color-success)]',
              status === 'upcoming' && 'border-[rgba(148,163,184,0.2)] bg-[var(--color-surface-muted)]/50'
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">Stap {index + 1}</span>
            <span className="text-base font-semibold text-[var(--color-text)]">{step.label}</span>
            <span className="text-xs text-subtle">{step.description}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const focusRef = useRef<HTMLInputElement | HTMLButtonElement | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  const [orgName, setOrgName] = useState('');
  const [orgCountry, setOrgCountry] = useState('Nederland');
  const [orgIndustry, setOrgIndustry] = useState('Manufacturing');
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});

  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    focusRef.current?.focus();
  }, [step]);

  const validateAccount = () => {
    const errors: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Voer een geldig werk e-mailadres in.';
    }

    if (password.length < 8 || !/[0-9]/.test(password) || !/[A-Z]/.test(password)) {
      errors.password = 'Wachtwoord moet minimaal 8 tekens bevatten met een hoofdletter en cijfer.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Wachtwoorden moeten overeenkomen.';
    }

    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOrganization = () => {
    const errors: Record<string, string> = {};
    if (!orgName.trim()) {
      errors.orgName = 'Organisatienaam is verplicht voor certificaatlabels.';
    }

    setOrgErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    if (!validateAccount()) {
      return;
    }

    setStep('organization');
    setStatusMessage('Accountgegevens vastgelegd. Voltooi de organisatie-instellingen.');
  };

  const handleOrganizationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    if (!validateOrganization()) {
      return;
    }

    setStep('persona');
    setStatusMessage('Organisatie geconfigureerd. Kies je onboarding-rol.');
  };

  const personaRoute = useMemo(() => {
    if (!selectedPersona) {
      return '/dashboard';
    }

    return PERSONAS.find(persona => persona.id === selectedPersona)?.route ?? '/dashboard';
  }, [selectedPersona]);

  const handlePersonaContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetRoute = personaRoute;
    setStatusMessage(`Persona geselecteerd. Navigeren naar ${targetRoute}.`);
    router.push(targetRoute);
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Signup' }
  ];

  const headerAside = (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.35)] bg-[var(--color-surface-muted)]/50 px-5 py-4 text-sm text-subtle">
      <p className="font-semibold text-[var(--color-text)]">Enterprise ready</p>
      <ul className="mt-3 space-y-2 text-left">
        <li className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>SAML/SCIM provisioning beschikbaar na contract.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>Per-tenant audit logging en notary hashing geactiveerd.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>RBAC-rollen afgestemd op Admin, Compliance, Supplier, Partner.</span>
        </li>
      </ul>
    </div>
  );

  return (
    <AppShell variant="narrow" contentClassName="space-y-8" breadcrumbs={breadcrumbs}>
      <PageHeader
        size="compact"
        align="center"
        eyebrow="PSRA-LTSD Onboarding"
        title="Start met je enterprise demo"
        description="Doorloop de drie stappen: account aanmaken, organisatiegegevens invullen en een persona kiezen voor een gerichte ervaring."
        badges={[
          { label: 'SOC2-ready flow', tone: 'success' },
          { label: 'Multi-tenant sandbox', tone: 'neutral' }
        ]}
        aside={headerAside}
      />

      <StepIndicator currentStep={step} />

      {statusMessage && (
        <div className="rounded-2xl border border-[rgba(94,234,212,0.4)] bg-[var(--color-success-soft)]/70 p-4 text-sm text-[var(--color-success)]" role="status">
          {statusMessage}
        </div>
      )}

      {step === 'account' && (
        <form onSubmit={handleAccountSubmit} className="card space-y-6 p-6" noValidate>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Maak een account</h2>
            <p className="text-sm text-subtle">Gebruik je zakelijke gegevens om toegang tot de PSRA-LTSD sandbox te krijgen.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="work-email" className="section-title">
              Work email
            </label>
            <input
              ref={element => {
                if (step === 'account') {
                  focusRef.current = element;
                }
              }}
              id="work-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              aria-invalid={Boolean(accountErrors.email)}
              aria-describedby={accountErrors.email ? 'work-email-error' : undefined}
            />
            {accountErrors.email && (
              <p id="work-email-error" className="field-error">
                {accountErrors.email}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="password" className="section-title">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                aria-invalid={Boolean(accountErrors.password)}
                aria-describedby={accountErrors.password ? 'password-error' : undefined}
              />
              {accountErrors.password && (
                <p id="password-error" className="field-error">
                  {accountErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm-password" className="section-title">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(accountErrors.confirmPassword)}
                aria-describedby={accountErrors.confirmPassword ? 'confirm-password-error' : undefined}
              />
              {accountErrors.confirmPassword && (
                <p id="confirm-password-error" className="field-error">
                  {accountErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button type="submit" className="primary w-full md:w-auto">
            Create account
          </button>
        </form>
      )}

      {step === 'organization' && (
        <form onSubmit={handleOrganizationSubmit} className="card space-y-6 p-6" noValidate>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Organisatiegegevens</h2>
            <p className="text-sm text-subtle">Deze gegevens voeden je certificaatkopteksten en auditrapportage.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="organization-name" className="section-title">
              Organization name
            </label>
            <input
              ref={element => {
                if (step === 'organization') {
                  focusRef.current = element;
                }
              }}
              id="organization-name"
              value={orgName}
              onChange={event => setOrgName(event.target.value)}
              aria-invalid={Boolean(orgErrors.orgName)}
              aria-describedby={orgErrors.orgName ? 'organization-name-error' : undefined}
            />
            {orgErrors.orgName && (
              <p id="organization-name-error" className="field-error">
                {orgErrors.orgName}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="organization-country" className="section-title">
                Headquarters country
              </label>
              <input
                id="organization-country"
                value={orgCountry}
                onChange={event => setOrgCountry(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="organization-industry" className="section-title">
                Industry focus
              </label>
              <input
                id="organization-industry"
                value={orgIndustry}
                onChange={event => setOrgIndustry(event.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="primary w-full md:w-auto">
            Continue
          </button>
        </form>
      )}

      {step === 'persona' && (
        <form onSubmit={handlePersonaContinue} className="card space-y-6 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Kies je onboarding-rol</h2>
            <p className="text-sm text-subtle">
              Selecteer de persona die het beste aansluit op je doelen. We stemmen dashboards, import-sjablonen en validaties af op je keuze.
            </p>
          </div>

          <fieldset className="grid gap-4" aria-describedby="persona-hint">
            <legend className="sr-only">Beschikbare persona’s</legend>
            <p id="persona-hint" className="input-hint">
              Kies één persona om een relevante demo-flow te starten.
            </p>

            {PERSONAS.map(persona => (
              <label
                key={persona.id}
                className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[var(--color-surface-muted)]/60 p-4 transition-colors hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)]"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="persona"
                    value={persona.id}
                    checked={selectedPersona === persona.id}
                    onChange={() => setSelectedPersona(persona.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-base font-semibold text-[var(--color-text)]">{persona.label}</p>
                    <p className="text-sm text-subtle">{persona.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="primary"
              ref={element => {
                if (step === 'persona') {
                  focusRef.current = element;
                }
              }}
            >
              Continue
            </button>
            <p className="text-sm text-subtle">
              Organisatie: <span className="font-semibold text-[var(--color-text)]">{orgName || 'Nog niet ingevuld'}</span>
            </p>
          </div>
        </form>
      )}
    </AppShell>
  );
}
