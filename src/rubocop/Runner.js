'use babel'

import path from 'path'
import childProcess from 'child_process'
import { exec } from 'atom-linter'

const TIMEOUT_ERROR_MSG = 'Process execution timed out'
const LINTER_TIMEOUT_MSG = 'Linter-Rubocop: Linter timed out'
const LINTER_TIMEOUT_DESC = 'Make sure you are not running Rubocop with a slow-starting interpreter like JRuby. '
                            + 'If you are still seeing timeouts, consider running your linter `on save` and not `on change`, '
                            + 'or reference https://github.com/AtomLinter/linter-rubocop/issues/202 .'

function currentDirectory(filePath) {
  return atom.project.relativizePath(filePath)[0] || path.dirname(filePath)
}

function errorHandler(e) {
  if (e.message !== TIMEOUT_ERROR_MSG) {
    throw e
  }
  atom.notifications.addInfo(LINTER_TIMEOUT_MSG, { description: LINTER_TIMEOUT_DESC })
}

export default class Runner {
  constructor(config) {
    this.config = config
  }

  runSync(filePath, args, options = {}) {
    const cwd = currentDirectory(filePath)

    const command = this.config.baseCommand.concat(args)
    const output = childProcess.spawnSync(
      command[0],
      command.slice(1),
      {
        cwd,
        shell:
          process.platform === 'win32'
          || process.platform === 'win64',
        ...options,
      },
    )

    if (output.error) {
      errorHandler(output.error)
      return null
    }

    return output
  }

  async run(filePath, args, options = {}) {
    const command = this.config.baseCommand.concat(args)
    let output
    try {
      output = await exec(
        command[0],
        command.slice(1),
        {
          cwd: currentDirectory(filePath),
          stream: 'both',
          timeout: 10000,
          uniqueKey: `linter-rubocop::${filePath}`,
          ignoreExitCode: true,
          ...options,
        },
      )
    } catch (e) {
      errorHandler(e)
      return null
    }

    return output
  }
}
