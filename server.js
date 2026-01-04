const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Azure Configuration
const AZURE_CONFIG = {
    endpoint: process.env.ENDPOINT_URL,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deploymentName: process.env.DEPLOYMENT_NAME,
    searchEndpoint: process.env.SEARCH_ENDPOINT,
    searchKey: process.env.SEARCH_KEY,
    searchIndex: process.env.SEARCH_INDEX_NAME
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the chatbot HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatbot.html'));
});

// API endpoint to submit leads
app.post('/api/submit-lead', async (req, res) => {
    try {
        const { name, phone, email, company, message, requirement, type } = req.body;
        
        // Validate required fields
        if (!name || !phone || !email || !company) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: name, phone, email, and company are required' 
            });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }
        
        const leadData = {
            id: Date.now().toString(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            company: company.trim(),
            message: message ? message.trim() : 'No additional message provided',
            requirement: requirement ? requirement.trim() : 'General inquiry',
            type: type || 'contact_form',
            submittedAt: new Date().toISOString(),
            ip: req.ip || 'unknown'
        };

        // Save to JSON file (in production, use a proper database)
        const leadsFile = path.join(__dirname, 'data', 'leads.json');
        
        // Ensure data directory exists
        await fs.mkdir(path.dirname(leadsFile), { recursive: true });
        
        let leads = [];
        try {
            const existingData = await fs.readFile(leadsFile, 'utf8');
            leads = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist yet, start with empty array
        }
        
        leads.push(leadData);
        await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2));
        
        console.log('New lead submitted:', {
            id: leadData.id,
            name: leadData.name,
            email: leadData.email,
            company: leadData.company,
            requirement: leadData.requirement,
            submittedAt: leadData.submittedAt
        });
        res.json({ success: true, message: 'Lead submitted successfully', leadId: leadData.id });
        
    } catch (error) {
        console.error('Error saving lead:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// API endpoint to get all leads (for admin)
app.get('/api/leads', async (req, res) => {
    try {
        const leadsFile = path.join(__dirname, 'data', 'leads.json');
        const data = await fs.readFile(leadsFile, 'utf8');
        const leads = JSON.parse(data);
        res.json(leads);
    } catch (error) {
        res.json([]);
    }
});

// Azure OpenAI Chat API
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Check if user says "hi" and respond with "gpt-40"
        if (message.toLowerCase().trim() === 'hi') {
            return res.json({ response: 'gpt-40' });
        }
        
        // Search for relevant information first
        let searchResults = '';
        if (AZURE_CONFIG.searchEndpoint && AZURE_CONFIG.searchKey) {
            try {
                const searchResponse = await axios.post(
                    `${AZURE_CONFIG.searchEndpoint}/indexes/${AZURE_CONFIG.searchIndex}/docs/search?api-version=2023-11-01`,
                    {
                        search: message,
                        top: 3,
                        select: 'content'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': AZURE_CONFIG.searchKey
                        }
                    }
                );
                
                if (searchResponse.data.value && searchResponse.data.value.length > 0) {
                    searchResults = searchResponse.data.value
                        .map(result => result.content)
                        .join('\n\n');
                }
            } catch (searchError) {
                console.log('Search not available or failed:', searchError.message);
            }
        }
        
        // Prepare system message with company context
        const systemMessage = `You are a helpful AI assistant for GradientM, a leading technology consulting firm specializing in digital transformation. 
        
GradientM Services:
        - Cloud & Infrastructure (AWS, Azure, GCP)
        - Digital Transformation
        - Data Analytics & AI
        - Cybersecurity
        - Software Development
        - IT Consulting
        
        ${searchResults ? `Additional Context: ${searchResults}` : ''}
        
        Provide helpful, professional responses about GradientM's services. If asked about services not offered, politely redirect to available services.`;
        
        // Call Azure OpenAI
        const response = await axios.post(
            `${AZURE_CONFIG.endpoint}/openai/deployments/${AZURE_CONFIG.deploymentName}/chat/completions?api-version=2023-12-01-preview`,
            {
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: message }
                ],
                max_tokens: 300,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': AZURE_CONFIG.apiKey
                }
            }
        );
        
        const aiResponse = response.data.choices[0].message.content;
        res.json({ response: aiResponse });
        
    } catch (error) {
        console.error('Azure OpenAI Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'I apologize, but I\'m having trouble connecting to our AI service. Please try again or contact our support team directly.' 
        });
    }
});

// API endpoint to get lead statistics
app.get('/api/stats', async (req, res) => {
    try {
        const leadsFile = path.join(__dirname, 'data', 'leads.json');
        const data = await fs.readFile(leadsFile, 'utf8');
        const leads = JSON.parse(data);
        
        const stats = {
            totalLeads: leads.length,
            todayLeads: leads.filter(lead => {
                const today = new Date().toDateString();
                const leadDate = new Date(lead.submittedAt).toDateString();
                return today === leadDate;
            }).length,
            serviceRequests: leads.reduce((acc, lead) => {
                const service = lead.requirement || 'General Inquiry';
                acc[service] = (acc[service] || 0) + 1;
                return acc;
            }, {})
        };
        
        res.json(stats);
    } catch (error) {
        res.json({ totalLeads: 0, todayLeads: 0, serviceRequests: {} });
    }
});

app.listen(PORT, () => {
    console.log(`GradientM Chatbot Server running on http://localhost:${PORT}`);
});