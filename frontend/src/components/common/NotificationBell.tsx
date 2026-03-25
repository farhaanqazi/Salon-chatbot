import { useState, useEffect } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography,
  List, ListItem, ListItemText, Divider, Chip, Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../store/authStore';

interface Notification {
  id: string;
  booking_reference: string;
  customer_name: string;
  service_name: string;
  appointment_at: string;
  read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('new-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: user.role !== 'admin' && user.salon_id
            ? `salon_id=eq.${user.salon_id}`
            : undefined,
        },
        (payload) => {
          const appt = payload.new as { id: string; booking_reference: string; appointment_at: string; created_at: string; };
          setNotifications((prev) => [
            {
              id: appt.id,
              booking_reference: appt.booking_reference,
              customer_name: 'New booking',
              service_name: '',
              appointment_at: appt.appointment_at,
              read: false,
              created_at: appt.created_at,
            },
            ...prev.slice(0, 19),
          ]);
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton size="small" onClick={handleOpen} aria-label="Notifications">
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, borderRadius: 2, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <ListItem key={n.id} alignItems="flex-start" sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        New Booking
                      </Typography>
                      <Chip label={n.booking_reference} size="small" variant="outlined" />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(n.appointment_at), 'dd MMM yyyy, HH:mm')}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;
