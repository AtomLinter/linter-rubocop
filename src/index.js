'use babel';

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';
import path from 'path';
import escapeHtml from 'escape-html';
import pluralize from 'pluralize';
import * as helpers from 'atom-linter';
import cheerioReq from 'cheerio-req';

const DEFAULT_ARGS = [
  '--cache', 'false',
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
];

const formatMessage = ({ message, cop_name: copName, url }) => {
  const formattedMessage = escapeHtml(message || 'Unknown Error');
  let formattedCopName = '';
  if (copName && url) {
    formattedCopName = ` (<a href="${escapeHtml(url)}">${escapeHtml(copName)}</a>)`;
  } else if (copName) {
    formattedCopName = ` (${escapeHtml(copName)})`;
  }
  return formattedMessage + formattedCopName;
};

const parseFromStd = (stdout, stderr) => {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    // continue regardless of error
  }
  if (typeof parsed !== 'object') { throw new Error(stderr || stdout); }
  return parsed;
};

const forwardRubocopToLinter =
  ({ message: rawMessage, location, severity, cop_name }, filePath) => {
    console.debug(...arguments);
    // refactor, convention, warning, error and fatal
    const [description, url] = rawMessage.split(/ \((.*)\)/, 2);
    const { line, column, length } = location;

    const severityMapping = {
      refactor: 'info',
      convention: 'info',
      warning: 'warning',
      error: 'error',
      fatal: 'error',
    };

    function takeWhile(source, predicate) {
      const result = [];
      const length = source.length;
      let i = 0;

      while (i < length && predicate(source[i], i)) {
        result.push(source[i]);
        i++;
      }

      return result;
    }


    const getMarkDown = async () => {
      const [urlz, ...anchor] = url.split('#');
      const request = require('request-promise');
      const body = await request.get('https://raw.githubusercontent.com/bbatsov/ruby-style-guide/master/README.md');
      const byLine = body.split('\n');
      const string = `"${anchor}"`;
      const regex = new RegExp(string, 'g');

      // not efficient but itll do
      const startingLine = byLine.indexOf(byLine.find(l => l.match(regex)));
      const [firstLine, ...segment] = byLine.slice(startingLine);
      const lines = takeWhile(segment, l => !l.match(/\* <a name=/));
      // if (line.length > 100) { throw 'Something is fucked' }
      return lines.join('\n');
    };



    const newOutput = {
      url,
      severity: severityMapping[severity],
      description: url ? getMarkDown : "Syntax error",
      excerpt: [cop_name, description].join(' -- '),
    };

    //
    // let markdown
    // request(, (error, response, body) => {
    //   if (error) { return; }
    //   console.log('hello')
    //   const byLine = body.split('\n')
    //   const string = `"${anchor}"`
    //   const regex = new RegExp(string, "g");
    //
    //   //not efficient but itll do
    //   const startingLine = byLine.indexOf(byLine.find(line => line.match(regex)))
    //   const [firstLine, ...segment] = byLine.slice(startingLine)
    //   const lines = takeWhile(segment, l => !l.match(/\* <a name=/))
    //   if (line.length > 100) { console.log('Something is fucked'); }
    //   markdown = firstLine.concat(lines)
    //
    //   const newOutput = {
    //     url,
    //     severity: severityMapping[severity],
    //     description,
    //     excerpt: cop_name,
    //   };
    // });


    // <a name="user-content-underscore-unused-vars"></a>


    // const outputToLinter = {
    //   type: ['refactor', 'convention', 'warning'].includes(severity) ? 'Warning' : 'Error',
    //   html: formatMessage({ cop_name, description, url }),
    //   filePath,
    // };
    // return Object.assign(outputToLinter,
    //   location && { range: [[line - 1, column - 1], [line - 1, (column + length) - 1]] },
    // );
    if (location) {
      newOutput.location = {
        file: filePath,
        position: [[line - 1, column - 1], [line - 1, (column + length) - 1]],
      };
    }
    return newOutput;
  };

export default {
  activate() {
    console.log(atom.project.getPaths())
    require('atom-package-deps').install('linter-rubocop', true);

    this.subscriptions = new CompositeDisposable();

    // Register fix command
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'linter-rubocop:fix-file': async () => {
          const textEditor = atom.workspace.getActiveTextEditor();

          if (!atom.workspace.isTextEditor(textEditor) || textEditor.isModified()) {
            // Abort for invalid or unsaved text editors
            return atom.notifications.addError('Linter-Rubocop: Please save before fixing');
          }

          const filePath = textEditor.getPath();
          const command = this.command
                              .split(/\s+/)
                              .filter(i => i)
                              .concat(DEFAULT_ARGS, '--auto-correct', filePath);
          const cwd = atom.project.getPaths()[0];
          const { stdout, stderr } = await helpers.exec(command[0], command.slice(1), { cwd, stream: 'both' });
          const { summary: { offense_count: offenseCount } } = parseFromStd(stdout, stderr);
          return offenseCount === 0 ?
            atom.notifications.addInfo('Linter-Rubocop: No fixes were made') :
            atom.notifications.addSuccess(`Linter-Rubocop: Fixed ${pluralize('offenses', offenseCount, true)}`);
        },
      }),
    );

    // Config observers
    this.subscriptions.add(
      atom.config.observe('linter-rubocop.command', (value) => {
        this.command = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-rubocop.disableWhenNoConfigFile', (value) => {
        this.disableWhenNoConfigFile = value;
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'RuboCop',
      grammarScopes: [
        'source.ruby',
        'source.ruby.rails',
        'source.ruby.rspec',
        'source.ruby.chef',
      ],
      scope: 'file',
      lintsOnChange: true,
      lint: async (editor) => {
        const filePath = editor.getPath();

        if (this.disableWhenNoConfigFile === true) {
          const config = await helpers.findAsync(filePath, '.rubocop.yml');
          if (config === null) {
            return [];
          }
        }

        const command = this.command
                            .split(/\s+/)
                            .filter(i => i)
                            .concat(DEFAULT_ARGS, '--stdin', filePath);
        const cwd = atom.project.getPaths()[0]
        const stdin = editor.getText();
        const { stdout, stderr } = await helpers.exec(command[0], command.slice(1), { cwd, stdin, stream: 'both' });
        const { files } = parseFromStd(stdout, stderr);
        const offenses = files && files[0] && files[0].offenses;
        return (offenses || []).map(offense => forwardRubocopToLinter(offense, filePath));
      },
    };
  },
};
