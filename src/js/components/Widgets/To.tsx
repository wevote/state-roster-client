import { Link } from '@mui/material';
import { type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { renderLog } from '../../common/utils/logging';

/** A link inside the console. */
export default function To ({ to, children, sx }: { to: string; children: ReactNode; sx?: object }) {
  renderLog('To');
  return <Link component={RouterLink} to={to} sx={sx}>{children}</Link>;
}
