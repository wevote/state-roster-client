import { Box, IconButton, Link, Tooltip, Typography } from '@mui/material';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import Close from '@mui/icons-material/Close';
import Edit from '@mui/icons-material/Edit';
import { renderLog } from '../../common/utils/logging';
import type { RegionUrl } from '../../react-query/apiTypes';
import { regionLabel, shortUrl, urlFormat, urlPrefix, urlTypeLabel } from '../../utils/regionUrls';
import { formatIcon } from '../Widgets/SourceLinks';

const iconBox = { color: 'text.primary', fontSize: '1rem', display: 'inline-flex', verticalAlign: '-3px' };

// Overview links lead with what kind of page they are. Roster links trail the format the collector would read.
function TypeIcon ({ url }: { url: RegionUrl }) {
  if (url.urlType === 'official_landing') return <Box component="span" sx={{ ...iconBox, mr: 0.75 }}><AccountBalanceOutlined fontSize="inherit" /></Box>;
  if (url.urlType === 'ballotpedia') {
    return (
      <Box component="span" sx={{ display: 'inline-grid', placeItems: 'center', width: 16, height: 16, mr: 0.75, borderRadius: '50%', bgcolor: 'secondary.main', color: 'common.white', fontSize: '0.5rem', fontWeight: 600, verticalAlign: '-3px' }}>BP</Box>
    );
  }
  return null;
}

/** One column of a state's URLs, each with its edit and delete buttons. */
export default function UrlList ({ urls, onEdit, onDelete }: { urls: RegionUrl[]; onEdit: (url: RegionUrl) => void; onDelete: (url: RegionUrl) => void }) {
  renderLog('UrlList');
  if (urls.length === 0) return <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>None yet</Typography>;
  return (
    <>
      {urls.map((u) => {
        const region = regionLabel(u.counties, u.city);
        const format = urlFormat(u.url);
        const prefix = urlPrefix(u.urlType);
        return (
          <Box key={u.urlId} sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', lineHeight: 1.7, minWidth: 0 }}>
            <Box sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <TypeIcon url={u} />
              {prefix && <Box component="span" sx={{ color: 'primary.main' }}>{prefix}: </Box>}
              <Tooltip title={`${urlTypeLabel(u.urlType)}${region ? `, ${region}` : ''}: ${u.url}`}>
                <Link href={u.url} target="_blank" rel="noreferrer">{shortUrl(u.url, 26)}</Link>
              </Tooltip>
              {region && <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>({region})</Box>}
            </Box>
            {prefix && format && (
              <Tooltip title={format.toUpperCase()}><Box component="span" sx={{ ...iconBox, ml: 0.5 }}>{formatIcon(format)}</Box></Tooltip>
            )}
            <Tooltip title="Edit this URL">
              <IconButton size="small" aria-label={`Edit ${u.url}`} onClick={() => onEdit(u)} sx={{ ml: 0.25, p: 0.25, color: 'text.secondary' }}>
                <Edit sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete this URL">
              <IconButton size="small" aria-label={`Delete ${u.url}`} onClick={() => onDelete(u)} sx={{ p: 0.25, color: 'error.main' }}>
                <Close sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
    </>
  );
}
