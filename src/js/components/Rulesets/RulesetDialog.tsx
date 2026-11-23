import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, IconButton, InputLabel, Menu, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { Ruleset, RulesetSummary, SampleResult, TransformKind, TransformParam, TransformStep } from '../../react-query/apiTypes';
import { createRuleset, setRulesetActive, tryRuleset, updateRuleset, useApi } from '../../react-query/RosterQuery';
import Pending from '../Widgets/Pending';

// regex_replace shows as "Regex replace".
const transformLabel = (name: string) => name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');

// The transformation that runs another saved ruleset. Its id is picked from a list, so a rule keeps it in
// rulesetId rather than params.
const RULESET = 'ruleset';

interface Rule { id: number; transformation: string; rulesetId: number | null; params: Record<string, string> }

// ignoreCase shows as "Ignore case".
const paramLabel = (name: string) => transformLabel(name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`));

// A param that defaults to true or false gets a checkbox.
const isFlag = (p: TransformParam) => p.default === 'true' || p.default === 'false';

// A row of the "Selected Rules Applied" table. result is null until the rules are processed.
interface Sample { id: number; before: string; result: SampleResult | null; custom: boolean }

// The API's limit per request.
const MAX_SAMPLES = 1000;

const titleSx = { display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main', fontWeight: 500, fontSize: '1.4rem' };

function ruleStep (rule: Rule): TransformStep {
  if (rule.transformation === RULESET) return { kind: RULESET, params: { rulesetId: String(rule.rulesetId) } };
  return { kind: rule.transformation, params: rule.params };
}

function stepRule (step: TransformStep, index: number): Rule {
  if (step.kind === RULESET) return { id: index + 1, transformation: RULESET, rulesetId: Number(step.params.rulesetId), params: {} };
  return { id: index + 1, transformation: step.kind, rulesetId: null, params: { ...step.params } };
}

// Without a rulesetId the dialog adds a new ruleset, with one it edits that ruleset. sampleValues fills the
// importing data column.
export interface RulesetPreset { rulesetId?: number; sampleValues?: string[] }

/** The "Add Ruleset" or "Edit Ruleset" dialog. */
export default function RulesetDialog ({ preset, onClose }: { preset: RulesetPreset; onClose: () => void }) {
  renderLog('RulesetDialog');
  const sampleValues = preset.sampleValues ?? [];
  if (preset.rulesetId === undefined) return <RulesetForm sampleValues={sampleValues} onClose={onClose} />;
  return <SavedRulesetForm rulesetId={preset.rulesetId} sampleValues={sampleValues} onClose={onClose} />;
}

function SavedRulesetForm ({ rulesetId, sampleValues, onClose }: { rulesetId: number; sampleValues: string[]; onClose: () => void }) {
  renderLog('SavedRulesetForm');
  const ruleset = useApi<Ruleset>(`/rulesets/${rulesetId}`);
  // useApi keeps showing the previous ruleset while a new one loads.
  if (ruleset.data?.rulesetId === rulesetId) return <RulesetForm saved={ruleset.data} sampleValues={sampleValues} onClose={onClose} />;
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={titleSx}>Edit Ruleset</DialogTitle>
      <DialogContent><Pending query={ruleset} /></DialogContent>
    </Dialog>
  );
}

function RulesetForm ({ saved, sampleValues, onClose }: { saved?: Ruleset; sampleValues: string[]; onClose: () => void }) {
  renderLog('RulesetForm');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [name, setName] = useState(saved?.name ?? '');
  const [description, setDescription] = useState(saved?.description ?? '');
  const [rules, setRules] = useState<Rule[]>(() => (saved?.steps ?? []).map(stepRule));
  const transforms = useApi<TransformKind[]>('/transforms');
  const choices = (transforms.data ?? []).filter((t) => t.name !== 'passthrough');
  const paramsOf = (rule: Rule) => (rule.transformation === RULESET ? [] : choices.find((t) => t.name === rule.transformation)?.params ?? []);
  // The API refuses a ruleset that runs itself, and new links to deactivated rulesets, but keeps existing links.
  const [linkedBefore] = useState(() => new Set(rules.filter((r) => r.transformation === RULESET).map((r) => r.rulesetId)));
  const rulesets = useApi<RulesetSummary[]>('/rulesets?summary=true');
  const pickable = rulesets.data?.filter((r) => r.rulesetId !== saved?.rulesetId && (r.isActive || linkedBefore.has(r.rulesetId)));
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveRefusal, setSaveRefusal] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [samples, setSamples] = useState<Sample[]>(() => sampleValues.map((before, i) => ({ id: i + 1, before, result: null, custom: false })));
  const [processing, setProcessing] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  const saveBlocked = saving || name.trim() === '';

  // Results from other rules or values would be misleading.
  function clearResults () {
    setSamples((s) => s.map((sample) => ({ ...sample, result: null })));
    setRefusal(null);
  }

  // New rows go last, so the last id plus one is never in use.
  function addRule () {
    setRules((r) => [...r, { id: (r.at(-1)?.id ?? 0) + 1, transformation: '', rulesetId: null, params: {} }]);
    clearResults();
  }

  function updateRule (id: number, changes: Partial<Rule>) {
    setRules((r) => r.map((rule) => (rule.id === id ? { ...rule, ...changes } : rule)));
    clearResults();
  }

  function deleteRule (id: number) {
    setRules((r) => r.filter((rule) => rule.id !== id));
    clearResults();
  }

  function setParam (rule: Rule, param: string, value: string) {
    updateRule(rule.id, { params: { ...rule.params, [param]: value } });
  }

  function addSample () {
    setSamples((s) => [...s, { id: (s.at(-1)?.id ?? 0) + 1, before: '', result: null, custom: true }]);
  }

  function setBefore (id: number, before: string) {
    setSamples((s) => s.map((sample) => (sample.id === id ? { ...sample, before, result: null } : sample)));
  }

  // Why the rules can't run or be saved yet, or null.
  function rulesProblem (): string | null {
    if (rules.length === 0) return 'Add a rule first.';
    const unpicked = rules.findIndex((r) => r.transformation === '' || (r.transformation === RULESET && r.rulesetId === null));
    if (unpicked >= 0) return `Pick a transformation for rule ${unpicked + 1}.`;
    const lacking = rules.findIndex((r) => paramsOf(r).some((p) => p.required && !r.params[p.name]));
    if (lacking >= 0) {
      const missing = paramsOf(rules[lacking]).filter((p) => p.required && !rules[lacking].params[p.name]);
      return `Rule ${lacking + 1} needs a ${missing.map((p) => paramLabel(p.name).toLowerCase()).join(' and a ')}.`;
    }
    return null;
  }

  async function processRules () {
    const problem = rulesProblem();
    if (problem) {
      setRefusal(problem);
      return;
    }
    setProcessing(true);
    setRefusal(null);
    try {
      // Each distinct value is sent once.
      const steps = rules.map(ruleStep);
      const distinct = [...new Set(samples.map((s) => s.before))];
      const batches = Array.from({ length: Math.ceil(distinct.length / MAX_SAMPLES) }, (_, i) => distinct.slice(i * MAX_SAMPLES, (i + 1) * MAX_SAMPLES));
      const results = (await Promise.all(batches.map((batch) => tryRuleset({ steps, samples: batch })))).flat();
      const byValue = new Map(distinct.map((value, i) => [value, results[i]]));
      setSamples((s) => s.map((sample) => ({ ...sample, result: byValue.get(sample.before) ?? null })));
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
    } finally {
      setProcessing(false);
    }
  }

  async function save () {
    const problem = rulesProblem();
    if (problem) {
      setSaveRefusal(problem);
      return;
    }
    setSaving(true);
    setSaveRefusal(null);
    try {
      const request = { name: name.trim(), description: description.trim() || null, steps: rules.map(ruleStep) };
      await (saved ? updateRuleset(saved.rulesetId, request) : createRuleset(request));
      await refreshRulesets();
      onClose();
    } catch (error) {
      setSaveRefusal(error instanceof Error ? error.message : String(error));
      setSaving(false);
    }
  }

  async function setArchived (rulesetId: number, archived: boolean) {
    setMenuAnchor(null);
    setSaving(true);
    setSaveRefusal(null);
    try {
      await setRulesetActive(rulesetId, !archived);
      await refreshRulesets();
      onClose();
    } catch (error) {
      setSaveRefusal(error instanceof Error ? error.message : String(error));
      setSaving(false);
    }
  }

  // Copies the saved ruleset, not unsaved changes.
  async function duplicate (ruleset: Ruleset) {
    setMenuAnchor(null);
    setSaving(true);
    setSaveRefusal(null);
    setNotice(null);
    try {
      const copy = await createRuleset({ name: `${ruleset.name}_copy`, description: ruleset.description, steps: ruleset.steps });
      await refreshRulesets();
      setNotice(`Saved a copy named "${copy.name}".`);
    } catch (error) {
      setSaveRefusal(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function refreshRulesets () {
    await queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/rulesets') });
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={titleSx}>
        {saved ? 'Edit Ruleset' : 'Add Ruleset'}
        <Tooltip title="More">
          <IconButton aria-haspopup="menu" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
            <Close />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {saved && [
          <MenuItem key="archive" disabled={saving} onClick={() => setArchived(saved.rulesetId, saved.isActive)}>{saved.isActive ? 'Archive' : 'Unarchive'}</MenuItem>,
          <MenuItem key="duplicate" disabled={saving} onClick={() => duplicate(saved)}>Duplicate</MenuItem>,
        ]}
      </Menu>
      <Divider />
      <DialogContent>
        <TextField label="Name Ruleset" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 1 }} />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} sx={{ mt: 3 }} />
        {rules.map((rule, i) => (
          <Box key={rule.id} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontWeight: 500, minWidth: 24 }}>{i + 1}</Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id={`rule-${rule.id}-transformation`}>Transformation</InputLabel>
                <Select
                labelId={`rule-${rule.id}-transformation`}
                label="Transformation"
                value={rule.transformation}
                onChange={(e) => updateRule(rule.id, { transformation: e.target.value, rulesetId: null, params: {} })}
                renderValue={transformLabel}
                >
                  {choices.map((t) => (
                    <MenuItem key={t.name} value={t.name} sx={{ display: 'block' }}>
                      <Typography sx={{ fontWeight: 500 }}>{transformLabel(t.name)}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>{t.summary}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {rule.transformation === RULESET && (
              <FormControl size="small" fullWidth disabled={pickable?.length === 0}>
                <InputLabel id={`rule-${rule.id}-ruleset`}>{pickable?.length === 0 ? 'No saved rulesets' : 'Ruleset'}</InputLabel>
                <Select
                  labelId={`rule-${rule.id}-ruleset`}
                  label={pickable?.length === 0 ? 'No saved rulesets' : 'Ruleset'}
                  value={pickable ? rule.rulesetId ?? '' : ''}
                  onChange={(e) => updateRule(rule.id, { rulesetId: Number(e.target.value) })}
                >
                  {(pickable ?? []).map((r) => <MenuItem key={r.rulesetId} value={r.rulesetId}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
              )}
              <Tooltip title="Delete rule">
                <IconButton onClick={() => deleteRule(rule.id)}>
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
            </Box>
            {paramsOf(rule).length > 0 && (
            // Lines up with the Transformation dropdown.
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 1.5, ml: 5 }}>
              {paramsOf(rule).map((p) => (isFlag(p) ? (
                <FormControlLabel
                  key={p.name}
                  label={paramLabel(p.name)}
                  control={<Checkbox size="small" checked={(rule.params[p.name] ?? p.default) === 'true'} onChange={(e) => setParam(rule, p.name, String(e.target.checked))} />}
                />
              ) : (
                <TextField
                  key={p.name}
                  size="small"
                  label={p.required ? paramLabel(p.name) : `${paramLabel(p.name)} (optional)`}
                  placeholder={p.default ?? undefined}
                  required={p.required}
                  value={rule.params[p.name] ?? ''}
                  onChange={(e) => setParam(rule, p.name, e.target.value)}
                  sx={{ flex: '1 1 160px', maxWidth: paramsOf(rule).filter((q) => !isFlag(q)).length === 1 ? '50%' : undefined }}
                />
              )))}
            </Box>
            )}
          </Box>
        ))}
        {rules.length > 0 && !transforms.data && <Pending query={transforms} />}
        {rules.some((r) => r.transformation === RULESET) && !rulesets.data && <Pending query={rulesets} />}
        <Button startIcon={<Add />} onClick={() => addRule()} sx={{ mt: 2 }}>Add Rule</Button>

        <Typography sx={{ fontWeight: 500, mt: 3, mb: 1 }}>Selected Rules Applied</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Importing Data (before rules)</TableCell><TableCell>After Rules</TableCell></TableRow></TableHead>
            <TableBody>
              {samples.length === 0 && (
                <TableRow><TableCell colSpan={2} sx={{ color: 'text.secondary' }}>No importing data yet. Add custom data to try the rules on.</TableCell></TableRow>
              )}
              {samples.map((s) => (
                <TableRow key={s.id}>
                  <TableCell sx={{ width: '50%' }}>
                    {s.custom ?
                      <TextField size="small" fullWidth placeholder="Type a value" value={s.before} onChange={(e) => setBefore(s.id, e.target.value)} /> :
                      s.before}
                  </TableCell>
                  <TableCell sx={{ width: '50%' }}>
                    {s.result?.error && <Typography color="error" sx={{ fontSize: 'inherit' }}>{s.result.error}</Typography>}
                    {s.result?.value === '' && <Typography color="text.secondary" sx={{ fontSize: 'inherit' }}>(empty)</Typography>}
                    {s.result?.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {refusal && <Alert severity="error" sx={{ mt: 2 }}>{refusal}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button startIcon={<Add />} onClick={() => addSample()}>Add Custom Data</Button>
          <Button variant="contained" onClick={() => processRules()} disabled={processing || samples.length === 0}>{processing ? 'Processing…' : 'Process Rules'}</Button>
        </Box>
        {saveRefusal && <Alert severity="error" sx={{ mt: 3 }}>{saveRefusal}</Alert>}
        {notice && <Alert severity="success" sx={{ mt: 3 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => save()} disabled={saveBlocked}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}
