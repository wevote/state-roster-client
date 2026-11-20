import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import Close from '@mui/icons-material/Close';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { UrlVersion } from '../../react-query/apiTypes';
import { revertUrl, useApi } from '../../react-query/RosterQuery';
import { changedFields, currentVersions, shortUrl, urlTypeLabel, type VersionField } from '../../utils/regionUrls';
import { longDate, minuteOf } from '../../utils/timeAndSizeFormat';
import { savedName } from '../../utils/yourName';
import Empty from '../Widgets/Empty';
import Pending from '../Widgets/Pending';
import invalidateUrls from './urlQueries';

const PAGE = 5;

/**
 * The saved versions of one URL, or of every URL in a state (its change log), newest first.
 * Bold marks what each version changed. Any version but a URL's current one can be made current again.
 */
export default function UrlHistoryDialog ({ title, path, stateNames, onClose }: { title: string; path: string; stateNames: Record<string, string>; onClose: () => void }) {
  renderLog('UrlHistoryDialog');
  const queryClient = useQueryClient();
  const history = useApi<UrlVersion[]>(path);
  const [shown, setShown] = useState(PAGE);
  const [reverting, setReverting] = useState<number | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  const versions = history.data ?? [];
  const changed = changedFields(versions);
  const current = currentVersions(versions);

  async function revert (v: UrlVersion) {
    setReverting(v.versionId);
    setRefusal(null);
    try {
      await revertUrl(v.urlId, v.versionId, savedName() || 'console');
      await invalidateUrls(queryClient);
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
    }
    setReverting(null);
  }

  const cell = (v: UrlVersion, field: VersionField, text: string, link = false) => {
    const sx = { fontWeight: changed.get(v.versionId)?.has(field) ? 700 : 400, textDecoration: v.action === 'deleted' ? 'line-through' : 'none' };
    return (
      <TableCell sx={{ color: 'primary.main', ...sx }}>
        {link ? <Tooltip title={text}><Link href={text} target="_blank" rel="noreferrer" sx={{ fontWeight: 'inherit' }}>{shortUrl(text, 28)}</Link></Tooltip> : text}
      </TableCell>
    );
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 500, fontSize: '1.6rem', pr: 7, borderBottom: 1, borderColor: 'divider' }}>{title}</DialogTitle>
      <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}><Close /></IconButton>
      <DialogContent>
        {!history.data && <Pending query={history} />}
        {history.data && versions.length === 0 && <Empty>No edits saved yet.</Empty>}
        {versions.length > 0 && (
          <>
            {refusal && <Alert severity="error" sx={{ my: 1 }}>{refusal}</Alert>}
            <TableContainer>
              <Table size="small" sx={{ '& td': { fontSize: '0.75rem', borderBottom: 0, whiteSpace: 'nowrap' }, '& th': { fontSize: '0.85rem', textAlign: 'center' } }}>
                <TableHead>
                  <TableRow>
                    {['URL', 'URL Type', 'State', 'County', 'City', 'Date Edited', 'Date Last Used', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versions.slice(0, shown).map((v) => (
                    <TableRow key={v.versionId}>
                      {cell(v, 'url', v.url, true)}
                      {cell(v, 'urlType', urlTypeLabel(v.urlType))}
                      {cell(v, 'stateCode', stateNames[v.stateCode] ?? v.stateCode)}
                      {cell(v, 'counties', v.counties.join(', '))}
                      {cell(v, 'city', v.city ?? '')}
                      <TableCell>
                        <Tooltip title={`${v.action} by ${v.editedBy}, ${minuteOf(v.editedAt)} UTC`}><span>{longDate(v.editedAt)}</span></Tooltip>
                      </TableCell>
                      <TableCell sx={{ color: 'primary.main' }}>{v.lastUsedAt ? longDate(v.lastUsedAt) : '–'}</TableCell>
                      <TableCell>
                        {current.has(v.versionId) ?
                          <Typography component="span" color="text.secondary" sx={{ fontSize: 'inherit' }}>{v.action === 'deleted' ? 'deleted' : 'current'}</Typography> : (
                            <Button size="small" disabled={reverting !== null} onClick={() => revert(v)} sx={{ fontSize: 'inherit', minWidth: 0, py: 0 }}>
                              {reverting === v.versionId ? 'reverting…' : 'revert'}
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {versions.length > shown && (
              <Box sx={{ mt: 2 }}><Button onClick={() => setShown(shown + PAGE * 2)}>Show more</Button></Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
