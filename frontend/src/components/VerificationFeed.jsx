import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, Link as LinkIcon, Send } from 'lucide-react';
import api from '../services/api';

const VerificationFeed = ({ analysisId, requiresReview }) => {
    const [notes, setNotes] = useState([]);
    const [newEvidence, setNewEvidence] = useState('');
    const [newLink, setNewLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        if (analysisId) {
            fetchNotes();
        }
    }, [analysisId]);

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/verify/similar/${analysisId}`);
            setNotes(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch notes:", err);
            setError("Failed to load community notes.");
            setLoading(false);
        }
    };

    const handleVote = async (noteId, vote) => {
        if (!user || !token) {
            alert("You must be logged in to vote.");
            return;
        }

        try {
            await api.patch(`/verify/vote/${noteId}`, 
                { vote },
                { headers: { 'x-auth-token': token } }
            );
            fetchNotes(); // Refresh to get updated scores
        } catch (err) {
            console.error("Failed to vote:", err);
            alert("Failed to submit vote.");
        }
    };

    const handleSubmitNote = async (e) => {
        e.preventDefault();
        if (!user || !token) {
            alert("You must be logged in to submit a review.");
            return;
        }
        if (!newEvidence.trim()) {
            return;
        }

        try {
            await api.post('/verify/note', {
                linkedAnalysisId: analysisId,
                citizenEvidence: newEvidence,
                evidenceLinks: newLink ? [newLink] : []
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setNewEvidence('');
            setNewLink('');
            fetchNotes();
        } catch (err) {
            console.error("Failed to post note:", err);
            const msg = err.response?.data?.error || "Failed to post note.";
            alert(msg);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading community consensus...</div>;

    return (
        <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            {requiresReview && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '1rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle color="var(--danger)" size={24} />
                    <div>
                        <h4 style={{ margin: 0, color: 'var(--danger)', letterSpacing: '0.05em' }}>FORENSIC UNCERTAINTY DETECTED</h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Automated models failed to reach a confident consensus. This case requires human verification.
                        </p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <Users color="var(--accent-primary)" size={20} />
                <h3 style={{ margin: 0, color: 'var(--text-primary)', letterSpacing: '0.1em' }} className="tech-font">CITIZEN REVIEWS</h3>
            </div>

            {/* List Notes */}
            {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px dashed var(--glass-border)' }}>
                    No community notes have been added yet. Be the first to verify this content.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {notes.map(note => (
                        <div key={note._id} style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            padding: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                            {note.authorUsername ? `@${note.authorUsername}` : 'Anonymous Citizen'}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {note.authorId}
                                        </span>
                                    </div>
                                    {note.verificationStatus === 'Verified' && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '2px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <CheckCircle size={10} /> Verified Consensus
                                        </span>
                                    )}
                                    {note.verificationStatus === 'Debunked' && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '2px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <AlertTriangle size={10} /> Debunked Consensus
                                        </span>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '2px', border: '1px solid var(--glass-border)' }}>
                                    <button onClick={() => handleVote(note._id, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}>
                                        <ThumbsUp size={13} />
                                    </button>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', minWidth: '1.2rem', textAlign: 'center', color: note.trustScore > 0 ? 'var(--success)' : note.trustScore < 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                        {note.trustScore > 0 ? `+${note.trustScore}` : note.trustScore}
                                    </span>
                                    <button onClick={() => handleVote(note._id, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}>
                                        <ThumbsDown size={13} />
                                    </button>
                                </div>
                            </div>

                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                                {note.citizenEvidence}
                            </p>

                            {note.evidenceLinks && note.evidenceLinks.length > 0 && note.evidenceLinks[0] !== '' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <LinkIcon size={12} color="var(--accent-primary)" />
                                    <a href={note.evidenceLinks[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', textDecoration: 'none' }} onMouseOver={e => e.target.style.textDecoration='underline'} onMouseOut={e => e.target.style.textDecoration='none'}>
                                        Source Evidence Link
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Note Form */}
            {user ? (
                <form onSubmit={handleSubmitNote} style={{ marginTop: '2rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }} className="tech-font">Contribute to Verification</h4>
                    
                    <textarea 
                        value={newEvidence}
                        onChange={(e) => setNewEvidence(e.target.value)}
                        placeholder="Provide factual context or debunking evidence..."
                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px', minHeight: '80px', marginBottom: '1rem', resize: 'vertical', fontSize: '0.9rem', outline: 'none' }}
                        required
                    />
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <LinkIcon size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="url" 
                                value={newLink}
                                onChange={(e) => setNewLink(e.target.value)}
                                placeholder="Evidence URL (Optional)"
                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.25rem', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '2px', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8rem' }}>
                            <Send size={12} /> SUBMIT NOTE
                        </button>
                    </div>
                </form>
            ) : (
                <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px dashed var(--glass-border)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Log in to submit citizen evidence and vote on community consensus.</p>
                </div>
            )}
        </div>
    );
};

export default VerificationFeed;
