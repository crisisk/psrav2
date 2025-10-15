'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { personaScenarios } from '@/data/persona-scenarios';

const FEEDBACK_THEMES = [
  'UX-verbetering',
  'Gegevenskwaliteit',
  'API-integratie',
  'Governance',
  'Anders'
];

export function FeedbackPanel() {
  const [personaId, setPersonaId] = useState(personaScenarios[0]?.id ?? '');
  const [theme, setTheme] = useState(FEEDBACK_THEMES[0]);
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitted(false);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setMessage('');
    }, 600);
  };

  return (
    <section className="card p-6">
      <header className="mb-4">
        <p className="section-title">Feedback</p>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">UAT feedback & sentiment</h3>
        <p className="text-sm text-subtle">
          Verzamel gesimuleerde terugkoppeling uit de tien persona’s om design-iteraties te sturen.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="persona" className="section-title">
            Persona
          </label>
          <select
            id="persona"
            value={personaId}
            onChange={event => setPersonaId(event.target.value)}
            className="mt-2 w-full"
          >
            {personaScenarios.map(persona => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="theme" className="section-title">
              Thema
            </label>
            <select
              id="theme"
              value={theme}
              onChange={event => setTheme(event.target.value)}
              className="mt-2 w-full"
            >
              {FEEDBACK_THEMES.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rating" className="section-title">
              Ervaring (1-5)
            </label>
            <input
              id="rating"
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={event => setRating(Number(event.target.value))}
              className="mt-3 w-full"
            />
            <p className="mt-1 text-xs text-subtle">Score: {rating}/5</p>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="section-title">
            Feedbacknotitie
          </label>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="Wat moeten we verbeteren om de workflow te versnellen?"
            className="mt-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          className="primary"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-live="polite"
        >
          {isSubmitting ? 'Opslaan…' : 'Feedback registreren'}
        </button>

        <p
          className="text-sm text-[var(--color-success)]"
          role="status"
          aria-live="polite"
          hidden={!submitted}
        >
          Feedback opgeslagen. Het productteam verwerkt deze input in de volgende iteratie.
        </p>
      </form>
    </section>
  );
}

