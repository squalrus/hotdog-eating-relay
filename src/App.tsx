import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Scoreboard from './pages/Scoreboard'
import Roster from './pages/Roster'
import EventSetup from './pages/EventSetup'
import TeamManager from './pages/TeamManager'
import Results from './pages/Results'
import Prizes from './pages/Prizes'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Scoreboard />} />
          <Route path="roster" element={<Roster />} />
          <Route path="event" element={<EventSetup />} />
          <Route path="teams" element={<TeamManager />} />
          <Route path="results" element={<Results />} />
          <Route path="prizes" element={<Prizes />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
