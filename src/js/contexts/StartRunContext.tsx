import { createContext, useContext } from 'react';

// Any page can open the "Start a run" dialog, which App renders.
export interface StartRunPreset { stateCode?: string; normalizeCaptureId?: number }

const StartRunContext = createContext<(preset: StartRunPreset) => void>(() => {});

export const useStartRun = () => useContext(StartRunContext);

export default StartRunContext;
