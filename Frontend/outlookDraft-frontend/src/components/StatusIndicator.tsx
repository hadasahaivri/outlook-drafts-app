import React from 'react';

interface StatusIndicatorProps {
  status: 'unknown' | 'connected' | 'disconnected';
  onRefresh: () => void;
}

const statusMessages: Record<'unknown' | 'connected' | 'disconnected', string> = {
  connected: '🟢 התוכנה המקומית פעילה - פתיחה אוטומטית זמינה',
  disconnected: '🟡 התוכנה המקומית לא זמינה - יצירת קבצים בלבד',
  unknown: '🔄 בודק חיבור לתוכנה המקומית...'
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, onRefresh }) => {
  return (
    <div className={`status-indicator ${status}`}>
      <span className="status-message">{statusMessages[status]}</span>
      <button
        onClick={onRefresh}
        className="refresh-status-button"
        title="בדוק מחדש את חיבור התוכנה המקומית"
      >
        🔄
      </button>
    </div>
  );
};

export default StatusIndicator;
