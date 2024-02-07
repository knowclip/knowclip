export function getSelectionWithin(element: HTMLElement) {
  let start = 0
  let end = 0
  const doc = element.ownerDocument as Document
  const win = doc.defaultView as Window
  const sel = win.getSelection() as Selection
  if (sel.rangeCount > 0) {
    const range = (win.getSelection() as Selection).getRangeAt(0)
    const preCaretRange = range.cloneRange()
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
  const textNodes: Text[] = []
  if (node.nodeType === 3) {
    const textNode = node as Text
    textNodes.push(textNode)
  } else {
    const children = node.childNodes
    for (let i = 0, len = children.length; i < len; ++i) {
      textNodes.push(...getTextNodesIn(children[i]))
    }
  }
  return textNodes
}

export function setSelectionRange(el: HTMLElement, start: number, end: number) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const textNodes = getTextNodesIn(el)
  let foundStart = false
  let charCount = 0,
    endCharCount

  for (let i = 0, textNode; (textNode = textNodes[i++]); ) {
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

  const sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
