import { Box } from '@mui/material';
import { renderLog } from '../../common/utils/logging';
import { monoFont } from '../Style/textStyles';

export default function Log ({ text }: { text: string }) {
  renderLog('Log');
  return (
    <Box component="pre" sx={{ m: 0, p: 2, maxHeight: 520, overflow: 'auto', bgcolor: '#f7f8fa', border: 1, borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', fontFamily: monoFont, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {text}
    </Box>
  );
}
