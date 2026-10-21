import { Link, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import numberWithCommas from '../../common/utils/numberWithCommas';
import type { CountyBallot } from '../../react-query/apiTypes';
import Empty from '../Widgets/Empty';

/** The county ballots a run has. Picking one shows its candidates. */
export default function RunCountyBallots ({ ballots, onPick }: { ballots: CountyBallot[]; onPick: (county: string) => void }) {
  renderLog('RunCountyBallots');
  if (ballots.length === 0) return <Empty>This source does not publish county ballots.</Empty>;

  return (
    <Table size="small" sx={{ width: 'auto', minWidth: 420 }}>
      <TableHead><TableRow><TableCell>County</TableCell><TableCell align="right">Candidates</TableCell><TableCell align="right">Measures</TableCell></TableRow></TableHead>
      <TableBody>
        {ballots.map((b) => (
          <TableRow key={b.county} hover>
            <TableCell>
              {/* MUI renders this Link as a <button>, so it is not an anchor used as a button. */}
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <Link component="button" onClick={() => onPick(b.county)}>{b.county}</Link>
            </TableCell>
            <TableCell align="right">{numberWithCommas(b.candidateCount)}</TableCell><TableCell align="right">{numberWithCommas(b.measureCount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
