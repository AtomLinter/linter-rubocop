{CompositeDisposable} = require 'atom'

module.exports =
  config:
    executablePath:
      type: 'string'
      title: 'Executable Path'
      default: 'rubocop'
    additionalArguments:
      title: 'Additional Arguments'
      type: 'array'
      default: []
      items:
        type: 'string'

  activate: ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.config.observe('linter-rubocop.executablePath', (executablePath) =>
      @executablePath = executablePath
    )

  deactivate: ->
    @subscriptions.dispose()

  provideLinter: ->
    helpers = require('atom-linter')
    warnings = new Set(['refactor', 'convention', 'warning'])
    provider =
      grammarScopes: ['source.ruby', 'source.ruby.rails', 'source.ruby.rspec', 'source.ruby.chef']
      scope: 'file'
      lintOnFly: true
      lint: (textEditor) =>
        filePath = textEditor.getPath()
        additional = atom.config.get('linter-rubocop.additionalArguments')
        return helpers.exec(@executablePath, additional.concat(['-f', 'json', '-s', textEditor.getPath()]),
          {stdin: textEditor.getText()}).then(JSON.parse).then (contents) ->
            return contents.files[0].offenses.map (error) ->
              {line, column, length} = error.location || {line: 1, column: 1, length: 0}
              return {
                type: if warnings.has(error.severity) then 'Warning' else 'Error'
                text: (if error.cop_name then error.cop_name + ' - ' else '') + (if error.message then error.message else 'Unknown Error')
                filePath: filePath
                range: [[line - 1, column - 1], [line - 1, column + length - 1]]
              }
