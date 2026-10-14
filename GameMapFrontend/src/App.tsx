import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Main from './pages/Main';
import './App.css';
import Profile from './pages/Profile';
import BattleMapTestPage from './pages/BattleMapTestPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page (Login & Join Game triggers) */}
        <Route path="/" element={<LandingPage />} />

        {/* Main Game Board Page */}
        <Route path="/game" element={<Main />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/418" element={<div>Im a teapot</div>} />
        <Route path="/test/battlemap" element={<BattleMapTestPage />} />
      </Routes>
    </Router>
  )
}

export default App