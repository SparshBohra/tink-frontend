import Navigation from '../components/Navigation';
import Link from 'next/link';
import { withAuth } from '../lib/auth-context';

function WorkflowGuide() {
  return (
    <div>
      <Navigation />
      <h1>🔄 Complete Workflow Guide</h1>
      <p>Clear, step-by-step processes for maximum efficiency. Every action connects to drive revenue and reduce vacancy time.</p>

      <section>
        <h2>🎯 Core Workflow: Fill Vacant Rooms (Revenue Impact: HIGH)</h2>
        <div style={{backgroundColor: '#e8f5e8', padding: '15px', border: '2px solid #27ae60', borderRadius: '5px', marginBottom: '20px'}}>
          <h3>Goal: Convert applications to paying tenants in under 7 days</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px'}}>
            <div style={{textAlign: 'center', padding: '10px'}}>
              <div style={{fontSize: '30px'}}>📋</div>
              <div><strong>1. Review Applications</strong></div>
              <div style={{fontSize: '12px', color: '#666'}}>⏱️ Time: 5 min/app</div>
              <Link href="/applications">
                <button style={{backgroundColor: '#3498db', color: 'white', margin: '5px 0'}}>
                  Go to Applications
                </button>
              </Link>
            </div>
            <div style={{textAlign: 'center', padding: '10px'}}>
              <div style={{fontSize: '30px'}}>✅</div>
              <div><strong>2. Quick Approve & Assign</strong></div>
              <div style={{fontSize: '12px', color: '#666'}}>⏱️ Time: 2 min/approval</div>
              <div style={{fontSize: '12px', color: '#27ae60'}}>💡 Use &quot;Quick Approve&quot; buttons</div>
            </div>
            <div style={{textAlign: 'center', padding: '10px'}}>
              <div style={{fontSize: '30px'}}>📱</div>
              <div><strong>3. Welcome Communication</strong></div>
              <div style={{fontSize: '12px', color: '#666'}}>⏱️ Automated</div>
              <Link href="/reminders">
                <button style={{backgroundColor: '#9b59b6', color: 'white', margin: '5px 0'}}>
                  Set Up Auto-Welcome
                </button>
              </Link>
            </div>
            <div style={{textAlign: 'center', padding: '10px'}}>
              <div style={{fontSize: '30px'}}>💰</div>
              <div><strong>4. Revenue Generated</strong></div>
              <div style={{fontSize: '12px', color: '#666'}}>📊 Track in Dashboard</div>
              <Link href="/dashboard">
                <button style={{backgroundColor: '#27ae60', color: 'white', margin: '5px 0'}}>
                  View Revenue Impact
                </button>
              </Link>
            </div>
          </div>
          <div style={{backgroundColor: '#fff', padding: '10px', marginTop: '10px', borderRadius: '3px'}}>
            <strong>💡 Pro Tip:</strong> Each day a room stays vacant costs ~$40/day in lost revenue. Fast processing = direct profit increase.
          </div>
        </div>
      </section>

      <section>
        <h2>📊 Landlord Workflow: Revenue Optimization</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Step</th>
              <th>Action</th>
              <th>Page</th>
              <th>Revenue Impact</th>
              <th>Time Required</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{backgroundColor: '#fff3cd'}}>
              <td>1</td>
              <td><strong>Check Dashboard Revenue Analytics</strong></td>
              <td><Link href="/dashboard">📊 Dashboard</Link></td>
              <td>Identify $X lost revenue/month</td>
              <td>2 minutes</td>
            </tr>
            <tr style={{backgroundColor: '#fff3cd'}}>
              <td>2</td>
              <td><strong>Download Portfolio Report</strong></td>
              <td><Link href="/properties">🏠 Properties</Link></td>
              <td>Spot underperforming properties</td>
              <td>1 minute</td>
            </tr>
            <tr style={{backgroundColor: '#e8f5e8'}}>
              <td>3</td>
              <td><strong>Focus on properties &lt;90% occupancy</strong></td>
              <td><Link href="/properties">🏠 Properties</Link></td>
              <td>Target highest revenue gaps first</td>
              <td>5 minutes</td>
            </tr>
            <tr style={{backgroundColor: '#e8f5e8'}}>
              <td>4</td>
              <td><strong>Check pending applications for vacant rooms</strong></td>
              <td><Link href="/applications">📋 Applications</Link></td>
              <td>Can fill X rooms immediately</td>
              <td>3 minutes</td>
            </tr>
            <tr style={{backgroundColor: '#e8f5e8'}}>
              <td>5</td>
              <td><strong>Approve applications quickly</strong></td>
              <td><Link href="/applications">📋 Applications</Link></td>
              <td>+$Y/month per approval</td>
              <td>10 minutes</td>
            </tr>
            <tr style={{backgroundColor: '#f0f8ff'}}>
              <td>6</td>
              <td><strong>Monitor lease renewals</strong></td>
              <td><Link href="/leases">📄 Leases</Link></td>
              <td>Prevent future vacancy</td>
              <td>5 minutes</td>
            </tr>
          </tbody>
        </table>
        <div style={{backgroundColor: '#f8f9fa', padding: '10px', marginTop: '10px'}}>
          <strong>📈 Expected Outcome:</strong> 10-15% revenue increase within 30 days through faster room filling and better occupancy management.
        </div>
      </section>

      <section>
        <h2>⚙️ Manager Workflow: Daily Operations</h2>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
          
          <div style={{border: '1px solid #ccc', padding: '15px', borderRadius: '5px'}}>
            <h3>🌅 Morning Routine (15 minutes)</h3>
            <ol>
              <li><Link href="/dashboard">📊 Check Dashboard</Link> - See urgent priorities</li>
              <li><Link href="/applications">📋 Review New Applications</Link> - Process overnight applications</li>
              <li><Link href="/reminders">📱 Send Daily Reminders</Link> - Rent due, maintenance, etc.</li>
              <li><Link href="/inventory">🔧 Check Maintenance Issues</Link> - Address urgent items</li>
            </ol>
            <div style={{backgroundColor: '#e8f5e8', padding: '8px', borderRadius: '3px', marginTop: '10px'}}>
              <strong>Goal:</strong> Clear all urgent items before 10 AM
            </div>
          </div>

          <div style={{border: '1px solid #ccc', padding: '15px', borderRadius: '5px'}}>
            <h3>🌆 Evening Routine (10 minutes)</h3>
            <ol>
              <li><Link href="/tenants">👥 Update Tenant Info</Link> - Log any conversations</li>
              <li><Link href="/reminders">📱 Schedule Tomorrow&apos;s Communications</Link></li>
              <li><Link href="/properties">📊 Download Daily Reports</Link> - For landlord updates</li>
              <li><Link href="/leases">📄 Check Upcoming Expirations</Link></li>
            </ol>
            <div style={{backgroundColor: '#fff3cd', padding: '8px', borderRadius: '3px', marginTop: '10px'}}>
              <strong>Goal:</strong> Set up next day for success
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>📱 Communication Workflow: Multi-Channel Strategy</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Best Channel</th>
              <th>Response Time</th>
              <th>Success Rate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Rent Due Reminder</strong></td>
              <td>WhatsApp + Email</td>
              <td>2-6 hours</td>
              <td>89%</td>
              <td><Link href="/reminders">📱 Send via Communication Hub</Link></td>
            </tr>
            <tr>
              <td><strong>Urgent Maintenance</strong></td>
              <td>WhatsApp Group + SMS</td>
              <td>5-15 minutes</td>
              <td>95%</td>
              <td><Link href="/reminders">🚨 Send Emergency Alert</Link></td>
            </tr>
            <tr>
              <td><strong>Lease Renewal</strong></td>
              <td>Email + Personal WhatsApp</td>
              <td>1-2 days</td>
              <td>67%</td>
              <td><Link href="/leases">📄 Download & Send Renewal Notice</Link></td>
            </tr>
            <tr>
              <td><strong>Welcome New Tenant</strong></td>
              <td>WhatsApp Group + Email</td>
              <td>Immediate</td>
              <td>100%</td>
              <td><Link href="/reminders">🤖 Automated Welcome Sequence</Link></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>🛒 Inventory & Purchasing Workflow</h2>
        <div style={{backgroundColor: '#fff8dc', padding: '15px', border: '1px solid #daa520', borderRadius: '5px'}}>
          <h3>Smart Purchasing Process</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px'}}>
            <div>
              <h4>1. Identify Need</h4>
              <ul>
                <li><Link href="/inventory">📦 Check Inventory Status</Link></li>
                <li>Items marked &quot;poor condition&quot;</li>
                <li>Tenant maintenance requests</li>
                <li>New room setup needs</li>
              </ul>
            </div>
            <div>
              <h4>2. Quick Purchase</h4>
              <ul>
                <li>🛒 Click Amazon links in inventory</li>
                <li>Use bulk purchase planning</li>
                <li>Check warranty dates first</li>
                <li>Consider tenant preferences</li>
              </ul>
            </div>
            <div>
              <h4>3. Track & Report</h4>
              <ul>
                <li><Link href="/inventory">📊 Download Purchase Report</Link></li>
                <li>Update inventory status</li>
                <li>Schedule delivery coordination</li>
                <li>Tax deduction documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>📊 Data & Reports Workflow</h2>
        <div style={{backgroundColor: '#f0f8ff', padding: '15px', border: '1px solid #4682b4', borderRadius: '5px'}}>
          <h3>Download Everything for Spreadsheet Analysis</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div>
              <h4>💰 Financial Reports</h4>
              <ul>
                <li><Link href="/dashboard">📊 Portfolio Revenue Report</Link></li>
                <li><Link href="/properties">🏠 Property Analytics Report</Link></li>
                <li><Link href="/properties">📉 Vacancy Report</Link></li>
                <li><Link href="/leases">📄 Lease Revenue Report</Link></li>
              </ul>
            </div>
            <div>
              <h4>📋 Operational Reports</h4>
              <ul>
                <li><Link href="/applications">📋 Applications Pipeline Report</Link></li>
                <li><Link href="/tenants">👥 Tenant Contact List</Link></li>
                <li><Link href="/inventory">📦 Inventory & Maintenance Report</Link></li>
                <li><Link href="/reminders">📱 Communication Log</Link></li>
              </ul>
            </div>
          </div>
          <div style={{backgroundColor: '#fff', padding: '10px', marginTop: '10px', borderRadius: '3px'}}>
            <strong>💡 Use Case:</strong> Import CSVs into Excel/Google Sheets for custom analysis, tax reporting, or sharing with accountants/investors.
          </div>
        </div>
      </section>

      <section>
        <h2>🚨 Emergency Workflows</h2>
        <table border={1}>
          <thead>
            <tr>
              <th>Emergency Type</th>
              <th>Immediate Action</th>
              <th>Communication</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{backgroundColor: '#ffebee'}}>
              <td><strong>🚰 Water/Gas Leak</strong></td>
              <td>1. Shut off main valve<br/>2. Call emergency services</td>
              <td><Link href="/reminders">📱 SMS ALL tenants immediately</Link></td>
              <td><Link href="/inventory">🔧 Schedule repairs via Amazon/contractors</Link></td>
            </tr>
            <tr style={{backgroundColor: '#fff3cd'}}>
              <td><strong>🔌 Power Outage</strong></td>
              <td>1. Check breakers<br/>2. Call utility company</td>
              <td><Link href="/reminders">📢 WhatsApp Group updates</Link></td>
              <td><Link href="/reminders">📧 Email detailed timeline</Link></td>
            </tr>
            <tr style={{backgroundColor: '#e8f5e8'}}>
              <td><strong>📶 Internet Down</strong></td>
              <td>1. Restart router<br/>2. Call ISP</td>
              <td><Link href="/reminders">📱 WhatsApp: &quot;Working on internet fix&quot;</Link></td>
              <td><Link href="/inventory">📦 Order backup equipment if needed</Link></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>🎯 Success Metrics: Track Your Progress</h2>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
          <div style={{border: '1px solid #27ae60', padding: '15px', borderRadius: '5px'}}>
            <h3 style={{color: '#27ae60'}}>💰 Revenue Metrics</h3>
            <ul>
              <li>Occupancy rate: Target 95%+</li>
              <li>Time to fill vacant rooms: &lt;7 days</li>
              <li>Lease renewal rate: 80%+</li>
              <li>Revenue per room: Track monthly</li>
            </ul>
            <Link href="/dashboard">
              <button style={{backgroundColor: '#27ae60', color: 'white'}}>View Revenue Dashboard</button>
            </Link>
          </div>
          
          <div style={{border: '1px solid #3498db', padding: '15px', borderRadius: '5px'}}>
            <h3 style={{color: '#3498db'}}>⚙️ Operational Metrics</h3>
            <ul>
              <li>Application processing time: &lt;24 hours</li>
              <li>Maintenance response time: &lt;2 hours</li>
              <li>Communication response rate: 85%+</li>
              <li>Tenant satisfaction: Monthly surveys</li>
            </ul>
            <Link href="/applications">
              <button style={{backgroundColor: '#3498db', color: 'white'}}>Check Operations</button>
            </Link>
          </div>
          
          <div style={{border: '1px solid #9b59b6', padding: '15px', borderRadius: '5px'}}>
            <h3 style={{color: '#9b59b6'}}>📱 Communication Metrics</h3>
            <ul>
              <li>Message response rate: Track by channel</li>
              <li>Rent reminder effectiveness: 95%+</li>
              <li>Emergency response time: &lt;5 minutes</li>
              <li>WhatsApp group engagement: Active</li>
            </ul>
            <Link href="/reminders">
              <button style={{backgroundColor: '#9b59b6', color: 'white'}}>View Communication Hub</button>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2>💡 Pro Tips for Maximum Efficiency</h2>
        <div style={{backgroundColor: '#f8f9fa', padding: '15px', border: '1px solid #ddd', borderRadius: '5px'}}>
          <h3>🔥 Game-Changing Shortcuts</h3>
          <ul>
            <li><strong>Green rows = money opportunity</strong> - In applications, green means you can approve and fill rooms immediately</li>
            <li><strong>Download everything</strong> - CSVs are perfect for landlord reports, tax prep, and investor updates</li>
            <li><strong>Amazon one-click</strong> - Inventory links take you straight to replacements, no searching</li>
            <li><strong>WhatsApp groups per property</strong> - Much faster than individual messages for announcements</li>
            <li><strong>Automate rent reminders</strong> - Set it once, never worry about late payments again</li>
            <li><strong>Focus on vacancy first</strong> - Every empty room costs $40+/day, prioritize filling them</li>
            <li><strong>Quick approval workflow</strong> - Don&apos;t overthink applications when rooms are available</li>
            <li><strong>Mobile-first communication</strong> - WhatsApp gets faster responses than email</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default withAuth(WorkflowGuide, ['admin', 'owner', 'manager']); 