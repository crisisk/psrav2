// frontend/hooks/useOriginApi.ts

import { useState, useCallback } from 'react';
import { RealTimeROI } from '../components/ROITellerWidget'; // Importeer het model

// --- Data Modellen (Moeten overeenkomen met de backend) ---

interface OriginDeterminationRequest {
    invoice_file_base64: string;
    invoice_number: string;
    bom_data: any; // Vereenvoudigd
}

interface OriginDeterminationResponse {
    verdict: 'PREFERENTIAL' | 'NON_PREFERENTIAL';
    confidence_score: number;
    ruling_citation: string;
    trace_log_id: string;
    // ... andere XAI-velden
}

interface HitlFeedback {
    trace_log_id: string;
    override_reason: string;
}

// --- 1. Custom Hook voor Algemene API-functionaliteit ---

const useApi = <T, P>(url: string, method: 'GET' | 'POST' = 'GET') => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (payload?: P) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload ? JSON.stringify(payload) : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API-fout: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Onbekende API-fout';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [url, method]);

    return { data, isLoading, error, execute };
};

// --- 2. Specifieke Hooks voor de PSRA-LTSD API's ---

// SEC-401: Live ROI-Teller
export const useRealTimeRoi = () => {
    return useApi<RealTimeROI, void>('/api/metrics/realtime_roi', 'GET');
};

// BL-502: Oorsprongsbepaling
export const useDetermineOrigin = () => {
    return useApi<OriginDeterminationResponse, OriginDeterminationRequest>('/api/origin/determine', 'POST');
};

// HITL-201: Feedback indiening
export const useSubmitHitlFeedback = () => {
    return useApi<void, HitlFeedback>('/api/origin/hitl/submit_feedback', 'POST');
};

// CG-205: GDPR Verwijdering
export const useDeleteUserData = () => {
    return useApi<any, { user_id: string }>('/api/origin/gdpr/delete_user', 'POST');
};

