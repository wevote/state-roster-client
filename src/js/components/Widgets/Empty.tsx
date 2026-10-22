import { Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { renderLog } from '../../common/utils/logging';

export default function Empty ({ children }: { children: ReactNode }) {
  renderLog('Empty');
  return <Typography color="text.secondary" sx={{ py: 1.5 }}>{children}</Typography>;
}
