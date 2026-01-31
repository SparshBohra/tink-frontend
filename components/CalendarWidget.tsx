import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const today = currentDate.getDate();

  // Generate simple calendar grid for current month (Jan 2026 example)
  // 31st Jan 2026 is Saturday. Jan 1st 2026 is Thursday.
  const calendarDays = [
    { day: 28, prev: true }, { day: 29, prev: true }, { day: 30, prev: true }, { day: 31, prev: true },
    { day: 1 }, { day: 2 }, { day: 3 },
    { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 },
    { day: 11 }, { day: 12 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 },
    { day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 },
    { day: 25 }, { day: 26 }, { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31 },
    { day: 1, next: true }, { day: 2, next: true }, { day: 3, next: true }, { day: 4, next: true }, { day: 5, next: true }, { day: 6, next: true }, { day: 7, next: true }
  ];

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <h3 className="month-year">{currentMonth} {currentYear}</h3>
        <div className="calendar-nav">
          <button className="nav-btn"><ChevronLeft size={16} /></button>
          <button className="nav-btn"><ChevronRight size={16} /></button>
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="weekdays">
          {days.map(d => <div key={d} className="weekday">{d.charAt(0)}</div>)}
        </div>
        <div className="days">
          {calendarDays.slice(0, 35).map((d, i) => ( // Show 5 weeks
            <div 
              key={i} 
              className={`day ${d.prev || d.next ? 'dimmed' : ''} ${d.day === today && !d.prev && !d.next ? 'today' : ''}`}
            >
              {d.day}
              {d.day === today && !d.prev && !d.next && <div className="dot"></div>}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .calendar-widget {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .month-year {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .calendar-nav {
          display: flex;
          gap: 4px;
        }

        .nav-btn {
          padding: 4px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          border-radius: 4px;
        }

        .nav-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 8px;
        }

        .weekday {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          row-gap: 8px;
        }

        .day {
          text-align: center;
          font-size: 13px;
          color: #1e293b;
          padding: 6px;
          cursor: pointer;
          border-radius: 6px;
          position: relative;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .day:hover:not(.dimmed) {
          background: #f8fafc;
          color: #3b82f6;
        }

        .day.dimmed {
          color: #cbd5e1;
        }

        .day.today {
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }

        .dot {
          position: absolute;
          bottom: 4px;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
