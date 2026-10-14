import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Main from './pages/Main';
import './App.css';
import Maps from './pages/Maps';
import Profile from './pages/Profile';
import Character from './pages/Character';
import BattleMapTestPage from './pages/BattleMapTestPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page (Login & Join Game triggers) */}
        <Route path="/" element={<LandingPage />} />

        {/* Main Game Board Page */}
        <Route path="/game" element={<Main />} />

        <Route path="/Map" element={<Maps />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/Character" element={<Character />} />

        <Route path="/418" element={<div>Im a teapot</div>} />
        <Route path="/test/battlemap" element={<BattleMapTestPage />} />
      </Routes>
    </Router>
  )
}

export default App