import { WalletConnect } from './components/WalletConnect';
import { EventRegistration } from './components/EventRegistration';
import { EventDashboard } from './components/EventDashboard';
import { AppProvider } from './contexts/AppContext';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="container">
        <header className="header">
          <h1>E-Watch</h1>
          <WalletConnect />
        </header>
        
        <main>
          <EventRegistration />
          <EventDashboard />
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
