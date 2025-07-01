import { useState, useEffect } from 'react'
import './App.css'
import EmailForm, { EmailData } from './components/EmailForm'
import StatusIndicator from './components/StatusIndicator'
import {
  validateEmailList,
  fileToBase64
} from './utils/emailUtils'

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [localAppStatus, setLocalAppStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Check local app status on component mount
  useEffect(() => {
    checkLocalAppStatus();
  }, []);

  // פונקציה לבדיקת חיבור לתוכנה המקומית (דרך השרת)
  const checkLocalAppStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/local-status');
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      if (data.status === 'connected') {
        setLocalAppStatus('connected');
      } else {
        setLocalAppStatus('disconnected');
      }
    } catch {
      setLocalAppStatus('disconnected');
    }
  };

  // כפתור שליחת המיילים - עכשיו עובד רק דרך השרת
  const handleEmailSubmit = async (emailData: EmailData) => {
    if (!emailData.subject.trim()) {
      setMessage({ type: 'error', text: 'אנא הכנס נושא למייל' });
      throw new Error('Missing subject');
    }

    if (!emailData.body.trim()) {
      setMessage({ type: 'error', text: 'אנא הכנס תוכן למייל' });
      throw new Error('Missing body');
    }

    // בדיקת ולידציית מיילים
    const emailValidation = validateEmailList(emailData.recipients);

    if (!emailValidation.isValid) {
      setMessage({ type: 'error', text: emailValidation.errors.join(' • ') });
      throw new Error('Invalid emails');
    }

    // אזהרה אם התוכנה המקומית לא מחוברת
    if (localAppStatus === 'disconnected') {
      const userConfirmed = window.confirm(
        '⚠️ התוכנה המקומית לא מחוברת!\n\n' +
        'הקבצים ייוצרו אך לא יפתחו אוטומטית ב-Outlook.\n' +
        'האם ברצונך להמשיך בכל זאת?'
      );

      if (!userConfirmed) {
        throw new Error('User cancelled due to local app not connected');
      }
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const recipients = emailValidation.validEmails;

      // שליחה לשרת - הכל עובר דרך השרת שיטפל בכל השאר
      const response = await fetch('http://localhost:5000/create-drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject: emailData.subject,
          body: emailData.body,
          attachment: emailData.cvFile ? {
            name: emailData.cvFile.name,
            content: await fileToBase64(emailData.cvFile),
            type: emailData.cvFile.type
          } : null
        }),
      });

      const result = await response.json();

      if (result.success) {
        let message = `נוצרו בהצלחה ${result.data.totalCreated} קבצי EML`;
        const messageType: 'success' | 'error' = 'success';

        if (result.localAppNotified) {
          message += ' ונשלחו לתוכנה המקומית. הטיוטות נפתחו ב-Outlook! 🎉';
        } else if (result.localAppWarning) {
          message += '. ⚠️ התוכנה המקומית לא מחוברת - הקבצים נוצרו אך לא נשלחו לפתיחה.';
          message += '\n💡 הפעל את התוכנה המקומית על פורט 5097 לפתיחה אוטומטית.';
        } else {
          message += '. הקבצים מוכנים לשימוש ידני.';
        }

        setMessage({
          type: messageType,
          text: message
        });

        // עדכון סטטוס התוכנה המקומית אם יש מידע חדש
        if (result.localAppNotified === true && localAppStatus !== 'connected') {
          setLocalAppStatus('connected');
        } else if (result.localAppNotified === false && result.localAppWarning && localAppStatus !== 'disconnected') {
          setLocalAppStatus('disconnected');
        }

        // בדיקת סטטוס מחדש אחרי כמה שניות אם התוכנה לא הייתה זמינה
        if (!result.localAppNotified) {
          setTimeout(() => {
            checkLocalAppStatus();
          }, 5000); // בדיקה מחדש אחרי 5 שניות
        }

        if (result.warnings && result.warnings.length > 0) {
          console.warn('Warnings:', result.warnings);
        }
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'אירעה שגיאה ביצירת טיוטות המייל'
        });
      }

    } catch (error) {
      console.error('Error creating email drafts:', error);
      setMessage({ type: 'error', text: 'אירעה שגיאה ביצירת טיוטות המייל' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1> מערכת יצירת טיוטות מייל</h1>
        <p>מלא את הפרטים ליצירת טיוטות מייל ב-Outlook</p>
      </div>

      <StatusIndicator
        status={localAppStatus}
        onRefresh={checkLocalAppStatus}
      />

      {message && (
        <div className={`message ${message.type}-message`}>
          {message.text}
        </div>
      )}

      <EmailForm
        onSubmit={handleEmailSubmit}
        isLoading={isLoading}
      />

      <div className="instructions">
        <h3>הוראות שימוש:</h3>
        <ol>
          <li>מלא את כל השדות הנדרשים</li>
          <li>הכנס כתובות מייל מופרדות בפסיק עבור מספר נמענים</li>
          <li>צרף קובץ קורות חיים במידת הצורך</li>
          <li>לחץ על "יצור טיוטות מייל"</li>
        </ol>

      </div>
    </div>
  );
}

export default App
