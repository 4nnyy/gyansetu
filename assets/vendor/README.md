# Vendored dependency

`marked-18.1.0.js` is the unmodified UMD build from the official npm package `marked@18.1.0`.
License: MIT, included in `marked-LICENSE.txt`.

Source: https://registry.npmjs.org/marked/-/marked-18.1.0.tgz
Verified npm tarball integrity:
`sha512-PamYXWWWg2nboG3oX5Ffzpy3EFZROqZJK9hSlMmUnekp7TxPs5DcT95vwd46m73/exfKCRVMtgXoPMI4FEJL6w==`

GyanSetu uses the lexer only. `answer-renderer.js` builds an allowlisted DOM tree using text nodes; Marked-generated HTML is never inserted into the document.
