import express from 'express';
import { AssistantService } from '../services/AssistantService';

const router = express.Router();
const assistantService = new AssistantService();

// Get library information
router.get('/library-info', async (req, res) => {
  try {
    const orgName = req.query.orgName as string || 'OrgSettings';
    const libraryInfo = await assistantService.getLibraryInfo(orgName);
    
    res.json({
      success: true,
      data: libraryInfo
    });
  } catch (error) {
    console.error('Error fetching library info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch library information'
    });
  }
});

// Process chat message
router.post('/chat', async (req, res) => {
  try {
    const { message, orgName = 'OrgSettings' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }
    
    const response = await assistantService.processQuery(message, orgName);
    
    res.json({
      success: true,
      data: {
        response,
        metadata: {
          query: message,
          timestamp: new Date().toISOString(),
          orgName
        }
      }
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// Get quick suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const orgName = req.query.orgName as string || 'OrgSettings';
    const suggestions = assistantService.getQuickSuggestions(orgName);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Assistant service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;