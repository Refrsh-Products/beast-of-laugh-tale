import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isLoggedIn } = useAuth();
  // The root layout gates rendering on session hydration, so by the time this
  // mounts `isLoggedIn` reflects the persisted session.
  return <Redirect href={isLoggedIn ? '/notebooks' : '/login'} />;
}
