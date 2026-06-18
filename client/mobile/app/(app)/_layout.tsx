import { Tabs } from 'expo-router';
import { NotebookIcon, UserIcon } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="notebooks"
        options={{
          title: 'Notebooks',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <NotebookIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
