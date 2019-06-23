'use babel'

import { exec, findAsync } from 'atom-linter'

function getBaseExecutionOpts(filePath, extraOptions = {}) {
  const baseExecOptions = {
    cwd: atom.project.relativizePath(filePath)[0],
    stream: 'both',
    timeout: 10000,
    uniqueKey: `linter-rubocop::${filePath}`,
  }
  return Object.assign(baseExecOptions, extraOptions)
}

export default class RubocopRunner {
  constructor(config) {
    this.config = config
  }

  async executeRubocop(filePath, args, options = {}) {
    if (this.config.disableWhenNoConfigFile === true) {
      const configFile = await findAsync(filePath, '.rubocop.yml')
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
        getBaseExecutionOpts(filePath, options),
      )
    } catch (e) {
      if (e.message !== 'Process execution timed out') throw e
      atom.notifications.addInfo(
        'Linter-Rubocop: Linter timed out',
        {
          description: 'Make sure you are not running Rubocop with a slow-starting interpreter like JRuby. '
                       + 'If you are still seeing timeouts, consider running your linter `on save` and not `on change`, '
                       + 'or reference https://github.com/AtomLinter/linter-rubocop/issues/202 .',
        },
      )
      return null
    }
    return output
  }
}
