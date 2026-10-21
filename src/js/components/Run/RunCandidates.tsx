import { Box, InputAdornment, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { renderLog } from '../../common/utils/logging';
import numberWithCommas from '../../common/utils/numberWithCommas';
import type { Candidate, Page } from '../../react-query/apiTypes';
import { useApi } from '../../react-query/RosterQuery';
import { mono } from '../Style/textStyles';
import Empty from '../Widgets/Empty';
import Pager from '../Widgets/Pager';
import Pending from '../Widgets/Pending';

const PAGE = 100;

/** A run's candidates, a page at a time, filtered by text and by county ballot. */
export default function RunCandidates ({ runId, county }: { runId: number; county: string }) {
  renderLog('RunCandidates');
  const [filter, setFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const page = useApi<Page<Candidate>>(`/runs/${runId}/candidates?q=${encodeURIComponent(filter.trim())}&county=${encodeURIComponent(county)}&offset=${offset}&limit=${PAGE}`);

  let emptyText = 'This run has no candidates.';
  if (filter.trim()) emptyText = 'Nothing matches.';
  else if (county) emptyText = `No candidates on the ${county} ballot.`;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small"
placeholder="Filter by office, name, county, party"
value={filter}
sx={{ width: 380, maxWidth: '100%' }}
          onChange={(e) => { setFilter(e.target.value); setOffset(0); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
        {page.data && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{numberWithCommas(page.data.total)} {filter.trim() ? 'matching' : 'candidates'}</Typography>}
      </Box>
      {!page.data && <Pending query={page} />}
      {page.data?.total === 0 && <Empty>{emptyText}</Empty>}
      {page.data && page.data.total > 0 && (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Office</TableCell><TableCell>District</TableCell><TableCell>County</TableCell><TableCell>Candidate</TableCell><TableCell>Party</TableCell><TableCell>Filing Status</TableCell><TableCell>OCD Division</TableCell></TableRow></TableHead>
              <TableBody>
                {page.data.rows.map((c, i) => (
                  // Candidate rows have no id, names repeat, and the rows hold no state, so the index is a safe key.
                  // eslint-disable-next-line react/no-array-index-key
                  <TableRow key={offset + i} hover>
                    <TableCell>{c.office}</TableCell><TableCell>{c.district}</TableCell><TableCell>{c.county}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell><TableCell>{c.party}</TableCell><TableCell>{c.status}</TableCell>
                    <TableCell sx={mono}>{c.ocdDivisionId ?? <Typography component="span" color="text.secondary" sx={{ fontSize: 'inherit' }}>not mapped</Typography>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Pager offset={offset} limit={PAGE} total={page.data.total} onChange={setOffset} />
        </>
      )}
    </>
  );
}
