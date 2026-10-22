import { Typography } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import To from './To';

// The console says "retrieve" for what the pipeline and its tables call a capture.
export default function CaptureLink ({ id }: { id: number | null }) {
  renderLog('CaptureLink');
  return id === null ? <Typography component="span" color="text.secondary">no retrieve</Typography> : <To to={`/retrieves/${id}`}>retrieve {id}</To>;
}
