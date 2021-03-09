'use babel'

import path from 'path'

export default function currentDirectory(filePath) {
  return atom.project.relativizePath(filePath)[0] || path.dirname(filePath)
}
