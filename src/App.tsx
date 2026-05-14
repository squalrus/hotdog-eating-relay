import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Timer from './pages/Timer'
import Scoreboard from './pages/Scoreboard'
import Roster from './pages/Roster'
import EventSetup from './pages/EventSetup'
import TeamManager from './pages/TeamManager'
import Results from './pages/Results'
import Prizes from './pages/Prizes'
import History from './pages/History'
import EventDetail from './pages/EventDetail'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="scoreboard" element={<Scoreboard />} />
            <Route path="timer" element={<Timer />} />
            <Route path="roster" element={<Roster />} />
            <Route path="event" element={<EventSetup />} />
            <Route path="teams" element={<TeamManager />} />
            <Route path="results" element={<Results />} />
            <Route path="prizes" element={<Prizes />} />
            <Route path="history" element={<History />} />
            <Route path="history/:slug" element={<EventDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
