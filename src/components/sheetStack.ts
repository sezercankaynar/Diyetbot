// Open sheets push a history entry so Android's back button closes the top one.
// One shared popstate listener routes "back" to the top sheet only, and ignores
// the history.back() we trigger ourselves when a sheet is closed with its ✕.
type Entry = { close: () => void; popped: boolean }
const stack: Entry[] = []
let ignorePops = 0

function onPop() {
  if (ignorePops > 0) {
    ignorePops--
    return
  }
  const top = stack.at(-1)
  if (top) {
    top.popped = true
    top.close()
  }
}

export function openSheet(close: () => void): () => void {
  if (stack.length === 0) window.addEventListener('popstate', onPop)
  const entry: Entry = { close, popped: false }
  stack.push(entry)
  history.pushState({ sheet: stack.length }, '')
  return () => {
    const i = stack.indexOf(entry)
    if (i >= 0) stack.splice(i, 1)
    if (!entry.popped) {
      ignorePops++
      history.back()
    }
    if (stack.length === 0) {
      // Remove the listener after our own back() has been delivered.
      setTimeout(() => stack.length === 0 && ignorePops === 0 && window.removeEventListener('popstate', onPop), 500)
    }
  }
}

export const openSheetCount = (): number => stack.length
