'use babel'

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
  '--cache', 'false',
]

class CommandBuilder {
  static build(baseCommand, args) {
    if (baseCommand.length !== 0) {
      return baseCommand.split(/\s+/)
        .filter((i) => i)
        .concat(DEFAULT_ARGS)
        .concat(args)
    }
    return null
  }
}

module.exports = CommandBuilder
