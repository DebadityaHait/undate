import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import Navbar from './components/Navbar';
import { Landing, Profiles } from './pages/Core';
import ProfileDetail from './pages/ProfileDetail';
import Arena from './pages/Arena';
import Rankings from './pages/Rankings';
import AddPerson from './pages/AddPerson';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:id" element={<ProfileDetail />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/add" element={<AddPerson />} />
        </Routes>
        <div className="wrap"><footer>undate — agentic dating harness · Each agent reads only LinkedIn + public Instagram · Demo: 25 real people, {25*24/2} dates · Built for the 3-hour test. <br/>Scrape: Microlink (no key) + AllOrigins proxy + OG parse. Analysis + dating run fully client-side so the live site works with no keys.</footer></div>
      </BrowserRouter>
    </StoreProvider>
  );
}
