import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function FullCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Mock events
  const events = [
    { date: new Date(2026, 0, 2), title: 'HVAC Maintenance', type: 'maintenance', time: '10:00 AM' },
    { date: new Date(2026, 0, 5), title: 'Unit 402 Inspection', type: 'inspection', time: '2:00 PM' },
    { date: new Date(2026, 0, 12), title: 'Lease Renewal', type: 'admin', time: 'All Day' },
    { date: new Date(2026, 0, 15), title: 'Plumbing Repair', type: 'emergency', time: '9:30 AM' },
    { date: new Date(2026, 0, 24), title: 'Fire Alarm Test', type: 'maintenance', time: '11:00 AM' },
    { date: new Date(2026, 0, 31), title: 'Monthly Review', type: 'admin', time: '3:00 PM' },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysArray = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      daysArray.unshift({ date: prevDate, type: 'prev' });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysArray.push({ date: new Date(year, month, i), type: 'current' });
    }
    
    const remainingDays = 42 - daysArray.length;
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push({ date: new Date(year, month + 1, i), type: 'next' });
    }
    
    return daysArray;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(e => 
      e.date.getFullYear() === date.getFullYear() &&
      e.date.getMonth() === date.getMonth() &&
      e.date.getDate() === date.getDate()
    );
  };

  const changeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + offset);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (offset * 7));
    } else {
      newDate.setDate(newDate.getDate() + offset);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (view === 'week') {
      const weekDays = getWeekDays(currentDate);
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  return (
    <div className="full-calendar">
      <div className="calendar-header">
        <div className="header-left">
          <h2>{formatDateHeader()}</h2>
          <div className="nav-buttons">
            <button onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
            <button className="today-btn" onClick={goToToday}>Today</button>
            <button onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="view-options">
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
          <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button>
        </div>
      </div>

      {view === 'month' && (
        <div className="calendar-grid">
          <div className="weekdays">
            {days.map(day => <div key={day} className="weekday">{day}</div>)}
          </div>
          <div className="days-grid">
            {calendarDays.map((item, index) => {
              const dayEvents = getEventsForDate(item.date);
              const isToday = new Date().toDateString() === item.date.toDateString();
              
              return (
                <div key={index} className={`day-cell ${item.type} ${isToday ? 'today' : ''}`}>
                  <div className="day-number">{item.date.getDate()}</div>
                  <div className="events-list">
                    {dayEvents.map((event, idx) => (
                      <div key={idx} className={`event-chip ${event.type}`}>
                        <span className="event-title">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="week-grid">
          <div className="week-header">
            <div className="time-gutter"></div>
            {weekDays.map((day, i) => {
              const isToday = new Date().toDateString() === day.toDateString();
              return (
                <div key={i} className={`week-day-header ${isToday ? 'today' : ''}`}>
                  <span className="day-name">{days[day.getDay()].slice(0, 3)}</span>
                  <span className={`day-num ${isToday ? 'today' : ''}`}>{day.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div className="week-body">
            <div className="time-column">
              {hours.map(h => (
                <div key={h} className="time-slot">
                  <span>{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</span>
                </div>
              ))}
            </div>
            {weekDays.map((day, i) => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={i} className="day-column">
                  {hours.map(h => (
                    <div key={h} className="hour-cell"></div>
                  ))}
                  {dayEvents.map((event, idx) => (
                    <div key={idx} className={`week-event ${event.type}`} style={{ top: `${(parseInt(event.time) - 8) * 60 + 10}px` }}>
                      <span className="event-time">{event.time}</span>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="day-view">
          <div className="day-schedule">
            {hours.map(h => {
              const hourEvents = events.filter(e => 
                e.date.toDateString() === currentDate.toDateString() && 
                parseInt(e.time) === h
              );
              return (
                <div key={h} className="hour-row">
                  <div className="hour-label">{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</div>
                  <div className="hour-content">
                    {hourEvents.map((event, idx) => (
                      <div key={idx} className={`day-event ${event.type}`}>
                        <Clock size={14} />
                        <span className="event-time">{event.time}</span>
                        <span className="event-title">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .full-calendar {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          padding: 28px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .header-left h2 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .nav-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-buttons button {
          height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 13px;
          font-weight: 600;
        }

        .nav-buttons button:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .today-btn {
          padding: 0 16px !important;
        }

        .view-options {
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          display: flex;
        }

        .view-options button {
          padding: 8px 20px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .view-options button.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        /* Month View */
        .calendar-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: white;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .weekday {
          padding: 14px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .days-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
        }

        .day-cell {
          border-right: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          padding: 10px;
          min-height: 90px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.2s;
        }

        .day-cell:nth-child(7n) { border-right: none; }
        .day-cell:hover { background: #f8fafc; }
        .day-cell.prev, .day-cell.next { background: #fcfcfc; color: #cbd5e1; }
        .day-cell.today { background: #eff6ff; }

        .day-number {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .day-cell.today .day-number {
          background: #3b82f6;
          color: white;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-chip {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          border-left: 3px solid;
          cursor: pointer;
          transition: transform 0.1s;
        }

        .event-chip:hover { transform: translateX(2px); }
        .event-chip.maintenance { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
        .event-chip.inspection { background: #f0fdf4; border-color: #22c55e; color: #15803d; }
        .event-chip.emergency { background: #fef2f2; border-color: #ef4444; color: #b91c1c; }
        .event-chip.admin { background: #f8fafc; border-color: #64748b; color: #334155; }

        .event-title {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Week View */
        .week-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: white;
        }

        .week-header {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .time-gutter {
          border-right: 1px solid #e2e8f0;
        }

        .week-day-header {
          padding: 12px;
          text-align: center;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .week-day-header:last-child { border-right: none; }
        
        .day-name {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .day-num {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .day-num.today {
          background: #3b82f6;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .week-body {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          flex: 1;
          overflow-y: auto;
        }

        .time-column {
          border-right: 1px solid #e2e8f0;
        }

        .time-slot {
          height: 60px;
          padding: 4px 8px;
          font-size: 11px;
          color: #94a3b8;
          text-align: right;
          border-bottom: 1px solid #f1f5f9;
        }

        .day-column {
          position: relative;
          border-right: 1px solid #f1f5f9;
        }

        .day-column:last-child { border-right: none; }

        .hour-cell {
          height: 60px;
          border-bottom: 1px solid #f1f5f9;
        }

        .week-event {
          position: absolute;
          left: 4px;
          right: 4px;
          padding: 6px;
          border-radius: 6px;
          font-size: 11px;
          border-left: 3px solid;
        }

        .week-event.maintenance { background: #eff6ff; border-color: #3b82f6; }
        .week-event.inspection { background: #f0fdf4; border-color: #22c55e; }
        .week-event.emergency { background: #fef2f2; border-color: #ef4444; }
        .week-event.admin { background: #f8fafc; border-color: #64748b; }

        .week-event .event-time {
          font-size: 10px;
          opacity: 0.8;
          display: block;
        }

        .week-event .event-title {
          font-weight: 600;
          display: block;
        }

        /* Day View */
        .day-view {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: white;
        }

        .day-schedule {
          height: 100%;
          overflow-y: auto;
        }

        .hour-row {
          display: flex;
          border-bottom: 1px solid #f1f5f9;
          min-height: 80px;
        }

        .hour-label {
          width: 80px;
          padding: 12px;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          border-right: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .hour-content {
          flex: 1;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .day-event {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          border-left: 4px solid;
        }

        .day-event.maintenance { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
        .day-event.inspection { background: #f0fdf4; border-color: #22c55e; color: #15803d; }
        .day-event.emergency { background: #fef2f2; border-color: #ef4444; color: #b91c1c; }
        .day-event.admin { background: #f8fafc; border-color: #64748b; color: #334155; }

        .day-event .event-time {
          font-size: 13px;
          font-weight: 600;
        }

        .day-event .event-title {
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
