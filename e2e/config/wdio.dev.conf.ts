/**
 * Config variant for Expo dev builds (expo-dev-client).
 * Use when running `npx expo run:android` or a custom dev build APK.
 */
import { config as baseConfig } from './wdio.conf';

export const config: typeof baseConfig = {
  ...baseConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'emulator-5554',
      // Point to the Expo dev build APK
      'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
      'appium:appPackage': 'com.duolife.app',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      // Extra wait for Expo dev build JS bundle load
      'appium:appWaitDuration': 30000,
    } as any,
  ],
};
