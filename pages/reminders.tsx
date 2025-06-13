import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { withAuth } from '../lib/auth-context';

function Reminders() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    // Mock tasks for now since this is a communication/task management feature
    setTasks([
      { id: 1, title: 'Send rent reminders for January', type: 'communication', priority: 'high', dueDate: '2024-01-01', completed: false },
      { id: 2, title: 'Follow up on maintenance requests', type: 'maintenance', priority: 'medium', dueDate: '2024-01-02', completed: false },
      { id: 3, title: 'Schedule property inspections', type: 'inspection', priority: 'low', dueDate: '2024-01-05', completed: true }
    ]);
  }, []);

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        title: newTask,
        type: 'general',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        completed: false
      };
      setTasks([...tasks, task]);
      setNewTask('');
    }
  };

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px' }}>
        <h1>📋 Tasks & Reminders</h1>
        <p>Manage your daily tasks, communications, and follow-ups.</p>

        {/* Add New Task */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h2>➕ Add New Task</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter task description..."
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <button
              onClick={addTask}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Pending Tasks */}
        <div style={{ marginBottom: '30px' }}>
          <h2>⏰ Pending Tasks ({pendingTasks.length})</h2>
          {pendingTasks.length > 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Task</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Priority</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Due Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTasks.map((task, index) => (
                    <tr key={task.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        <strong>{task.title}</strong>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: task.type === 'communication' ? '#e3f2fd' : 
                                         task.type === 'maintenance' ? '#fff3e0' : '#f3e5f5',
                          color: task.type === 'communication' ? '#1976d2' : 
                                 task.type === 'maintenance' ? '#f57c00' : '#7b1fa2'
                        }}>
                          {task.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: task.priority === 'high' ? '#ffebee' : 
                                         task.priority === 'medium' ? '#fff3e0' : '#e8f5e8',
                          color: task.priority === 'high' ? '#d32f2f' : 
                                 task.priority === 'medium' ? '#f57c00' : '#388e3c'
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        {task.dueDate}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <button
                            onClick={() => toggleTask(task.id)}
                            style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3>🎉 All caught up!</h3>
              <p>No pending tasks. Great job!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '30px' }}>
          <h2>⚡ Quick Communication Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div style={{ 
              backgroundColor: '#e3f2fd', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <h3>📱 WhatsApp Reminders</h3>
              <p>Send rent reminders, maintenance updates, and announcements.</p>
              <button style={{
                backgroundColor: '#25d366',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Open WhatsApp
              </button>
            </div>
            
            <div style={{ 
              backgroundColor: '#fff3e0', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #ffcc02'
            }}>
              <h3>📧 Email Campaigns</h3>
              <p>Send lease renewals, welcome messages, and newsletters.</p>
              <button style={{
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Compose Email
              </button>
            </div>
            
            <div style={{ 
              backgroundColor: '#f3e5f5', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #e1bee7'
            }}>
              <h3>📞 Call Schedule</h3>
              <p>Schedule follow-up calls and property visits.</p>
              <button style={{
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Schedule Call
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ 
          marginTop: '30px',
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2>📊 Task Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
                {pendingTasks.length}
              </div>
              <div>Pending Tasks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                {completedTasks.length}
              </div>
              <div>Completed Today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
                {pendingTasks.filter(t => t.priority === 'high').length}
              </div>
              <div>High Priority</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>
                {Math.round((completedTasks.length / (completedTasks.length + pendingTasks.length)) * 100) || 0}%
              </div>
              <div>Completion Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Reminders, ['admin', 'owner', 'manager']); 