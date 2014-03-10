hexo-generator-optimize
=======================

Generator for Hexo that optimizes css, js, html, and imgages + optionally deploys your site.

- Concatenate CSS and JS: for local files only... skip cdn assets
- minify CSS (this is our current index.js starting point): https://github.com/flerro/hexo-generator-minify/blob/master/index.js
- uglify JS: https://www.npmjs.org/package/uglify-js
- minify HTML: https://www.npmjs.org/package/minimize
- optimize images https://www.npmjs.org/package/image-min
- gzip https://www.npmjs.org/package/hexo-gzip

 
## CLI Usage

```
hexo optimize -d
or aliases...
hexo o #hexo optimize
hexo od #hexo optimize -d
```

Generate, then Optimize, then optional deploy (-d flag)