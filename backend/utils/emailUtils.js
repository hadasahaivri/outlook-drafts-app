import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Create temporary directory for EML files
const tempDir = path.join(os.tmpdir(), 'email-drafts');
await fs.ensureDir(tempDir);

/**
 * יצירת תוכן קובץ EML
 * @param {string} recipient - כתובת הנמען
 * @param {string} subject - נושא המייל
 * @param {string} body - גוף המייל
 * @param {Object} attachment - קובץ מצורף (אופציונלי)
 * @returns {string} תוכן קובץ EML
 */
export async function createEMLFile(recipient, subject, body, attachment) {
    let emlContent = `To: ${recipient.trim()}\r\n`;
    emlContent += `Subject: ${subject}\r\n`;
    emlContent += `MIME-Version: 1.0\r\n`;
    emlContent += `Date: ${new Date().toUTCString()}\r\n`;

    if (attachment && attachment.content) {
        emlContent += `Content-Type: multipart/mixed; boundary="boundary123"\r\n\r\n`;

        // Message body
        emlContent += `--boundary123\r\n`;
        emlContent += `Content-Type: text/html; charset=UTF-8\r\n`;
        emlContent += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
        emlContent += `${body.replace(/\n/g, '<br>')}\r\n\r\n`;

        // Attachment
        emlContent += `--boundary123\r\n`;
        emlContent += `Content-Type: application/octet-stream; name="${attachment.name}"\r\n`;
        emlContent += `Content-Disposition: attachment; filename="${attachment.name}"\r\n`;
        emlContent += `Content-Transfer-Encoding: base64\r\n\r\n`;

        // Split base64 content into lines of 76 characters (RFC requirement)
        const lines = attachment.content.match(/.{1,76}/g);
        if (lines) {
            emlContent += lines.join('\r\n');
        }
        emlContent += `\r\n\r\n--boundary123--\r\n`;
    } else {
        // Simple message without attachment
        emlContent += `Content-Type: text/html; charset=UTF-8\r\n`;
        emlContent += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
        emlContent += `${body.replace(/\n/g, '<br>')}\r\n`;
    }

    return emlContent;
}

/**
 * ניסיון לפתוח קובץ EML ב-Outlook (אופציונלי)
 * @param {string} filePath - נתיב הקובץ
 * @returns {Promise<boolean>} true אם הצליח לפתוח, false אם לא
 */
export async function tryOpenWithOutlook(filePath) {
    try {
        console.log(`Trying to open EML file: ${filePath}`);

        // בדיקה שהקובץ קיים
        const fileExists = await fs.pathExists(filePath);
        if (!fileExists) {
            console.warn(`File does not exist: ${filePath}`);
            return false;
        }

        let command;

        switch (process.platform) {
            case 'win32':
                // Windows - פתיחה דרך start עם error handling
                command = `start "" "${filePath}"`;
                break;
            case 'darwin':
                // macOS
                command = `open "${filePath}"`;
                break;
            case 'linux':
                // Linux
                command = `xdg-open "${filePath}"`;
                break;
            default:
                console.warn(`Unsupported platform: ${process.platform}`);
                return false;
        }

        console.log(`Executing command: ${command}`);

        // הרצת הפקודה עם timeout קצר
        await execAsync(command, {
            timeout: 5000, // 5 seconds timeout
            windowsHide: true
        });

        console.log(`Successfully opened EML file: ${filePath}`);
        return true;

    } catch (error) {
        console.warn(`Could not auto-open EML file ${filePath}:`, error.message);
        return false; // לא נזרוק שגיאה, רק נחזיר false
    }
}

/**
 * יצירת קובץ BAT לפתיחת קבצי EML
 * @param {string[]} emlFilePaths - רשימת נתיבי קבצי EML
 * @returns {string} נתיב קובץ ה-BAT
 */
export function createBatchFile(emlFilePaths) {
    let batchContent = '@echo off\r\n';
    batchContent += 'chcp 65001 >nul\r\n';
    batchContent += 'echo יוצר טיוטות מייל ב-Outlook...\r\n';
    batchContent += 'echo.\r\n';

    emlFilePaths.forEach((filePath, index) => {
        const fileName = path.basename(filePath, '.eml');
        batchContent += `echo פותח טיוטה ${index + 1} מתוך ${emlFilePaths.length}: ${fileName}\r\n`;
        batchContent += `start "" "${filePath}"\r\n`;
        batchContent += 'timeout /t 2 /nobreak >nul\r\n';
    });

    batchContent += 'echo.\r\n';
    batchContent += 'echo כל הטיוטות נפתחו ב-Outlook!\r\n';
    batchContent += 'echo עכשיו תוכל לערוך ולשלוח את המיילים מ-Outlook.\r\n';
    batchContent += 'echo.\r\n';
    batchContent += 'pause\r\n';

    const batchFilePath = path.join(tempDir, 'open_email_drafts.bat');
    fs.writeFileSync(batchFilePath, batchContent, 'utf8');

    console.log(`Created batch file: ${batchFilePath}`);
    return batchFilePath;
}

/**
 * שמירת קובץ EML לתיקייה
 * @param {string} recipient - כתובת הנמען
 * @param {string} subject - נושא המייל
 * @param {string} body - גוף המייל
 * @param {Object} attachment - קובץ מצורף (אופציונלי)
 * @returns {Promise<string>} נתיב הקובץ שנוצר
 */
export async function saveEMLFile(recipient, subject, body, attachment) {
    const emlContent = await createEMLFile(recipient, subject, body, attachment);

    // יצירת שם קובץ ייחודי
    const safeRecipient = recipient.replace(/[@.\s]/g, '_');
    const timestamp = Date.now();
    const fileName = `draft_${safeRecipient}_${timestamp}.eml`;
    const filePath = path.join(tempDir, fileName);

    // שמירת הקובץ
    await fs.writeFile(filePath, emlContent, 'utf-8');

    // וידוא שהקובץ נוצר
    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
        throw new Error(`Failed to create EML file: ${filePath}`);
    }

    const fileStats = await fs.stat(filePath);
    console.log(`Created EML file: ${filePath} (${fileStats.size} bytes)`);

    return filePath;
}

/**
 * קבלת רשימת קבצי EML שנוצרו
 * @returns {Promise<string[]>} רשימת נתיבי קבצי EML
 */
export async function getEMLFiles() {
    try {
        const files = await fs.readdir(tempDir);
        const emlFiles = files
            .filter(file => file.endsWith('.eml'))
            .map(file => path.join(tempDir, file));
        return emlFiles;
    } catch (error) {
        console.error('Error reading EML files:', error);
        return [];
    }
}

/**
 * קבלת נתיב תיקיית הקבצים הזמניים
 * @returns {string} נתיב התיקייה
 */
export function getTempDir() {
    return tempDir;
}

/**
 * ניקוי קבצים זמניים
 * @param {string[]} filePaths - רשימת נתיבי קבצים לניקוי
 */
export async function cleanupTempFiles(filePaths) {
    try {
        for (const filePath of filePaths) {
            await fs.remove(filePath);
        }
        console.log('Temporary EML files cleaned up');
    } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
    }
}
