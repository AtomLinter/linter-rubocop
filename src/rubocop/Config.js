'use babel'

const theCommand = Symbol('theCommand')
const isDisableWhenNoConfigFile = Symbol('isDisableWhenNoConfigFile')
const isUseBundler = Symbol('isUseBundler')
const baseCommand = Symbol('baseCommand')
const detectProjectSettings = Symbol('detectProjectSettings')

const buildBaseCommand = Symbol('buildBaseCommand')

const BUNDLE_EXEC_CMD = 'bundle exec'

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
  '--cache', 'false',
]

class Config {
  constructor(config = {}) {
    this[theCommand] = config.command
    this[isDisableWhenNoConfigFile] = config.disableWhenNoConfigFile
    this[isUseBundler] = config.useBundler
    this[detectProjectSettings] = config.detectProjectSettings
    this[baseCommand] = this[buildBaseCommand]()
  }

  get command() {
    return this[theCommand]
  }

  set command(value) {
    this[theCommand] = value
  }

  get disableWhenNoConfigFile() {
    return this[isDisableWhenNoConfigFile]
  }

  set disableWhenNoConfigFile(value) {
    this[isDisableWhenNoConfigFile] = value
  }

  get useBundler() {
    return this[isUseBundler]
  }

  set useBundler(value) {
    this[isUseBundler] = value
  }

  get detectProjectSettings() {
    return this[detectProjectSettings]
  }

  set detectProjectSettings(value) {
    this[detectProjectSettings] = value
  }

  get baseCommand() {
    return this[baseCommand]
  }

  static splitCommand(command) {
    return command.split(/\s+/)
      .filter((i) => i)
      .concat(DEFAULT_ARGS)
  }

  [buildBaseCommand]() {
    let cmd
    if (this[isUseBundler]) {
      cmd = `${BUNDLE_EXEC_CMD} ${this[theCommand]}`
    } else if (this[theCommand].length !== 0) {
      cmd = this[theCommand]
    }

    return this.constructor.splitCommand(cmd)
  }
}

module.exports = Config
