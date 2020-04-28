'use babel'

import { findAsync } from 'atom-linter'
import pluralize from 'pluralize'
import parseFromStd from '../helpers/parseFromStd'

import CommandBuilder from './CommandBuilder'
import Runner from './Runner'
import ErrorFormatter from './formatters/ErrorFormatter'
import OffenseFormatter from './formatters/OffenseFormatter'

const CONFIG_FILE = '.rubocop.yml'

const PARSE_ERROR_MSG = 'Rubocop: Parse error'
const UNEXPECTED_ERROR_MSG = 'Rubocop: Unexpected error'
const UNDEF_VERSION_ERROR_MSG = 'Unable to get rubocop version from linting output results.'
const NO_FIXES_INFO_MSG = 'Linter-Rubocop: No fixes were made'

class Rubocop {
  constructor(config) {
    this.config = config
    this.offenseFormatter = new OffenseFormatter()
    this.errorFormatter = new ErrorFormatter()
  }

  setConfig(newConfig) {
    this.config = newConfig
  }

  async configFileExists(filePath) {
    if (this.config.disableWhenNoConfigFile === true) {
      return await findAsync(filePath, CONFIG_FILE) !== null
    }
    return true
  }

  async autocorrect(cwd, filePath, onSave = false) {
    if (!filePath || !await this.configFileExists(filePath)) {
      return
    }

    try {
      const output = await Runner.runSync(
        cwd,
        CommandBuilder.build(this.config.command, ['--auto-correct', filePath]),
      )
      try {
        const {
          files,
          summary: { offense_count: offenseCount },
        } = parseFromStd(output.stdout, output.stderr)

        const offenses = files && files[0] && files[0].offenses

        if (offenseCount === 0) {
          atom.notifications.addInfo(NO_FIXES_INFO_MSG)
        } else {
          const corrections = Object.values(offenses)
            .reduce((off, { corrected }) => off + corrected, 0)
          const message = `Linter-Rubocop: Fixed ${pluralize('offenses', corrections, true)} of ${offenseCount}`
          if (!onSave) {
            if (corrections < offenseCount) {
              atom.notifications.addInfo(message)
            } else {
              atom.notifications.addSuccess(message)
            }
          }
        }
      } catch (e) {
        atom.notifications.addError(PARSE_ERROR_MSG, { description: e.message })
      }
    } catch (e) {
      atom.notifications.addError(UNEXPECTED_ERROR_MSG, { description: e.message })
    }
  }

  async analyze(text, cwd, filePath) {
    if (!filePath || !await this.configFileExists(filePath)) {
      return null
    }

    try {
      const output = await Runner.run(
        cwd,
        CommandBuilder.build(this.config.command, ['--stdin', filePath]),
        { stdin: text },
      )
      try {
        if (output === null) { return null }

        const {
          metadata: { rubocop_version: rubocopVersion }, files,
        } = parseFromStd(output.stdout, output.stderr)

        if (rubocopVersion == null || rubocopVersion === '') {
          throw new Error(UNDEF_VERSION_ERROR_MSG)
        }

        const offenses = files && files[0] && files[0].offenses

        return (offenses || []).map(
          (offense) => this.offenseFormatter.format(rubocopVersion, offense, filePath),
        )
      } catch (e) {
        return this.errorFormatter.format(filePath, e.message)
      }
    } catch (e) {
      atom.notifications.addError(UNEXPECTED_ERROR_MSG, { description: e.message })
      return null
    }
  }
}

module.exports = Rubocop
