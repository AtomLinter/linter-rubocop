'use babel'

import { exec } from 'atom-linter'

const options = Symbol('options')
const editor = Symbol('editor')
const bundledRubocop = Symbol('bundledRubocop')
const baseCommand = Symbol('baseCommand')

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
]

const BUNDLE_SHOW_CMD = 'bundle show rubocop'
const BUNDLE_EXEC_CMD = 'bundle exec'

async function detectBundledRubocop() {
  try {
    const cwd = atom.project.relativizePath(this[editor].getPath())[0]
    await exec(BUNDLE_SHOW_CMD[0], BUNDLE_SHOW_CMD.slice(1), { cwd })
    return true
  } catch (e) {
    return false
  }
}

export default class RubocopConfig {
  constructor(newOptions, newEditor) {
    this[options] = newOptions
    this[editor] = newEditor
    this[bundledRubocop] = detectBundledRubocop()
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

  get editor() {
    return this.editor
  }

  get bundledRubocop() {
    return this[bundledRubocop]
  }

  get baseCommand() {
    return this[baseCommand]
  }

  buildBaseCommand(args = []) {
    let cmd
    if (this[options].useBundler || this[options].bundledRubocop) {
      cmd = `${BUNDLE_EXEC_CMD} ${this[options].command}`
    } else if (this[options].command.length !== 0) {
      cmd = this[options].command
    }

    return cmd.split(/\s+/)
      .filter(i => i)
      .concat(DEFAULT_ARGS)
      .concat(args)
  }
}
