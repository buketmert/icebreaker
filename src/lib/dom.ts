/** Klavye kısayolları, kullanıcı bir alana yazarken ya da bir düğme odaktayken tetiklenmemeli. */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
}
