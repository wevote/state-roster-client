import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { RegionUrl, Source, StateUrls as StateUrlsData } from '../../react-query/apiTypes';
import { deleteUrl, useApi } from '../../react-query/RosterQuery';
import { regionLabel, urlColumn, urlTypeLabel, type UrlColumn } from '../../utils/regionUrls';
import { savedName } from '../../utils/yourName';
import SourceLinks from '../Widgets/SourceLinks';
import UrlEditDialog, { type UrlEditPreset } from './UrlEditDialog';
import UrlHistoryDialog from './UrlHistoryDialog';
import UrlList from './UrlList';
import invalidateUrls from './urlQueries';

const HEADINGS: Record<UrlColumn, string> = { overview: 'Overview URLs', roster: 'Roster URLs' };

/**
 * A state's Overview and Roster URLs, which a person adds, edits and deletes here, and its change log.
 * Until the API serves the URLs, the columns fall back to the links the latest good run reported.
 */
export default function StateUrls ({ code, name, sources }: { code: string; name: string; sources: Source[] }) {
  renderLog('StateUrls');
  const queryClient = useQueryClient();
  const urls = useApi<StateUrlsData>(`/states/${code}/urls`, 5000);
  const [editor, setEditor] = useState<UrlEditPreset | null>(null);
  const [changeLog, setChangeLog] = useState(false);
  const [deleting, setDeleting] = useState<RegionUrl | null>(null);
  const [sending, setSending] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  async function confirmDelete () {
    setSending(true);
    setRefusal(null);
    try {
      await deleteUrl(deleting!.urlId, savedName() || 'console');
      await invalidateUrls(queryClient);
      setDeleting(null);
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
    }
    setSending(false);
  }

  const column = (kind: UrlColumn) => (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h3">{HEADINGS[kind]}</Typography>
        {urls.data && (
          <Tooltip title="Modify state URLs and roster links">
            <IconButton size="small" color="primary" aria-label={`Add to ${HEADINGS[kind]}`} onClick={() => setEditor({ stateCode: code, editing: null, column: kind })} sx={{ ml: 1 }}>
              <Add />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {urls.data ?
        <UrlList urls={urls.data.urls.filter((u) => urlColumn(u.urlType) === kind)} onEdit={(u) => setEditor({ stateCode: code, editing: u, column: kind })} onDelete={(u) => { setRefusal(null); setDeleting(u); }} /> :
        <SourceLinks sources={sources} kind={kind} />}
    </Box>
  );

  return (
    <Box sx={{ gridColumn: { md: 'span 2' }, minWidth: 0 }}>
      <Button variant="outlined" disabled={!urls.data} onClick={() => setChangeLog(true)} sx={{ mb: 2 }}>View Change Log</Button>
      {urls.error && <Typography color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>URLs can&apos;t be edited right now: {urls.error.message}</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 3, borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
        {column('overview')}
        {column('roster')}
      </Box>

      {editor && <UrlEditDialog preset={editor} onClose={() => setEditor(null)} />}
      {changeLog && <UrlHistoryDialog title={`${name} URL change log`} path={`/states/${code}/urls/history`} stateNames={{ [code]: name }} onClose={() => setChangeLog(false)} />}
      {deleting && (
        <Dialog open onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete this URL?</DialogTitle>
          <DialogContent>
            <Typography sx={{ overflowWrap: 'anywhere' }}>{deleting.url}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.85rem', mt: 1 }}>
              {urlTypeLabel(deleting.urlType)}, {regionLabel(deleting.counties, deleting.city) || name}. It stays in the change log, where it can be reverted.
            </Typography>
            {refusal && <Alert severity="error" sx={{ mt: 2 }}>{refusal}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="contained" color="error" disabled={sending} onClick={() => confirmDelete()}>{sending ? 'Deleting…' : 'Delete'}</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
