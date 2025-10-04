import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@shopify/restyle';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Redux Store
import { store, persistor } from './store/store';

// Theme
import { theme, paperTheme } from './theme/theme';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import BiometricSetupScreen from './screens/auth/BiometricSetupScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import ExpenseListScreen from './screens/expenses/ExpenseListScreen';
import CreateExpenseScreen from './screens/expenses/CreateExpenseScreen';
import CameraScreen from './screens/camera/CameraScreen';
import ExpenseDetailsScreen from './screens/expenses/ExpenseDetailsScreen';
import ApprovalListScreen from './screens/approvals/ApprovalListScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import NotificationsScreen from './screens/notifications/NotificationsScreen';

// Components
import LoadingScreen from './components/LoadingScreen';

// Hooks
import { useAuth } from './hooks/useAuth';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Expenses':
              iconName = 'receipt';
              break;
            case 'Camera':
              iconName = 'camera-alt';
              break;
            case 'Approvals':
              iconName = 'approval';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpenseListScreen}
        options={{ title: 'Expenses' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ 
          title: 'Capture',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={{
                top: -30,
                justifyContent: 'center',
                alignItems: 'center',
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: theme.colors.primary,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Icon name="camera-alt" size={30} color="white" />
            </TouchableOpacity>
          )
        }}
      />
      <Tab.Screen 
        name="Approvals" 
        component={ApprovalListScreen}
        options={{ title: 'Approvals' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="CreateExpense" 
            component={CreateExpenseScreen}
            options={{ 
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen 
            name="ExpenseDetails" 
            component={ExpenseDetailsScreen}
            options={{ 
              presentation: 'card',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              presentation: 'card',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              presentation: 'card',
              gestureEnabled: true,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

// Root App Component
const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<SplashScreen />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider theme={theme}>
                <PaperProvider theme={paperTheme}>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                </PaperProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;