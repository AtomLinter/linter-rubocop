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
    provider =
      grammarScopes: ['source.ruby', 'source.ruby.rails', 'source.ruby.rspec', 'source.ruby.chef']
      scope: 'file'
      lintOnFly: true
      lint: (textEditor) =>
        additional = atom.config.get('linter-rubocop.additionalArguments')
        return helpers.exec(@executablePath, additional.concat(['-f', 'json', '-s', textEditor.getPath()]),
          {stdin: textEditor.getText()}).then (contents) ->
            console.log(contents)
            return []
