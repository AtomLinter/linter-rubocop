'use babel'

const TOP_FILE_RANGE = [[0, 0], [0, Infinity]]

const SEVERITY_MAPPING = {
  refactor: 'info',
  convention: 'info',
  warning: 'warning',
  error: 'error',
  fatal: 'error',
}

export default class ErrorFormatter {
  constructor() {
    this.topFileRange = TOP_FILE_RANGE
    this.severityMapping = SEVERITY_MAPPING
  }

  format(filePath, message) {
    return [{
      excerpt: `Linter-Rubocop: ${message}`,
      severity: this.severityMapping.error,
      location: {
        file: filePath,
        position: this.topFileRange,
      },
    }]
  }
}
