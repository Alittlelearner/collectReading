const { expo } = require('./app.json');

module.exports = {
  ...expo,
  extra: {
    ...(expo.extra ?? {}),
    eas: {
      ...((expo.extra && expo.extra.eas) ?? {}),
      projectId: 'fda23fa8-4216-4af8-b186-0324687c73b8',
    },
  },
  ios: {
    ...expo.ios,
    bundleIdentifier: 'com.liamred.bookmarktracker',
  },
  android: {
    ...expo.android,
    package: 'com.liamred.bookmarktracker',
  },
  plugins: [
    ...(expo.plugins ?? []),
    [
      'expo-notifications',
      {
        icon: './src/assets/icon.png',
        color: '#0f172a',
        defaultChannel: 'default',
      },
    ],
  ],
};
