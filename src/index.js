'use babel';

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';
import path from 'path';
import escapeHtml from 'escape-html';
import pluralize from 'pluralize';
import * as helpers from 'atom-linter';

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
    const [message, url] = rawMessage.split(/ \((.*)\)/, 2);
    const { line, column, length } = location;
    const outputToLinter = {
      type: ['refactor', 'convention', 'warning'].includes(severity) ? 'Warning' : 'Error',
      html: formatMessage({ cop_name, message, url }),
      filePath,
    };
    return Object.assign(outputToLinter,
      location && { range: [[line - 1, column - 1], [line - 1, (column + length) - 1]] },
    );
  };

export default {
  activate() {
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
          const cwd = path.dirname(filePath);
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
      lintOnFly: true,
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
        const cwd = path.dirname(filePath);
        const stdin = editor.getText();
        const { stdout, stderr } = await helpers.exec(command[0], command.slice(1), { cwd, stdin, stream: 'both' });
        const { files } = parseFromStd(stdout, stderr);
        const offenses = files && files[0] && files[0].offenses;
        return (offenses || []).map(offense => forwardRubocopToLinter(offense, filePath));
      },
    };
  },
};
