import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useState } from 'react';
import { renderLog } from '../../common/utils/logging';
import type { Measure, Page } from '../../react-query/apiTypes';
import { useApi } from '../../react-query/RosterQuery';
import Empty from '../Widgets/Empty';
import Pager from '../Widgets/Pager';
import Pending from '../Widgets/Pending';

const PAGE = 100;

/** A run's measures, a page at a time, filtered by county ballot. */
export default function RunMeasures ({ runId, county }: { runId: number; county: string }) {
  renderLog('RunMeasures');
  const [offset, setOffset] = useState(0);
  const page = useApi<Page<Measure>>(`/runs/${runId}/measures?county=${encodeURIComponent(county)}&offset=${offset}&limit=${PAGE}`);
  if (!page.data) return <Pending query={page} />;
  if (page.data.total === 0) return <Empty>{county ? `No measures on the ${county} ballot.` : 'This run has no measures.'}</Empty>;

  return (
    <>
      <Table size="small">
        <TableHead><TableRow><TableCell>Measure</TableCell><TableCell>Title</TableCell><TableCell>Jurisdiction</TableCell><TableCell>County</TableCell></TableRow></TableHead>
        <TableBody>
          {page.data.rows.map((m, i) => (
            // Measure rows have no id, measure ids repeat across counties, and the rows hold no state, so the index is a safe key.
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={offset + i} hover><TableCell>{m.measureId}</TableCell><TableCell>{m.title}</TableCell><TableCell>{m.jurisdiction}</TableCell><TableCell>{m.county}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
      <Pager offset={offset} limit={PAGE} total={page.data.total} onChange={setOffset} />
    </>
  );
}
