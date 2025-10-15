import React, { useState, useCallback, useMemo } from 'react';
import { Verdict, WCOStatus, OriginDeterminationResponse, BOMAnalysisItem } from '../models/origin_models';
import { useDropzone } from 'react-dropzone';

// --- Sevensa Branding Constants (B-101) ---
const SEVENSA_TEAL = '#00A896';
const SEVENSA_DARK = '#2D3A45';
const SUCCESS_GREEN = '#4CAF50';
const ERROR_RED = '#F44336';

// --- Mock API Call (FE-103 Placeholder) ---
const mockDetermineOrigin = async (invoiceNumber: string): Promise<OriginDeterminationResponse> => {
    // Simulate API call to /api/origin/determine
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate 1.5s processing time (UX-405)

    const traceLogId = `TL-${Date.now()}`;

    return {
        verdict: invoiceNumber.includes('FAIL') ? Verdict.NON_PREFERENTIAL : Verdict.PREFERENTIAL,
        confidence_score: invoiceNumber.includes('FAIL') ? 0.785 : 0.982,
        ruling_citation: "The rule of origin applied is Change in Tariff Heading (CTH) for HS 3908.10. This rule was met because the value of non-originating materials did not exceed 50% of the ex-works price.",
        ruling_id: "CTH-390810",
        wco_verification_status: WCOStatus.VERIFIED,
        trace_log_id: traceLogId,
        bom_analysis: [
            { item_id: "M-001", hs_code: "390120", value_eur: 8500.0, origin_country: "NL", is_non_originating: false, compliance_status: "Green", rule_violation_reason: null },
            { item_id: "M-002", hs_code: "290110", value_eur: 500.0, origin_country: "CN", is_non_originating: true, compliance_status: "Orange", rule_violation_reason: "De Minimis value close to threshold." }
        ]
    };
};

// --- Component: XAI Visualisation Dashboard (FE-105, FE-XAI-2, FE-XAI-3) ---
const XAIDashboard: React.FC<{ response: OriginDeterminationResponse }> = ({ response }) => {
    const verdictColor = response.verdict === Verdict.PREFERENTIAL ? SUCCESS_GREEN : ERROR_RED;
    const confidencePercent = (response.confidence_score * 100).toFixed(1);

    return (
        <div style={{ borderLeft: `3px solid ${SEVENSA_TEAL}`, paddingLeft: 20, marginTop: 20 }}>
            <h3 style={{ color: SEVENSA_DARK }}>Oorsprongsanalyse & Validatie</h3>
            
            {/* Verdict Indicator (FE-105) */}
            <div style={{ padding: 10, backgroundColor: verdictColor, color: 'white', borderRadius: 5, marginBottom: 15 }}>
                Verdict: **{response.verdict}**
            </div>

            {/* Confidence Score (FE-XAI-2) */}
            <p>
                **Confidence Score:** <span style={{ color: SEVENSA_TEAL, fontWeight: 'bold', fontSize: '1.2em' }}>{confidencePercent}%</span>
            </p>

            {/* WCO Status (FE-XAI-5) */}
            <p style={{ fontSize: '0.9em', color: SEVENSA_DARK }}>
                WCO Traceability Status: <span style={{ color: response.wco_verification_status === WCOStatus.VERIFIED ? SUCCESS_GREEN : ERROR_RED }}>{response.wco_verification_status}</span>
            </p>

            {/* Regelpassage Citaat (FE-XAI-3) */}
            <details style={{ border: `1px solid ${SEVENSA_TEAL}`, padding: 10, borderRadius: 5, marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Juridische Validatie (Regelpassage Citaat)</summary>
                <blockquote style={{ borderLeft: `2px solid ${SEVENSA_TEAL}`, margin: '10px 0', paddingLeft: 10, fontStyle: 'italic' }}>
                    {response.ruling_citation}
                </blockquote>
            </details>

            {/* BOM Analysis Matrix (FE-XAI-4) - Simplified */}
            <h4 style={{ marginTop: 20 }}>BOM Analyse</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>HS Code</th>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>Oorsprong</th>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {response.bom_analysis.map((item, index) => (
                        <tr key={index}>
                            <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.hs_code}</td>
                            <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.origin_country}</td>
                            <td style={{ border: '1px solid #ddd', padding: 8, color: item.compliance_status === 'Green' ? SUCCESS_GREEN : item.compliance_status === 'Orange' ? 'orange' : ERROR_RED }}>
                                {item.compliance_status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Audit ID (FE-HITL-3) */}
            <p style={{ fontSize: '0.8em', marginTop: 15 }}>Audit ID: {response.trace_log_id}</p>
        </div>
    );
};

// --- Component: ML-HITL Override Modaal (FE-HITL-1) ---
const HITLOverrideModal: React.FC<{ response: OriginDeterminationResponse, onClose: () => void }> = ({ response, onClose }) => {
    const [reason, setReason] = useState('');
    
    const handleSubmit = async () => {
        if (reason.length < 20) {
            alert('Reden moet minimaal 20 tekens bevatten.');
            return;
        }
        // FE-HITL-2: Call HITL API
        // await fetch('/api/hitl/submit_feedback', { method: 'POST', body: JSON.stringify({ trace_log_id: response.trace_log_id, override_reason: reason, new_verdict: response.verdict === Verdict.PREFERENTIAL ? Verdict.NON_PREFERENTIAL : Verdict.PREFERENTIAL }) });
        alert('Override feedback succesvol verzonden en in de wachtrij geplaatst voor hertraining.');
        onClose();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: 30, borderRadius: 8, width: 500 }}>
                <h3 style={{ color: SEVENSA_DARK }}>Bevestig Handmatige Override</h3>
                <p>U overschrijft het AI-Verdict: **{response.verdict}** (Confidence: {(response.confidence_score * 100).toFixed(1)}%).</p>
                <p style={{ color: SEVENSA_TEAL, fontStyle: 'italic' }}>Uw expertise is van onschatbare waarde. Documenteer de reden voor de override om ons AI-model te trainen.</p>
                
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reden voor Override (Verplicht, minimaal 20 tekens)"
                    rows={5}
                    style={{ width: '100%', padding: 10, marginTop: 10, border: `1px solid ${SEVENSA_TEAL}` }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', marginRight: 10, backgroundColor: '#ccc', border: 'none', borderRadius: 4 }}>Annuleren</button>
                    <button onClick={handleSubmit} style={{ padding: '10px 20px', backgroundColor: SEVENSA_TEAL, color: 'white', border: 'none', borderRadius: 4 }}>
                        Bevestig Override
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component: Invoice Upload Module ---
const InvoiceUploadModule: React.FC = () => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<OriginDeterminationResponse | null>(null);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [uploadTime, setUploadTime] = useState<number | null>(null);

    // FE-101: Drag-and-drop component
    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log('Files accepted:', acceptedFiles);
        // In a real app, you would store the file and get a temporary URL/ID
        alert(`Bestand(en) geaccepteerd: ${acceptedFiles.map(f => f.name).join(', ')}`);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'], 'text/csv': ['.csv'] } });

    // FE-103: Orchestrator Call Handler
    const handleAnalyze = async () => {
        if (!invoiceNumber) return alert('Voer een factuurnummer in.');
        
        setIsProcessing(true);
        setResult(null);
        const startTime = performance.now();

        try {
            // In a real app, this would also send the file data
            const response = await mockDetermineOrigin(invoiceNumber);
            setResult(response);
        } catch (error) {
            // FE-112: Error Handling
            alert(`Analyse mislukt. Controleer de API-verbinding. ${error}`);
        } finally {
            const endTime = performance.now();
            setUploadTime(endTime - startTime); // UX-405
            setIsProcessing(false);
        }
    };

    const handleDownloadCertificate = () => {
        if (result && result.verdict === Verdict.PREFERENTIAL) {
            // FE-109: Call Certificate Generation API
            alert(`Certificaat voor ${result.trace_log_id} wordt gegenereerd en gedownload.`);
        } else {
            alert('Kan geen certificaat genereren: Oorsprong is niet preferentieel.');
        }
    };

    return (
        <div style={{ fontFamily: 'Montserrat, sans-serif', padding: 30, maxWidth: 1000, margin: '0 auto' }}>
            <h1 style={{ color: SEVENSA_DARK }}>Factuur Upload & Oorsprongsbepaling</h1>
            
            {/* Kolom 1: Input */}
            <div style={{ display: 'flex', gap: 30 }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: SEVENSA_TEAL }}>1. Input</h3>
                    
                    {/* Factuur Upload Component (UX-401) */}
                    <div {...getRootProps()} style={{ border: `2px ${isDragActive ? 'solid' : 'dashed'} ${SEVENSA_TEAL}`, padding: 30, textAlign: 'center', borderRadius: 8, cursor: 'pointer', backgroundColor: isDragActive ? '#f0fafa' : 'white' }}>
                        <input {...getInputProps()} />
                        <p style={{ color: SEVENSA_DARK }}>{isDragActive ? "Laat hier los..." : "Sleep Factuur (PDF) of BOM (CSV) hier, of klik om te selecteren."}</p>
                    </div>

                    {/* Factuurnummer Check (UX-402) */}
                    <div style={{ marginTop: 20 }}>
                        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Factuurnummer</label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            onBlur={() => { /* FE-102: Real-time Check API Call */ console.log('Checking invoice number:', invoiceNumber); }}
                            style={{ width: '100%', padding: 10, border: `1px solid ${SEVENSA_DARK}`, borderRadius: 4 }}
                            placeholder="Voer factuurnummer in (bv. INV-2025-FAIL)"
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={isProcessing || !invoiceNumber}
                        style={{ marginTop: 20, padding: '12px 25px', backgroundColor: SEVENSA_TEAL, color: 'white', border: 'none', borderRadius: 4, cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                        {isProcessing ? 'Analyseren...' : 'Start Oorsprongsanalyse'}
                    </button>
                </div>

                {/* Kolom 2: Resultaat & XAI */}
                <div style={{ flex: 2 }}>
                    {isProcessing && (
                        <div style={{ textAlign: 'center', marginTop: 50 }}>
                            <p style={{ color: SEVENSA_TEAL }}>Analyseren van 100.000+ regels in de Rules-as-Data Engine...</p>
                        </div>
                    )}

                    {result && (
                        <>
                            {/* Performance Indicator (UX-405) */}
                            {uploadTime !== null && (
                                <p style={{ fontSize: '0.9em', color: SEVENSA_DARK }}>
                                    Verwerkingstijd: <span style={{ fontWeight: 'bold' }}>{(uploadTime / 1000).toFixed(2)}s</span>
                                </p>
                            )}
                            
                            <XAIDashboard response={result} />

                            {/* Acties */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button
                                    onClick={handleDownloadCertificate}
                                    disabled={result.verdict !== Verdict.PREFERENTIAL}
                                    style={{ padding: '12px 25px', backgroundColor: result.verdict === Verdict.PREFERENTIAL ? SUCCESS_GREEN : '#ccc', color: 'white', border: 'none', borderRadius: 4, cursor: result.verdict === Verdict.PREFERENTIAL ? 'pointer' : 'not-allowed' }}
                                >
                                    Genereer Certificaat (PDF)
                                </button>
                                
                                {/* ML-HITL Override Knop (UX-404) */}
                                <button
                                    onClick={() => setShowOverrideModal(true)}
                                    style={{ padding: '12px 25px', backgroundColor: 'white', color: SEVENSA_DARK, border: `1px solid ${SEVENSA_DARK}`, borderRadius: 4, cursor: 'pointer' }}
                                >
                                    Overrule Beslissing (HITL)
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {showOverrideModal && result && (
                <HITLOverrideModal response={result} onClose={() => setShowOverrideModal(false)} />
            )}
        </div>
    );
};

export default InvoiceUploadModule;
