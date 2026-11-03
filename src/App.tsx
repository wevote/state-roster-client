import { Box } from '@mui/material';
import { lazy, Suspense, useState } from 'react';
import { Route, Routes } from 'react-router';
import LoadingWheel from './js/common/components/Widgets/LoadingWheel';
import { renderLog } from './js/common/utils/logging';
import Header from './js/components/Navigation/Header';
import StartRunDialog from './js/components/StartRun/StartRunDialog';
import StartRunContext, { type StartRunPreset } from './js/contexts/StartRunContext';

// Each page loads when it is first visited, as in weconnect-client.
const Activity = lazy(() => import('./js/pages/Activity'));
const CapturePage = lazy(() => import('./js/pages/CapturePage'));
const ElectionPage = lazy(() => import('./js/pages/ElectionPage'));
const Overview = lazy(() => import('./js/pages/Overview'));
const RunPage = lazy(() => import('./js/pages/RunPage'));
const StatePage = lazy(() => import('./js/pages/StatePage'));

function App () {
  renderLog('App');
  const [preset, setPreset] = useState<StartRunPreset | null>(null);

  return (
    <StartRunContext.Provider value={setPreset}>
      <Header />
      <Box component="main" sx={{ maxWidth: 1480, mx: 'auto', px: { xs: 2, md: 4 }, py: 4, bgcolor: 'background.paper', minHeight: 'calc(100vh - 72px)' }}>
        <Suspense fallback={LoadingWheel}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/retrieves/:id" element={<CapturePage />} />
            <Route path="/runs/:id" element={<RunPage />} />
            <Route path="/states/:code" element={<StatePage />} />
            <Route path="/states/:code/elections/:key" element={<ElectionPage />} />
          </Routes>
        </Suspense>
      </Box>
      {preset && <StartRunDialog preset={preset} onClose={() => setPreset(null)} />}
    </StartRunContext.Provider>
  );
}

export default App;
