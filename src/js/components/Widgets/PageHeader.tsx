import { Box, Breadcrumbs, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { renderLog } from '../../common/utils/logging';
import To from './To';

/** Breadcrumbs, the page title and its actions. */
export default function PageHeader ({ crumbs, title, actions }: { crumbs?: [string, string][]; title: ReactNode; actions?: ReactNode }) {
  renderLog('PageHeader');
  return (
    <Box sx={{ mb: 3 }}>
      {crumbs && (
        <Breadcrumbs sx={{ mb: 1, fontSize: '0.85rem' }}>
          {crumbs.map(([label, to]) => <To key={to} to={to}>{label}</To>)}
        </Breadcrumbs>
      )}
      <Stack direction="row" useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{title}</Typography>
        {actions && <Stack direction="row" spacing={1}>{actions}</Stack>}
      </Stack>
    </Box>
  );
}
