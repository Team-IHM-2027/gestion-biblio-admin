// librarian-app/functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AssistantService } from '../../src/services/AssistantService';

admin.initializeApp();
const assistantService = new AssistantService();

export const assistantChat = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { message, orgName = 'OrgSettings' } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    
    const response = await assistantService.processQuery(message, orgName);
    res.json({ success: true, data: { response } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const assistantInfo = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const orgName = req.query.orgName as string || 'OrgSettings';
    const info = await assistantService.getLibraryInfo(orgName);
    res.json({ success: true, data: info });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});