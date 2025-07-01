// Frontend Email Utils - רק פונקציות שהפרונטאנד צריך

/**
 * בדיקת תקינות כתובת מייל
 * @param email - כתובת המייל לבדיקה
 * @returns true אם הכתובת תקינה
 */
export const validateEmailAddress = (email: string): boolean => {
    const comprehensiveEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return comprehensiveEmailRegex.test(email) && email.length <= 254;
};

/**
 * בדיקת תקינות רשימת כתובות מייל
 * @param emailString - מחרוזת עם כתובות מייל מופרדות
 * @returns אובייקט עם תוצאות הבדיקה
 */
export const validateEmailList = (emailString: string): { 
    isValid: boolean; 
    errors: string[]; 
    validEmails: string[] 
} => {
    const errors: string[] = [];

    if (!emailString.trim()) {
        errors.push('שדה כתובות הנמענים ריק');
        return { isValid: false, errors, validEmails: [] };
    }

    const emails = emailString
        .split(/[,;\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

    if (emails.length === 0) {
        errors.push('לא נמצאו כתובות מייל תקינות');
        return { isValid: false, errors, validEmails: [] };
    }

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    const duplicateEmails: string[] = [];
    const seenEmails = new Set<string>();

    emails.forEach(email => {
        const normalizedEmail = email.toLowerCase();

        if (seenEmails.has(normalizedEmail)) {
            if (!duplicateEmails.includes(email)) {
                duplicateEmails.push(email);
            }
            return;
        }

        seenEmails.add(normalizedEmail);

        if (validateEmailAddress(email)) {
            validEmails.push(email);
        } else {
            invalidEmails.push(email);
        }
    });

    if (invalidEmails.length > 0) {
        errors.push(`כתובות מייל לא תקינות: ${invalidEmails.join(', ')}`);
    }

    if (duplicateEmails.length > 0) {
        errors.push(`כתובות מייל כפולות: ${duplicateEmails.join(', ')}`);
    }

    if (validEmails.length === 0) {
        errors.push('לא נמצאה אף כתובת מייל תקינה');
    }

    if (validEmails.length > 50) {
        errors.push('מספר כתובות המייל עולה על המגבלה המותרת (50)');
    }

    return {
        isValid: errors.length === 0,
        errors,
        validEmails
    };
};

/**
 * המרת קובץ ל-Base64
 * @param file - הקובץ להמרה
 * @returns Promise עם תוכן Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('Failed to convert file to base64'));
            }
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * בדיקת סטטוס השרת המקומי
 * @returns Promise<boolean> - true אם השרת פועל
 */
export const checkServerStatus = async (): Promise<boolean> => {
    try {
        const response = await fetch('http://localhost:5000/status', {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch {
        return false;
    }
};

// Type definitions
export interface AttachmentData {
    name: string;
    content: string;
    type: string;
}



