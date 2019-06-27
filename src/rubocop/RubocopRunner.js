'use babel'

import { exec, findAsync } from 'atom-linter'

const CFG_FILE = '.rubocop.yml'

const TIMEOUT_ERROR_MSG = 'Process execution timed out'
const LINTER_TIMEOUT_INFO_MSG = 'Linter-Rubocop: Linter timed out'
const LINTER_TIMEOUT_INFO_DESC = 'Make sure you are not running Rubocop with a slow-starting interpreter like JRuby. '
                                 + 'If you are still seeing timeouts, consider running your linter `on save` and not `on change`, '
                                 + 'or reference https://github.com/AtomLinter/linter-rubocop/issues/202 .'


function buildBaseExecutionOpts(filePath, extraOptions = {}) {
  const baseExecOptions = {
    cwd: atom.project.relativizePath(filePath)[0],
    stream: 'both',
    timeout: 10000,
    uniqueKey: `linter-rubocop::${filePath}`,
    ignoreExitCode: true,
  }
  return Object.assign(baseExecOptions, extraOptions)
}

export default class RubocopRunner {
  constructor(config) {
    this.config = config
  }

  async run(filePath, args, options = {}) {
    if (this.config.disableWhenNoConfigFile === true) {
      const configFile = await findAsync(filePath, CFG_FILE)
      if (configFile === null) {
        return null
      }
    }

    const baseCommand = this.config.baseCommand.concat(args)
    let output
    try {
      output = await exec(
        baseCommand[0],
        baseCommand.slice(1),
        buildBaseExecutionOpts(filePath, options),
      )
    } catch (e) {
      if (e.message !== TIMEOUT_ERROR_MSG) {
        throw e
      }
      atom.notifications.addInfo(LINTER_TIMEOUT_INFO_MSG, { description: LINTER_TIMEOUT_INFO_DESC })
      return null
    }
    return output
  }
}
