import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

interface UseageCardProp {
  featureTitle: string;
  maxLimit: number;
  used: number;
}

function UseageCard({ featureTitle, maxLimit, used }: UseageCardProp) {
  return (
    <Card className="w-64">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{featureTitle}</CardTitle>
        <CardDescription>
          {used}/{maxLimit}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={(used / maxLimit) * 100} />
      </CardContent>
    </Card>
  );
}

export { UseageCard };
