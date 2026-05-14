import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './data/store';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CRMPipeline = lazy(() => import('./pages/CRMPipeline'));
const Leads = lazy(() => import('./pages/Leads'));
const Clients = lazy(() => import('./pages/Clients'));
const Laboratory = lazy(() => import('./pages/Laboratory'));
const Projects = lazy(() => import('./pages/Projects'));
const Proposals = lazy(() => import('./pages/Proposals'));
const Financial = lazy(() => import('./pages/Financial'));
const Reports = lazy(() => import('./pages/Reports'));
const WhatsAppPage = lazy(() => import('./pages/WhatsApp'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Team = lazy(() => import('./pages/Team'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Settings = lazy(() => import('./pages/Settings'));
const CEOMode = lazy(() => import('./pages/CEOMode'));
const ClientOnboarding = lazy(() => import('./pages/ClientOnboarding'));
const ProjecaoFaturamento = lazy(() => import('./pages/ProjecaoFaturamento'));
const DiagnosticoEstrategico = lazy(() => import('./pages/DiagnosticoEstrategico'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Services = lazy(() => import('./pages/Services'));
const ChatPage = lazy(() => import('./pages/Chat'));
const ResultProjections = lazy(() => import('./pages/ResultProjections'));
const PropostaPublica = lazy(() => import('./pages/PropostaPublica'));
const PropostaModularPublica = lazy(() => import('./pages/PropostaModularPublica'));
const OptimizationManagement = lazy(() => import('./pages/OptimizationManagement'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--card-border)', borderTopColor: 'var(--yellow)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando...</div>
      </div>
    </div>
  );
}

function AuthGuard() {
  const { auth, loadingData } = useApp();

  if (loadingData) return <PageLoader />;
  if (!auth) return <Login />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crm" element={<CRMPipeline />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/laboratorio" element={<Laboratory />} />
            <Route path="/servicos" element={<Services />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/propostas" element={<Proposals />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/whatsapp" element={<WhatsAppPage />} />
            <Route path="/campanhas" element={<Campaigns />} />
            <Route path="/agenda" element={<CalendarPage />} />
            <Route path="/equipe" element={<Team />} />
            <Route path="/ia" element={<AIAssistant />} />
            <Route path="/integracoes" element={<Integrations />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/ceo" element={<CEOMode />} />
            <Route path="/onboarding" element={<ClientOnboarding />} />
            <Route path="/projecao" element={<ProjecaoFaturamento />} />
            <Route path="/diagnostico" element={<DiagnosticoEstrategico />} />
            <Route path="/alertas" element={<Alerts />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/resultado-projecoes" element={<ResultProjections />} />
            <Route path="/otimizacoes" element={<OptimizationManagement />} />
          </Routes>
        </Suspense>
      </main>
      <ToastContainer />
    </div>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  const GOOGLE_CLIENT_ID = '302053902292-k5e9bpkbau4qog47ui8483psh09oop5m.apps.googleusercontent.com';

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '2117661839175842',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/pt_BR/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppProvider>
        <Routes>
          <Route path="/proposta/:id" element={<Suspense fallback={<PageLoader />}><PropostaPublica /></Suspense>} />
          <Route path="/proposta-modular/:id" element={<Suspense fallback={<PageLoader />}><PropostaModularPublica /></Suspense>} />
          <Route path="*" element={<AuthGuard />} />
        </Routes>
      </AppProvider>
    </GoogleOAuthProvider>
  );
}
