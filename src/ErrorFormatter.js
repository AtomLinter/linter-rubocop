'use babel'

import { generateRange } from 'atom-linter'

const editor = Symbol('editor')

export default class ErrorFormatter {
  constructor(newEditor) {
    this[editor] = newEditor
  }

  toLinter(message) {
    return [{
      excerpt: `Linter-Rubocop: ${message}`,
      severity: 'error',
      location: {
        file: this[editor].getPath(),
        position: generateRange(this[editor], 0),
      },
    }]
  }
}
