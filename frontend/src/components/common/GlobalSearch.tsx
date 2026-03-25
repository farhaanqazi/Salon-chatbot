import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  InputBase, Box, Paper, List, ListItem, ListItemText,
  ListItemIcon, Typography, CircularProgress, useTheme, alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/apiClient';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'appointment' | 'customer';
  title: string;
  subtitle: string;
  navigateTo: string;
}

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthStore();
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const params: Record<string, string> = { q: debouncedQuery };
      if (user?.role !== 'admin' && user?.salon_id) {
        params.salon_id = user.salon_id;
      }
      const { data } = await apiClient.get('/api/v1/search', { params });
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 10000,
  });

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.navigateTo);
    setQuery('');
    setOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.75,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha('#FFFFFF', 0.06)
            : alpha('#000000', 0.05),
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <SearchIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
        <InputBase
          inputRef={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search appointments, customers… (⌘K)"
          fullWidth
          sx={{ fontSize: 14 }}
        />
        {isLoading && <CircularProgress size={16} sx={{ flexShrink: 0 }} />}
      </Box>

      {open && debouncedQuery.length >= 2 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            zIndex: 9999,
            maxHeight: 360,
            overflowY: 'auto',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {!results || results.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results found for "{debouncedQuery}"
              </Typography>
            </Box>
          ) : (
            <List dense>
              {results.map((result) => (
                <ListItem
                  key={result.id}
                  component="div"
                  onClick={() => handleSelect(result)}
                  sx={{
                    borderRadius: 1,
                    mx: 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {result.type === 'appointment'
                      ? <CalendarMonthIcon fontSize="small" color="primary" />
                      : <PersonIcon fontSize="small" color="secondary" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.subtitle}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {open && (
        <Box
          sx={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          onClick={() => { setOpen(false); setQuery(''); }}
        />
      )}
    </Box>
  );
};

export default GlobalSearch;
