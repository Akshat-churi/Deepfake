const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CommunityVerification = require('../models/CommunityVerification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper to generate pseudonymous ID from email
function generatePseudoId(email) {
    const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    return 'citizen_' + hash.substring(0, 8);
}

// POST /api/verify/note
// Add a new citizen review note
router.post('/note', auth, async (req, res) => {
    try {
        const { linkedAnalysisId, citizenEvidence, evidenceLinks } = req.body;

        // Fetch user to get email for pseudo ID
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const authorId = generatePseudoId(user.email);

        const newNote = new CommunityVerification({
            linkedAnalysisId,
            authorId,
            authorUsername: user.username,
            citizenEvidence,
            evidenceLinks: evidenceLinks || []
        });

        await newNote.save();

        res.status(201).json({ success: true, note: newNote });
    } catch (error) {
        console.error("Error posting note:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/verify/similar/:analysisId
// Fetch community notes for this analysis and any similar previous analyses
router.get('/similar/:analysisId', async (req, res) => {
    try {
        // 1. Find the current analysis to get its text
        const AnalysisResult = require('../models/AnalysisResult');
        const currentAnalysis = await AnalysisResult.findById(req.params.analysisId);
        
        if (!currentAnalysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        // 2. Find all other analyses with the EXACT SAME text (ignoring case/whitespace)
        // This is our "Similarity Engine"
        const similarAnalyses = await AnalysisResult.find({
            text: { $regex: new RegExp(`^${currentAnalysis.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).select('_id');

        const analysisIds = similarAnalyses.map(a => a._id);

        // 3. Find all notes linked to any of these similar analyses
        const notes = await CommunityVerification.find({ linkedAnalysisId: { $in: analysisIds } })
            .sort({ trustScore: -1, createdAt: -1 });
            
        res.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/verify/vote/:noteId
// Upvote or downvote a note
router.patch('/vote/:noteId', auth, async (req, res) => {
    try {
        const { vote } = req.body; // 1 for upvote, -1 for downvote
        if (vote !== 1 && vote !== -1) {
            return res.status(400).json({ error: 'Invalid vote value' });
        }

        const note = await CommunityVerification.findById(req.params.noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        note.trustScore += vote;
        
        // Update verification status based on strong community consensus
        if (note.trustScore >= 10) {
            note.verificationStatus = 'Verified';
        } else if (note.trustScore <= -10) {
            note.verificationStatus = 'Debunked';
        } else {
            note.verificationStatus = 'Inconclusive';
        }

        await note.save();

        res.json({ success: true, note });
    } catch (error) {
        console.error("Error voting on note:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
