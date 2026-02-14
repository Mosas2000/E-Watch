import { WalletConnect } from './components/WalletConnect';
import { EventRegistration } from './components/EventRegistration';
import { EventDashboard } from './components/EventDashboard';
import { AppProvider } from './contexts/AppContext';
import SEO from './components/SEO';
import './App.css';

function App() {
  return (
    <AppProvider>
      <SEO
        title="E-Watch - Blockchain Event Monitoring for Stacks"
        description="Register, query, and manage blockchain events on Stacks network. Real-time monitoring with secure wallet integration."
        keywords="blockchain, stacks, event monitoring, smart contracts, clarity, web3, dapp"
        canonical="https://ewatch.io/"
      />
      <div className="container">
        <header className="header" role="banner">
          <h1>E-Watch - Blockchain Event Monitoring</h1>
          <WalletConnect />
        </header>
        
        <main role="main">
          <EventRegistration />
          <EventDashboard />
        </main>
        
        <footer className="footer" role="contentinfo">
          <p>&copy; 2026 E-Watch. Blockchain event monitoring on Stacks network.</p>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
