import React, { useState, useEffect } from 'react';

// --- Sevensa Branding Constants ---
const SEVENSA_TEAL = '#00A896';
const SEVENSA_DARK = '#2D3A45';
const SUCCESS_GREEN = '#4CAF50';
const ERROR_RED = '#D32F2F';

// --- Data Model for ROI Output (Must match backend/services/metrics_service.py) ---
interface RealTimeROI {
    total_determinations: number;
    total_time_saved_hours: number;
    total_money_saved_eur: number;
    last_updated: string; // ISO string from backend
}

// --- 1. API Call Function (SEC-401.4) ---
const fetchROI = async (): Promise<RealTimeROI> => {
    // SEC-401.4: Actual API Call to the Metrics Service
    const response = await fetch('/api/metrics/realtime_roi');
    
    if (!response.ok) {
        // FE-112: Robust Error Handling
        throw new Error(`Failed to fetch ROI data: ${response.statusText}`);
    }
    
    const data: RealTimeROI = await response.json();
    return data;
};

// --- 2. Main Component: Live ROI Teller Widget (SEC-401.3) ---

const ROITellerWidget: React.FC = () => {
    const [roiData, setRoiData] = useState<RealTimeROI | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch and update the ROI from the API
    const updateROI = async () => {
        try {
            setError(null);
            const data = await fetchROI();
            setRoiData(data);
        } catch (err) {
            console.error("ROI Fetch Error:", err);
            setError("Kan ROI-data niet ophalen. Controleer de Metrics Service API.");
        } finally {
            setIsLoading(false);
        }
    };

    // SEC-401.4: Real-time Connectie (API Polling every 5 seconds)
    useEffect(() => {
        // Initial fetch
        updateROI();

        // Set up the API polling timer
        const intervalId = setInterval(updateROI, 5000); // Update every 5 seconds

        // Cleanup function
        return () => clearInterval(intervalId);
    }, []);

    // Helper function for formatting money
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
    };

    if (isLoading) {
        return <div style={{ padding: 20, textAlign: 'center', color: SEVENSA_DARK }}>Laden van Live ROI-data...</div>;
    }

    if (error) {
        return <div style={{ padding: 20, textAlign: 'center', color: ERROR_RED, border: `1px solid ${ERROR_RED}`, borderRadius: 8 }}>Fout: {error}</div>;
    }

    if (!roiData) {
        return null; // Should not happen if error is handled
    }

    return (
        <div style={{ 
            border: `1px solid ${SEVENSA_TEAL}`, 
            borderRadius: 8, 
            padding: 20, 
            backgroundColor: '#f9f9f9',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
            <h3 style={{ color: SEVENSA_DARK, borderBottom: `2px solid ${SEVENSA_TEAL}`, paddingBottom: 10, marginBottom: 15 }}>
                Live ROI-Teller (Gecumuleerde Besparing)
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                
                {/* Money Saved */}
                <div style={{ flex: 1, borderRight: '1px solid #ddd', paddingRight: 10 }}>
                    <p style={{ fontSize: '0.8em', color: SEVENSA_DARK, margin: 0 }}>Financiële Waarde Bespaard</p>
                    <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: SUCCESS_GREEN, margin: '5px 0' }}>
                        {formatMoney(roiData.total_money_saved_eur)}
                    </p>
                </div>

                {/* Time Saved */}
                <div style={{ flex: 1, borderRight: '1px solid #ddd', padding: '0 10px' }}>
                    <p style={{ fontSize: '0.8em', color: SEVENSA_DARK, margin: 0 }}>Tijd Bespaard (Uren)</p>
                    <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: SEVENSA_TEAL, margin: '5px 0' }}>
                        {roiData.total_time_saved_hours.toLocaleString('nl-NL')}u
                    </p>
                </div>

                {/* Total Determinations */}
                <div style={{ flex: 1, paddingLeft: 10 }}>
                    <p style={{ fontSize: '0.8em', color: SEVENSA_DARK, margin: 0 }}>Totaal Bepalingen</p>
                    <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: SEVENSA_DARK, margin: '5px 0' }}>
                        {roiData.total_determinations.toLocaleString('nl-NL')}
                    </p>
                </div>
            </div>
            
            <p style={{ fontSize: '0.7em', color: '#999', marginTop: 15, textAlign: 'right' }}>
                Laatst bijgewerkt: {new Date(roiData.last_updated).toLocaleTimeString('nl-NL')}
            </p>
        </div>
    );
};

export default ROITellerWidget;

