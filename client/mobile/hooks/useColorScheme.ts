import { useColorScheme as useNativewindColorScheme } from 'nativewind';

export function useColorScheme() {
  const { colorScheme, toggleColorScheme } = useNativewindColorScheme();

  return {
    colorScheme,
    isDarkColorScheme: colorScheme === 'dark',
    toggleColorScheme,
  };
}

export default useColorScheme;
