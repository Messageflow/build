<div align="center" style="text-align: center;">
  <h1 style="border-bottom: none;">@messageflow/build</h1>

  <p>Quick build with Gulp</p>
</div>

<hr />

[![NPM][nodei-badge]][nodei-url]

[![Version][version-badge]][version-url]
[![Downloads][downloads-badge]][downloads-url]
[![MIT License][mit-license-badge]][mit-license-url]
[![Code of Conduct][coc-badge]][coc-url]

[![Build Status][travis-badge]][travis-url]
[![Dependency Status][daviddm-badge]][daviddm-url]
[![NSP Status][nsp-badge]][nsp-url]
[![Codecov][codecov-badge]][codecov-url]
[![Coverage Status][coveralls-badge]][coveralls-url]

[![codebeat-badge]][codebeat-url]
[![codacy-badge]][codacy-url]

> Better build process with [Gulp][gulp-url] for general [Node.js][nodejs-url] projects written in [TypeScript][typescript-url].

## Table of contents

- [Pre-requisites](#pre-requisites)
- [Setup](#setup)
  - [Install](#install)
  - [Usage](#usage)
    - [Node.js](#nodejs)
    - [Native ES modules or TypeScript](#native-es-modules-or-typescript)
- [API Reference](#api-reference)
  - [BuilderParams](#builderparams)
  - [builder([options])](#builderoptions)
- [License](#license)

## Pre-requisites

- [Node.js][node-js-url] >= 8.9.0
- [NPM][npm-url] >= 5.5.1 ([NPM][npm-url] comes with [Node.js][node-js-url] so there is no need to install separately.)

## Setup

### Install

```sh
# Install via NPM
$ npm install --save @messageflow/build
```

### Usage

#### Node.js

```js
const gulp = require('gulp');
const { builder } = require('@messageflow/build');

const build = builder();
/** `cleanGlobs` can be helpful when the destination directory is not the `dist` directory. */
// const build = builder({
//   dist: '.',
//   cleanGlobs: [
//     './*.js',
//     './*.d.ts',
//     '!./gulpfile.js',
//     '!./json.d.ts',
//   ],
// });

gulp.task('clean', build.clean);
gulp.task('lint', build.lint);
gulp.task('copy', build.copy);
gulp.task('ts', build.ts);
gulp.task('watch', build.watch);
gulp.task('default', build.default);
```

#### Native ES modules or TypeScript

```ts
// @ts-check

import gulp from 'gulp';
import { builder } from '@messageflow/build';

const build = builder();
/** `cleanGlobs` can be helpful when the destination directory is not the `dist` directory. */
// const build = builder({
//   dist: '.',
//   cleanGlobs: [
//     './*.js',
//     './*.d.ts',
//     '!./gulpfile.js',
//     '!./json.d.ts',
//   ],
// });

gulp.task('clean', build.clean);
gulp.task('lint', build.lint);
gulp.task('copy', build.copy);
gulp.task('ts', build.ts);
gulp.task('watch', build.watch);
gulp.task('default', build.default);
```

## API Reference

### BuilderParams

- `src` <[string][string-mdn-url]> Optional source directory. Defaults to `src`.
- `dist` <[string][string-mdn-url]> Optional destination directory. Defaults to `dist`.
- `ignores` <[string][string-mdn-url]|[string][string-mdn-url][]> Optional glob patterns to ignore files/ directories. Defaults to `[demo*, test*]`.
- `cleanGlobs` <[string][string-mdn-url]|[string][string-mdn-url][]> Optional glob patterns to clean files/ directories up before every build process initiates. ***This is required only when the destination directory is not the `dist` directory.*** Defaults to the value of `dist` if unspecified.
- `isProd` <[boolean][boolean-mdn-url]> Optional production flage. Set to `true` if the build process is meant for production. Defaults to `process.env.NODE_ENV === 'production'`.
- `rootPath` <[string][string-mdn-url]> Optional path to current working directory. Defaults to `.`.
- `babelConfig` <[Object][object-mdn-url]> Optional configuration for [Babel][babel-url]. ***This is only needed when `isProd` is set to true.***
- `tsConfig` <[string][string-mdn-url]> Optional path to `tsconfig.json`. Defaults to `./tsconfig.json`.
- `tslintConfig` <[string][string-mdn-url]> Optional path to `tslint.json`. Defaults to `./tslint.json`.

___

### builder([options])

- `options` <[BuilderParams][builderparams-url]> Optional configuration for the build process.
- returns: <[Object][object-mdn-url]> An object of build tasks to be assigned as [Gulp][gulp-url] task, e.g. `gulp.task('<TASK_NAME>', <GULP_TASK_FUNCTION>)`. It comprises of a list of tasks fo a common build process with Gulp for most of the projects:

  1. `clean` - Always remove old files from previous build.
  2. `lint` - Always lint all `.ts` files with given `tslint.json`.
  3. `ts` - Compile all `.ts` files with given `tsconfig.json`.
  4. `copy` - Copy all asset files such as `images`, `json`, `md`, etc.
  5. `watch` - Run the build process by watching for flle changes.
  6. `default` - Default build process that comprises all the above.

## License

[MIT License](https://Messageflow.mit-license.org/) © Rong Sen Ng

<!-- References -->
[typescript-url]: https://github.com/Microsoft/TypeScript
[node-js-url]: https://nodejs.org
[npm-url]: https://www.npmjs.com
[node-releases-url]: https://nodejs.org/en/download/releases
[gulp-url]: https://github.com/gulpjs/gulp
[babel-url]: https://github.com/babel/babel

[array-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[boolean-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[function-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[map-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[number-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[object-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[promise-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[regexp-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[set-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
[string-mdn-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String

[builderparams-url]: #builderparams

<!-- Badges -->
[nodei-badge]: https://nodei.co/npm/@messageflow/build.png?downloads=true&downloadRank=true&stars=true

[version-badge]: https://img.shields.io/npm/v/@messageflow/build.svg?style=flat-square
[downloads-badge]: https://img.shields.io/npm/dm/@messageflow/build.svg?style=flat-square
[mit-license-badge]: https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square

[travis-badge]: https://img.shields.io/travis/Messageflow/build.svg?style=flat-square
[daviddm-badge]: https://img.shields.io/david/Messageflow/build.svg?style=flat-square
[nsp-badge]: https://nodesecurity.io/orgs/messageflow/projects/4650ee88-a5b8-4474-bff4-7d55d8b2c51f/badge?style=flat-square
[codecov-badge]: https://codecov.io/gh/Messageflow/build/branch/master/graph/badge.svg?style=flat-square
[coveralls-badge]: https://coveralls.io/repos/github/Messageflow/build/badge.svg?branch=master&style=flat-square

[codebeat-badge]: https://codebeat.co/badges/ca230cdd-bdc5-4f9e-bd39-7b62d47f5fef?style=flat-square
[codacy-badge]: https://api.codacy.com/project/badge/Grade/ef8c3a98c9e649d19a67ae78f980748a?style=flat-square

<!-- Links -->
[nodei-url]: https://nodei.co/npm/@messageflow/build

[version-url]: https://www.npmjs.com/package/@messageflow/build
[downloads-url]: http://www.npmtrends.com/@messageflow/build
[mit-license-url]: https://github.com/Messageflow/build/blob/master/LICENSE
[coc-url]: https://github.com/Messageflow/build/blob/master/CODE_OF_CONDUCT.md

[travis-url]: https://travis-ci.org/Messageflow/build
[daviddm-url]: https://david-dm.org/Messageflow/build
[nsp-url]: https://nodesecurity.io/orgs/messageflow/projects/4650ee88-a5b8-4474-bff4-7d55d8b2c51f
[codecov-url]: https://codecov.io/gh/Messageflow/build
[coveralls-url]: https://coveralls.io/github/Messageflow/build?branch=master

[codebeat-url]: https://codebeat.co/projects/github-com-messageflow-build-master
[codacy-url]: https://www.codacy.com/app/motss/build?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Messageflow/build&amp;utm_campaign=Badge_Grade
