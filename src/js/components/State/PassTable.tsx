import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import numberWithCommas from '../../common/utils/numberWithCommas';
import type { Pass, Run } from '../../react-query/apiTypes';
import { runType } from '../../utils/runUtils';
import { minuteOf } from '../../utils/timeAndSizeFormat';
import ErrorText from '../Widgets/ErrorText';
import StatusText from '../Widgets/StatusText';
import To from '../Widgets/To';

/** The normalizations of one retrieve, with the runs each one built. */
export default function PassTable ({ passes, runs, retrievedOnly }: { passes: Pass[]; runs: Run[]; retrievedOnly: boolean }) {
  renderLog('PassTable');
  if (passes.length === 0) return retrievedOnly ? <Typography color="text.secondary" sx={{ fontSize: '0.85rem', mt: 2 }}>Retrieved only. Not normalized yet.</Typography> : null;
  return (
    <Table size="small" sx={{ mt: 2 }}>
      <TableHead>
        <TableRow><TableCell>Run</TableCell><TableCell>Run Type</TableCell><TableCell>Status</TableCell><TableCell>Date Created</TableCell><TableCell align="right">Candidates</TableCell><TableCell align="right">Measures</TableCell></TableRow>
      </TableHead>
      <TableBody>
        {passes.flatMap((p) => {
          const built = runs.filter((r) => r.passId === p.passId);
          if (built.length === 0) {
            return [
              <TableRow key={`p${p.passId}`}>
                <TableCell>Pass {p.passId}{p.errorText && <ErrorText text={p.errorText} />}</TableCell>
                <TableCell>{runType(p.source)}</TableCell>
                <TableCell><StatusText status={p.status} /></TableCell>
                <TableCell>{minuteOf(p.requestedAt)}</TableCell>
                <TableCell /><TableCell />
              </TableRow>,
            ];
          }
          return built.map((r) => (
            <TableRow key={r.runId}>
              <TableCell><To to={`/runs/${r.runId}`}>Run {r.runId} – {r.electionDate} {r.electionType}</To>
                <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>pass {p.passId}{p.gaps.length > 0 && `, ${p.gaps.length} gap${p.gaps.length > 1 ? 's' : ''}`}</Typography>
              </TableCell>
              <TableCell>{runType(p.source)}</TableCell>
              <TableCell><StatusText status={r.isPending ? 'pending' : p.status} /></TableCell>
              <TableCell>{minuteOf(r.createdAt)}</TableCell>
              <TableCell align="right">{numberWithCommas(r.candidateCount)}</TableCell>
              <TableCell align="right">{numberWithCommas(r.measureCount)}</TableCell>
            </TableRow>
          ));
        })}
      </TableBody>
    </Table>
  );
}
