# Hexo Plugin to Optimize Website Files for Deployment


Generator for [Hexo](http://hexo.io/) that optimizes CSS, JS, HTML, and images + optionally deploys your site.

- Concatenate CSS and JS: https://github.com/vvo/concat-files
- minify CSS: https://github.com/GoalSmashers/clean-css
- uglify JS: https://github.com/mishoo/UglifyJS2
- minify HTML: https://github.com/Moveo/minimize
- gzip html: https://github.com/kkaefer/node-zlib
- optimize images: https://github.com/kevva/image-min

Your CSS and JS gets saved and inserted into your HTML as main.min.css and main.min.js with a cache-busting query string appended. We skip any CDN links.

### Notice
concatenate seems doesn't work well , if you deploy with nginx 
I'm trying to review the code and fix the bugs.

### Command Line Usage

To generate, then optimize, and optionally deploy (-d flag)...

```bash
hexo optimize -d
# or aliases...
hexo o #hexo optimize
hexo od #hexo optimize -d
```

### Config Options
In Hexo's `_config.yml` you can set the following options...

```yml
optimize:
  # Defaults
  image_min:
    run: true
    optimizationLevel: 4
  css_concat: true
  css_min: true
  js_concat: true
  js_min: true
  html_min:
    run: true
    removeComments: true
    removeCommentsFromCDATA: true
    collapseWhitespace: true
    collapseBooleanAttributes: true
    removeEmptyAttributes: true
  gzip: true
```

If you want to deploy be sure to set up [one of the deployment options](http://hexo.io/docs/deployment.html) in your config as well. 

```yml
deploy:
  type: rsync
  host: <host>
  user: <user>
  root: <root>
  port: [port] # Default is 22
  delete: [true|false] # Default is true
```
