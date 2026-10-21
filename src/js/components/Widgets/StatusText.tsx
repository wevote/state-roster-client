import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOff from '@mui/icons-material/HighlightOff';
import PauseCircleOutline from '@mui/icons-material/PauseCircleOutlineOutlined';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Schedule from '@mui/icons-material/Schedule';
import { type ReactNode } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { Status } from '../../react-query/apiTypes';

export type Shown = Status | 'pending' | 'pruned';

const STATUS: Record<Shown, { label: string; color: string; icon: ReactNode }> = {
  succeeded: { label: 'Success', color: 'success.main', icon: <CheckCircleOutline fontSize="inherit" /> },
  failed: { label: 'Failed', color: 'error.main', icon: <HighlightOff fontSize="inherit" /> },
  running: { label: 'Running', color: 'info.main', icon: <CircularProgress size="0.9em" color="inherit" thickness={6} /> },
  queued: { label: 'Queued', color: 'warning.main', icon: <Schedule fontSize="inherit" /> },
  pending: { label: 'Pending at source', color: 'warning.main', icon: <PauseCircleOutline fontSize="inherit" /> },
  pruned: { label: 'Payloads pruned', color: 'text.secondary', icon: <RadioButtonUnchecked fontSize="inherit" /> },
};

/** A status the way the wireframe draws it: an icon and a bold coloured word, with an optional line under it. */
export default function StatusText ({ status, children }: { status: Shown; children?: ReactNode }) {
  renderLog('StatusText');
  const s = STATUS[status];
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', display: 'inline-flex', verticalAlign: 'top' }}>
      <Box sx={{ color: s.color, fontSize: '1.15rem', lineHeight: 1, mt: '1px', display: 'flex' }}>{s.icon}</Box>
      <Box sx={{ fontSize: '0.8rem', lineHeight: 1.25 }}>
        <Typography component="span" sx={{ color: s.color, fontWeight: 600, fontSize: '0.8rem' }}>{s.label}</Typography>
        {children && <Typography component="div" sx={{ fontSize: '0.8rem' }}>{children}</Typography>}
      </Box>
    </Stack>
  );
}
