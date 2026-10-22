import { Box, Tooltip } from '@mui/material';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOff from '@mui/icons-material/HighlightOff';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Schedule from '@mui/icons-material/Schedule';
import { type ReactNode } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { Status } from '../../react-query/apiTypes';

const STAGE: Record<Status | 'never', { color: string; icon: ReactNode }> = {
  succeeded: { color: 'success.main', icon: <CheckCircleOutline fontSize="inherit" /> },
  failed: { color: 'error.main', icon: <HighlightOff fontSize="inherit" /> },
  running: { color: 'info.main', icon: <Schedule fontSize="inherit" /> },
  queued: { color: 'info.main', icon: <Schedule fontSize="inherit" /> },
  never: { color: 'text.disabled', icon: <RadioButtonUnchecked fontSize="inherit" /> },
};

/** One pipeline stage's latest outcome as a circled icon. The detail is in the tooltip. */
export default function Stage ({ label, status, detail }: { label: string; status: Status | null; detail: string }) {
  renderLog('Stage');
  const { color, icon } = STAGE[status ?? 'never'];
  return (
    <Tooltip title={<><b>{label}</b><br />{detail}</>}>
      <Box component="span" sx={{ color, fontSize: '1.45rem', display: 'inline-flex', mr: 0.25 }}>{icon}</Box>
    </Tooltip>
  );
}
