/* GyanSetu answer rendering. Marked supplies tokens; no model HTML is executed. */
(function (root) {
  'use strict';

  function normalizeMath(text) {
    return String(text || '')
      .replace(/\\\[\s*\\\(([\s\S]*?)\\\)\s*\\\]/g, '\\[$1\\]')
      .replace(/\\\(\s*\\\[([\s\S]*?)\\\]\s*\\\)/g, '\\[$1\\]');
  }

  const parser =
    root.marked &&
    new root.marked.Marked({
      gfm: true,
      breaks: false,
      extensions: [
        {
          name: 'displayMath',
          level: 'block',
          start(src) {
            return src.search(
              /(?:^|\n) {0,3}(?:\\\[|\$\$|\\begin\{|\\(?:frac|sqrt|int|sum|partial)\b)/
            );
          },
          tokenizer(src) {
            const match =
              /^(?: {0,3})(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\begin\{([^}]+)\}[\s\S]*?\\end\{\2\})(?:[ \t]*\n|$)/.exec(
                src
              );
            if (!match) {
              const line = src.split('\n')[0],
                t = line.trim();
              if (
                /^(?:\\|[A-Za-z]\s*=)/.test(t) &&
                /\\(?:frac|sqrt|int|sum|partial)\b/.test(t) &&
                !/[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(t.replace(/\\[A-Za-z]+/g, '')) &&
                !/\\[\[\]()]|\$/.test(t)
              ) {
                return {
                  type: 'displayMath',
                  raw: line + (src[line.length] === '\n' ? '\n' : ''),
                  text: '\\[' + t + '\\]',
                };
              }
              return;
            }
            let value = normalizeMath(match[1]);
            if (value.startsWith('\\begin')) value = '\\[' + value + '\\]';
            return { type: 'displayMath', raw: match[0], text: value };
          },
        },
        {
          name: 'inlineMath',
          level: 'inline',
          start(src) {
            return src.search(/\\[([]|\$/);
          },
          tokenizer(src) {
            // Single dollars require non-space edges and cannot consume another currency price.
            const match =
              /^(?:\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$(?!\s)(?:\\.|[^$\n])+?(?<!\s)\$(?!\d))/.exec(
                src
              );
            if (match) return { type: 'inlineMath', raw: match[0], text: normalizeMath(match[0]) };
          },
        },
      ],
    });

  function safeLink(href) {
    // Explicit external web links only; no data:, javascript:, protocol-relative or local paths.
    return /^https?:\/\/[^\s<>]+$/i.test(String(href || '')) && !/[\u0000-\u001f\u007f]/.test(href);
  }

  function render(container, source) {
    const doc = container.ownerDocument || root.document;
    source = String(source || '');
    // GFM splits cells before inline tokenization. Protect TeX vertical bars, including
    // norm/absolute-value notation, without rewriting code or ordinary escaped pipes.
    let prefix = 'GYANSETUMATH';
    while (source.includes(prefix)) prefix += 'X';
    const tableMath = new Map();
    let fence = null;
    const prepared = source
      .split('\n')
      .map((line) => {
        const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
        if (marker) {
          if (!fence) fence = marker[1];
          else if (
            marker[1][0] === fence[0] &&
            marker[1].length >= fence.length &&
            !line.slice(marker[0].length).trim()
          )
            fence = null;
          return line;
        }
        if (fence || /^(?: {4}|\t)/.test(line) || !line.includes('|')) return line;
        return line.replace(
          /(`+)[\s\S]*?\1|\\\([^\n]*?\\\)|\\\[[^\n]*?\\\]|\$\$[^\n]*?\$\$|\$(?!\s)[^\n$]+?(?<!\s)\$(?!\d)/g,
          (match) => {
            if (match.startsWith('`')) return match;
            const key = '\\(' + prefix + tableMath.size + '\\)';
            tableMath.set(key, normalizeMath(match));
            return key;
          }
        );
      })
      .join('\n');
    const mathText = (value) => tableMath.get(value) || value;
    container.classList.add('answer-content');
    const el = (tag, cls, text) => {
      const node = doc.createElement(tag);
      if (cls) node.className = cls;
      if (text != null) node.textContent = text;
      return node;
    };
    const literal = (parent, text) => parent.appendChild(doc.createTextNode(String(text || '')));
    const inline = (parent, tokens) => {
      for (const token of tokens || []) {
        if (['strong', 'em', 'del'].includes(token.type)) {
          const node = el(token.type);
          inline(node, token.tokens);
          parent.appendChild(node);
        } else if (token.type === 'codespan') {
          parent.appendChild(el('code', 'inline-code', token.text));
        } else if (
          token.type === 'br' ||
          (token.type === 'html' && /^<br\s*\/?\s*>$/i.test(token.raw || token.text || ''))
        ) {
          // Only a bare line-break tag is allowed, never attributes or arbitrary model HTML.
          parent.appendChild(el('br'));
        } else if (token.type === 'inlineMath') {
          parent.appendChild(el('span', 'answer-math', mathText(token.text)));
        } else if (token.type === 'link') {
          const node = el(safeLink(token.href) ? 'a' : 'span');
          if (safeLink(token.href)) {
            node.setAttribute('href', token.href);
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
          inline(node, token.tokens);
          parent.appendChild(node);
        } else if (token.type === 'image') {
          // Do not let a generated image URL contact a third party or impersonate an attachment.
          literal(parent, token.text || '[Image]');
        } else if (token.tokens) {
          inline(parent, token.tokens);
        } else {
          literal(parent, token.text ?? token.raw);
        }
      }
    };
    const table = (token) => {
      // Two/three-column conceptual tables become labelled cards on small screens.
      // Wider numeric/comparison tables keep their grid and scroll inside their own region.
      const wrap = el(
        'div',
        'answer-table-wrap' + (token.header.length <= 3 ? ' answer-table-cards' : '')
      );
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Answer table; scroll sideways for more columns');
      const tableNode = el('table', 'answer-table');
      tableNode.setAttribute('role', 'table');
      const head = el('thead');
      head.setAttribute('role', 'rowgroup');
      const header = el('tr');
      header.setAttribute('role', 'row');
      const labels = [];
      token.header.forEach((cell, index) => {
        const th = el('th');
        th.setAttribute('scope', 'col');
        th.setAttribute('role', 'columnheader');
        inline(th, cell.tokens);
        labels.push(th.textContent);
        if (token.align[index]) th.style.textAlign = token.align[index];
        header.appendChild(th);
      });
      if (labels.length === 3 && /^(?:#|no\.?|s\.?\s*no\.?|number)$/i.test(labels[0].trim()))
        wrap.classList.add('answer-table-numbered');
      head.appendChild(header);
      tableNode.appendChild(head);
      const body = el('tbody');
      body.setAttribute('role', 'rowgroup');
      token.rows.forEach((cells) => {
        const row = el('tr');
        row.setAttribute('role', 'row');
        cells.forEach((cell, index) => {
          const td = el('td');
          td.setAttribute('role', 'cell');
          const label = el('span', 'table-mobile-label', labels[index]);
          label.setAttribute('aria-hidden', 'true');
          const value = el('div', 'table-cell-value');
          inline(value, cell.tokens);
          if (token.align[index]) value.style.textAlign = token.align[index];
          td.appendChild(label);
          td.appendChild(value);
          row.appendChild(td);
        });
        body.appendChild(row);
      });
      tableNode.appendChild(body);
      wrap.appendChild(tableNode);
      return wrap;
    };
    const blocks = (parent, tokens) => {
      for (const token of tokens || []) {
        let node;
        switch (token.type) {
          case 'space':
            continue;
          case 'heading':
            // The page owns h1; answer headings start at h2 and never inherit branding styles.
            node = el('h' + Math.min(6, Math.max(2, token.depth)), 'answer-heading');
            inline(node, token.tokens);
            break;
          case 'paragraph':
          case 'text':
            node = el('p');
            if (token.tokens) inline(node, token.tokens);
            else literal(node, token.text);
            break;
          case 'list':
            node = el(token.ordered ? 'ol' : 'ul');
            if (token.ordered && token.start !== 1) node.setAttribute('start', String(token.start));
            token.items.forEach((item) => {
              const li = el('li');
              if (item.task) {
                const check = el('span', 'task-state', item.checked ? '✓ ' : '○ ');
                check.setAttribute('aria-label', item.checked ? 'Completed' : 'Not completed');
                li.appendChild(check);
              }
              blocks(li, item.tokens);
              node.appendChild(li);
            });
            break;
          case 'blockquote':
            node = el('blockquote');
            blocks(node, token.tokens);
            break;
          case 'hr':
            node = el('hr');
            break;
          case 'table':
            node = table(token);
            break;
          case 'code': {
            node = el('div', 'answer-code');
            if (token.lang)
              node.appendChild(el('div', 'code-language', token.lang.split(/\s/)[0].slice(0, 40)));
            const pre = el('pre');
            pre.setAttribute('tabindex', '0');
            pre.appendChild(el('code', null, token.text));
            node.appendChild(pre);
            break;
          }
          case 'displayMath':
            node = el('div', 'answer-math answer-math-display', mathText(token.text));
            break;
          case 'html': {
            const value = token.text ?? token.raw;
            if (/^\s*(?:<br\s*\/?\s*>\s*)+$/i.test(value)) {
              node = el('p');
              for (const unused of value.matchAll(/<br\s*\/?\s*>/gi)) node.appendChild(el('br'));
            } else node = el('p', null, value);
            break;
          }
          default:
            node = el('p', null, token.text ?? token.raw); // Raw HTML is always inert text.
        }
        parent.appendChild(node);
      }
    };
    if (!parser) {
      container.appendChild(el('p', 'answer-fallback', source));
      return;
    }
    try {
      blocks(container, parser.lexer(prepared));
    } catch (_) {
      container.textContent = '';
      container.appendChild(el('p', 'answer-fallback', source));
    }
  }

  root.GyanSetuAnswer = { render, normalizeMath };
})(typeof window === 'undefined' ? globalThis : window);
