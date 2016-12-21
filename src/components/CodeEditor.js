import React, { PropTypes } from 'react'
import styled from 'styled-components'
import CodeMirror from 'codemirror'
import _ from 'lodash'
import { Map } from 'immutable'

const req = require.context('style-loader?singleton!css-loader!../../node_modules/codemirror/theme', true, /\.css$/)
req.keys().forEach(key => {
  req(key)
})

let docMap = new Map()

const Root = styled.div`
  .CodeMirror {
    min-height: 100%;
    font-family: ${p => p.fontFamily}, monospace;
    font-size: ${p => p.fontSize}px;
    line-height: 1.4;
  }
`

class CodeEditor extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  componentDidMount () {
    const { value, docKey, mode } = this.props
    this.value = value
    this.codemirror = CodeMirror(this.root, {
      value: new CodeMirror.Doc(_.isString(value) ? value : ''),
      lineNumbers: true,
      lineWrapping: true,
      theme: this.props.theme,
      indentUnit: this.props.indentSize,
      tabSize: this.props.indentSize,
      keyMap: 'sublime',
      inputStyle: 'textarea',
      indentWithTabs: this.props.indentStyle === 'tab',
      extraKeys: {
        Tab: function (cm) {
          if (cm.somethingSelected()) cm.indentSelection('add')
          else {
            if (cm.getOption('indentWithTabs')) {
              cm.execCommand('insertTab')
            } else {
              cm.execCommand('insertSoftTab')
            }
          }
        },
        'Cmd-T': function (cm) {
          // Do nothing
        }
      }
    })

    this.setSyntaxMode(mode)

    this.codemirror.on('blur', this.handleBlur)
    this.codemirror.on('change', this.handleChange)
    docMap = docMap.set(docKey, this.codemirror.getDoc())
  }

  componentWillUnmount () {
    this.codemirror.off('blur', this.handleBlur)
    this.codemirror.off('change', this.handleChange)

    // Unlink document by force
    this.codemirror.swapDoc(new CodeMirror.Doc(''))
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.docKey !== nextProps.docKey) {
      let nextDoc = docMap.get(nextProps.docKey)
      let currentDoc = this.codemirror.getDoc()
      docMap = docMap.set(this.props.docKey, currentDoc)

      if (nextDoc == null) {
        let syntax = CodeMirror.findModeByName(nextProps.mode)
        nextDoc = new CodeMirror.Doc(nextProps.value, syntax.mime)
        docMap = docMap.set(nextProps.docKey, nextDoc)
      }
      this.codemirror.swapDoc(nextDoc)
    }

    if (this.props.mode !== nextProps.mode) this.setSyntaxMode(nextProps.mode)
  }

  componentDidUpdate (prevProps) {
    if (this.props.value !== this.value) {
      this.value = this.props.value
      this.codemirror.off('change', this.handleChange)
      this.codemirror.setValue(this.props.value)
      this.codemirror.on('change', this.handleChange)
    }

    if (this.props.fontSize !== prevProps.fontSize ||
    this.props.fontFamily !== prevProps.fontFamily) {
      this.codemirror.refresh()
    }

    if (this.props.indentSize !== prevProps.indentSize) {
      this.codemirror.setOption('indentUnit', this.props.indentSize)
      this.codemirror.setOption('tabSize', this.props.indentSize)
    }

    if (this.props.indentStyle !== prevProps.indentStyle) {
      this.codemirror.setOption('indentWithTabs', this.props.indentStyle === 'tab')
    }

    if (this.props.theme !== prevProps.theme) {
      this.codemirror.setOption('theme', this.props.theme)
      this.codemirror.refresh()
    }
  }

  handleBlur = (cm, e) => {
    if (e == null) return null
    let el = e.relatedTarget
    while (el != null) {
      if (el === this.root) {
        return
      }
      el = el.parentNode
    }

    if (this.props.onBlur != null) this.props.onBlur()
  }

  handleChange = e => {
    this.value = this.codemirror.getValue()
    if (this.props.onChange != null) this.props.onChange()
  }

  focus () {
    this.codemirror.focus()
  }

  setSyntaxMode (mode) {
    let syntax = CodeMirror.findModeByName(mode)
    if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')

    this.codemirror.setOption('mode', syntax.mime)
    CodeMirror.autoLoadMode(this.codemirror, syntax.mode)
  }

  render () {
    const { className, style, fontSize, fontFamily } = this.props
    return (
      <Root
        className={['CodeEditor', className].join(' ')}
        style={style}
        innerRef={c => (this.root = c)}
        fontSize={fontSize}
        fontFamily={fontFamily}
      />
    )
  }
}

CodeEditor.propTypes = {
  value: PropTypes.string,
  docKey: PropTypes.string
}

export default CodeEditor
