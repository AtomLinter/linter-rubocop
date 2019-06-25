'use babel'

const TOP_FILE_RANGE = [[0, 0], [0, 0]]

export default class ErrorFormatter {
  constructor() {
    this.topFileRange = TOP_FILE_RANGE
  }

  format(filePath, message) {
    return [{
      excerpt: `Linter-Rubocop: ${message}`,
      severity: 'error',
      location: {
        file: filePath,
        position: this.topFileRange,
      },
    }]
  }
}
