# Hexo Plugin to Optimize Website Files for Deployment

Generator for [Hexo](http://zespia.tw/hexo/) that optimizes css, js, html, and imgages + optionally deploys your site.

- Concatenate CSS and JS: https://github.com/vvo/concat-files
- minify CSS: https://github.com/GoalSmashers/clean-css
- uglify JS: https://github.com/mishoo/UglifyJS2
- minify HTML: https://github.com/Moveo/minimize
- gzip html: https://github.com/kkaefer/node-zlib
- optimize images: https://github.com/kevva/image-min

### CLI Usage

```
hexo optimize -d
or aliases...
hexo o #hexo optimize
hexo od #hexo optimize -d
```
Generate, then Optimize, then optional deploy (-d flag)

### Config Options
In Hexo's `_config.yml` you can set the following options...

```
optimize:
  # Defaults
  image_min: true
  css_concat: true
  css_min: true
  js_concat: true
  js_min: true
  html_min: true
  gzip: true
```

If you want to deploy be sure to set up deployment in your config as well... 

```
# 1. For Github
deploy:
  type: github
  repo: <repository url>
  branch: [branch]

# 2. For Heroku
deploy:
  type: heroku
  repo: <repository url>

# 3. For Rsync
deploy:
  type: rsync
  host: <host>
  user: <user>
  root: <root>
  port: [port] # Default is 22
  delete: [true|false] # Default is true

# 4. For OpenShift DIY Cartridge
deploy:
  type: openshift
  remote: <upstream git remote>
  branch: [upstream git branch] # Default is master

```