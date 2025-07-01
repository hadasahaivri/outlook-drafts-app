import { useState } from 'react';
import EmailTemplates from './EmailTemplates';

export interface EmailData {
    subject: string;
    recipients: string;
    body: string;
    cvFile: File | null;
}

interface EmailFormProps {
    onSubmit: (emailData: EmailData) => Promise<void>;
    isLoading: boolean;
}

const EmailForm: React.FC<EmailFormProps> = ({
    onSubmit,
    isLoading
}) => {
    const [emailData, setEmailData] = useState<EmailData>({
        subject: '',
        recipients: '',
        body: '',
        cvFile: null
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleInputChange = (field: keyof EmailData, value: string) => {
        setEmailData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear messages when user starts typing
        if (message) setMessage(null);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setEmailData(prev => ({
            ...prev,
            cvFile: file
        }));
    };

    const handleTemplateSelect = (subject: string, body: string) => {
        setEmailData(prev => ({
            ...prev,
            subject,
            body
        }));

    };

    const clearForm = () => {
        setEmailData({
            subject: '',
            recipients: '',
            body: '',
            cvFile: null
        });
        setMessage(null);

        // Reset file input
        const fileInput = document.getElementById('cvFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            await onSubmit(emailData);

            // Reset form after successful submission
            setEmailData({
                subject: '',
                recipients: '',
                body: '',
                cvFile: null
            });

            // Reset file input
            const fileInput = document.getElementById('cvFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error('Error in form submission:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="email-form">
            {message && (
                <div className={`message ${message.type}-message`}>
                    {message.text}
                </div>
            )}

            <EmailTemplates
                onTemplateSelect={handleTemplateSelect}
                onClearForm={clearForm}
            />

            <div className="form-group">
                <label htmlFor="subject">נושא המייל *</label>
                <input
                    type="text"
                    id="subject"
                    value={emailData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="הכנס נושא המייל"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="recipients">כתובות הנמענים *</label>
                <textarea
                    id="recipients"
                    value={emailData.recipients}
                    onChange={(e) => handleInputChange('recipients', e.target.value)}
                    placeholder="הכנס כתובות מייל מופרדות בפסיק או נקודה-פסיק&#10;דוגמה: email1@example.com, email2@example.com"
                    rows={3}
                    required
                />
                <small>ניתן להזין מספר כתובות מייל מופרדות בפסיק (,) או נקודה-פסיק (;)</small>
            </div>

            <div className="form-group">
                <label htmlFor="body">גוף ההודעה *</label>
                <textarea
                    id="body"
                    value={emailData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    placeholder="הכנס את תוכן ההודעה"
                    rows={8}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="cvFile">קובץ קורות חיים</label>
                <input
                    type="file"
                    id="cvFile"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                />
                {emailData.cvFile && (
                    <small>קובץ נבחר: {emailData.cvFile.name}</small>
                )}
            </div>

            <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
            >
                {isLoading ? 'יוצר טיוטות...' : 'צור טיוטות מייל'}
            </button>
        </form>
    );
};

export default EmailForm;
