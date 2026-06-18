import { Redirect } from 'expo-router';

export default function Index() {
  // Auth wiring coming later
  return <Redirect href="/login" />;
}
