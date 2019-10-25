'use babel'

const theCommand = Symbol('theCommand')
const isDisableWhenNoConfigFile = Symbol('isDisableWhenNoConfigFile')
const isUseBundler = Symbol('isUseBundler')
const baseCommand = Symbol('baseCommand')

const buildBaseCommand = Symbol('buildBaseCommand')

const BUNDLE_EXEC_CMD = 'bundle exec'

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
  '--cache', 'false',
]

class Config {
  constructor({ command, disableWhenNoConfigFile, useBundler }) {
    this[theCommand] = command
    this[isDisableWhenNoConfigFile] = disableWhenNoConfigFile
    this[isUseBundler] = useBundler
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

  get baseCommand() {
    return this[baseCommand]
  }

  [buildBaseCommand]() {
    let cmd
    if (this[isUseBundler]) {
      cmd = `${BUNDLE_EXEC_CMD} ${this[theCommand]}`
    } else if (this[theCommand].length !== 0) {
      cmd = this[theCommand]
    }

    return cmd.split(/\s+/)
      .filter((i) => i)
      .concat(DEFAULT_ARGS)
  }
}

module.exports = Config
