export function getSelectionWithin(element: HTMLElement) {
  var start = 0
  var end = 0
  var doc = element.ownerDocument as Document
  var win = doc.defaultView as Window
  var sel = win.getSelection() as Selection
  if (sel.rangeCount > 0) {
    var range = (win.getSelection() as Selection).getRangeAt(0)
    var preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    start = preCaretRange.toString().length
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    end = preCaretRange.toString().length
  }

  const innerText = element.innerText
  const length = innerText.length

  return {
    start: Math.max(0, Math.min(start, length)),
    end: Math.max(0, Math.min(end, length)),
  }
}
function getTextNodesIn(node: Node) {
  var textNodes: Text[] = []
  if (node.nodeType === 3) {
    const textNode = node as Text
    textNodes.push(textNode)
  } else {
    var children = node.childNodes
    for (var i = 0, len = children.length; i < len; ++i) {
      textNodes.push.apply(textNodes, getTextNodesIn(children[i]))
    }
  }
  return textNodes
}

export function setSelectionRange(el: HTMLElement, start: number, end: number) {
  var range = document.createRange()
  range.selectNodeContents(el)
  var textNodes = getTextNodesIn(el)
  var foundStart = false
  var charCount = 0,
    endCharCount

  for (var i = 0, textNode; (textNode = textNodes[i++]); ) {
    endCharCount = charCount + textNode.length
    if (
      !foundStart &&
      start >= charCount &&
      (start < endCharCount ||
        (start === endCharCount && i <= textNodes.length))
    ) {
      range.setStart(textNode as unknown as Node, start - charCount)
      foundStart = true
    }
    if (foundStart && end <= endCharCount) {
      range.setEnd(textNode, end - charCount)
      break
    }
    charCount = endCharCount
  }

  var sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
