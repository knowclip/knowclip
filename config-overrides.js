const rewireReactHotLoader = require('react-app-rewire-hot-loader');
const rewireDefinePlugin = require('react-app-rewire-define-plugin')

module.exports = function override(config, env) {
  config = rewireDefinePlugin(config, env, {
    'process.env.FLUENTFFMPEG_COV': JSON.stringify(false),
  });
  config = rewireReactHotLoader(config, env);

  config.externals = [
    ...(config.externals || []),
    // 'child_process',
    // 'fs',
  ]

  config.target = 'electron-renderer'

  return config;
}
