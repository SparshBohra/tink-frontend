import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { withAuth } from '../lib/auth-context';

function Reminders() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock tasks
        setTasks([
          { id: 1, title: 'Send rent reminders for January', type: 'communication', priority: 'high', dueDate: '2024-01-01', completed: false },
          { id: 2, title: 'Follow up on maintenance requests', type: 'maintenance', priority: 'medium', dueDate: '2024-01-02', completed: false },
          { id: 3, title: 'Schedule property inspections', type: 'inspection', priority: 'low', dueDate: '2024-01-05', completed: true }
        ]);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
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

  const getPriorityStatus = (priority: string) => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'info';
  }

  if (loading) {
    return (
      <DashboardLayout title="Reminders & Tasks">
        <Head>
          <title>Reminders & Tasks - Tink</title>
        </Head>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Tasks & Reminders - Tink</title>
      </Head>
      <DashboardLayout
        title="Tasks & Reminders"
        subtitle="Manage your daily tasks, communications, and follow-ups."
      >
        <SectionCard title="Add New Task">
          <div className="add-task-form">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter task description..."
              className="form-input"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              disabled={loading}
            />
            <button onClick={addTask} className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Quick Communication Actions">
          <div className="communication-actions">
            <div className="action-card">
              <h3>WhatsApp Reminders</h3>
              <p>Send rent reminders, maintenance updates, and announcements.</p>
              <button className="btn btn-success">Open WhatsApp</button>
            </div>
            <div className="action-card">
              <h3>Email Campaigns</h3>
              <p>Send lease renewals, welcome messages, and newsletters.</p>
              <button className="btn btn-warning">Compose Email</button>
            </div>
            <div className="action-card">
              <h3>SMS Alerts</h3>
              <p>Send urgent notifications and alerts to tenants.</p>
              <button className="btn btn-primary">Send SMS</button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Pending Tasks (${pendingTasks.length})`}>
          {pendingTasks.length > 0 ? (
            <div className="centered-table">
              <DataTable
                columns={[
                  { key: 'title', header: 'Task' },
                  { key: 'type', header: 'Type' },
                  { key: 'priority', header: 'Priority' },
                  { key: 'dueDate', header: 'Due Date' },
                  { key: 'actions', header: 'Actions' },
                ]}
                data={pendingTasks}
                renderRow={(task) => (
                  <tr key={task.id}>
                    <td className="center-cell">{task.title}</td>
                    <td className="center-cell"><StatusBadge status="info" text={task.type} /></td>
                    <td className="center-cell"><StatusBadge status={getPriorityStatus(task.priority)} text={task.priority} /></td>
                    <td className="center-cell">{task.dueDate}</td>
                    <td className="center-cell">
                      <div className="action-buttons">
                        <button onClick={() => toggleTask(task.id)} className="btn btn-success btn-sm" disabled={loading}>Complete</button>
                        <button onClick={() => deleteTask(task.id)} className="btn btn-error btn-sm" disabled={loading}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          ) : (
            <EmptyState title="All caught up!" description="No pending tasks." />
          )}
        </SectionCard>
        
        <SectionCard title={`Completed Tasks (${completedTasks.length})`}>
          {completedTasks.length > 0 ? (
            <div className="centered-table">
              <DataTable
                columns={[
                  { key: 'title', header: 'Task' },
                  { key: 'type', header: 'Type' },
                  { key: 'actions', header: 'Actions' },
                ]}
                data={completedTasks}
                renderRow={(task) => (
                  <tr key={task.id} className="completed-task">
                    <td className="center-cell">{task.title}</td>
                    <td className="center-cell"><StatusBadge status="info" text={task.type} /></td>
                    <td className="center-cell">
                      <button onClick={() => toggleTask(task.id)} className="btn btn-warning btn-sm" disabled={loading}>Mark as Pending</button>
                    </td>
                  </tr>
                )}
              />
            </div>
          ) : (
            <EmptyState title="No completed tasks" description="Complete a task to see it here." />
          )}
        </SectionCard>
      </DashboardLayout>
      <style jsx>{`
        .add-task-form { 
          display: flex; 
          gap: var(--spacing-md); 
        }
        
        .action-buttons { 
          display: flex; 
          gap: var(--spacing-xs); 
          justify-content: center; 
        }
        
        /* Center align table headers and cells */
        .centered-table :global(.data-table .table-header) {
          text-align: center !important;
        }
        
        .center-cell {
          text-align: center !important;
          padding: var(--spacing-md) var(--spacing-lg);
        }
        
        .completed-task .center-cell { 
          text-decoration: line-through; 
          color: var(--gray-400); 
        }
        
        .communication-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .action-card {
          background-color: var(--gray-50);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-100);
        }
        
        .action-card h3 {
          margin-top: 0;
        }
      `}</style>
    </>
  );
}

export default withAuth(Reminders, ['manager']); 