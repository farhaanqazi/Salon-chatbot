import { AppBar, Toolbar, Typography, Chip, Box, IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import { DRAWER_EXPANDED, DRAWER_COLLAPSED } from './Sidebar';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

const Header = ({ sidebarCollapsed }: HeaderProps) => {
  const { user } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const theme = useTheme();

  const width = sidebarCollapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer - 1,
        width: `calc(100%% - ${width}px)`,
        ml: `${width}px`,
        transition: 'width 0.25s ease, margin-left 0.25s ease',
        borderLeft: 'none',
        boxShadow: 'none',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flexGrow: 1, maxWidth: 480 }}>
          <GlobalSearch />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <NotificationBell />

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggleMode} size="small" aria-label="Toggle theme">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {user.full_name}
              </Typography>
              <Chip
                label={user.role.replace(/_/g, ' ')}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
