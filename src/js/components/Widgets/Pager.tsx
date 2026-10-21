import { TablePagination } from '@mui/material';
import { renderLog } from '../../common/utils/logging';

export default function Pager ({ offset, limit, total, onChange }: { offset: number; limit: number; total: number; onChange: (offset: number) => void }) {
  renderLog('Pager');
  if (total <= limit) return null;
  return (
    <TablePagination
      component="div"
      count={total}
      page={Math.floor(offset / limit)}
      rowsPerPage={limit}
      rowsPerPageOptions={[]}
      onPageChange={(_, page) => onChange(page * limit)}
    />
  );
}
