import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

interface UsageCardProp {
  featureTitle: string;
  maxLimit: number;
  used: number;
  format?: 'bytes' | 'number';
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function UsageCard({ featureTitle, maxLimit, used, format = 'number' }: UsageCardProp) {
  const displayUsed = format === 'bytes' ? formatBytes(used) : used;
  const displayLimit = format === 'bytes' ? formatBytes(maxLimit) : maxLimit;

  return (
    <Card className="w-64">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{featureTitle}</CardTitle>
        <CardDescription>
          {displayUsed}/{displayLimit}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={maxLimit > 0 ? (used / maxLimit) * 100 : 0} />
      </CardContent>
    </Card>
  );
}

export { UsageCard };
