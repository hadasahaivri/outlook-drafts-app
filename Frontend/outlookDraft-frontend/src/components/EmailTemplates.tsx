interface EmailTemplate {
    name: string;
    subject: string;
    body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        name: 'תבנית כללית',
        subject: 'קורות חיים למשרה ב[שם החברה]',
        body: `שלום רב,

אני שולח/ת אליכם קורות חיים של מועמד/ת מתאים/ה למשרה הרלוונטית בחברתכם.

המועמד/ת מביא/ה עמו/ה ניסיון רלוונטי וכישורים מקצועיים שיכולים לתרום לצוות שלכם.

בצירוף מצ"ב קורות החיים לעיונכם.

אני זמין/ה לכל שאלה או הבהרה נוספת.

בברכה,
[השם שלך]
[פרטי יצירת קשר]`
    },
    {
        name: 'תבנית טכנולוגיה',
        subject: 'מועמד/ת מצוין/ת לתפקיד הייטק ב[שם החברה]',
        body: `שלום רב,

אני פונה אליכם בנוגע למשרה הטכנולוגית הפתוחה בחברתכם.

ברצוני להציג בפניכם מועמד/ת איכותי/ת עם רקע טכנולוגי מתקדם ונסיון בפיתוח תוכנה.

המועמד/ת מתמחה ב:
• פיתוח תוכנה
• טכנולוגיות מתקדמות
• עבודה בצוות
• פתרון בעיות מורכבות

מצ"ב קורות החיים המלאים.

אשמח לקבוע פגישה או שיחת טלפון לדיון נוסף.

בברכה,
[השם שלך]
[פרטי יצירת קשר]`
    },
    {
        name: 'תבנית שיווק ומכירות',
        subject: 'מועמד/ת מצוין/ת לתפקיד שיווק ומכירות',
        body: `שלום רב,

אני שמח/ה להציג בפניכם מועמד/ת איכותי/ת לתפקיד בתחום השיווק והמכירות.

המועמד/ת מציג/ה הישגים מרשימים בתחום:
• ניסיון בניהול לקוחות
• הגדלת מכירות
• פיתוח עסקי
• יחסי לקוחות מעולים

המועמד/ת יכול/ה להביא ערך מוסף משמעותי לחברתכם.

בצירוף מצ"ב קורות החיים המפורטים.

זמין/ה לכל שאלה ובירור.

בהצלחה,
[השם שלך]
[פרטי יצירת קשר]`
    }
];

interface EmailTemplatesProps {
    onTemplateSelect: (subject: string, body: string, templateName: string) => void;
    onClearForm: () => void;
}

const EmailTemplates: React.FC<EmailTemplatesProps> = ({ onTemplateSelect, onClearForm }) => {
    return (
        <div className="templates-section">
            <div className="templates-header">
                <h3>תבניות מייל מוכנות</h3>
                <button
                    type="button"
                    className="clear-button"
                    onClick={onClearForm}
                >
                    🗑️ נקה טופס
                </button>
            </div>
            <div className="templates-buttons">
                {EMAIL_TEMPLATES.map((template, index) => (
                    <button
                        key={index}
                        type="button"
                        className="template-button"
                        onClick={() => onTemplateSelect(template.subject, template.body, template.name)}
                    >
                        {template.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EmailTemplates;
