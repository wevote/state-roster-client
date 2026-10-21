import { Box } from '@mui/material';
import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { renderLog } from './js/common/utils/logging';
import Header from './js/components/Navigation/Header';
import StartRunDialog from './js/components/StartRun/StartRunDialog';
import StartRunContext, { type StartRunPreset } from './js/contexts/StartRunContext';
import Activity from './js/pages/Activity';
import CapturePage from './js/pages/CapturePage';
import ElectionPage from './js/pages/ElectionPage';
import Overview from './js/pages/Overview';
import RunPage from './js/pages/RunPage';
import StatePage from './js/pages/StatePage';

function App () {
  renderLog('App');
  const [preset, setPreset] = useState<StartRunPreset | null>(null);

  return (
    <StartRunContext.Provider value={setPreset}>
      <Header />
      <Box component="main" sx={{ maxWidth: 1480, mx: 'auto', px: { xs: 2, md: 4 }, py: 4, bgcolor: 'background.paper', minHeight: 'calc(100vh - 72px)' }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/retrieves/:id" element={<CapturePage />} />
          <Route path="/runs/:id" element={<RunPage />} />
          <Route path="/states/:code" element={<StatePage />} />
          <Route path="/states/:code/elections/:key" element={<ElectionPage />} />
        </Routes>
      </Box>
      {preset && <StartRunDialog preset={preset} onClose={() => setPreset(null)} />}
    </StartRunContext.Provider>
  );
}

export default App;
