import { Box, Link, Tooltip } from '@mui/material';
import DataObject from '@mui/icons-material/DataObject';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import GridOnOutlined from '@mui/icons-material/GridOnOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import { renderLog } from '../../common/utils/logging';
import type { Source } from '../../react-query/apiTypes';

// The source groups a pass reports, as the two URL columns show them. Overview is where a person
// would look (the election index, and the verification-only link). Roster is what the collector parses.
const OVERVIEW: Record<string, string> = { elections: '', verification_only: '' };
const ROSTER: Record<string, string> = { statewide_candidates: 'C', statewide_measures: 'M', local_measures: 'M' };

function shortUrl (url: string): string {
  const short = url.replace(/^https?:\/\/(www\.)?/, '');
  return short.length > 30 ? `${short.slice(0, 29)}…` : short;
}

function formatIcon (format: string) {
  const f = format.toLowerCase();
  if (f.includes('pdf')) return <PictureAsPdfOutlined fontSize="inherit" />;
  if (f.includes('csv') || f.includes('xls')) return <GridOnOutlined fontSize="inherit" />;
  if (f.includes('json')) return <DataObject fontSize="inherit" />;
  return <DescriptionOutlined fontSize="inherit" />;
}

export default function SourceLinks ({ sources, kind }: { sources: Source[]; kind: 'overview' | 'roster' }) {
  renderLog('SourceLinks');
  const labels = kind === 'overview' ? OVERVIEW : ROSTER;
  const seen = new Set<string>();
  const shown = sources.filter((s) => s.group in labels && s.url.startsWith('http') && !seen.has(s.url) && seen.add(s.url));
  if (shown.length === 0) return null;
  return (
    <>
      {shown.map((s) => (
        <Box key={s.url} sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', lineHeight: 1.7 }}>
          {labels[s.group] && <Box component="span" sx={{ color: 'primary.main' }}>{labels[s.group]}: </Box>}
          <Tooltip title={s.group === 'verification_only' ? `${s.url} (for visual verification only, never a data source)` : s.url}>
            <Link href={s.url} target="_blank" rel="noreferrer">{shortUrl(s.url)}</Link>
          </Tooltip>
          {kind === 'roster' && s.format && (
            <Tooltip title={s.format.toUpperCase()}>
              <Box component="span" sx={{ color: 'text.primary', fontSize: '1rem', ml: 0.5, display: 'inline-flex', verticalAlign: '-3px' }}>{formatIcon(s.format)}</Box>
            </Tooltip>
          )}
        </Box>
      ))}
    </>
  );
}
