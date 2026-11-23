import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { RulesetSummary } from '../../react-query/apiTypes';
import { useApi } from '../../react-query/RosterQuery';
import Pending from '../Widgets/Pending';

/** Asks for a saved ruleset's name or id, for the header's "Edit Ruleset" item. */
export default function FindRulesetDialog ({ onFound, onClose }: { onFound: (rulesetId: number) => void; onClose: () => void }) {
  renderLog('FindRulesetDialog');
  const rulesets = useApi<RulesetSummary[]>('/rulesets?summary=true');
  const [text, setText] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const wanted = text.trim();

  function submit (e: FormEvent) {
    e.preventDefault();
    // Ids first, since a name could be all digits.
    const found = rulesets.data?.find((r) => String(r.rulesetId) === wanted) ??
      rulesets.data?.find((r) => r.name.toLowerCase() === wanted.toLowerCase());
    if (found) onFound(found.rulesetId);
    else setRefusal(`There is no ruleset with the name or id "${wanted}".`);
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { component: 'form', onSubmit: submit } as never }}>
      <DialogTitle sx={{ color: 'secondary.main', fontWeight: 500, fontSize: '1.4rem' }}>Edit Ruleset</DialogTitle>
      <DialogContent>
        {!rulesets.data ? <Pending query={rulesets} /> : (
          <TextField label="Ruleset name or id" value={text} onChange={(e) => { setText(e.target.value); setRefusal(null); }} fullWidth sx={{ mt: 1 }} />
        )}
        {refusal && <Alert severity="error" sx={{ mt: 2 }}>{refusal}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!rulesets.data || wanted === ''}>Open</Button>
      </DialogActions>
    </Dialog>
  );
}
