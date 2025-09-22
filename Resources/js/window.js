// window.js
// Cria uma janela (div) redimensionável apenas pelas bordas

/**
 * Cria uma janela redimensionável na tela, apenas pelas bordas (topo, laterais e base).
 * @param {Object} options - Opções da janela
 * @param {string|HTMLElement} options.content - Conteúdo HTML ou elemento a ser inserido na janela
 * @param {number} [options.width=400] - Largura da janela em px
 * @param {number} [options.height=400] - Altura da janela em px
 * @param {string} [options.backgroundColor='#fff'] - Cor de fundo da janela
 * @param {string} [options.borderColor='#000'] - Cor da borda da janela
 * @param {HTMLElement} [options.container=document.body] - Container onde a janela será criada
 * @returns {HTMLDivElement} A div criada, já inserida no container
 */
export function createWindow({ content, width = 400, height = 400, backgroundColor = '#fff', borderColor = '#000', container = document.body } = {}) {
  // CSS embutido para .movable-window, .window-border, .window-content (aplicado apenas uma vez)
  if (!document.getElementById('movable-window-style')) {
    const style = document.createElement('style');
    style.id = 'movable-window-style';
    style.textContent = `
      .movable-window {
        position: absolute;
        left: 100px;
        top: 100px;
        box-shadow: 2px 2px 10px rgba(0,0,0,0.15);
        z-index: 1000;
        border-radius: 6px;
        transition: box-shadow 0.2s;
        background: transparent;
        overflow: visible;
      }
      .movable-window:active {
        box-shadow: 4px 4px 20px rgba(0,0,0,0.25);
      }
      .window-border-part {
        position: absolute;
        background: var(--border-color, #000);
        z-index: 2;
        border-radius: 6px;
      }
      .window-border-top {
        top: 0; left: 0; right: 0; height: 8px;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        cursor: n-resize;
      }
      .window-border-bottom {
        bottom: 0; left: 0; right: 0; height: 8px;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        cursor: s-resize;
      }
      .window-border-left {
        top: 8px; bottom: 8px; left: 0; width: 8px;
        border-bottom-left-radius: 6px;
        border-top-left-radius: 6px;
        cursor: w-resize;
      }
      .window-border-right {
        top: 8px; bottom: 8px; right: 0; width: 8px;
        border-bottom-right-radius: 6px;
        border-top-right-radius: 6px;
        cursor: e-resize;
      }
      .window-corner {
        position: absolute;
        width: 16px;
        height: 16px;
        z-index: 3;
      }
      .window-corner-tl {
        top: 0; left: 0;
        cursor: nw-resize;
      }
      .window-corner-tr {
        top: 0; right: 0;
        cursor: ne-resize;
      }
      .window-corner-bl {
        bottom: 0; left: 0;
        cursor: sw-resize;
      }
      .window-corner-br {
        bottom: 0; right: 0;
        cursor: se-resize;
      }
      .window-content {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        background: var(--background-color, #fff);
        border-radius: 3px;
        z-index: 4;
        width: auto;
        height: auto;
        overflow: auto;
        cursor: default;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }

  const win = document.createElement('div');
  win.className = 'movable-window';
  win.style.width = width + 'px';
  win.style.height = height + 'px';
  // Garante que left/top sempre estejam definidos
  if (!win.style.left) win.style.left = '100px';
  if (!win.style.top) win.style.top = '100px';

  // Cria as 4 bordas redimensionáveis
  const borderColorVar = borderColor;
  const backgroundColorVar = backgroundColor;

  const borderTop = document.createElement('div');
  borderTop.className = 'window-border-part window-border-top';
  borderTop.style.setProperty('--border-color', borderColorVar);

  const borderBottom = document.createElement('div');
  borderBottom.className = 'window-border-part window-border-bottom';
  borderBottom.style.setProperty('--border-color', borderColorVar);

  const borderLeft = document.createElement('div');
  borderLeft.className = 'window-border-part window-border-left';
  borderLeft.style.setProperty('--border-color', borderColorVar);

  const borderRight = document.createElement('div');
  borderRight.className = 'window-border-part window-border-right';
  borderRight.style.setProperty('--border-color', borderColorVar);

  // Cantos para redimensionamento diagonal
  const cornerTL = document.createElement('div');
  cornerTL.className = 'window-corner window-corner-tl';
  const cornerTR = document.createElement('div');
  cornerTR.className = 'window-corner window-corner-tr';
  const cornerBL = document.createElement('div');
  cornerBL.className = 'window-corner window-corner-bl';
  const cornerBR = document.createElement('div');
  cornerBR.className = 'window-corner window-corner-br';

  // Conteúdo central
  const contentDiv = document.createElement('div');
  contentDiv.className = 'window-content';
  contentDiv.style.setProperty('--background-color', backgroundColorVar);

  if (typeof content === 'string') {
    contentDiv.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    contentDiv.appendChild(content);
  }

  win.appendChild(borderTop);
  win.appendChild(borderBottom);
  win.appendChild(borderLeft);
  win.appendChild(borderRight);
  win.appendChild(cornerTL);
  win.appendChild(cornerTR);
  win.appendChild(cornerBL);
  win.appendChild(cornerBR);
  win.appendChild(contentDiv);

  // Lógica de redimensionamento
  let isResizing = false;
  let resizeDir = '';
  let startX, startY, startW, startH, startL, startT;
  const minWidth = 100;
  const minHeight = 50;

  function startResize(e, dir) {
    e.preventDefault();
    isResizing = true;
    resizeDir = dir;
    startX = e.clientX;
    startY = e.clientY;
    startW = win.offsetWidth;
    startH = win.offsetHeight;
    // Garante que left/top nunca sejam NaN
    startL = parseInt(win.style.left, 10);
    if (isNaN(startL)) startL = 0;
    startT = parseInt(win.style.top, 10);
    if (isNaN(startT)) startT = 0;
    document.body.style.userSelect = 'none';
  }

  borderTop.addEventListener('mousedown', e => startResize(e, 'n'));
  borderBottom.addEventListener('mousedown', e => startResize(e, 's'));
  borderLeft.addEventListener('mousedown', e => startResize(e, 'w'));
  borderRight.addEventListener('mousedown', e => startResize(e, 'e'));
  cornerTL.addEventListener('mousedown', e => startResize(e, 'nw'));
  cornerTR.addEventListener('mousedown', e => startResize(e, 'ne'));
  cornerBL.addEventListener('mousedown', e => startResize(e, 'sw'));
  cornerBR.addEventListener('mousedown', e => startResize(e, 'se'));

  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;
    let newW = startW, newH = startH, newL = startL, newT = startT;
    if (resizeDir.includes('e')) newW = Math.max(minWidth, startW + dx);
    if (resizeDir.includes('s')) newH = Math.max(minHeight, startH + dy);
    if (resizeDir.includes('w')) {
      newW = Math.max(minWidth, startW - dx);
      newL = startL + dx;
    }
    if (resizeDir.includes('n')) {
      newH = Math.max(minHeight, startH - dy);
      newT = startT + dy;
    }
    // Limita dentro do container
    let maxW, maxH, maxL, maxT;
    if (container === document.body) {
      maxW = window.innerWidth - newL;
      maxH = window.innerHeight - newT;
      newW = Math.min(newW, maxW);
      newH = Math.min(newH, maxH);
      newL = Math.max(0, Math.min(newL, window.innerWidth - minWidth));
      newT = Math.max(0, Math.min(newT, window.innerHeight - minHeight));
    } else {
      maxW = container.clientWidth - newL;
      maxH = container.clientHeight - newT;
      newW = Math.min(newW, maxW);
      newH = Math.min(newH, maxH);
      newL = Math.max(0, Math.min(newL, container.clientWidth - minWidth));
      newT = Math.max(0, Math.min(newT, container.clientHeight - minHeight));
    }
    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
    win.style.left = newL + 'px';
    win.style.top = newT + 'px';
  });

  document.addEventListener('mouseup', function() {
    isResizing = false;
    document.body.style.userSelect = '';
  });

  // Adiciona a janela ao container
  container.appendChild(win);
  return win;
}