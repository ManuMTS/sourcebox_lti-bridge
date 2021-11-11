const Clipboard = require('clipboard');
const _ = require('lodash');
const Highlight = require('highlight.js');
const juice = require('juice');

/* eslint-env browser */


/**
 * Klasse, welche die Generierung von HTML Beschreibungen zum
 * kopieren in die Beschreibung des LMS erstellt 
 */
class GenerateDescription {
  /**
   * @param {Object} files Objekt mit Dateinamen als Keys und Inhalt als Values.
   */
  constructor(files) {
    this.files = files;
    new Clipboard('#copyHtml');
    window.$('#settingsModal').on('shown.bs.modal', () => {
      const css = '.hljs{display:block;overflow-x:auto;padding:.5em;background:#fdf6e3;color:#657b83}.hljs-comment,.hljs-quote{color:#93a1a1}.hljs-addition,.hljs-keyword,.hljs-selector-tag{color:#859900}.hljs-doctag,.hljs-literal,.hljs-meta .hljs-meta-string,.hljs-number,.hljs-regexp,.hljs-string{color:#2aa198}.hljs-name,.hljs-section,.hljs-selector-class,.hljs-selector-id,.hljs-title{color:#268bd2}.hljs-attr,.hljs-attribute,.hljs-class .hljs-title,.hljs-template-variable,.hljs-type,.hljs-variable{color:#b58900}.hljs-bullet,.hljs-link,.hljs-meta,.hljs-meta .hljs-keyword,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-subst,.hljs-symbol{color:#cb4b16}.hljs-built_in,.hljs-deletion{color:#dc322f}.hljs-formula{background:#eee8d5}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}';
      let htmlText = '';
      _.each(this.files, (file, filename) => {
        htmlText += `<h3>${filename}</h3><br>`;
        htmlText += Highlight.highlight('c', file).value;
      });
      htmlText = juice.inlineContent(htmlText, css);
      htmlText = htmlText.replace(/\n/g, '<br>\n');
      htmlText = htmlText.replace(/\s\s/g, '&nbsp;&nbsp;');
      document.getElementById('htmlCode').innerText = htmlText;
    });
  }
}

exports = GenerateDescription;
module.exports = exports;

