import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '../lib/auth-context';
import Navigation from '../components/Navigation';
import Link from 'next/link';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  status: 'pending' | 'completed';
  property_name?: string;
}

function RemindersPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_date: ''
  });

  useEffect(() => {
    // Mock tasks for demo
    setTasks([
      {
        id: 1,
        title: 'Inspect Room 302 - Ali Milk',
        description: 'Monthly room inspection for tenant Ali Milk',
        priority: 'high',
        due_date: '2024-01-20',
        status: 'pending',
        property_name: 'Manhattan Heights Co-Living'
      },
      {
        id: 2,
        title: 'Process Lease Renewal - Sarah Wilson',
        description: 'Review and process lease renewal application',
        priority: 'medium',
        due_date: '2024-01-25',
        status: 'pending',
        property_name: 'Downtown Professional Suites'
      },
      {
        id: 3,
        title: 'Maintenance Check - Common Areas',
        description: 'Weekly maintenance check of common areas',
        priority: 'low',
        due_date: '2024-01-18',
        status: 'completed',
        property_name: 'Brooklyn Creative Hub'
      }
    ]);
    setLoading(false);
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: Date.now(),
      ...newTask,
      status: 'pending'
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
    setShowAddForm(false);
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'pending' ? 'completed' : 'pending' }
        : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  if (loading) {
    return (
      <div>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading tasks...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '15px'
        }}>
          <div>
            <h1 style={{ margin: '0', color: '#2c3e50', fontSize: '28px' }}>
              📋 Tasks & Reminders
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px' }}>
              Manage your property management tasks and reminders
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ Add Task
          </button>
        </div>

        {/* Add Task Form Modal */}
        {showAddForm && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ marginBottom: '20px' }}>Add New Task</h3>
              <form onSubmit={handleAddTask}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Task Title*
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'high' | 'medium' | 'low' })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
              {pendingTasks.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Pending Tasks</div>
          </div>
          
          <div style={{
            backgroundColor: '#d4edda',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
              {completedTasks.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Completed Tasks</div>
          </div>
          
          <div style={{
            backgroundColor: '#f8d7da',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #f5c6cb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
              {pendingTasks.filter(task => task.priority === 'high').length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>High Priority</div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>⏰ Pending Tasks</h2>
          {pendingTasks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3>All caught up!</h3>
              <p>No pending tasks at the moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {pendingTasks.map((task) => (
                <div key={task.id} style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  borderLeft: `4px solid ${getPriorityColor(task.priority)}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{task.title}</h3>
                      {task.property_name && (
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                          📍 {task.property_name}
                        </p>
                      )}
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{task.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        backgroundColor: getPriorityColor(task.priority),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✓ Complete
                      </button>
                    </div>
                  </div>
                  {task.due_date && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      📅 Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>✅ Completed Tasks</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {completedTasks.map((task) => (
                <div key={task.id} style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  opacity: 0.7
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#6c757d', textDecoration: 'line-through' }}>
                        {task.title}
                      </h3>
                      {task.property_name && (
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                          📍 {task.property_name}
                        </p>
                      )}
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{task.description}</p>
                    </div>
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ↶ Reopen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(RemindersPage, ['manager', 'owner', 'admin']); 