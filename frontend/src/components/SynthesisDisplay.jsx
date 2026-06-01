import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, ShieldCheck, Shield, Activity, Info, Link as LinkIcon, Users } from 'lucide-react';
import api from '../services/api';

const SynthesisDisplay = ({ analysisId, result }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [hasTimedOut, setHasTimedOut] = useState(false);

    useEffect(() => {
        if (analysisId) {
            fetchNotes();
        }
    }, [analysisId]);

    // Timeout fallback: if notes haven't loaded in 5 seconds, proceed without them
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setHasTimedOut(true);
                setLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);
    useEffect(() => {
        if (analysisId) {
            fetchNotes();
        }
    }, [analysisId]);

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/verify/similar/${analysisId}`, { timeout: 3000 });
            setNotes(res.data);
        } catch (err) {
            console.error("Failed to fetch notes for synthesis:", err);
            setLoadError(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        if (loadError) {
            return <div style={{ color: 'var(--danger)' }}>Failed to load community notes.</div>;
        }
        return <div style={{ color: 'var(--text-secondary)' }}>Compiling synthesis conclusion{hasTimedOut ? ' (no community notes available)' : '...'}</div>;
    }

    // Dynamic Synthesis Engine
    const getSynthesis = () => {
        if (!result) return null;

        const aiPrediction = result.prediction;
        const aiConfidence = result.confidence || 0;
        const credibility = result.credibilityScore || 50;

        if (notes.length === 0) {
            return {
                verdict: 'AWAITING CITIZEN REVIEW',
                color: 'var(--warning)',
                bg: 'rgba(245, 158, 11, 0.05)',
                border: 'rgba(245, 158, 11, 0.2)',
                icon: <Activity size={36} color="var(--warning)" />,
                verdictSub: 'AI analysis is complete. Human consensus is pending.',
                summary: `The hybrid neural detectors finished scanning the content and predicted a ${aiPrediction} pattern with ${aiConfidence.toFixed(1)}% confidence. However, no citizen reviews or verified references have been logged in the community database yet.`,
                actionable: 'We highly recommend contributing fact-checking links or details in the Citizen Reviews tab to help confirm or dispute this AI prediction.',
                score: 'N/A'
            };
        }

        // Aggregate statistics
        const totalNotes = notes.length;
        const topNote = notes[0]; // notes are pre-sorted by trust score descending from backend
        let communityVerdict = 'Inconclusive';

        if (topNote && topNote.trustScore >= 5) {
            communityVerdict = topNote.verificationStatus; // 'Verified', 'Debunked', 'Inconclusive'
        }

        let combinedVerdict = '';
        let combinedColor = '';
        let combinedBg = '';
        let combinedBorder = '';
        let iconElement = null;
        let summaryText = '';
        let actionableText = '';

        if (aiPrediction === 'FAKE') {
            if (communityVerdict === 'Verified') {
                combinedVerdict = 'AI DEVIATION (CONTEXTUAL SAFEGUARD)';
                combinedColor = 'var(--accent-primary)';
                combinedBg = 'rgba(0, 210, 255, 0.05)';
                combinedBorder = 'rgba(0, 210, 255, 0.2)';
                iconElement = <ShieldCheck size={36} color="var(--accent-primary)" />;
                summaryText = `Automated neural models predicted this content to be FAKE (${aiConfidence.toFixed(1)}% confidence). However, trusted human investigators have verified key context or established that this content represents parody, educational commentary, standard citations, or authorized public speech.`;
                actionableText = `The AI warning may be safely bypassed. Please check the community reviews and references to understand the full context.`;
            } else if (communityVerdict === 'Debunked') {
                combinedVerdict = 'CONFIRMED DECEPTIVE FABRICATION';
                combinedColor = 'var(--danger)';
                combinedBg = 'rgba(239, 68, 68, 0.05)';
                combinedBorder = 'rgba(239, 68, 68, 0.2)';
                iconElement = <AlertTriangle size={36} color="var(--danger)" />;
                summaryText = `High Risk. Both the automated neural classifiers (${aiConfidence.toFixed(1)}% FAKE confidence) and verified citizen investigations are in perfect agreement. The content contains confirmed artificial vectors, deepfakes, or fabricated statements.`;
                actionableText = `Avoid sharing this media or text. Refer to the primary debunking links below to spread awareness.`;
            } else {
                combinedVerdict = 'SUSPECT / UNCONFIRMED';
                combinedColor = 'var(--danger)';
                combinedBg = 'rgba(239, 68, 68, 0.03)';
                combinedBorder = 'rgba(239, 68, 68, 0.15)';
                iconElement = <AlertTriangle size={36} color="var(--danger)" />;
                summaryText = `AI engines predict this content is FAKE. Community members have submitted preliminary notes, but no notes have reached the high-trust threshold required to issue a definitive community verdict.`;
                actionableText = `Go to the Citizen Reviews tab to review and vote on existing evidence, or add new references.`;
            }
        } else {
            // AI says REAL
            if (communityVerdict === 'Debunked') {
                combinedVerdict = 'COMMUNITY ALERT (DISCREPANCY)';
                combinedColor = 'var(--danger)';
                combinedBg = 'rgba(239, 68, 68, 0.05)';
                combinedBorder = 'rgba(239, 68, 68, 0.2)';
                iconElement = <AlertTriangle size={36} color="var(--danger)" />;
                summaryText = `Warning! While the automated detectors did not find obvious digital tampering (predicting REAL), community investigators have flagged this content as highly misleading, pointing out out-of-context video, outdated quotes, or smart manipulation.`;
                actionableText = `Exercise extreme caution. Human investigators have highlighted critical deceptive context that automated algorithms missed.`;
            } else if (communityVerdict === 'Verified') {
                combinedVerdict = 'FULLY VERIFIED AUTHENTIC';
                combinedColor = 'var(--success)';
                combinedBg = 'rgba(16, 185, 129, 0.05)';
                combinedBorder = 'rgba(16, 185, 129, 0.2)';
                iconElement = <Shield size={36} color="var(--success)" />;
                summaryText = `Vetted Authentic. Both automated AI algorithms and verified community reviews are in full harmony, certifying that the content is genuine, unmanipulated, and contextually accurate.`;
                actionableText = `This content has cleared both automated and human forensic verification steps and is safe for distribution.`;
            } else {
                combinedVerdict = 'REAL / AWAITING ALIGNMENT';
                combinedColor = 'var(--success)';
                combinedBg = 'rgba(16, 185, 129, 0.03)';
                combinedBorder = 'rgba(16, 185, 129, 0.15)';
                iconElement = <Shield size={36} color="var(--success)" />;
                summaryText = `AI engines predict this content is REAL. Initial citizen reviews have been received but have not yet achieved the high-trust threshold required to lock down community verification.`;
                actionableText = `Review the community reviews and upvote or downvote notes to lock in the final consensus.`;
            }
        }

        return {
            verdict: combinedVerdict,
            color: combinedColor,
            bg: combinedBg,
            border: combinedBorder,
            icon: iconElement,
            verdictSub: `AI Scan: ${aiPrediction} (${aiConfidence.toFixed(0)}%) • Community: ${communityVerdict}`,
            summary: summaryText,
            actionable: actionableText,
            score: `${credibility}/100`,
            communityVerdict
        };
    };

    const synthesis = getSynthesis();

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            
            {/* Top Section: Large Premium Verdict Dashboard */}
            {synthesis && (
                <div style={{
                    background: synthesis.bg,
                    border: `1px solid ${synthesis.border}`,
                    borderRadius: '4px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                            {synthesis.icon}
                        </div>
                        <div>
                            <span className="tech-font" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'block', marginBottom: '0.25rem' }}>
                                Unified Verification Verdict
                            </span>
                            <h2 className="tech-font" style={{ color: synthesis.color, fontSize: '1.4rem', margin: 0, letterSpacing: '0.05rem', fontWeight: 'bold' }}>
                                {synthesis.verdict}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                {synthesis.verdictSub}
                            </p>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                        <div>
                            <span className="tech-font" style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '0.5rem' }}>
                                Forensic Aggregation Summary
                            </span>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>
                                {synthesis.summary}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '2px' }}>
                            <span className="tech-font" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Info size={12} /> ACTIONABLE INSIGHT
                            </span>
                            <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                                {synthesis.actionable}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Section: Side-by-Side Metrics & Core Evidence */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
                
                {/* Left Panel: High Level Synthesis Metrics */}
                <div className="sub-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={14} color="var(--accent-primary)" />
                        <span className="tech-font">VERIFICATION METRICS</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Combined Credibility Rating:</span>
                                <span style={{ fontWeight: 'bold', color: synthesis?.color }}>{synthesis?.score}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'var(--bg-primary)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, height: '100%',
                                    width: `${result.credibilityScore || 50}%`,
                                    background: synthesis?.color,
                                    transition: 'width 1s ease-out'
                                }}></div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    AI Predictor
                                </span>
                                <span className={`status-badge ${result.prediction === 'FAKE' ? 'badge-fake' : 'badge-real'}`}>
                                    {result.prediction}
                                </span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    Total Reviews
                                </span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                    {notes.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Primary Community Evidence Note */}
                <div className="sub-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={14} color="var(--accent-primary)" />
                        <span className="tech-font">PRIMARY CITIZEN EVIDENCE</span>
                    </div>

                    {notes.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', minHeight: '100px' }}>
                            No active community notes are available. AI confidence remains uncorroborated.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                    {notes[0].authorUsername ? `@${notes[0].authorUsername}` : notes[0].authorId}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '2px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    Top Trusted Review (+{notes[0].trustScore})
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                "{notes[0].citizenEvidence}"
                            </p>
                            {notes[0].evidenceLinks && notes[0].evidenceLinks.length > 0 && notes[0].evidenceLinks[0] !== '' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                                    <LinkIcon size={12} color="var(--accent-primary)" />
                                    <a href={notes[0].evidenceLinks[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>
                                        View Cited Evidence Source
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
};

export default SynthesisDisplay;
