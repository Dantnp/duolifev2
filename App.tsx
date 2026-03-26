import React, { Component, useEffect, useRef } from 'react';
import { AppState, Platform, StatusBar, Text, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import LearnScreen from './src/screens/LearnScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import AccountScreen from './src/screens/AccountScreen';
import SectionMapScreen from './src/screens/SectionMapScreen';
import SectionQuizScreen from './src/screens/SectionQuizScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import MockExamScreen from './src/screens/MockExamScreen';
import { ThemeProvider, useTheme, COLORS } from './src/context/ThemeContext';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            Please restart the app. If the issue persists, try clearing app data.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  HomeTab:     ['home',          'home-outline'],
  LearnTab:    ['book',          'book-outline'],
  PracticeTab: ['create',        'create-outline'],
  ProgressTab: ['bar-chart',     'bar-chart-outline'],
  AccountTab:  ['person-circle', 'person-circle-outline'],
};

function TabBarIcon({ focused, color, route }: { focused: boolean; color: string; route: string }) {
  const icons = TAB_ICONS[route] || ['ellipse', 'ellipse-outline'];
  return (
    <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
      <Ionicons name={focused ? icons[0] : icons[1]} size={21} color={color} />
    </View>
  );
}

function HomeTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: 58,
          paddingBottom: 5,
          paddingTop: 4,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.blue,
        tabBarInactiveTintColor: '#8D93A5',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon focused={focused} color={color} route={route.name} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="LearnTab" component={LearnScreen} options={{ tabBarLabel: 'Learn' }} />
      <Tab.Screen name="PracticeTab" component={PracticeScreen} options={{ tabBarLabel: 'Practice' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeTabs} />
        <Stack.Screen name="SectionMap" component={SectionMapScreen} />
        <Stack.Screen name="SectionQuiz" component={SectionQuizScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="MockExam" component={MockExamScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    function hideBars() {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
        try {
          NavigationBar.setVisibilityAsync('hidden');
          NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (e) {
          // edge-to-edge mode may not support these
        }
      }
      StatusBar.setBarStyle('light-content');
    }

    hideBars();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        hideBars();
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
