
import { attr } from './attr'
import { checked, checkedValue } from './checked'
import { click } from './click'
import { css } from './css'
import descendantsComplete from './descendantsComplete'
import { enable, disable } from './enableDisable'
import { eventHandler, onHandler } from './event'
import { hasfocus } from './hasfocus'
import { html } from './html'
import $let from './let'
import { options } from './options'
import { selectedOptions } from './selectedOptions'
import { style } from './style'
import { submit } from './submit'
import { text } from './text'
import { textInput } from './textInput'
import { uniqueName } from './uniqueName'
import { value } from './value'
import { visible, hidden } from './visible'
import { using } from './using'

type Bindings = {
  attr: typeof attr,
  checked: typeof checked,
  checkedValue: typeof checkedValue,
  click: typeof click,
  css: typeof css,
  'class': typeof css,
  descendantsComplete: typeof descendantsComplete,
  enable: typeof enable,
  'event': typeof eventHandler,
  disable: typeof disable,
  hasfocus: typeof hasfocus,
  hasFocus: typeof hasfocus,
  hidden: typeof hidden,
  html: typeof html,
  'let': typeof $let,
  on: typeof onHandler,
  options: typeof options,
  selectedOptions: typeof selectedOptions,
  style: typeof style,
  submit: typeof submit,
  text: typeof text,
  textInput: typeof textInput,
  uniqueName: typeof uniqueName,
  using: typeof using,
  value: typeof value,
  visible: typeof visible
}

export const bindings: Bindings = {
  attr,
  checked,
  checkedValue,
  click,
  css,
  'class': css,
  descendantsComplete,
  enable,
  'event': eventHandler,
  disable,
  hasfocus,
  hasFocus: hasfocus,
  hidden,
  html,
  'let': $let,
  on: onHandler,
  options,
  selectedOptions,
  style,
  submit,
  text,
  textInput,
  uniqueName,
  using,
  value,
  visible
}
