const { withAppBuildGradle } = require('@expo/config-plugins');

const withCustomApkName = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents += `
        android.applicationVariants.all { variant ->
            variant.outputs.all {
                outputFileName = "decoflow-studio.apk"
            }
        }
      `;
        } else {
            throw new Error('Cannot apply custom APK name because the build.gradle is not groovy');
        }
        return config;
    });
};

module.exports = withCustomApkName;
