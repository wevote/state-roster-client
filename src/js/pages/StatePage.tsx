import { Box, Button, Card, CardActionArea, Paper, Stack, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { Link as RouterLink, useParams } from 'react-router';
import { renderLog } from '../common/utils/logging';
import numberWithCommas from '../common/utils/numberWithCommas';
import PassTable from '../components/State/PassTable';
import Empty from '../components/Widgets/Empty';
import ErrorText from '../components/Widgets/ErrorText';
import Facts from '../components/Widgets/Facts';
import PageHeader from '../components/Widgets/PageHeader';
import Pending from '../components/Widgets/Pending';
import SourceLinks from '../components/Widgets/SourceLinks';
import StatusText from '../components/Widgets/StatusText';
import To from '../components/Widgets/To';
import webAppConfig from '../config';
import { useStartRun } from '../contexts/StartRunContext';
import type { StateDetail } from '../react-query/apiTypes';
import { useApi } from '../react-query/RosterQuery';
import { electionKey, electionsFrom, runType } from '../utils/runUtils';
import { ago, bytes, duration, minuteOf } from '../utils/timeAndSizeFormat';

export default function StatePage () {
  renderLog('StatePage');
  const { code = '' } = useParams();
  const startRun = useStartRun();
  const state = useApi<StateDetail>(`/states/${code}`, 5000);
  if (!state.data) return <Pending query={state} />;

  const { name, captures, passes, runs, sources, gaps, nextRun } = state.data;
  const latest = captures[0];
  const elections = electionsFrom(runs);
  // Passes stored before captures existed have no capture to sit under.
  const orphans = passes.filter((p) => p.captureId === null);

  return (
    <>
      <Helmet><title>{`${name} - ${webAppConfig.NAME_FOR_BROWSER_TAB_TITLE}`}</title></Helmet>
      <PageHeader crumbs={[['National – US States', '/']]}
title={name}
        actions={<Button variant="contained" size="large" onClick={() => startRun({ stateCode: code })}>Start a run</Button>}
      />

      <Paper variant="outlined" sx={{ p: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 3 }}>
        <Box sx={{ minWidth: 0 }}><Typography variant="h3" sx={{ mb: 1 }}>Overview URLs</Typography><SourceLinks sources={sources} kind="overview" /></Box>
        <Box sx={{ minWidth: 0 }}><Typography variant="h3" sx={{ mb: 1 }}>Roster URLs</Typography><SourceLinks sources={sources} kind="roster" /></Box>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>Latest Retrieve</Typography>
          {latest ? <StatusText status={latest.status}>{ago(latest.startedAt)}</StatusText> : <Typography color="text.secondary">Never retrieved</Typography>}
          {nextRun?.after && <Typography color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }} title={nextRun.reason ?? undefined}>Check again after {nextRun.after}</Typography>}
        </Box>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>Gaps in the latest good run</Typography>
          {gaps.length === 0 ? <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>None reported</Typography> :
            gaps.map((g) => <Typography key={g} color="error" sx={{ fontSize: '0.85rem' }}>{g}</Typography>)}
        </Box>
      </Paper>

      <Typography variant="h2">Elections</Typography>
      {elections.length === 0 && <Empty>No runs stored for {name} yet.</Empty>}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
        {elections.map((e) => (
          <Card key={e.key} variant="outlined">
            <CardActionArea component={RouterLink} to={`/states/${code}/elections/${electionKey(e.latest)}`} sx={{ p: 2, height: '100%', alignItems: 'flex-start' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: 'primary.main' }}>{e.latest.electionDate} {e.latest.electionType}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1.5 }}>{e.latest.electionName}</Typography>
              <Facts items={[
                ['Candidates', numberWithCommas(e.latest.candidateCount)],
                ['Measures', numberWithCommas(e.latest.measureCount)],
                ['County ballots', numberWithCommas(e.latest.countyBallotCount)],
              ]}
              />
              <Typography color="text.secondary" sx={{ fontSize: '0.8rem', mt: 1.5 }}>
                {e.runs.length} {e.runs.length === 1 ? 'run' : 'runs'}, latest is run {e.latest.runId}{e.latest.isPending && ', pending at the source'}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Typography variant="h2">Retrieves and what was built from them</Typography>
      {captures.length === 0 && <Empty>Nothing retrieved yet.</Empty>}
      <Stack spacing={2}>
        {captures.map((c) => (
          <Paper key={c.captureId} variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
              <To to={`/retrieves/${c.captureId}`} sx={{ fontSize: '1.6rem', fontWeight: 500, color: 'secondary.main' }}>Retrieve {c.captureId}</To>
              <StatusText status={c.status} />
              <Box sx={{ flex: 1 }} />
              {c.status === 'succeeded' && (c.filesPresent ?
                <Button variant="contained" onClick={() => startRun({ stateCode: code, normalizeCaptureId: c.captureId })}>Normalize</Button> :
                <StatusText status="pruned" />)}
            </Stack>
            <Facts items={[
              ['Logical Date', c.startedAt.slice(0, 10)],
              ['Run Type', runType(c.source)],
              ['Start Date', minuteOf(c.startedAt)],
              ['End Date', c.finishedAt ? minuteOf(c.finishedAt) : 'running'],
              ['Duration', duration(c.startedAt, c.finishedAt)],
              ['Fetched', `${c.fetchCount} requests, ${bytes(c.rawBytes)}`],
              ['Requested by', c.requestedBy],
            ]}
            />
            <ErrorText text={c.errorText} />
            <PassTable passes={passes.filter((p) => p.captureId === c.captureId)} runs={runs} retrievedOnly={c.status === 'succeeded'} />
          </Paper>
        ))}
        {orphans.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h3">Normalizations with no retrieve on record</Typography>
            <PassTable passes={orphans} runs={runs} retrievedOnly={false} />
          </Paper>
        )}
      </Stack>
    </>
  );
}
