import { Box, Link, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutlineOutlined';
import { renderLog } from '../../common/utils/logging';
import numberWithCommas from '../../common/utils/numberWithCommas';
import type { StateSummary } from '../../react-query/apiTypes';
import { electionKey } from '../../utils/runUtils';
import { ago } from '../../utils/timeAndSizeFormat';
import SourceLinks from '../Widgets/SourceLinks';
import Stage from '../Widgets/Stage';
import StatusText from '../Widgets/StatusText';
import To from '../Widgets/To';

function nextCheck (after: string | null | undefined): string | null {
  if (!after) return null;
  const days = Math.ceil((new Date(`${after}T00:00:00Z`).getTime() - Date.now()) / 86400000);
  if (days > 1) return `${days} days until next retrieve`;
  return days === 1 ? '1 day until next retrieve' : `Due for a retrieve since ${after}`;
}

/** One state's row on the Overview page. */
export default function StateRow ({ state: s, onStart }: { state: StateSummary; onStart: () => void }) {
  renderLog('StateRow');
  const stateName = { fontSize: '1.35rem', fontWeight: 500, whiteSpace: 'nowrap' };
  const next = nextCheck(s.nextRun?.after);
  return (
    <TableRow hover>
      <TableCell><To to={`/states/${s.code}`} sx={stateName}>{s.name}</To></TableCell>
      <TableCell><SourceLinks sources={s.sources} kind="overview" /></TableCell>
      <TableCell><SourceLinks sources={s.sources} kind="roster" /></TableCell>
      <TableCell sx={{ minWidth: 190 }}>
        {s.lastCapture ?
          <StatusText status={s.lastCapture.status}>{ago(s.lastCapture.startedAt)}</StatusText> :
          <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>Never retrieved</Typography>}
        <Box sx={{ fontSize: '0.8rem', mt: 0.75, lineHeight: 1.7 }}>
          {s.lastCapture && <div><To to={`/retrieves/${s.lastCapture.captureId}`}>View Log</To></div>}
          {next && <Tooltip title={s.nextRun?.reason ?? ''}><div>{next}</div></Tooltip>}
          {/* MUI renders this Link as a <button>, so it is not an anchor used as a button. */}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <Link component="button" onClick={onStart} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 'inherit' }}>
            <PlayCircleOutline fontSize="small" /> Start Retrieve
          </Link>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: '0.8rem' }}>
        {s.elections.map((e) => (
          <Box key={e.runId} sx={{ whiteSpace: 'nowrap', lineHeight: 1.7 }}>
            <To to={`/states/${s.code}/elections/${electionKey(e)}`}>{e.electionDate} {e.electionType}</To>
            <Typography component="span" color="text.secondary" sx={{ fontSize: 'inherit' }}>
              {' '}{numberWithCommas(e.candidateCount)} cand.{e.measureCount > 0 && `, ${numberWithCommas(e.measureCount)} meas.`}{e.isPending && ', pending'}
            </Typography>
          </Box>
        ))}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Stage label="Retrieve"
status={s.lastCapture?.status ?? null}
            detail={s.lastCapture ? `Retrieve ${s.lastCapture.captureId}, ${s.lastCapture.status} ${ago(s.lastCapture.startedAt)}` : 'Never run'}
          />
          <Stage label="Normalize"
status={s.lastPass?.status ?? null}
            detail={s.lastPass ? `Pass ${s.lastPass.passId} of retrieve ${s.lastPass.captureId}, ${s.lastPass.status} ${ago(s.lastPass.requestedAt)}` : 'Never run'}
          />
        </Box>
        {s.gapCount !== null && s.gapCount > 0 && <Typography color="error" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.gapCount} {s.gapCount === 1 ? 'gap' : 'gaps'}</Typography>}
        <Box sx={{ fontSize: '0.8rem', mt: 0.5 }}><To to={`/states/${s.code}`}>Show All Results</To></Box>
      </TableCell>
    </TableRow>
  );
}
