import { Alert } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import { monoFont } from '../Style/textStyles';

export default function ErrorText ({ text }: { text: string | null }) {
  renderLog('ErrorText');
  return text ? (
    <Alert severity="error" icon={false} sx={{ my: 1, '& .MuiAlert-message': { fontFamily: monoFont, fontSize: '0.75rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }}>
      {text}
    </Alert>
  ) : null;
}
