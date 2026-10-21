import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import './App.css';
import Game from './pages/Game'
import Main from './pages/Main'

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page (Login & Join Game triggers) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/main" element={<Main />} />

        <Route path="/418" element={<div>Im a teapot</div>} />
        <Route path="/game" element={<Game />} />
        
      </Routes>
    </Router>
  )
}

export default App