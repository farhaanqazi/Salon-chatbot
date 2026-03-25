import { Chip } from '@mui/material';
import type { AppointmentStatus } from '../../types';

interface AppointmentStatusChipProps {
  status: AppointmentStatus;
}

const statusConfig: Record<AppointmentStatus, { label: string; color: 'default' | 'primary' | 'success' | 'error' | 'warning' }> = {
  pending: { label: 'Pending', color: 'default' },
  confirmed: { label: 'Confirmed', color: 'primary' },
  completed: { label: 'Completed', color: 'success' },
  cancelled_by_client: { label: 'Cancelled by Client', color: 'error' },
  cancelled_by_salon: { label: 'Cancelled by Salon', color: 'error' },
  cancelled_by_reception: { label: 'Cancelled by Reception', color: 'error' },
  cancelled_closure: { label: 'Cancelled Closure', color: 'error' },
  no_show: { label: 'No Show', color: 'warning' },
};

const AppointmentStatusChip = ({ status }: AppointmentStatusChipProps) => {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
};

export default AppointmentStatusChip;
