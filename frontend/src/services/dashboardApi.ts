/**
 * Dashboard Data API Service
 * 
 * Fetches real-time data from Supabase via FastAPI backend
 * Mirrors the patterns from existing useKpis.ts
 */

import apiClient from '../services/apiClient';
import type { Appointment } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  total_salons: number;
  total_users: number;
  todays_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  no_shows: number;
}

export interface DashboardAppointment {
  id: string;
  customer_name: string;
  service_name: string;
  staff_name: string | null;
  appointment_at: string;
  status: string;
  phone_number: string | null;
}

export interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'salon_owner' | 'reception';
  is_active: boolean;
}

export interface WeeklyRevenue {
  day: string;
  value: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch dashboard KPIs
 * Uses existing backend endpoint /api/v1/analytics/kpis
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/api/v1/analytics/kpis');
  return data;
};

/**
 * Fetch today's appointments for a salon
 */
export const fetchTodayAppointments = async (salonId: string): Promise<DashboardAppointment[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await apiClient.get<{ data: Appointment[] }>('/api/v1/appointments', {
    params: {
      salon_id: salonId,
      date_from: `${today}T00:00:00`,
      date_to: `${today}T23:59:59`,
    },
  });

  // Transform to dashboard-friendly format
  return data.data.map(apt => ({
    id: apt.id,
    customer_name: apt.customer?.display_name || apt.customer?.phone_number || 'Unknown',
    service_name: apt.service?.name || 'Unknown Service',
    staff_name: null, // Backend doesn't include staff in list endpoint yet
    appointment_at: apt.appointment_at,
    status: apt.status,
    phone_number: apt.customer?.phone_number || null,
  }));
};

/**
 * Fetch staff members for a salon
 */
export const fetchStaffBySalon = async (salonId: string): Promise<StaffMember[]> => {
  const { data } = await apiClient.get<{ data: StaffMember[] }>('/api/v1/users', {
    params: { salon_id: salonId },
  });
  return data.data;
};

/**
 * Fetch all appointments for revenue calculation
 * This is a simplified version - in production you'd have a dedicated revenue endpoint
 */
export const fetchAppointmentsForRevenue = async (
  salonId: string,
  fromDate: string,
  toDate: string
): Promise<Appointment[]> => {
  const { data } = await apiClient.get<{ data: Appointment[] }>('/api/v1/appointments', {
    params: {
      salon_id: salonId,
      date_from: fromDate,
      date_to: toDate,
      status: 'completed', // Only count completed appointments for revenue
    },
  });
  return data.data;
};
