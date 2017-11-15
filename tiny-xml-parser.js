// '<div>asdf<span>a</span></div><img src="asdf"/>'

// ['<', 'div', '>', 'asdf', '<', 'span', '>', 'a', '</', 'span', '>', '</', div', '>', '<', 'img', 'src', '=', '"', 'asdf', '"', '/>' ]

const tokenize = raw => {
  let current = 0
  const tokens = []
  while (raw.length > 0) {
    const WHITESPACE = /^\s+/
    if (WHITESPACE.test(raw)) {
      let m = WHITESPACE.exec(raw)[0]
      raw = raw.substr(m.length)
      continue
    }

    if (/^<\//.test(raw)) {
      tokens.push({
        token: '</',
        value: '</'
      })
      raw = raw.substr(2)
      continue
    }

    if (/^\/>/.test(raw)) {
      tokens.push({
        token: '/>',
        value: '/>'
      })
      raw = raw.substr(2)
      continue
    }

    if (/^>/.test(raw)) {
      tokens.push({
        token: '>',
        value: '>'
      })
      raw = raw.substr(1)
      continue
    }

    if (/^</.test(raw)) {
      tokens.push({
        token: '<',
        value: '<'
      })
      raw = raw.substr(1)
      continue
    }

    const STRING = /^[^\s\\<>=]+/
    if (STRING.test(raw)) {
      let str = STRING.exec(raw)[0]
      tokens.push({
        token: 'string',
        value: str
      })
      raw = raw.substr(str.length)
      continue
    }

    if (/^=/.test(raw)) {
      tokens.push({
        token: '=',
        value: '='
      })
      raw = raw.substr(1)
      continue
    }

    throw new Error('tokenize')
  }
  return tokens
}

const parse = tokens => {
  var ast = {
      tagName: 'root',
      attrs: [],
      children: [],
      parent: null
    },
    i = 0,
    status = 0 /*
      {
        inNode: 0,
        tagName: 1,
        attrName: 2,
        attrValue: 3,
        BeginValidate: 7,
        outNode: 9,
        endNode: 6
      }
    */,
    node = ast
  while (i < tokens.length) {
    var token = tokens[i]
    if (token.token === '<') {
      _node = {
        tagName: '',
        attrs: [],
        children: [],
        parent: node
      }
      if (status === 9) {
        node.children.push(_node)
      } else if (status === 0) {
        node.children.push(_node)
      } else {
        throw new Error('<')
      }
      node = _node
      status = 1
      i += 1
      continue
    }

    if (token.token === 'string') {
      if (status === 0) {
        node.children.push({
          tagName: 'text',
          attrs: [],
          children: [],
          parent: node,
          text: token.value
        })
      } else if (status === 1) {
        node.tagName = token.value
        status = 2
      } else if (status === 2) {
        node.attrs.push({
          name: token.value,
          value: ''
        })
      } else if (status === 3) {
        node.attrs[node.attrs.length - 1].value = token.value
        status = 2
      } else if (status === 7) {
        if (node.tagName !== token.value) {
          throw new Error('status 7 name doesn\'t match')
        }
        status = 6
      } else {
        throw new Error('string')
      }
      i += 1
      continue
    }

    if (token.token === '=') {
      if (status === 2) {
        status = 3
      } else {
        throw new Error('=')
      }

      i += 1
      continue
    }

    if (token.token === '>') {
      if (status === 2) {
        status = 0
      } else if (status === 6) {
        status = 9
        node = node.parent
      } else {
        throw new Error('>')
      }
      i += 1
      continue
    }

    if (token.token === '/>') {
      if (status === 2) {
        status = 9
        node = node.parent
      } else {
        throw new Error('/>')
      }
      i += 1
      continue
    }

    if (token.token === '</') {
      if (status === 0 || status === 9) {
        status = 7
      } else {
        throw new Error('</')
      }
      i += 1
      continue
    }

    throw new Error('parse')
  }
  return ast
}
