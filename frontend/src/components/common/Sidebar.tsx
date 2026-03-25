import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Box, Typography, IconButton, Tooltip,
  useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SettingsIcon from '@mui/icons-material/Settings';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

export const DRAWER_EXPANDED = 240;
export const DRAWER_COLLAPSED = 64;

const NAV_ITEMS: Record<UserRole, { label: string; icon: ReactNode; path: string }[]> = {
  admin: [
    { label: 'Appointments', icon: <CalendarMonthIcon />, path: '/admin/appointments' },
    { label: 'Salons', icon: <DashboardIcon />, path: '/admin/salons' },
    { label: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { label: 'Analytics', icon: <DashboardIcon />, path: '/admin/analytics' },
  ],
  salon_owner: [
    { label: 'Appointments', icon: <CalendarMonthIcon />, path: '/salon/appointments' },
    { label: 'Services', icon: <ContentCutIcon />, path: '/salon/services' },
    { label: 'Closure', icon: <EventBusyIcon />, path: '/salon/closure' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/salon/settings' },
  ],
  reception: [
    { label: 'Appointments', icon: <CalendarMonthIcon />, path: '/reception/appointments' },
    { label: 'Customers', icon: <GroupIcon />, path: '/reception/customers' },
  ],
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  if (!user) return null;

  const items = NAV_ITEMS[user.role];
  const width = collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;

  return (
    <Drawer
      variant="permanent"
      elevation={0}
      sx={{
        width,
        flexShrink: 0,
        transition: 'width 0.25s ease',
        '& .MuiDrawer-paper': {
          width,
          overflowX: 'hidden',
          transition: 'width 0.25s ease',
          boxSizing: 'border-box',
          borderRight: 'none',
          boxShadow: 'none',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2,
          py: 1.5,
          minHeight: 64,
        }}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary"
                noWrap
              >
                Beauty Parlour
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        <IconButton
          size="small"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, pt: 1 }}>
        {items.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 44,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 2,
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(124,58,237,0.2)'
                        : 'rgba(124,58,237,0.1)',
                      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                      '& .MuiListItemText-primary': { color: theme.palette.primary.main, fontWeight: 700 },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.5,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                      >
                        <ListItemText primary={item.label} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
            <ListItemButton
              onClick={logout}
              sx={{
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: 'center' }}>
                <LogoutIcon />
              </ListItemIcon>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                  >
                    <ListItemText primary="Logout" />
                  </motion.div>
                )}
              </AnimatePresence>
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
