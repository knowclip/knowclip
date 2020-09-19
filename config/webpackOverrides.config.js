'use strict';

module.exports = function override(config) {
  config.target = 'electron-renderer'

  return config
}
