import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, IconButton, InputAdornment, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import Sync from '@mui/icons-material/Sync';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { renderLog } from '../common/utils/logging';
import StateRow from '../components/State/StateRow';
import PageHeader from '../components/Widgets/PageHeader';
import Pending from '../components/Widgets/Pending';
import StatusText from '../components/Widgets/StatusText';
import To from '../components/Widgets/To';
import webAppConfig from '../config';
import { useStartRun } from '../contexts/StartRunContext';
import type { JobsData, StateSummary } from '../react-query/apiTypes';
import { useApi } from '../react-query/RosterQuery';
import { isActive, kindLabel } from '../utils/runUtils';
import { duration } from '../utils/timeAndSizeFormat';

export default function Overview () {
  renderLog('Overview');
  const startRun = useStartRun();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const states = useApi<StateSummary[]>('/states', 5000);
  const active = (useApi<JobsData>('/jobs', 2000).data?.jobs ?? []).filter(isActive).reverse();

  const needle = search.trim().toLowerCase();
  const shown = [...(states.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)).filter((s) => needle === '' || s.name.toLowerCase().includes(needle) || s.code.toLowerCase() === needle);
  const implemented = shown.filter((s) => s.implemented);
  const unimplemented = shown.filter((s) => !s.implemented);

  return (
    <>
      <Helmet><title>{webAppConfig.NAME_FOR_BROWSER_TAB_TITLE}</title></Helmet>
      <PageHeader
        title="National – US States"
        actions={(
          <Tooltip title="Refresh">
            <IconButton onClick={() => queryClient.invalidateQueries()} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, width: 52, height: 52 }}>
              <Sync sx={{ fontSize: 30 }} />
            </IconButton>
          </Tooltip>
        )}
      />

      <TextField
        placeholder="Filtering by State"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 640, maxWidth: '100%', mb: 2.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>, sx: { fontStyle: search ? 'normal' : 'italic' } } }}
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="outlined" size="large" onClick={() => startRun({})}>Start a run</Button>
      </Stack>

      {active.length > 0 && (
        <Alert severity="info" icon={false} sx={{ mb: 2 }}>
          {active.map((j) => (
            <Box key={j.jobId} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <StatusText status={j.status} />
              <To to={`/states/${j.stateCode}`}><b>{j.stateCode}</b></To> {kindLabel[j.kind].toLowerCase()}
              {j.normalizeCaptureId && ` retrieve ${j.normalizeCaptureId}`}
              {j.status === 'running' && <Typography component="span" color="text.secondary">, {duration(j.startedAt, null)} so far</Typography>}
            </Box>
          ))}
        </Alert>
      )}

      {!states.data ? <Pending query={states} /> : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>State</TableCell>
                <TableCell>Overview URLs</TableCell>
                <TableCell>Roster URLs</TableCell>
                <TableCell>Latest Retrieve</TableCell>
                <TableCell>Elections</TableCell>
                <TableCell>Recent Executions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {implemented.map((s) => <StateRow key={s.code} state={s} onStart={() => startRun({ stateCode: s.code })} />)}
            </TableBody>
          </Table>
          {shown.length === 0 && <Typography color="text.secondary" sx={{ py: 2 }}>No state matches “{search}”.</Typography>}
          {unimplemented.length > 0 && (
            <Accordion variant="outlined" disableGutters sx={{ mt: 4, '&::before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h3">{unimplemented.length} {unimplemented.length === 1 ? 'state' : 'states'} with no collector yet</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>{unimplemented.map((s) => s.name).join(', ')}</Typography>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </>
  );
}
