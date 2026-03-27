import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    tsNodeOpts: { project: './e2e/tsconfig.json' },
  },

  specs: ['./e2e/tests/**/*.spec.ts'],
  exclude: [],

  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'emulator-5554',
      'appium:app': './android/app/build/outputs/apk/release/app-release.apk',
      'appium:appPackage': 'com.duolife.app',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      'appium:uiautomator2ServerLaunchTimeout': 60000,
    } as any,
  ],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: ['appium'],
  port: 4723,

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
};
