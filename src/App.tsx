import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import Navbar from './components/Navbar';
import { Landing, Profiles } from './pages/Core';
import ProfileDetail from './pages/ProfileDetail';
import Arena from './pages/Arena';
import Rankings from './pages/Rankings';
import AddPerson from './pages/AddPerson';
import Tour from './pages/Tour';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:id" element={<ProfileDetail />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/add" element={<AddPerson />} />
        </Routes>
        <div className="wrap"><footer>un date — no swipes. Each agent reads only a LinkedIn and a public Instagram, dates every other agent, and ranks who fits best.<br />Scrape: Microlink (no key) → AllOrigins proxy → paste fallback. Deterministic by default; your own AI key optionally voices it.</footer></div>
      </BrowserRouter>
    </StoreProvider>
  );
}
