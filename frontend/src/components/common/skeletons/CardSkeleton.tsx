import { Card, CardContent, Skeleton, Stack } from '@mui/material';

const CardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="text" width="60%" height={48} sx={{ mt: 1 }} />
      <Stack direction="row" spacing={1} mt={2}>
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
      </Stack>
    </CardContent>
  </Card>
);

export default CardSkeleton;
