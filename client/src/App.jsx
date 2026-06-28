import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import Landing           from './pages/Landing';
import GetStarted        from './pages/GetStarted';
import Login             from './pages/Login';
import Register          from './pages/Register';

import PublisherDashboard  from './pages/publisher/Dashboard';
import Sites               from './pages/publisher/Sites';
import Slots               from './pages/publisher/Slots';
import Earnings            from './pages/publisher/Earnings';
import Withdraw            from './pages/publisher/Withdraw';

import AdvertiserDashboard from './pages/advertiser/Dashboard';
import Campaigns           from './pages/advertiser/Campaigns';
import CreateCampaign      from './pages/advertiser/CreateCampaign';
import FundWallet          from './pages/advertiser/FundWallet';
import Analytics           from './pages/advertiser/Analytics';

import AdminDashboard      from './pages/admin/Dashboard';
import AdminUsers          from './pages/admin/Users';
import AdminCampaigns      from './pages/admin/Campaigns';
import AdminSites          from './pages/admin/Sites';
import AdminCreatives      from './pages/admin/Creatives';
import AdminPayouts        from './pages/admin/Payouts';
import AdminSettings       from './pages/admin/Settings';

const Pub  = ({ children }) => <ProtectedRoute role="publisher">{children}</ProtectedRoute>;
const Adv  = ({ children }) => <ProtectedRoute role="advertiser">{children}</ProtectedRoute>;
const Adm  = ({ children }) => <ProtectedRoute role="admin">{children}</ProtectedRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toast />
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Landing />} />
          <Route path="/get-started"   element={<GetStarted />} />
          <Route path="/advertiser/login"    element={<Login    role="advertiser" />} />
          <Route path="/advertiser/register" element={<Register role="advertiser" />} />
          <Route path="/publisher/login"     element={<Login    role="publisher"  />} />
          <Route path="/publisher/register"  element={<Register role="publisher"  />} />

          {/* Publisher */}
          <Route path="/publisher"           element={<Pub><PublisherDashboard /></Pub>} />
          <Route path="/publisher/sites"     element={<Pub><Sites /></Pub>} />
          <Route path="/publisher/slots"     element={<Pub><Slots /></Pub>} />
          <Route path="/publisher/earnings"  element={<Pub><Earnings /></Pub>} />
          <Route path="/publisher/withdraw"  element={<Pub><Withdraw /></Pub>} />

          {/* Advertiser */}
          <Route path="/advertiser"                               element={<Adv><AdvertiserDashboard /></Adv>} />
          <Route path="/advertiser/campaigns"                     element={<Adv><Campaigns /></Adv>} />
          <Route path="/advertiser/campaigns/new"                 element={<Adv><CreateCampaign /></Adv>} />
          <Route path="/advertiser/campaigns/:id/analytics"       element={<Adv><Analytics /></Adv>} />
          <Route path="/advertiser/wallet"                        element={<Adv><FundWallet /></Adv>} />

          {/* Admin */}
          <Route path="/admin"            element={<Adm><AdminDashboard /></Adm>} />
          <Route path="/admin/users"      element={<Adm><AdminUsers /></Adm>} />
          <Route path="/admin/campaigns"  element={<Adm><AdminCampaigns /></Adm>} />
          <Route path="/admin/sites"      element={<Adm><AdminSites /></Adm>} />
          <Route path="/admin/creatives"  element={<Adm><AdminCreatives /></Adm>} />
          <Route path="/admin/payouts"    element={<Adm><AdminPayouts /></Adm>} />
          <Route path="/admin/settings"   element={<Adm><AdminSettings /></Adm>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
