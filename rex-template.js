#!/usr/bin/env node 


var optimist = require('optimist')
  , handlebars = require('handlebars')
  , uglify = require('uglify-js')
  , fs = require('fs')
  , path = require('path')
  , scli = require('supercli')
  , _ = require('underscore')._
  , watch = require('node-watch')
  , async = require('async')
  , EventEmitter = require('events').EventEmitter
  , Miyagi = new EventEmitter()
  , config = {
      infile : "./public/js/templates",
      outfile : "./public/js/templates.js",
      extensions : [".hb",".hbs",".handlebars"],
      engine : "handlebars",
      minify : true,
      watch : false,
      timeout : 5000,
      hb : {
        startString : '(function() { var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {}; Handlebars.partials = Handlebars.templates; \n',
        endString : '})();'
      },
      tplHeader : '\/** \n \
 * Compiled by Rex-Compiler on {{date}} \n \
 * \n \
 * Templates : {{templateCount}} \n \
 * Compile Time : {{compileTime}} \n \
 * Unmodified Templates Skipped : {{skippedTemplates}} \n \
 *\/ \n '
    }
  , compiled = {}
  , count = 0
  , remaining = 0
  , skipped = 0
  , startTime = 0
  , elapsedTime = 0
  , lastCompileTime = new Date().getTime()
  , argv = require('optimist')
    .usage('Efficiently and quickly compiles all the template files in a directory into an output file using your favorite microtemplating framework.')
    
    .alias('h', 'help')
    .describe('h', 'Show this usage information')
    .default('h', false)
    .boolean('h')

    .demand('i')
    .alias('i', 'in')
    .describe('i', 'Input directory, where template files are kept')
    .default('i', config.infile)
    
    .demand('o')
    .alias('o', 'out')
    .describe('o', 'Output file which will contain the compiled templates')
    .default('o', config.outfile)

    .alias('m', 'minify')
    .describe('m', 'If true, Rex-Compiler will cut out unnecessary whitespace, remove comments, and minify the file.')
    .default('m', config.minify)
    .boolean('m')

    .alias('w', 'watch')
    .describe('w', 'Have Rex-Compiler stay alive and monitor the input folder for changes, recompiling as they happen.')
    .default('w', config.watch)
    .boolean('w')

    // .alias('e', 'extension')
    // .describe('e', 'Have Rex-Compiler compile additional file extensions, one per -e flag.')
    // .default('e', config.extensions)

    .argv
  ;

/**
 * Bootstrap the application with CLI flags
 */
_.extend(config, {
  infile : argv.in,
  outfile : argv.out,
  minify : argv.minify,
  watch : argv.watch,
  help : optimist.help()
})

scli.config.appName("Rex-Template")

var help = function appHelp() {
  scli(config.help)
}

if(argv.help)
  help()

var error = function appError(err, line) {
  scli.error(err, line)
}

var preProcessCheck = function() {
  var newTime = new Date().getTime()
  if(parseInt( newTime - lastCompileTime) >= 3000) {
    startTime = new Date().getTime()
    count = skipped = remaining = 0
    lastCompileTime = newTime
    app()
  } else {
    scli.error("Duplicate compile detected! Difference of " + parseFloat( ( newTime - lastCompileTime ) / 1000) + " seconds")
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
  data = data || ""
  if(data == "")
    return ""
  else
    return handlebars.precompile( data, {})
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
  // Replace all placeholders in output file with appropriate data
  config.tplHeader = config.tplHeader.replace("{{date}}", now.toLocaleString() )
        .replace("{{templateCount}}", _.size(compiled))
        .replace("{{compileTime}}", elapsedTime)
        .replace("{{skippedTemplates}}", skipped)
  return config.tplHeader + output
}

var init = function appInit() {
  if(!fs.existsSync( path.resolve(config.infile) ) )
    throw "Input folder '" + config.infile + "' does not exist!"
  if(config.watch)
    Miyagi.emit('app:watch')
  /**
   * And away we go! :D
   */
  app()
}

var app = function RexCompiler() {
  count = remaining = skipped = 0
  lastCompileTime = new Date().getTime()
  startTime = new Date().getTime()
  Miyagi.once('app:cleanup', appCleanup)
  Miyagi.emit('read:folder', path.resolve(config.infile))
}

Miyagi.once('app:watch', function() {
  watch(config.infile, function(file) {
    preProcessCheck()
    // scli("File change detected: " + file)
  })
})

/**
 * Functional Event Listeners
 */
Miyagi.on('read:folder', function readFolder(folder, namespace) {
  fs.readdir(folder, function fileList(err, files) {
    addWorkers(files.length)
    async.each(files, function(file, fileProcessed) {
      var fp = path.resolve(folder + path.sep + file)
      fs.stat(fp, function(err, stats) {
        namespace = namespace || ""
        if(stats && stats.isDirectory()) {
          ns = namespace + file + "/"
          Miyagi.emit('read:folder', folder + path.sep + file, ns)
        } else if(stats && stats.isFile()) {
          // Is our file a template we care about?
          if(_.contains(config.extensions, path.extname(file))) {
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
    fs.readFile(path.resolve(config.infile + path.sep + name), 'utf8', function readInFile(err, fileContents) {
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
  var output = config.hb.startString
  _.each(compiled, function(tpl) {
    output += 'templates[\'' + tpl.name + '\'] = template(' + tpl.template + '); \n'
  })
  output += config.hb.endString
  fs.writeFile(config.outfile, prepareFile(output), function(err) {
    if(err) throw err
    var msg = "Successfully compiled " + _.size(compiled) + " templates to " + config.outfile + " in " + elapsedTime
    if(skipped > 0)
      msg += ", skipping " + skipped + " that didn't change."
    scli.success(msg)
  })
}

/**
 * Bootstrap complete, start application
 */
init()

