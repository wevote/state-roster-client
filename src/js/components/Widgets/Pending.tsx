import { Alert } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import LoadingWheel from '../../common/components/Widgets/LoadingWheel';
import { renderLog } from '../../common/utils/logging';

/** What a page shows while its data has not arrived, or when the request failed. */
export default function Pending ({ query }: { query: UseQueryResult<unknown, Error> }) {
  renderLog('Pending');
  return query.error ? <Alert severity="error" sx={{ my: 2 }}>{query.error.message}</Alert> : LoadingWheel;
}
