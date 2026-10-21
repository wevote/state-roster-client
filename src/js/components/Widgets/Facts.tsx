import { Box, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { renderLog } from '../../common/utils/logging';

/** Label-over-value pairs in a row, as the workflow wireframe lays out a run's facts. */
export default function Facts ({ items }: { items: [string, ReactNode][] }) {
  renderLog('Facts');
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', columnGap: 5, rowGap: 1.5 }}>
      {items.map(([label, value]) => (
        <Box key={label} sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 500, fontSize: '0.75rem' }}>{label}</Typography>
          <Typography component="div" sx={{ fontSize: '0.85rem', overflowWrap: 'anywhere' }}>{value}</Typography>
        </Box>
      ))}
    </Stack>
  );
}
