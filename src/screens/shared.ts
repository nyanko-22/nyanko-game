const overlayContainer = () => document.getElementById('overlay-container')!;

export function createScreen(id: string): HTMLDivElement {
  const screen = document.createElement('div');
  screen.id = id;
  screen.className = 'screen';
  return screen;
}

export function showScreen(screen: HTMLElement): void {
  const container = overlayContainer();
  if (!container.contains(screen)) {
    container.appendChild(screen);
  }
  screen.style.display = 'flex';
  // Trigger reflow for animation
  screen.offsetHeight;
  screen.classList.add('screen--visible');
}

export function hideScreen(screen: HTMLElement): void {
  screen.classList.remove('screen--visible');
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    screen.style.display = 'none';
    screen.removeEventListener('transitionend', finish);
  };
  screen.addEventListener('transitionend', finish);
  setTimeout(finish, 400);
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (HTMLElement | string)[],
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') {
        elem.className = val;
      } else if (key === 'textContent') {
        elem.textContent = val;
      } else {
        elem.setAttribute(key, val);
      }
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        elem.appendChild(document.createTextNode(child));
      } else {
        elem.appendChild(child);
      }
    }
  }
  return elem;
}

export function materialIcon(name: string, className?: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `material-symbols-outlined${className ? ' ' + className : ''}`;
  span.textContent = name;
  return span;
}
