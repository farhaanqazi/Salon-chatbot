import { Box, Skeleton, Stack } from '@mui/material';

interface Props {
  rows?: number;
  columns?: number;
}

const TableSkeleton = ({ rows = 8, columns = 5 }: Props) => (
  <Box>
    <Stack direction="row" spacing={2} mb={1}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={40} sx={{ flex: 1, borderRadius: 1 }} />
      ))}
    </Stack>
    {Array.from({ length: rows }).map((_, i) => (
      <Stack key={i} direction="row" spacing={2} mb={1}>
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} variant="rectangular" height={52} sx={{ flex: 1, borderRadius: 1 }} />
        ))}
      </Stack>
    ))}
  </Box>
);

export default TableSkeleton;
