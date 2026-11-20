import { Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, IconButton, InputLabel, ListItemText, ListSubheader, MenuItem, Select, TextField, Tooltip } from '@mui/material';
import Close from '@mui/icons-material/Close';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { RegionUrl, StateSummary, StateUrls, UrlType } from '../../react-query/apiTypes';
import { saveUrl, useApi } from '../../react-query/RosterQuery';
import { COLUMN_LABEL, URL_TYPES, urlProblem, type UrlColumn } from '../../utils/regionUrls';
import { saveName, savedName } from '../../utils/yourName';
import Pending from '../Widgets/Pending';
import UrlHistoryDialog from './UrlHistoryDialog';
import invalidateUrls from './urlQueries';

export interface UrlEditPreset { stateCode: string; editing: RegionUrl | null; column: UrlColumn }

const info = (text: string) => (
  <Tooltip title={text}><InfoOutlined sx={{ fontSize: '1rem', ml: 0.5, verticalAlign: '-3px', color: 'text.secondary' }} /></Tooltip>
);

/** Adds a URL for a state, its counties or a city, or edits one. "Duplicate this link" turns an edit into an add of a copy. */
export default function UrlEditDialog ({ preset, onClose }: { preset: UrlEditPreset; onClose: () => void }) {
  renderLog('UrlEditDialog');
  const queryClient = useQueryClient();
  const states = useApi<StateSummary[]>('/states');
  const [editing, setEditing] = useState(preset.editing);
  const [stateCode, setStateCode] = useState(preset.editing?.stateCode ?? preset.stateCode);
  const [counties, setCounties] = useState<string[]>(preset.editing?.counties ?? []);
  const [city, setCity] = useState(preset.editing?.city ?? '');
  const [url, setUrl] = useState(preset.editing?.url ?? '');
  const [urlType, setUrlType] = useState<UrlType>(preset.editing?.urlType ?? URL_TYPES.find((t) => t.column === preset.column)!.value);
  // Asked for only when this browser has no name yet, since every edit records who made it.
  const [askName] = useState(savedName() === '');
  const [editedBy, setEditedBy] = useState(savedName);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const region = useApi<StateUrls>(`/states/${stateCode}/urls`);

  const countyOptions = region.data?.counties ?? [];
  const cityOptions = [...new Set((region.data?.urls ?? []).map((u) => u.city).filter((c): c is string => !!c))].sort();
  const problem = urlProblem(url);
  const name = editedBy.trim();
  const stateNames = Object.fromEntries((states.data ?? []).map((s) => [s.code, s.name]));

  function pickState (code: string) {
    setStateCode(code);
    // Counties and cities belong to one state.
    setCounties([]);
    setCity('');
  }

  async function submit (e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (problem || name === '') return;
    setSending(true);
    setRefusal(null);
    saveName(name);
    try {
      await saveUrl(editing?.urlId ?? null, { stateCode, counties, city: city.trim() || null, url: url.trim(), urlType, editedBy: name });
      await invalidateUrls(queryClient);
      onClose();
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
      setSending(false);
    }
  }

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { component: 'form', onSubmit: submit, noValidate: true } as never }}>
        <DialogTitle sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '1.6rem', pr: 7, borderBottom: 1, borderColor: 'divider' }}>
          {editing ? 'Edit URL' : 'Add URL'}
        </DialogTitle>
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}><Close /></IconButton>
        <DialogContent>
          {!states.data ? <Pending query={states} /> : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="url-state">State</InputLabel>
                  <Select labelId="url-state" label="State" value={stateCode} onChange={(e) => pickState(e.target.value)}>
                    {states.data.map((s) => <MenuItem key={s.code} value={s.code}>{s.name}</MenuItem>)}
                  </Select>
                  <FormHelperText>State information and data{info('Leave County and City empty for a URL about the whole state.')}</FormHelperText>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="url-counties">County</InputLabel>
                  <Select labelId="url-counties"
label="County"
multiple
value={counties}
                    onChange={(e) => setCounties(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    disabled={countyOptions.length === 0}
                    renderValue={(picked) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {picked.map((c) => <Chip key={c} label={c} size="small" color="primary" />)}
                      </Box>
                    )}
                    MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
                  >
                    {countyOptions.map((c) => (
                      <MenuItem key={c} value={c} dense>
                        <Checkbox size="small" checked={counties.includes(c)} sx={{ p: 0.5, mr: 1 }} />
                        <ListItemText primary={c} />
                      </MenuItem>
                    ))}
                  </Select>
                  {region.isFetched && countyOptions.length === 0 && <FormHelperText>No counties on record for {stateNames[stateCode] ?? stateCode}</FormHelperText>}
                </FormControl>
                <Autocomplete freeSolo
options={cityOptions}
inputValue={city}
onInputChange={(_e, value) => setCity(value)}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  renderInput={(params) => <TextField {...params} label="City" />}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2, mt: 3 }}>
                <Box>
                  <TextField label="URL"
fullWidth
value={url}
onChange={(e) => setUrl(e.target.value)}
onBlur={() => setTouched(true)}
                    placeholder="https://"
error={touched && !!problem}
helperText={touched && problem}
                  />
                  {editing && (
                    <Button size="small" onClick={() => setShowHistory(true)} sx={{ mt: 0.5, px: 0.5, minWidth: 0 }}>Edit history</Button>
                  )}
                </Box>
                <FormControl fullWidth>
                  <InputLabel id="url-type">URL type</InputLabel>
                  <Select labelId="url-type" label="URL type" value={urlType} onChange={(e) => setUrlType(e.target.value as UrlType)}>
                    {(['overview', 'roster'] as UrlColumn[]).flatMap((column) => [
                      <ListSubheader key={column}>{COLUMN_LABEL[column]}</ListSubheader>,
                      ...URL_TYPES.filter((t) => t.column === column).map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>),
                    ])}
                  </Select>
                  <FormHelperText>For human reference{info('Where this URL is listed on the state page. Overview pages are for people to read; roster pages hold the candidate and measure data a retrieve starts from.')}</FormHelperText>
                </FormControl>
              </Box>

              {askName && (
                <TextField label="Your name"
helperText="Recorded on the edit"
value={editedBy}
onChange={(e) => setEditedBy(e.target.value)}
                  error={touched && name === ''}
sx={{ mt: 3, width: { xs: '100%', sm: '50%' } }}
                />
              )}
              {refusal && <Alert severity="error" sx={{ mt: 2 }}>{refusal}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {editing && <Button variant="outlined" onClick={() => setEditing(null)}>Duplicate this link</Button>}
          <Box sx={{ flex: 1 }} />
          <Button type="submit" variant="contained" disabled={sending || !states.data} sx={{ minWidth: 120 }}>{sending ? 'Saving…' : 'Save'}</Button>
          <Button variant="outlined" onClick={onClose} sx={{ minWidth: 120 }}>Cancel</Button>
        </DialogActions>
      </Dialog>
      {showHistory && editing && (
        <UrlHistoryDialog title="Link edit history" path={`/urls/${editing.urlId}/history`} stateNames={stateNames} onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}
