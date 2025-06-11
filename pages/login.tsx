import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (selectedRole: 'landlord' | 'manager') => {
    console.log('Login attempt:', { email, password, role: selectedRole });
    // Store role in localStorage for role-based dashboard
    localStorage.setItem('userRole', selectedRole);
    router.push('/dashboard');
  };

  return (
    <div>
      <h1>Tink Property Management - Login</h1>
      <p>Sign in to manage your co-living properties</p>
      
      <form>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>
      </form>

      <h2>Login As:</h2>
      <button onClick={() => handleLogin('landlord')}>
        Login as Landlord
      </button>
      {' '}
      <button onClick={() => handleLogin('manager')}>
        Login as Manager
      </button>

      <hr />
      <p><em>Demo: Use any email/password. Role determines what you see on dashboard.</em></p>
    </div>
  );
} 