import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

const TabIcon = ({ name }: { name: any }) => (
  <View style={{
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  }}>
    <MaterialCommunityIcons name={name} size={28} color="#000" />
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#6b3be3', // Purple background matching screenshot
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => <TabIcon name="book-open-variant" />,
        }}
      />
      <Tabs.Screen
        name="quest"
        options={{
          tabBarIcon: () => <TabIcon name="square-edit-outline" />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarIcon: () => <TabIcon name="chart-bar" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => <TabIcon name="account-circle-outline" />,
        }}
      />
    </Tabs>
  );
}
