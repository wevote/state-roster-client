import { Tooltip, Typography } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import { ago, minuteOf } from '../../utils/timeAndSizeFormat';

export default function When ({ iso }: { iso: string | null }) {
  renderLog('When');
  if (!iso) return <Typography component="span" color="text.secondary">not yet</Typography>;
  return (
    <Tooltip title={iso}>
      <span>{minuteOf(iso)} UTC <Typography component="span" color="text.secondary" sx={{ fontSize: 'inherit' }}>({ago(iso)})</Typography></span>
    </Tooltip>
  );
}
