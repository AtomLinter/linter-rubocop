'use babel'

import path from 'path'
import { exec, findAsync } from 'atom-linter'

const CONFIG_FILE = '.rubocop.yml'

const TIMEOUT_ERROR_MSG = 'Process execution timed out'
const LINTER_TIMEOUT_MSG = 'Linter-Rubocop: Linter timed out'
const LINTER_TIMEOUT_DESC = 'Make sure you are not running Rubocop with a slow-starting interpreter like JRuby. '
                            + 'If you are still seeing timeouts, consider running your linter `on save` and not `on change`, '
                            + 'or reference https://github.com/AtomLinter/linter-rubocop/issues/202 .'


function buildExecOptions(filePath, extraOptions = {}) {
  const baseOptions = {
    cwd: atom.project.relativizePath(filePath)[0] || path.dirname(filePath),
    stream: 'both',
    timeout: 10000,
    uniqueKey: `linter-rubocop::${filePath}`,
    ignoreExitCode: true,
  }
  return Object.assign(baseOptions, extraOptions)
}

export default class RubocopRunner {
  constructor(config) {
    this.config = config
  }

  async run(filePath, args, options = {}) {
    if (this.config.disableWhenNoConfigFile === true) {
      const configFile = await findAsync(filePath, CONFIG_FILE)
      if (configFile === null) {
        return null
      }
    }

    const command = this.config.baseCommand.concat(args)
    let output
    try {
      output = await exec(
        command[0],
        command.slice(1),
        buildExecOptions(filePath, options),
      )
    } catch (e) {
      if (e.message !== TIMEOUT_ERROR_MSG) {
        throw e
      }
      atom.notifications.addInfo(LINTER_TIMEOUT_MSG, { description: LINTER_TIMEOUT_DESC })
      return null
    }
    return output
  }
}
