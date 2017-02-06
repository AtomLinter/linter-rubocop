'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var path = require('path');
var escapeHtml = require('escape-html');
var pluralize = require('pluralize');
var helpers = require('atom-linter');

var COMMAND_CONFIG_KEY = 'linter-rubocop.command';
var DISABLE_CONFIG_KEY = 'linter-rubocop.disableWhenNoConfigFile';
var OLD_EXEC_PATH_CONFIG_KEY = 'linter-rubocop.executablePath';
var OLD_ARGS_CONFIG_KEY = 'linter-rubocop.additionalArguments';
var DEFAULT_LOCATION = { line: 1, column: 1, length: 0 };
var DEFAULT_ARGS = ['--cache', 'false', '--force-exclusion', '--format', 'json', '--display-style-guide'];
var AUTOCORRECT_ARG = '--auto-correct';
var STD_IN_ARG = '--stdin';

var DEFAULT_MESSAGE = 'Unknown Error';
var WARNINGS = new Set(['refactor', 'convention', 'warning']);

var convertOldConfig = function convertOldConfig() {
  var execPath = atom.config.get(OLD_EXEC_PATH_CONFIG_KEY);
  var args = atom.config.get(OLD_ARGS_CONFIG_KEY);
  if (!execPath && !args) {
    return null;
  }
  atom.config.set(COMMAND_CONFIG_KEY, ((execPath || '') + ' ' + (args || '')).trim());
  atom.config.set(OLD_EXEC_PATH_CONFIG_KEY, undefined);
  return atom.config.set(OLD_ARGS_CONFIG_KEY, undefined);
};

// TODO: figure out how to best handle, also, ESLint telling me conflicting things
// eslint-disable-next-line no-confusing-arrow
var guard = function guard(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
};

var extractUrl = function extractUrl(parsedMessage) {
  var _Array$from = Array.from(parsedMessage.split(/ \((.*)\)/, 2)),
      _Array$from2 = _slicedToArray(_Array$from, 2),
      message = _Array$from2[0],
      url = _Array$from2[1];

  return { message: message, url: url };
};

var formatMessage = function formatMessage(_ref) {
  var message = _ref.message,
      copName = _ref.cop_name,
      url = _ref.url;

  var formattedMessage = escapeHtml(message || DEFAULT_MESSAGE);
  var formattedCopName = '';
  if (copName != null && url != null) {
    formattedCopName = ' (<a href="' + escapeHtml(url) + '">' + escapeHtml(copName) + '</a>)';
  } else if (copName != null) {
    formattedCopName = ' (' + escapeHtml(copName) + ')';
  }
  return formattedMessage + formattedCopName;
};

var parseFromStd = function parseFromStd(stdout, stderr) {
  var parsed = void 0;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    // continue regardless of error
  }
  if ((typeof parsed === 'undefined' ? 'undefined' : _typeof(parsed)) !== 'object') {
    throw new Error(stderr || stdout);
  }
  return parsed;
};

var forwardRubocopToLinter = function forwardRubocopToLinter(_ref2, filePath) {
  var rawMessage = _ref2.message,
      location = _ref2.location,
      severity = _ref2.severity,
      cop_name = _ref2.cop_name;

  var _extractUrl = extractUrl(rawMessage),
      message = _extractUrl.message,
      url = _extractUrl.url;

  var _ref3 = location || DEFAULT_LOCATION,
      line = _ref3.line,
      column = _ref3.column,
      length = _ref3.length;

  return {
    type: WARNINGS.has(severity) ? 'Warning' : 'Error',
    html: formatMessage({ cop_name: cop_name, message: message, url: url }),
    filePath: filePath,
    range: [[line - 1, column - 1], [line - 1, column + length - 1]]
  };
};

var lint = function lint(editor) {
  var filePath = editor.getPath();
  convertOldConfig();
  var command = atom.config.get(COMMAND_CONFIG_KEY).split(/\s+/).filter(function (i) {
    return i;
  }).concat(DEFAULT_ARGS, STD_IN_ARG, filePath);
  if (atom.config.get(DISABLE_CONFIG_KEY) === true) {
    var config = helpers.find(filePath, '.rubocop.yml');
    if (config === null) {
      return [];
    }
  }
  var cwd = path.dirname(helpers.find(filePath, '.'));
  var stdin = editor.getText();
  var stream = 'both';
  return helpers.exec(command[0], command.slice(1), { cwd: cwd, stdin: stdin, stream: stream }).then(function (_ref4) {
    var stdout = _ref4.stdout,
        stderr = _ref4.stderr;

    var parsed = parseFromStd(stdout, stderr);
    return (guard(guard(parsed.files, function (x1) {
      return x1[0];
    }), function (x) {
      return x.offenses;
    }) || []).map(function (offense) {
      return forwardRubocopToLinter(offense, filePath);
    });
  });
};

var linter = {
  name: 'RuboCop',
  grammarScopes: ['source.ruby', 'source.ruby.rails', 'source.ruby.rspec', 'source.ruby.chef'],
  scope: 'file',
  lintOnFly: true,
  lint: lint
};

var autoCorrectFile = function autoCorrectFile() {
  var textEditor = atom.workspace.getActiveTextEditor();
  var filePath = textEditor.getPath();
  var command = atom.config.get(COMMAND_CONFIG_KEY).split(/\s+/).filter(function (i) {
    return i;
  }).concat(DEFAULT_ARGS, AUTOCORRECT_ARG, filePath);

  if (!textEditor || textEditor.isModified()) {
    // Abort for invalid or unsaved text editors
    atom.notifications.addError('Linter-Rubocop: Please save before fixing');
    return;
  }

  var cwd = path.dirname(helpers.find(filePath, '.'));
  var stream = 'both';
  helpers.exec(command[0], command.slice(1), { cwd: cwd, stream: stream }).then(function (_ref5) {
    var stdout = _ref5.stdout,
        stderr = _ref5.stderr;

    var _parseFromStd = parseFromStd(stdout, stderr),
        offenseCount = _parseFromStd.summary.offense_count;

    return offenseCount === 0 ? atom.notifications.addInfo('Linter-Rubocop: No fixes were made') : atom.notifications.addSuccess('Linter-Rubocop: Fixed ' + pluralize('offenses', offenseCount, true));
  });
};

atom.commands.add('atom-text-editor', 'linter-rubocop:fix-file', autoCorrectFile);

module.exports = {
  config: {
    command: {
      type: 'string',
      title: 'Command',
      default: 'rubocop',
      description: '\n' + 'This is the absolute path to your `rubocop` command. You may need to run \n' + '`which rubocop` or `rbenv which rubocop` to find this. Examples: \n' + '`/usr/local/bin/rubocop` or `/usr/local/bin/bundle exec rubocop --config \n' + '/my/rubocop.yml`.\n'
    },
    disableWhenNoConfigFile: {
      type: 'boolean',
      title: 'Disable when no .rubocop.yml config file is found',
      default: false,
      description: '\n' + 'Only run linter if a RuboCop config file is found somewhere in the path \n' + 'for the current file.'
    }
  },

  provideLinter: function provideLinter() {
    return linter;
  },


  autoCorrectFile: autoCorrectFile
};

//# sourceMappingURL=data:application/json;base64,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TyxpQkFBaUIsQ0FBakIsR0FDTCxLQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBMkIsb0NBQTNCLENBREssR0FFTCxLQUFLLGFBQUwsQ0FBbUIsVUFBbkIsNEJBQXVELFVBQVUsVUFBVixFQUFzQixZQUF0QixFQUFvQyxJQUFwQyxDQUF2RCxDQUZGO0FBR0QsR0FMRDtBQU1ELENBdEJEOztBQXlCQSxLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGtCQUFsQixFQUFzQyx5QkFBdEMsRUFBaUUsZUFBakU7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsVUFBUTtBQUNOLGFBQVM7QUFDUCxZQUFNLFFBREM7QUFFUCxhQUFPLFNBRkE7QUFHUCxlQUFTLFNBSEY7QUFJUCxtQkFBYSxPQUNBLDZFQURBLEdBRUEscUVBRkEsR0FHQSw2RUFIQSxHQUlBO0FBUk4sS0FESDtBQVdOLDZCQUF5QjtBQUN2QixZQUFNLFNBRGlCO0FBRXZCLGFBQU8sbURBRmdCO0FBR3ZCLGVBQVMsS0FIYztBQUl2QixtQkFBYSxPQUNBLDRFQURBLEdBRUE7QUFOVTtBQVhuQixHQURPOztBQXNCZixlQXRCZSwyQkFzQkM7QUFDZCxXQUFPLE1BQVA7QUFDRCxHQXhCYzs7O0FBMEJmO0FBMUJlLENBQWpCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGVzY2FwZUh0bWwgPSByZXF1aXJlKCdlc2NhcGUtaHRtbCcpO1xuY29uc3QgcGx1cmFsaXplID0gcmVxdWlyZSgncGx1cmFsaXplJyk7XG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnYXRvbS1saW50ZXInKTtcblxuY29uc3QgQ09NTUFORF9DT05GSUdfS0VZID0gJ2xpbnRlci1ydWJvY29wLmNvbW1hbmQnO1xuY29uc3QgRElTQUJMRV9DT05GSUdfS0VZID0gJ2xpbnRlci1ydWJvY29wLmRpc2FibGVXaGVuTm9Db25maWdGaWxlJztcbmNvbnN0IE9MRF9FWEVDX1BBVEhfQ09ORklHX0tFWSA9ICdsaW50ZXItcnVib2NvcC5leGVjdXRhYmxlUGF0aCc7XG5jb25zdCBPTERfQVJHU19DT05GSUdfS0VZID0gJ2xpbnRlci1ydWJvY29wLmFkZGl0aW9uYWxBcmd1bWVudHMnO1xuY29uc3QgREVGQVVMVF9MT0NBVElPTiA9IHsgbGluZTogMSwgY29sdW1uOiAxLCBsZW5ndGg6IDAgfTtcbmNvbnN0IERFRkFVTFRfQVJHUyA9IFtcbiAgJy0tY2FjaGUnLCAnZmFsc2UnLFxuICAnLS1mb3JjZS1leGNsdXNpb24nLFxuICAnLS1mb3JtYXQnLCAnanNvbicsXG4gICctLWRpc3BsYXktc3R5bGUtZ3VpZGUnLFxuXTtcbmNvbnN0IEFVVE9DT1JSRUNUX0FSRyA9ICctLWF1dG8tY29ycmVjdCc7XG5jb25zdCBTVERfSU5fQVJHID0gJy0tc3RkaW4nO1xuXG5jb25zdCBERUZBVUxUX01FU1NBR0UgPSAnVW5rbm93biBFcnJvcic7XG5jb25zdCBXQVJOSU5HUyA9IG5ldyBTZXQoWydyZWZhY3RvcicsICdjb252ZW50aW9uJywgJ3dhcm5pbmcnXSk7XG5cbmNvbnN0IGNvbnZlcnRPbGRDb25maWcgPSAoKSA9PiB7XG4gIGNvbnN0IGV4ZWNQYXRoID0gYXRvbS5jb25maWcuZ2V0KE9MRF9FWEVDX1BBVEhfQ09ORklHX0tFWSk7XG4gIGNvbnN0IGFyZ3MgPSBhdG9tLmNvbmZpZy5nZXQoT0xEX0FSR1NfQ09ORklHX0tFWSk7XG4gIGlmICghZXhlY1BhdGggJiYgIWFyZ3MpIHsgcmV0dXJuIG51bGw7IH1cbiAgYXRvbS5jb25maWcuc2V0KENPTU1BTkRfQ09ORklHX0tFWSwgYCR7ZXhlY1BhdGggfHwgJyd9ICR7YXJncyB8fCAnJ31gLnRyaW0oKSk7XG4gIGF0b20uY29uZmlnLnNldChPTERfRVhFQ19QQVRIX0NPTkZJR19LRVksIHVuZGVmaW5lZCk7XG4gIHJldHVybiBhdG9tLmNvbmZpZy5zZXQoT0xEX0FSR1NfQ09ORklHX0tFWSwgdW5kZWZpbmVkKTtcbn07XG5cbi8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHRvIGJlc3QgaGFuZGxlLCBhbHNvLCBFU0xpbnQgdGVsbGluZyBtZSBjb25mbGljdGluZyB0aGluZ3Ncbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25mdXNpbmctYXJyb3dcbmNvbnN0IGd1YXJkID0gKHZhbHVlLCB0cmFuc2Zvcm0pID0+ICh0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlICE9PSBudWxsKSA/IHRyYW5zZm9ybSh2YWx1ZSkgOiB1bmRlZmluZWQ7XG5cbmNvbnN0IGV4dHJhY3RVcmwgPSAocGFyc2VkTWVzc2FnZSkgPT4ge1xuICBjb25zdCBbbWVzc2FnZSwgdXJsXSA9IEFycmF5LmZyb20ocGFyc2VkTWVzc2FnZS5zcGxpdCgvIFxcKCguKilcXCkvLCAyKSk7XG4gIHJldHVybiB7IG1lc3NhZ2UsIHVybCB9O1xufTtcblxuY29uc3QgZm9ybWF0TWVzc2FnZSA9ICh7IG1lc3NhZ2UsIGNvcF9uYW1lOiBjb3BOYW1lLCB1cmwgfSkgPT4ge1xuICBjb25zdCBmb3JtYXR0ZWRNZXNzYWdlID0gZXNjYXBlSHRtbChtZXNzYWdlIHx8IERFRkFVTFRfTUVTU0FHRSk7XG4gIGxldCBmb3JtYXR0ZWRDb3BOYW1lID0gJyc7XG4gIGlmIChjb3BOYW1lICE9IG51bGwgJiYgdXJsICE9IG51bGwpIHtcbiAgICBmb3JtYXR0ZWRDb3BOYW1lID0gYCAoPGEgaHJlZj1cIiR7ZXNjYXBlSHRtbCh1cmwpfVwiPiR7ZXNjYXBlSHRtbChjb3BOYW1lKX08L2E+KWA7XG4gIH0gZWxzZSBpZiAoY29wTmFtZSAhPSBudWxsKSB7XG4gICAgZm9ybWF0dGVkQ29wTmFtZSA9IGAgKCR7ZXNjYXBlSHRtbChjb3BOYW1lKX0pYDtcbiAgfVxuICByZXR1cm4gZm9ybWF0dGVkTWVzc2FnZSArIGZvcm1hdHRlZENvcE5hbWU7XG59O1xuXG5jb25zdCBwYXJzZUZyb21TdGQgPSAoc3Rkb3V0LCBzdGRlcnIpID0+IHtcbiAgbGV0IHBhcnNlZDtcbiAgdHJ5IHtcbiAgICBwYXJzZWQgPSBKU09OLnBhcnNlKHN0ZG91dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gY29udGludWUgcmVnYXJkbGVzcyBvZiBlcnJvclxuICB9XG4gIGlmICh0eXBlb2YgcGFyc2VkICE9PSAnb2JqZWN0JykgeyB0aHJvdyBuZXcgRXJyb3Ioc3RkZXJyIHx8IHN0ZG91dCk7IH1cbiAgcmV0dXJuIHBhcnNlZDtcbn07XG5cbmNvbnN0IGZvcndhcmRSdWJvY29wVG9MaW50ZXIgPVxuICAoeyBtZXNzYWdlOiByYXdNZXNzYWdlLCBsb2NhdGlvbiwgc2V2ZXJpdHksIGNvcF9uYW1lIH0sIGZpbGVQYXRoKSA9PiB7XG4gICAgY29uc3QgeyBtZXNzYWdlLCB1cmwgfSA9IGV4dHJhY3RVcmwocmF3TWVzc2FnZSk7XG4gICAgY29uc3QgeyBsaW5lLCBjb2x1bW4sIGxlbmd0aCB9ID0gbG9jYXRpb24gfHwgREVGQVVMVF9MT0NBVElPTjtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogV0FSTklOR1MuaGFzKHNldmVyaXR5KSA/ICdXYXJuaW5nJyA6ICdFcnJvcicsXG4gICAgICBodG1sOiBmb3JtYXRNZXNzYWdlKHsgY29wX25hbWUsIG1lc3NhZ2UsIHVybCB9KSxcbiAgICAgIGZpbGVQYXRoLFxuICAgICAgcmFuZ2U6IFtbbGluZSAtIDEsIGNvbHVtbiAtIDFdLCBbbGluZSAtIDEsIChjb2x1bW4gKyBsZW5ndGgpIC0gMV1dLFxuICAgIH07XG4gIH07XG5cbmNvbnN0IGxpbnQgPSBmdW5jdGlvbiBsaW50KGVkaXRvcikge1xuICBjb25zdCBmaWxlUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gIGNvbnZlcnRPbGRDb25maWcoKTtcbiAgY29uc3QgY29tbWFuZCA9IGF0b20uY29uZmlnLmdldChDT01NQU5EX0NPTkZJR19LRVkpXG4gICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGkgPT4gaSlcbiAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KERFRkFVTFRfQVJHUywgU1REX0lOX0FSRywgZmlsZVBhdGgpO1xuICBpZiAoYXRvbS5jb25maWcuZ2V0KERJU0FCTEVfQ09ORklHX0tFWSkgPT09IHRydWUpIHtcbiAgICBjb25zdCBjb25maWcgPSBoZWxwZXJzLmZpbmQoZmlsZVBhdGgsICcucnVib2NvcC55bWwnKTtcbiAgICBpZiAoY29uZmlnID09PSBudWxsKSB7IHJldHVybiBbXTsgfVxuICB9XG4gIGNvbnN0IGN3ZCA9IHBhdGguZGlybmFtZShoZWxwZXJzLmZpbmQoZmlsZVBhdGgsICcuJykpO1xuICBjb25zdCBzdGRpbiA9IGVkaXRvci5nZXRUZXh0KCk7XG4gIGNvbnN0IHN0cmVhbSA9ICdib3RoJztcbiAgcmV0dXJuIGhlbHBlcnMuZXhlYyhjb21tYW5kWzBdLCBjb21tYW5kLnNsaWNlKDEpLCB7IGN3ZCwgc3RkaW4sIHN0cmVhbSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlRnJvbVN0ZChzdGRvdXQsIHN0ZGVycik7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gKGd1YXJkKGd1YXJkKHBhcnNlZC5maWxlcywgeDEgPT4geDFbMF0pLCB4ID0+IHgub2ZmZW5zZXMpIHx8IFtdKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAob2ZmZW5zZSA9PiBmb3J3YXJkUnVib2NvcFRvTGludGVyKG9mZmVuc2UsIGZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG59O1xuXG5jb25zdCBsaW50ZXIgPSB7XG4gIG5hbWU6ICdSdWJvQ29wJyxcbiAgZ3JhbW1hclNjb3BlczogW1xuICAgICdzb3VyY2UucnVieScsXG4gICAgJ3NvdXJjZS5ydWJ5LnJhaWxzJyxcbiAgICAnc291cmNlLnJ1YnkucnNwZWMnLFxuICAgICdzb3VyY2UucnVieS5jaGVmJyxcbiAgXSxcbiAgc2NvcGU6ICdmaWxlJyxcbiAgbGludE9uRmx5OiB0cnVlLFxuICBsaW50LFxufTtcblxuY29uc3QgYXV0b0NvcnJlY3RGaWxlID0gKCkgPT4ge1xuICBjb25zdCB0ZXh0RWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICBjb25zdCBmaWxlUGF0aCA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpO1xuICBjb25zdCBjb21tYW5kID0gYXRvbS5jb25maWcuZ2V0KENPTU1BTkRfQ09ORklHX0tFWSlcbiAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoaSA9PiBpKVxuICAgICAgICAgICAgICAgICAgICAgIC5jb25jYXQoREVGQVVMVF9BUkdTLCBBVVRPQ09SUkVDVF9BUkcsIGZpbGVQYXRoKTtcblxuICBpZiAoIXRleHRFZGl0b3IgfHwgdGV4dEVkaXRvci5pc01vZGlmaWVkKCkpIHtcbiAgICAvLyBBYm9ydCBmb3IgaW52YWxpZCBvciB1bnNhdmVkIHRleHQgZWRpdG9yc1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignTGludGVyLVJ1Ym9jb3A6IFBsZWFzZSBzYXZlIGJlZm9yZSBmaXhpbmcnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjd2QgPSBwYXRoLmRpcm5hbWUoaGVscGVycy5maW5kKGZpbGVQYXRoLCAnLicpKTtcbiAgY29uc3Qgc3RyZWFtID0gJ2JvdGgnO1xuICBoZWxwZXJzLmV4ZWMoY29tbWFuZFswXSwgY29tbWFuZC5zbGljZSgxKSwgeyBjd2QsIHN0cmVhbSB9KS50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcbiAgICBjb25zdCB7IHN1bW1hcnk6IHsgb2ZmZW5zZV9jb3VudDogb2ZmZW5zZUNvdW50IH0gfSA9IHBhcnNlRnJvbVN0ZChzdGRvdXQsIHN0ZGVycik7XG4gICAgcmV0dXJuIG9mZmVuc2VDb3VudCA9PT0gMCA/XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnTGludGVyLVJ1Ym9jb3A6IE5vIGZpeGVzIHdlcmUgbWFkZScpIDpcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKGBMaW50ZXItUnVib2NvcDogRml4ZWQgJHtwbHVyYWxpemUoJ29mZmVuc2VzJywgb2ZmZW5zZUNvdW50LCB0cnVlKX1gKTtcbiAgfSk7XG59O1xuXG5cbmF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2xpbnRlci1ydWJvY29wOmZpeC1maWxlJywgYXV0b0NvcnJlY3RGaWxlKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbmZpZzoge1xuICAgIGNvbW1hbmQ6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgdGl0bGU6ICdDb21tYW5kJyxcbiAgICAgIGRlZmF1bHQ6ICdydWJvY29wJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnXFxuJyArXG4gICAgICAgICAgICAgICAgICAgJ1RoaXMgaXMgdGhlIGFic29sdXRlIHBhdGggdG8geW91ciBgcnVib2NvcGAgY29tbWFuZC4gWW91IG1heSBuZWVkIHRvIHJ1biBcXG4nICtcbiAgICAgICAgICAgICAgICAgICAnYHdoaWNoIHJ1Ym9jb3BgIG9yIGByYmVudiB3aGljaCBydWJvY29wYCB0byBmaW5kIHRoaXMuIEV4YW1wbGVzOiBcXG4nICtcbiAgICAgICAgICAgICAgICAgICAnYC91c3IvbG9jYWwvYmluL3J1Ym9jb3BgIG9yIGAvdXNyL2xvY2FsL2Jpbi9idW5kbGUgZXhlYyBydWJvY29wIC0tY29uZmlnIFxcbicgK1xuICAgICAgICAgICAgICAgICAgICcvbXkvcnVib2NvcC55bWxgLlxcbicsXG4gICAgfSxcbiAgICBkaXNhYmxlV2hlbk5vQ29uZmlnRmlsZToge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgdGl0bGU6ICdEaXNhYmxlIHdoZW4gbm8gLnJ1Ym9jb3AueW1sIGNvbmZpZyBmaWxlIGlzIGZvdW5kJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgZGVzY3JpcHRpb246ICdcXG4nICtcbiAgICAgICAgICAgICAgICAgICAnT25seSBydW4gbGludGVyIGlmIGEgUnVib0NvcCBjb25maWcgZmlsZSBpcyBmb3VuZCBzb21ld2hlcmUgaW4gdGhlIHBhdGggXFxuJyArXG4gICAgICAgICAgICAgICAgICAgJ2ZvciB0aGUgY3VycmVudCBmaWxlLicsXG4gICAgfSxcbiAgfSxcblxuICBwcm92aWRlTGludGVyKCkge1xuICAgIHJldHVybiBsaW50ZXI7XG4gIH0sXG5cbiAgYXV0b0NvcnJlY3RGaWxlLFxufTtcbiJdfQ==