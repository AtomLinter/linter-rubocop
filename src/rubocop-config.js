'use babel'

import { exec } from 'atom-linter'

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
]

export default class RubocopConfig {
  constructor(options, editor) {
    this.options = options
    this.editor = editor
  }

  get command() {
    return this.options.command
  }

  set command(value) {
    this.options.command = value
  }

  get disableWhenNoConfigFile() {
    return this.options.disableWhenNoConfigFile
  }

  set disableWhenNoConfigFile(value) {
    this.options.disableWhenNoConfigFile = value
  }

  get useBundler() {
    return this.options.useBundler
  }

  set useBundler(value) {
    this.options.useBundler = value
  }

  async executeRubocop(filePath, args, options = {}) {
    await exec(
      this.baseCommand(args)[0],
      this.baseCommand(args).slice(1),
      Object.assign(this.getBaseExecutionOpts(filePath), options),
    )
  }

  baseCommand(args = []) {
    let cmd
    if (this.options.command.length !== 0) {
      cmd = this.options.command
    } else if (this.options.useBundler || this.detectBundledRubocop()) {
      cmd = `bundle exec ${this.options.command}`
    }
    return cmd.split(/\s+/)
      .filter(i => i)
      .concat(DEFAULT_ARGS)
      .concat(args)
  }

  getBaseExecutionOpts(filePath) {
    const fPath = filePath || this.editor.getPath()
    return {
      cwd: atom.project.relativizePath(fPath)[0],
      stream: 'both',
      timeout: 10000,
      uniqueKey: `linter-rubocop::${fPath}`,
    }
  }

  async detectBundledRubocop() {
    try {
      const command = 'bundle show rubocop'
      const cwd = atom.project.relativizePath(this.editor.getPath())[0]
      await exec(command[0], command.slice(1), { cwd })
      return true
    } catch (e) {
      return false
    }
  }
}
