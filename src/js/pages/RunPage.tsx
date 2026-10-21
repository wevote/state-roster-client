import { Box, FormControl, Link, MenuItem, Paper, Select, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';
import { renderLog } from '../common/utils/logging';
import numberWithCommas from '../common/utils/numberWithCommas';
import RunCandidates from '../components/Run/RunCandidates';
import RunCountyBallots from '../components/Run/RunCountyBallots';
import RunMeasures from '../components/Run/RunMeasures';
import { mono } from '../components/Style/textStyles';
import CaptureLink from '../components/Widgets/CaptureLink';
import Empty from '../components/Widgets/Empty';
import Facts from '../components/Widgets/Facts';
import Log from '../components/Widgets/Log';
import PageHeader from '../components/Widgets/PageHeader';
import Pending from '../components/Widgets/Pending';
import StatusText from '../components/Widgets/StatusText';
import webAppConfig from '../config';
import type { CountyBallot, RunDetail } from '../react-query/apiTypes';
import { useApi } from '../react-query/RosterQuery';
import { electionKey, runType } from '../utils/runUtils';
import { minuteOf } from '../utils/timeAndSizeFormat';

type TabKey = 'candidates' | 'measures' | 'ballots' | 'sources' | 'log';

export default function RunPage () {
  renderLog('RunPage');
  const { id = '' } = useParams();
  const [tab, setTab] = useState<TabKey>('candidates');
  const [county, setCounty] = useState('');
  const detail = useApi<RunDetail>(`/runs/${id}`);
  const ballots = useApi<CountyBallot[]>(`/runs/${id}/county-ballots`);
  if (!detail.data) return <Pending query={detail} />;

  const { run: r, pass: p } = detail.data;
  const counties = ballots.data ?? [];

  return (
    <>
      <Helmet><title>{`Run ${r.runId}, ${r.stateCode} - ${webAppConfig.NAME_FOR_BROWSER_TAB_TITLE}`}</title></Helmet>
      <PageHeader
        crumbs={[['National – US States', '/'], [r.stateCode, `/states/${r.stateCode}`], [`${r.electionDate} ${r.electionType}`, `/states/${r.stateCode}/elections/${electionKey(r)}`]]}
        title={<>Run {r.runId} <StatusText status={r.isPending ? 'pending' : p.status} /></>}
      />

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 500, color: 'secondary.main', mb: 1.5 }}>{r.electionName}</Typography>
        <Facts items={[
          ['Election Date', r.electionDate],
          ['Election Type', r.electionType],
          ['Run Type', runType(p.source)],
          ['Date Created', minuteOf(r.createdAt)],
          ['Built By', <>pass {p.passId} of <CaptureLink id={p.captureId} /></>],
          ['Requested By', p.requestedBy],
          ['Version', p.gitSha ? p.gitSha.slice(0, 7) : 'unknown'],
          ['Pass Also Stored', `${numberWithCommas(p.countyDirectoryCount)} county offices, ${numberWithCommas(p.proposedMeasureCount)} proposed measures, ${numberWithCommas(p.unassignedRowCount)} unassigned rows`],
        ]}
        />
      </Paper>

      <Tabs value={tab} onChange={(_, value: TabKey) => setTab(value)} sx={{ mt: 3, mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable">
        <Tab value="candidates" label={`Candidates ${numberWithCommas(r.candidateCount)}`} />
        <Tab value="measures" label={`Measures ${numberWithCommas(r.measureCount)}`} />
        <Tab value="ballots" label={`County ballots ${numberWithCommas(r.countyBallotCount)}`} />
        <Tab value="sources" label={`Gaps ${p.gaps.length} and sources`} />
        <Tab value="log" label="Log" />
      </Tabs>

      {(tab === 'candidates' || tab === 'measures') && counties.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={county} displayEmpty onChange={(e) => setCounty(e.target.value)}>
              <MenuItem value="">All Counties</MenuItem>
              {counties.map((b) => <MenuItem key={b.county} value={b.county}>{b.county}</MenuItem>)}
            </Select>
          </FormControl>
          {county && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>The {county} ballot as the source published it, statewide races included.</Typography>}
        </Box>
      )}
      {tab === 'candidates' && <RunCandidates key={county} runId={r.runId} county={county} />}
      {tab === 'measures' && <RunMeasures key={county} runId={r.runId} county={county} />}
      {tab === 'ballots' && (!ballots.data ? <Pending query={ballots} /> : <RunCountyBallots ballots={counties} onPick={(c) => { setCounty(c); setTab('candidates'); }} />)}

      {tab === 'sources' && (
        <>
          <Typography variant="h3" sx={{ mb: 1 }}>Gaps</Typography>
          {p.gaps.length === 0 ? <Empty>None reported.</Empty> : p.gaps.map((g) => <Typography key={g} color="error" sx={{ fontSize: '0.9rem' }}>{g}</Typography>)}
          {p.nextRun?.after && <Typography sx={{ my: 2, fontSize: '0.9rem' }}><b>Check again after {p.nextRun.after}.</b> {p.nextRun.reason}</Typography>}
          <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>Sources</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Used for</TableCell><TableCell>URL</TableCell><TableCell>Format</TableCell><TableCell>Payload saved</TableCell></TableRow></TableHead>
            <TableBody>
              {p.sources.map((s, i) => (
                // A source URL can repeat, and the rows hold no state, so the index is a safe key.
                // eslint-disable-next-line react/no-array-index-key
                <TableRow key={i}>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{s.group.replace(/_/g, ' ')}</TableCell>
                  <TableCell sx={{ ...mono, overflowWrap: 'anywhere' }}>{s.url.startsWith('http') ? <Link href={s.url} target="_blank" rel="noreferrer">{s.url}</Link> : s.url}</TableCell>
                  <TableCell>{s.format}</TableCell>
                  <TableCell>{s.hashed ? 'Yes' : <Typography component="span" color="text.secondary">No</Typography>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {tab === 'log' && <Log text={p.logText ?? p.summary ?? 'No log stored.'} />}
    </>
  );
}
