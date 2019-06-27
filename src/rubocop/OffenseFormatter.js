'use babel'

import { satisfies } from 'semver'
import getRuleDocumentation from './helpers/documentation-cache'

import ErrorFormatter from '../ErrorFormatter'

const SEVERITY_MAPPING = {
  refactor: 'info',
  convention: 'info',
  warning: 'warning',
  error: 'error',
  fatal: 'error',
}

const HASCOPNAME_VERSION_RANGE = '>=0.52.0 <0.68.0'
const RULE_MATCH_REGEX = /https:\/\/.*#(.*)/g

export default class OffenseFormatter extends ErrorFormatter {
  format(version, {
    message: rawMessage, location, severity, cop_name: copName,
  }, filePath) {
    const hasCopName = satisfies(version, HASCOPNAME_VERSION_RANGE)
    const [excerpt, url] = rawMessage.split(/ \((.*)\)/, 2)
    let position
    if (location) {
      const { line, column, length } = location
      position = [[line - 1, column - 1], [line - 1, (length + column) - 1]]
    } else {
      position = this.topFileRange
    }

    const linterMessage = {
      url,
      excerpt: hasCopName ? excerpt : `${copName}: ${excerpt}`,
      severity: SEVERITY_MAPPING[severity] || SEVERITY_MAPPING.error,
      location: {
        file: filePath,
        position,
      },
    }

    if (url) {
      const ruleMatch = RULE_MATCH_REGEX.exec(url)
      if (ruleMatch) {
        const rule = ruleMatch[1]
        getRuleDocumentation(rule).then((documentation) => {
          if (documentation) {
            linterMessage.description = documentation
          }
        })
      }
    }

    return linterMessage
  }
}
