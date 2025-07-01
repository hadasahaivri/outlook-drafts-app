# Email Draft Backend Server

שרת Backend לאפליקציית יצירת טיוטות מייל ב-Outlook.

## תכונות

- יצירת טיוטות מייל בפורמט EML
- פתיחה אוטומטית ב-Outlook
- תמיכה בקבצים מצורפים
- מספר נמענים
- ניקוי אוטומטי של קבצים זמניים

## התקנה

```bash
cd backend
npm install
```

## הרצה

### מצב פיתוח (עם hot reload)
```bash
npm run dev
```

### מצב ייצור
```bash
npm start
```

השרת ירוץ על http://localhost:5000

## API Endpoints

### GET /status
בדיקת סטטוס השרת

**Response:**
```json
{
  "status": "connected",
  "message": "Email draft server is running",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### GET /health
בדיקת בריאות השרת

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### POST /create-drafts
יצירת טיוטות מייל

**Request Body:**
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "נושא המייל",
  "body": "תוכן המייל",
  "attachment": {
    "name": "cv.pdf",
    "content": "base64_encoded_content",
    "type": "application/pdf"
  }
}
```

**Response (הצלחה):**
```json
{
  "success": true,
  "message": "Successfully created and opened 2 email drafts",
  "recipients": 2
}
```

**Response (שגיאה):**
```json
{
  "error": "Recipients array is required and must not be empty"
}
```

## Structure

```
backend/
├── server.js          # השרת הראשי
├── package.json       # תלויות והגדרות הפרויקט
└── README.md         # תיעוד
```

## דרישות מערכת

- Node.js גרסה 16 ומעלה
- Outlook מותקן במחשב (לפתיחה אוטומטית של טיוטות)
- Windows/macOS/Linux

## שימוש

1. הפעל את השרת: `npm start`
2. השרת ישמע על פורט 5000
3. הפרונטנד יתחבר אוטומטית לשרת
4. טיוטות המייל ייפתחו אוטומטית ב-Outlook

## פתרון בעיות

### השרת לא מתחיל
- וודא שפורט 5000 לא תפוס
- בדוק שכל התלויות מותקנות: `npm install`

### טיוטות לא נפתחות ב-Outlook
- וודא ש-Outlook מותקן ומוגדר כלקוח המייל ברירת המחדל
- בדוק הרשאות הגישה לקבצים

### שגיאות CORS
- השרת מוגדר לאפשר בקשות מכל מקור
- אם יש בעיות, בדוק הגדרות החומת אש
