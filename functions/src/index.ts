// librarian-app/functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { AssistantService } from '../../src/services/AssistantService';

admin.initializeApp();
const assistantService = new AssistantService();

// Email configuration - update with your email credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'bornbeforedesign@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'Design@08'
  }
});

// Define an interface for the data structure
interface BlockingData {
  studentEmail: string;
  studentName: string;
  librarianMessage?: string;
}

interface UnblockingData {
  studentEmail: string;
  studentName: string;
} 

// Send blocking notification email
export const sendBlockingNotification = functions.https.onCall(async (request: functions.https.CallableRequest<BlockingData>) => {
  try {
    const { studentEmail, studentName, librarianMessage = '' } = request.data;

    if (!studentEmail || !studentName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'studentEmail and studentName are required'
      );
    }

    const mailOptions = {
      from: process.env.GMAIL_USER || 'bornbeforedesign@gmail.com',
      to: studentEmail,
      subject: '⚠️ Notification : Votre Compte Bibliothèque a été Bloqué',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
              .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
              .alert-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Compte Bloqué</h1>
              </div>
              <div class="content">
                <p>Cher(e) ${studentName},</p>
                
                <p>Nous vous informons que votre compte d'accès à la bibliothèque a été <strong>bloqué</strong>.</p>
                
                <div class="alert-box">
                  <p><strong>Raison du blocage :</strong></p>
                  <p>${librarianMessage || 'Raison non spécifiée'}</p>
                </div>
                
                <p><strong>Que faire maintenant ?</strong></p>
                <ul>
                  <li>Veuillez vous présenter à la <strong>bibliothèque</strong> dès que possible</li>
                  <li>Consultez un <strong>bibliothécaire</strong> pour clarifier la situation</li>
                  <li>Votre compte restera bloqué jusqu'à résolution de ce problème</li>
                </ul>
                
                <p><strong>Informations importantes :</strong></p>
                <ul>
                  <li>Vous ne pourrez pas accéder à votre compte tant qu'il reste bloqué</li>
                  <li>Aucun emprunt ne peut être effectué pendant le blocage</li>
                  <li>Veuillez contacter la bibliothèque au plus tôt</li>
                </ul>
                
                <p>Cordialement,<br><strong>La Bibliothèque</strong></p>
              </div>
              <div class="footer">
                <p>Ceci est un message automatisé. Veuillez ne pas répondre à cet email.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: `Email sent to ${studentEmail}`
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Send unblocking notification email
export const sendUnblockingNotification = functions.https.onCall(async (request: functions.https.CallableRequest<UnblockingData>) => {
  try {
    const { studentEmail, studentName } = request.data;

    if (!studentEmail || !studentName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'studentEmail and studentName are required'
      );
    }

    const mailOptions = {
      from: process.env.GMAIL_USER || 'bornbeforedesign@gmail.com',
      to: studentEmail,
      subject: '✅ Notification : Votre Compte Bibliothèque a été Débloqué',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
              .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
              .alert-box { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Compte Débloqué</h1>
              </div>
              <div class="content">
                <p>Cher(e) ${studentName},</p>
                
                <div class="alert-box">
                  <p>Bonne nouvelle ! Votre compte d'accès à la bibliothèque a été <strong>débloqué</strong>.</p>
                </div>
                
                <p>Vous pouvez à nouveau :</p>
                <ul>
                  <li>Vous connecter à votre compte</li>
                  <li>Emprunter des documents</li>
                  <li>Effectuer des réservations</li>
                </ul>
                
                <p>Si vous avez des questions, n'hésitez pas à contacter la bibliothèque.</p>
                
                <p>Cordialement,<br><strong>La Bibliothèque</strong></p>
              </div>
              <div class="footer">
                <p>Ceci est un message automatisé. Veuillez ne pas répondre à cet email.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: `Email sent to ${studentEmail}`
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

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