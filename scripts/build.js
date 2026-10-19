'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');

// Only browser assets belong in the public deployment directory.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
fs.copyFileSync(path.join(root, 'index.html'), path.join(output, 'index.html'));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
