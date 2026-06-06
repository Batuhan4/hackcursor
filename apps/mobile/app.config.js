const appJson = require('./app.json');

module.exports = () => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      ios: {
        ...appJson.expo.ios,
        config: {
          googleMapsApiKey,
        },
      },
      android: {
        ...appJson.expo.android,
        config: {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        },
      },
    },
  };
};
