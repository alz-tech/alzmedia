import Navbar from './Navbar';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
