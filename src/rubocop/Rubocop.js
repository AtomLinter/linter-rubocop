'use babel'

import pluralize from 'pluralize'
import parseFromStd from '../helpers/std-parser'
import RubocopRunner from './RubocopRunner'
import ErrorFormatter from '../ErrorFormatter'
import OffenseFormatter from './OffenseFormatter'

const PARSE_ERROR_MSG = 'Rubocop: Parse error'
const UNEXPECTED_ERROR_MSG = 'Rubocop: Unexpected error'
const UNDEF_VERSION_ERROR_MSG = 'Unable to get rubocop version from linting output results.'
const NO_FIXES_INFO_MSG = 'Linter-Rubocop: No fixes were made'

export default class Rubocop {
  constructor(config) {
    this.config = config
  }

  async autocorrect(filePath) {
    if (!filePath) { return }

    try {
      const output = await new RubocopRunner(this.config).run(filePath, ['--auto-correct', filePath])
      try {
        // Process was canceled by newer process or there is nothing to parse
        if (output === null) { return }

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
          if (corrections < offenseCount) {
            atom.notifications.addInfo(message)
          } else {
            atom.notifications.addSuccess(message)
          }
        }
      } catch (e) {
        atom.notifications.addError(PARSE_ERROR_MSG, { description: e.message })
      }
    } catch (e) {
      atom.notifications.addError(UNEXPECTED_ERROR_MSG, { description: e.message })
    }
  }

  async analyze(text, filePath) {
    if (!filePath) { return null }
    try {
      const output = await new RubocopRunner(this.config).run(filePath, ['--stdin', filePath], { stdin: text })
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
          offense => new OffenseFormatter().format(rubocopVersion, offense, filePath),
        )
      } catch (e) {
        return new ErrorFormatter().format(filePath, e.message)
      }
    } catch (e) {
      atom.notifications.addError(UNEXPECTED_ERROR_MSG, { description: e.message })
      return null
    }
  }
}
