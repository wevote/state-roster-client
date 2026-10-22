import { TableCell, Typography } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import numberWithCommas from '../../common/utils/numberWithCommas';

/** A count, and how it changed from the run before. */
export default function RunCountDelta ({ value, previous }: { value: number; previous: number | undefined }) {
  renderLog('RunCountDelta');
  const change = previous === undefined ? 0 : value - previous;
  return (
    <TableCell align="right">
      {numberWithCommas(value)}
      {change !== 0 && <Typography component="span" sx={{ fontSize: 'inherit', color: change > 0 ? 'success.main' : 'error.main' }}> {change > 0 ? '+' : ''}{numberWithCommas(change)}</Typography>}
    </TableCell>
  );
}
