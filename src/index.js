const path = require('path');
const escapeHtml = require('escape-html');
const pluralize = require('pluralize');
const helpers = require('atom-linter');

const COMMAND_CONFIG_KEY = 'linter-rubocop.command';
const DISABLE_CONFIG_KEY = 'linter-rubocop.disableWhenNoConfigFile';
const OLD_EXEC_PATH_CONFIG_KEY = 'linter-rubocop.executablePath';
const OLD_ARGS_CONFIG_KEY = 'linter-rubocop.additionalArguments';
const DEFAULT_LOCATION = { line: 1, column: 1, length: 0 };
const DEFAULT_ARGS = [
  '--cache', 'false',
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
];
const AUTOCORRECT_ARG = '--auto-correct';
const STD_IN_ARG = '--stdin';

const DEFAULT_MESSAGE = 'Unknown Error';
const WARNINGS = new Set(['refactor', 'convention', 'warning']);

const convertOldConfig = () => {
  const execPath = atom.config.get(OLD_EXEC_PATH_CONFIG_KEY);
  const args = atom.config.get(OLD_ARGS_CONFIG_KEY);
  if (!execPath && !args) { return null; }
  atom.config.set(COMMAND_CONFIG_KEY, `${execPath || ''} ${args || ''}`.trim());
  atom.config.set(OLD_EXEC_PATH_CONFIG_KEY, undefined);
  return atom.config.set(OLD_ARGS_CONFIG_KEY, undefined);
};

// TODO: figure out how to best handle, also, ESLint telling me conflicting things
// eslint-disable-next-line no-confusing-arrow
const guard = (value, transform) => (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;

const extractUrl = (parsedMessage) => {
  const [message, url] = Array.from(parsedMessage.split(/ \((.*)\)/, 2));
  return { message, url };
};

const formatMessage = ({ message, cop_name: copName, url }) => {
  const formattedMessage = escapeHtml(message || DEFAULT_MESSAGE);
  let formattedCopName = '';
  if (copName != null && url != null) {
    formattedCopName = ` (<a href="${escapeHtml(url)}">${escapeHtml(copName)}</a>)`;
  } else if (copName != null) {
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
    const { message, url } = extractUrl(rawMessage);
    const { line, column, length } = location || DEFAULT_LOCATION;
    return {
      type: WARNINGS.has(severity) ? 'Warning' : 'Error',
      html: formatMessage({ cop_name, message, url }),
      filePath,
      range: [[line - 1, column - 1], [line - 1, (column + length) - 1]],
    };
  };

const lint = function lint(editor) {
  const filePath = editor.getPath();
  convertOldConfig();
  const command = atom.config.get(COMMAND_CONFIG_KEY)
                      .split(/\s+/)
                      .filter(i => i)
                      .concat(DEFAULT_ARGS, STD_IN_ARG, filePath);
  if (atom.config.get(DISABLE_CONFIG_KEY) === true) {
    const config = helpers.find(filePath, '.rubocop.yml');
    if (config === null) { return []; }
  }
  const cwd = path.dirname(helpers.find(filePath, '.'));
  const stdin = editor.getText();
  const stream = 'both';
  return helpers.exec(command[0], command.slice(1), { cwd, stdin, stream })
                .then(({ stdout, stderr }) => {
                  const parsed = parseFromStd(stdout, stderr);
                  return (guard(guard(parsed.files, x1 => x1[0]), x => x.offenses) || [])
                         .map(offense => forwardRubocopToLinter(offense, filePath));
                });
};

const linter = {
  name: 'RuboCop',
  grammarScopes: [
    'source.ruby',
    'source.ruby.rails',
    'source.ruby.rspec',
    'source.ruby.chef',
  ],
  scope: 'file',
  lintOnFly: true,
  lint,
};

const autoCorrectFile = () => {
  const textEditor = atom.workspace.getActiveTextEditor();
  const filePath = textEditor.getPath();
  const command = atom.config.get(COMMAND_CONFIG_KEY)
                      .split(/\s+/)
                      .filter(i => i)
                      .concat(DEFAULT_ARGS, AUTOCORRECT_ARG, filePath);

  if (!textEditor || textEditor.isModified()) {
    // Abort for invalid or unsaved text editors
    atom.notifications.addError('Linter-Rubocop: Please save before fixing');
    return;
  }

  const cwd = path.dirname(helpers.find(filePath, '.'));
  const stream = 'both';
  helpers.exec(command[0], command.slice(1), { cwd, stream }).then(({ stdout, stderr }) => {
    const { summary: { offense_count: offenseCount } } = parseFromStd(stdout, stderr);
    return offenseCount === 0 ?
      atom.notifications.addInfo('Linter-Rubocop: No fixes were made') :
      atom.notifications.addSuccess(`Linter-Rubocop: Fixed ${pluralize('offenses', offenseCount, true)}`);
  });
};


atom.commands.add('atom-text-editor', 'linter-rubocop:fix-file', autoCorrectFile);

module.exports = {
  config: {
    command: {
      type: 'string',
      title: 'Command',
      default: 'rubocop',
      description: '\n' +
                   'This is the absolute path to your `rubocop` command. You may need to run \n' +
                   '`which rubocop` or `rbenv which rubocop` to find this. Examples: \n' +
                   '`/usr/local/bin/rubocop` or `/usr/local/bin/bundle exec rubocop --config \n' +
                   '/my/rubocop.yml`.\n',
    },
    disableWhenNoConfigFile: {
      type: 'boolean',
      title: 'Disable when no .rubocop.yml config file is found',
      default: false,
      description: '\n' +
                   'Only run linter if a RuboCop config file is found somewhere in the path \n' +
                   'for the current file.',
    },
  },

  provideLinter() {
    return linter;
  },

  autoCorrectFile,
};
