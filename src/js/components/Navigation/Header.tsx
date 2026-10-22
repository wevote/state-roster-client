import { AppBar, Badge, Box, Button, Toolbar, Typography } from '@mui/material';
import { NavLink } from 'react-router';
import { renderLog } from '../../common/utils/logging';
import type { JobsData } from '../../react-query/apiTypes';
import { useApi } from '../../react-query/RosterQuery';
import { isActive } from '../../utils/runUtils';
import { navy } from '../Style/consoleTheme';

const navSx = {
  color: 'rgba(255,255,255,0.75)',
  px: 1.5,
  '&.active': { color: '#fff', boxShadow: 'inset 0 -2px 0 #fff', borderRadius: 0 },
};

export default function Header () {
  renderLog('Header');
  const active = (useApi<JobsData>('/jobs', 2000).data?.jobs ?? []).filter(isActive).length;

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: navy }}>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, gap: 3 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>Roster console</Typography>
        <Box component="nav" sx={{ display: 'flex', alignSelf: 'stretch' }}>
          <Button component={NavLink} to="/" end sx={navSx}>States</Button>
          <Button component={NavLink} to="/activity" sx={navSx}>
            <Badge badgeContent={active} color="info" sx={{ '& .MuiBadge-badge': { right: -10 } }}>Activity</Badge>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
