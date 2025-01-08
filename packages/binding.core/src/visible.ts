import {
    unwrap
} from '@tko/observable'

export var visible = {
  update: function (element, valueAccessor) {
    const value = unwrap(valueAccessor())
    const isCurrentlyVisible = !(element.style.display === 'none')
    if (value && !isCurrentlyVisible) {
      element.style.display = ''
    } else if (!value && isCurrentlyVisible) {
      element.style.display = 'none'
    }
  }
}

export var hidden = {
  update: function (element, valueAccessor) {
    visible.update.call(this, element, () => !unwrap(valueAccessor()))
  }
}
