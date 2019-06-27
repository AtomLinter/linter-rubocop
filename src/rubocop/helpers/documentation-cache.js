'use babel'

const RULE_INDEX_REGEX = /===.*\[\[(.*)\]\]/g
const DOC_URL = 'https://raw.githubusercontent.com/bbatsov/ruby-style-guide/master/README.adoc'
const DOCUMENTATION_LIFETIME = 86400 * 1000

const docsRuleCache = new Map()

function takeWhile(source, predicate) {
  const result = []
  const { length } = source
  let i = 0

  while (i < length && predicate(source[i], i)) {
    result.push(source[i])
    i += 1
  }

  return result
}

// Retrieves style guide documentation with cached responses
export default async function getRuleDocumentation(rule) {
  if (rule == null) {
    return null
  }

  if (docsRuleCache.has(rule)) {
    const cachedRule = docsRuleCache.get(rule)

    if (new Date().getTime() >= cachedRule.expires) {
      // If documentation is stale, clear cache
      docsRuleCache.delete(rule)
    } else {
      return cachedRule.documentation
    }
  }

  let rawRulesDoc
  const response = await fetch(DOC_URL)
  if (response.ok) {
    rawRulesDoc = await response.text()
  } else {
    return `***\nError retrieving documentation: ${response.statusText}`
  }

  const byLine = rawRulesDoc.split('\n')
  const ruleIndexes = byLine.reduce(
    (acc, line, idx) => (line.match(RULE_INDEX_REGEX) ? acc.concat([[idx, line]]) : acc),
    [],
  )

  ruleIndexes.forEach(([startingIndex, startingLine]) => {
    const ruleName = RULE_INDEX_REGEX.exec(startingLine)[1]

    if (ruleName == null) { return }

    const beginSearch = byLine.slice(startingIndex + 1)

    // gobble all the documentation until you reach the next rule
    const rawRuleDoc = takeWhile(beginSearch, x => !x.match(RULE_INDEX_REGEX))
    const documentation = '\n'.concat(rawRuleDoc.join('\n'))

    docsRuleCache.set(ruleName, {
      documentation,
      expires: new Date().getTime() + DOCUMENTATION_LIFETIME,
    })
  })

  if (docsRuleCache.has(rule)) {
    return docsRuleCache.get(rule).documentation
  }
  return null
}
