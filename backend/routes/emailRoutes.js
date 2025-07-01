import express from 'express';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import { saveEMLFile, getEMLFiles, getTempDir, cleanupTempFiles } from '../utils/emailUtils.js';

const router = express.Router();

/**
 * יצירת טיוטות מייל - רק יצירת קבצי EML
 */
async function handleEmailDrafts(req, res) {
    try {
        const { recipients, subject, body, attachment } = req.body;

        // Validate required fields
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                error: 'Recipients array is required and must not be empty'
            });
        }

        if (!subject || !body) {
            return res.status(400).json({
                error: 'Subject and body are required'
            });
        }

        console.log(`Creating ${recipients.length} email drafts...`);

        const emlFiles = [];
        const errors = [];

        // יצירת קובץ EML עבור כל נמען
        for (const recipient of recipients) {
            try {
                const filePath = await saveEMLFile(recipient, subject, body, attachment);
                emlFiles.push(filePath);
            } catch (error) {
                console.error(`Error creating EML for ${recipient}:`, error.message);
                errors.push(`שגיאה ביצירת קובץ עבור ${recipient}`);
            }
        }

        if (emlFiles.length === 0) {
            return res.status(500).json({
                success: false,
                error: 'לא הצלחנו ליצור אף קובץ EML',
                details: errors
            });
        }

        // החזרת מידע על הקבצים שנוצרו
        const response = {
            success: true,
            message: `נוצרו בהצלחה ${emlFiles.length} קבצי EML`,
            data: {
                totalCreated: emlFiles.length,
                emlFiles: emlFiles,
                tempDirectory: getTempDir()
            }
        };

        if (errors.length > 0) {
            response.warnings = errors;
        }

        // ניסיון לשלוח לתוכנה המקומית (פורט 5097)
        try {
            console.log('מנסה לשלוח לתוכנה המקומית...');
            console.log('נתיבי קבצי EML:', emlFiles);

            const localAppResponse = await fetch('http://localhost:5097/process-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipients,
                    subject,
                    body,
                    attachment,
                    emlFiles: emlFiles.map(filePath => ({
                        path: filePath,
                        recipient: recipients[emlFiles.indexOf(filePath)]
                    })) // שליחת נתיבי הקבצים עם פרטים נוספים
                }),
                signal: AbortSignal.timeout(10000) // 10 seconds timeout
            });

            if (localAppResponse.ok) {
                const localResult = await localAppResponse.json();
                console.log('נשלח בהצלחה לתוכנה המקומית:', localResult);

                response.message += ' ונשלח לתוכנה המקומית לפתיחה ב-Outlook';
                response.localAppNotified = true;
            } else {
                console.warn('התוכנה המקומית לא הגיבה כמו שצריך');
                response.message += ' (התוכנה המקומית לא זמינה)';
                response.localAppNotified = false;
            }
        } catch (localAppError) {
            console.warn('לא הצלחנו לחבור לתוכנה המקומית:', localAppError.message);
            response.message += ' (התוכנה המקומית לא זמינה)';
            response.localAppNotified = false;
        }

        res.json(response);

        // ניקוי קבצים אחרי זמן
        setTimeout(async () => {
            await cleanupTempFiles(emlFiles);
        }, 30 * 60 * 1000); // ניקוי אחרי 30 דקות

    } catch (error) {
        console.error('Error creating email drafts:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה פנימית בשרת',
            message: error.message
        });
    }
}

// Routes
router.post('/create-drafts', handleEmailDrafts);
router.post('/process-emails', handleEmailDrafts);

// endpoint לבדיקת זמינות התוכנה המקומית - גרסה פשוטה
router.get('/local-status', async (req, res) => {
    try {
        console.log('בודק חיבור לתוכנה המקומית בפורט 5097...');

        // נסה לשלוח בקשה פשוטה ל-root path
        const response = await fetch('http://localhost:5097/', {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // הגדלת הזמן ל-5 שניות
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'EmailDraftServer/1.0'
            }
        });

        if (response.status === 404) {
            // אם מקבלים 404, זה אומר שהשרת פועל אבל הנתיב לא קיים
            console.log('התוכנה המקומית פעילה! (404 expected for root path)');
            res.json({ status: 'connected', message: 'Local app is running', data: { port: 5097, status: 'active' } });
        } else if (response.ok) {
            const result = await response.text(); // נשתמש ב-text במקום json
            console.log('התוכנה המקומית פעילה!', result);
            res.json({ status: 'connected', message: 'Local app is running', data: { response: result } });
        } else {
            console.log('התוכנה המקומית לא הגיבה כמו שצריך - סטטוס:', response.status);
            res.json({ status: 'disconnected', message: `Local app responded with status ${response.status}` });
        }
    } catch (error) {
        console.log('התוכנה המקומית לא זמינה:', error.message);
        console.log('סוג השגיאה:', error.name);
        res.json({ status: 'disconnected', message: 'Local app not available', error: error.message });
    }
});

// endpoint לבדיקת זמינות התוכנה המקומית
router.get('/check-local-app', async (req, res) => {
    try {
        console.log('בודק חיבור לתוכנה המקומית בפורט 5097...');

        // נסה לשלוח בקשה פשוטה ל-root path
        const localAppResponse = await fetch('http://localhost:5097/', {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // הגדלת הזמן ל-5 שניות
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'EmailDraftServer/1.0'
            }
        });

        if (localAppResponse.status === 404) {
            // אם מקבלים 404, זה אומר שהשרת פועל אבל הנתיב לא קיים - זה בסדר
            console.log('התוכנה המקומית פעילה! (404 expected for root path)');
            res.json({
                success: true,
                localAppRunning: true,
                message: 'התוכנה המקומית פעילה',
                data: { port: 5097, status: 'active' }
            });
        } else if (localAppResponse.ok) {
            const result = await localAppResponse.text(); // נשתמש ב-text במקום json
            console.log('התוכנה המקומית פעילה!', result);
            res.json({
                success: true,
                localAppRunning: true,
                message: 'התוכנה המקומית פעילה',
                data: { response: result }
            });
        } else {
            console.log('התוכנה המקומית לא הגיבה כמו שצריך - סטטוס:', localAppResponse.status);
            res.json({
                success: true,
                localAppRunning: false,
                message: `התוכנה המקומית הגיבה עם סטטוס ${localAppResponse.status}`
            });
        }
    } catch (error) {
        console.log('התוכנה המקומית לא זמינה:', error.message);
        console.log('סוג השגיאה:', error.name);
        res.json({
            success: true,
            localAppRunning: false,
            message: 'התוכנה המקומית לא זמינה',
            error: error.message
        });
    }
});

// endpoint לתוכנה המקומית - קבלת רשימת קבצי EML
router.get('/eml-files', async (req, res) => {
    try {
        const emlFiles = await getEMLFiles();
        res.json({
            success: true,
            message: `נמצאו ${emlFiles.length} קבצי EML`,
            data: {
                files: emlFiles,
                tempDirectory: getTempDir(),
                count: emlFiles.length
            }
        });
    } catch (error) {
        console.error('Error getting EML files:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בקבלת קבצי EML',
            message: error.message
        });
    }
});

// endpoint לתוכנה המקומית - ניקוי קבצים
router.delete('/cleanup', async (req, res) => {
    try {
        const emlFiles = await getEMLFiles();
        await cleanupTempFiles(emlFiles);
        res.json({
            success: true,
            message: `נוקו ${emlFiles.length} קבצי EML`,
            data: {
                cleanedFiles: emlFiles.length
            }
        });
    } catch (error) {
        console.error('Error cleaning up files:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בניקוי קבצים',
            message: error.message
        });
    }
});

// Get email service info
router.get('/info', (req, res) => {
    res.json({
        service: 'Email Draft Creator',
        version: '1.0.0',
        description: 'יצירת טיוטות מייל ב-Outlook',
        supportedFormats: ['EML'],
        maxRecipients: 50,
        tempDirectory: getTempDir()
    });
});

// בדיקת זמינות קבצי EML עבור התוכנה המקומית
router.get('/verify-files', async (req, res) => {
    try {
        const emlFiles = await getEMLFiles();
        const verifiedFiles = [];

        for (const filePath of emlFiles) {
            try {
                const exists = await fs.pathExists(filePath);
                const stats = exists ? await fs.stat(filePath) : null;

                verifiedFiles.push({
                    path: filePath,
                    exists: exists,
                    size: stats ? stats.size : 0,
                    created: stats ? stats.birthtime : null
                });
            } catch (error) {
                verifiedFiles.push({
                    path: filePath,
                    exists: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `נבדקו ${emlFiles.length} קבצי EML`,
            data: {
                tempDirectory: getTempDir(),
                files: verifiedFiles,
                totalFiles: emlFiles.length,
                existingFiles: verifiedFiles.filter(f => f.exists).length
            }
        });
    } catch (error) {
        console.error('Error verifying EML files:', error);
        res.status(500).json({
            success: false,
            error: 'שגיאה בבדיקת קבצי EML',
            message: error.message
        });
    }
});

export default router;
