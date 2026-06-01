const axios = require('axios');

/**
 * Calls Hugging Face API to classify text.
 * Falls back to a localized mock if API fails or no token is provided.
 * @param {string} text 
 */
async function callHuggingFaceAPI(text) {
    // Instead of querying Hugging Face directly, we now query our local Python service
    const API_URL = 'http://127.0.0.1:5001/classify';

    try {
        const response = await axios.post(
            API_URL,
            { text: text }
            // No API token needed for local communication!
        );

        const prediction = response.data;
        
        return {
            source: prediction.source,
            label: prediction.label,
            confidence: prediction.confidence
        };
    } catch (error) {
        console.error("Local Python ML Service Error:", error.response ? error.response.data : error.message);
        // Fallthrough to mock if the python server is offline
    }

    // Mock API Response if token absent or request failed
    console.log("Using Hugging Face Mock Output for text:", text);
    const lowerText = text.toLowerCase();
    
    const fakeKeywords = [
        'shocking', 'exposed', 'attacked', 'war', 'gemini', 'generated', 'modi', 'pm ',
        'gay', 'died', 'pakistan', 'lizard', 'aliens', 'deepstate', 'breaking', 'secret',
        'hitler', 'nazi', 'ww2', 'world war', 'illuminati', 'flat earth', 'hoax', 'scam',
        'miracle cure', "they don't want you to know", 'banned', 'leaked', 'conspiracy', 'fake'
    ];
    
    // Very short texts like "hello" aren't reliable for misinfo detection.
    if (lowerText.length < 10 && !fakeKeywords.some(kw => lowerText.includes(kw))) {
        return {
            source: 'Hugging Face Mock',
            label: 'REAL',
            confidence: 55 // very low confidence for random 1-word inputs
        };
    }

    const isFake = fakeKeywords.some(kw => lowerText.includes(kw));
    const mockLabel = isFake ? 'FAKE' : 'REAL';
    const mockConfidence = Math.floor(Math.random() * (98 - 85 + 1) + 85); // High confidence for mock detections 85-98%

    return {
        source: 'Hugging Face Mock',
        label: mockLabel,
        confidence: mockConfidence
    };
}

module.exports = {
    callHuggingFaceAPI
};
