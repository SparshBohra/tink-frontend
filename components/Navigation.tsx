import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/properties">Properties</Link></li>
        <li><Link href="/tenants">Tenants</Link></li>
        <li><Link href="/applications">Applications</Link></li>
        <li><Link href="/leases">Leases</Link></li>
        <li><Link href="/inventory">Inventory</Link></li>
        <li><Link href="/reminders">Reminders</Link></li>
        <li><Link href="/login">Logout</Link></li>
      </ul>
      <hr />
    </nav>
  );
} 