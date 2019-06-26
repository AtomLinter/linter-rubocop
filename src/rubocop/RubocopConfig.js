'use babel'

const options = Symbol('options')
const baseCommand = Symbol('baseCommand')

const BUNDLE_EXEC_CMD = 'bundle exec'

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
  '--cache', 'false',
]

export default class RubocopConfig {
  constructor(newOptions) {
    this[options] = newOptions
    this[baseCommand] = this.buildBaseCommand()
  }

  get command() {
    return this[options].command
  }

  set command(value) {
    this[options].command = value
  }

  get disableWhenNoConfigFile() {
    return this[options].disableWhenNoConfigFile
  }

  set disableWhenNoConfigFile(value) {
    this[options].disableWhenNoConfigFile = value
  }

  get useBundler() {
    return this[options].useBundler
  }

  set useBundler(value) {
    this[options].useBundler = value
  }

  get baseCommand() {
    return this[baseCommand]
  }

  buildBaseCommand() {
    let cmd
    if (this[options].useBundler) {
      cmd = `${BUNDLE_EXEC_CMD} ${this[options].command}`
    } else if (this[options].command.length !== 0) {
      cmd = this[options].command
    }

    return cmd.split(/\s+/)
      .filter(i => i)
      .concat(DEFAULT_ARGS)
  }
}
