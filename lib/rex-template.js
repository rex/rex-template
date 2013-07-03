/*###############################################################################
#
#             _ __ _____  __   Welcome to the      _
#            | '__/ _ \ \/ / ___ __ ___ ____  _ __| |_ ___ _ __
#            | | |  __/>  < / -_) _/ _ (_-< || (_-<  _/ -_) '  \
#            |_|  \___/_/\_\\___\__\___/__/\_, /__/\__\___|_|_|_|
#                                          |__/
#
# The rex-* ecosystem is a collection of like-minded modules for Node.js/NPM
#   that allow developers to reduce their time spent developing by a wide margin.
#
#   Header File Version: 0.0.1, 06/08/2013
#
# The MIT License (MIT)
#
# Copyright (c) 2013 Pierce Moore <me@prex.io>
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
#######*/
var cli = require('rex-shell')
  , utils = require('rex-utils')
  , _ = require('rex-utils')._
  , handlebars = require('handlebars')
  , fs = require('fs')
  , path = require('path')
  , watch = require('node-watch')
  , async = require('async')
  , EventEmitter = require('events').EventEmitter
  , Miyagi = new EventEmitter()
  , package = require('../package')
  , app = package.config
  , compiled = {}
  , count = 0
  , remaining = 0
  , skipped = 0
  , iteration = 1
  , startTime = 0
  , elapsedTime = 0
  , timeSaved = 0.0
  , lastCompileTime = new Date().getTime()
  , argv = require('optimist')
    .usage(app.cli.usage)

    .alias('h','help')
    .alias('v','version')

    .alias('i', 'in')
    .describe('i', app.cli.args.in.description)
    .default('i', app.cli.args.in.default)
    
    .alias('o', 'out')
    .describe('o', app.cli.args.out.description)
    .default('o', app.cli.args.out.default)

    .alias('w', 'watch')
    .describe('w', app.cli.args.watch.description)
    .default('w', app.cli.args.watch.default)
    .boolean('w')

    .alias('q', 'quiet')
    .describe('q', app.cli.args.quiet.description)
    .default('q', app.cli.args.quiet.default)
    .boolean('q')

    .argv
  ;

exports.version = package.version
exports.package = package
exports.app = app

/**
 * Bootstrap the application with CLI flags
 */
app.version = package.version
_.extend(app, {
  infile : argv.in,
  outfile : argv.out,
  watch : argv.watch,
  quiet : argv.quiet
})
  
cli.config.appName("Rex-Template")
if(app.quiet || _.contains(argv._, 'quiet'))
  cli.config.hideName()

if(argv.help || _.contains(argv._, 'help')) {
  _.showAdvancedHelp(package)

  cli.$.red("╭ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ╮")
  cli.$.red("⌦  Hi, I'm Rex-Template. I'm here to make your life easier. ⌫ ")
  cli.$.red("╰ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ╯\r\n")
  cli.$.blue("  What is this? \r\n\t╰ " + cli.$$.y(package.description) )
  cli.$.blue("  I'm stuck and need help. \r\n\t╰ " + cli.$$.y(package.author))
  cli.$.blue("  GitHub repo? \r\n\t╰ " + cli.$$.y(package.homepage))
  cli.$.blue("  Command what?")
  cli.$.GREEN("     rex-template  \r\n\t╰ " + cli.$$.y("Compiles ./public/js/templates into ./public/js/templates.js."))
  cli.$.GREEN("     rex-template -w  \r\n\t╰ " + cli.$$.y("Compiles the folder of templates and and watches the folder for changes."))
  cli.$.GREEN("     rex-template  \r\n\t╰ " + cli.$$.y("Compiles the folder of templates and reduces the text logged to the console."))
  cli.$.GREEN("     rex-template -i './other/templates/folder/' -o './js/folder/templates.js' -w -q  \r\n\t╰ " + cli.$$.y("Changes the input/output paths, reduces console logging, and watches for changes."))
   
  process.exit(0)
}

if(argv.version || _.contains(argv._, 'version')) {
  _.displayVersion(package, {
    Handlebars : handlebars.VERSION
  })
  process.exit(0) 
}

var preProcessCheck = function() {
  var newTime = new Date().getTime()
  if(parseInt( newTime - lastCompileTime) >= app.timeout ) {
    startTime = new Date().getTime()
    count = skipped = remaining = 0
    lastCompileTime = newTime
    run()
  } else {
    cli.error("Duplicate compile detected! Difference of " + parseFloat( ( newTime - lastCompileTime ) / 1000) + " seconds")
    return false
  }
}

var noRecentChanges = function(tpl, filesystemLastModified) {
  if(_.has(compiled, tpl)) {
    if(new Date(compiled[tpl].modified).getTime() == new Date(filesystemLastModified).getTime()) {
      skipped++
      return true
    }
  }
  return false
}

var precompile = function(data) {
  try {
    data = data || ""
    if(data == "")
      return ""
    else
      return handlebars.precompile( data, {})
  } catch(err) {
    cli.error(err);
    compileErrors++
    return "";
  }
}

var addWorkers = function addWorkers(num) {
  remaining = remaining + num
}

var done = function workerDone() {
  remaining--
  if(remaining == -1)
    Miyagi.emit('app:cleanup')
}

var compileTime = function compileTime(start, end) {
  return ( end - start ) / 1000 + " seconds"
}

var clean = function cleanOutput(output) {
  output = output
        .replace(/<!--(.*?)-->/gm, "")
        .replace(/[\t]/gm, "")
        .replace(/(\r\n|\n|\r|\\n)/gm,"")
        .replace(/\s{2,}/g, ' ')
  return output
}

var prepareFile = function signFile(output) {
  var now = new Date()
  elapsedTime = compileTime(startTime, now.getTime() )

  timeSaved += parseFloat( ( ( now.getTime() - startTime ) * skipped ) / 1000 )

  var tplHeader = handlebars.compile( app.tplHeader.join(" \n") )({
    date : now.toLocaleString(),
    templateCount : _.size(compiled),
    compileTime : elapsedTime,
    version : app.version,
    infile : app.infile,
    outfile : app.outfile,
    extensions : app.extensions.join(", "),
    timeout : app.timeout,
    iteration : iteration,
    skipped : skipped,
    timeSaved : timeSaved,
    compileErrors : compileErrors
  })
  return tplHeader + output
}

exports.init = function appInit(infile, outfile) {
  app.infile = infile || app.infile
  app.outfile = outfile || app.outfile
  if(!fs.existsSync( _.osPath( app.infile ) ) ) {
    cli.error("Input folder '" + app.infile + "' does not exist!")
    _.showAdvancedHelp(package)
    process.exit(1)
  }

  if(app.watch)
    Miyagi.emit('app:watch')
  /**
   * And away we go! :D
   */
  run()
}

var run = function RexCompiler() {
  count = remaining = skipped = compileErrors = 0
  lastCompileTime = new Date().getTime()
  startTime = new Date().getTime()
  Miyagi.once('app:cleanup', appCleanup)
  Miyagi.emit('read:folder', _.osPath(app.infile))
}

Miyagi.once('app:watch', function() {
  watch(app.infile, function(file) {
    cli("File change detected: " + file)
    preProcessCheck()
  })
})

/**
 * Functional Event Listeners
 */
Miyagi.on('read:folder', function readFolder(folder, namespace) {
  fs.readdir(folder, function fileList(err, files) {
    addWorkers(files.length)
    async.each(files, function(file, fileProcessed) {
      var fp = _.osPath(folder + path.sep + file)
      fs.stat(fp, function(err, stats) {
        namespace = namespace || ""
        if(stats && stats.isDirectory()) {
          Miyagi.emit('read:folder', folder + path.sep + file, namespace + file + "/" )
        } else if(stats && stats.isFile()) {
          // Is our file a template we care about?
          if(_.contains(app.extensions, path.extname(file))) {
            Miyagi.emit('read:file', file, namespace, stats)
          } else {
            done()
          }
        } else {
          done()
        }
        fileProcessed()
      })
    }, function(err, results) {
      done()
    })
  })
})

Miyagi.on('read:file', function readFile(file, namespace, stats) {

  var ext = path.extname(file)
  var name = namespace + file
  var tpl = name.replace(ext, "")

  // If this template has already been seen before, avoid compiling it if we can
  if(noRecentChanges(tpl, stats.mtime)) {
    done()
    return false
  } else {
    fs.readFile(_.osPath(app.infile + path.sep + name), 'utf8', function readInFile(err, fileContents) {
      if(err)
        throw err
      compiled[tpl] = {
        name : tpl,
        ext : ext,
        template : clean( precompile(fileContents) ),
        modified : stats.mtime
      }
      done()
    })
  }
})

var appCleanup = function appCleanup() {
  var output = app.hb.startString
  _.each(compiled, function(tpl) {
    output += 'templates[\'' + tpl.name + '\'] = template(' + tpl.template + '); \n'
  })
  output += app.hb.endString
  fs.writeFile( _.osPath(app.outfile), prepareFile(output), function(err) {
    if(err) throw err
    var msg = "[#" + iteration + ", " + new Date().toLocaleTimeString() + "] "
    if(compileErrors)
      msg += cli.$$.R("[" + compileErrors + ((compileErrors > 1) ? " ERRORS" : " ERROR") + "!] ")

    msg += "Compiled " + _.size(compiled) + " templates to " + app.outfile + " in " + elapsedTime
    if(skipped > 0)
      msg += ", skipping " + skipped + " that didn't change."

    if(compileErrors)
      cli.error(msg)
    else
      cli.success(msg)

    // Handle all our variables and whatnot
    iteration++

  })
}
