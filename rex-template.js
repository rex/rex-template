#!/usr/bin/env node 

var optimist = require('optimist')
  , handlebars = require('handlebars')
  , fs = require('fs')
  , path = require('path')
  , scli = require('supercli')
  , _ = require('underscore')._
  , watch = require('node-watch')
  , async = require('async')
  , EventEmitter = require('events').EventEmitter
  , Miyagi = new EventEmitter()
  , __cfg__ = require('./package.json')
  , __version__ = require('./package.json').version
  , app = require('./package.json').app
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
    .usage(app.description)
    
    .alias('h', 'help')
    .describe('h', 'Show this usage information')
    .default('h', false)
    .boolean('h')

    .alias('i', 'in')
    .describe('i', 'Folder of templates to compile')
    .default('i', app.infile)
    
    .alias('o', 'out')
    .describe('o', 'Compiled output file')
    .default('o', app.outfile)

    .alias('m', 'minify')
    .describe('m', 'Remove extra comments and whitespace')
    .default('m', app.minify)
    .boolean('m')

    .alias('w', 'watch')
    .describe('w', 'Monitor the input folder for changes')
    .default('w', app.watch)
    .boolean('w')

    .alias('v', 'version')
    .describe('v', 'Display the current version number.')
    .boolean('v')

    .alias('q', 'quiet')
    .describe('q', 'Reduce console output')
    .default('q', false)
    .boolean('q')

    .argv
  ;

/**
 * Bootstrap the application with CLI flags
 */
app.version = __cfg__.version
_.extend(app, {
  infile : argv.in,
  outfile : argv.out,
  minify : argv.minify,
  watch : argv.watch,
  quiet : argv.quiet
})
  
scli.config.appName("Rex-Template")
if(app.quiet)
  scli.config.hideName()

if(argv.help) {
  scli.$.BLUE("Hi, I'm Rex-Template. I'm here to make your life easier.")
  scli.$.blue("  What is this? " + scli.$$.y(__cfg__.description) )
  scli.$.blue("  I'm stuck and need help. " + scli.$$.y(__cfg__.author))
  scli.$.blue("  GitHub repo? " + scli.$$.y(__cfg__.homepage))
  scli.$.blue("  Command what?")
  scli.$.GREEN("     rex-template \t" + scli.$$.y(" - Compiles ./public/js/templates into ./public/js/templates.js."))
  scli.$.GREEN("     rex-template -w \t" + scli.$$.y(" - Compiles the folder of templates and and watches the folder for changes."))
  scli.$.GREEN("     rex-template -q \t" + scli.$$.y(" - Compiles the folder of templates and reduces the text logged to the console."))
  scli.$.GREEN("     rex-template -i './other/templates/folder/' -o './js/folder/templates.js' -wq \t" + scli.$$.y(" - Changes the input/output paths, reduces console logging, and watches for changes."))
   

  console.log(optimist.help())
  process.exit(0)
}

if(argv.version) {
  scli.$.blue("Rex-Template Version Tree: ")
  scli.$.blue("\t Rex-Template: \t [ " + scli.$$.r( app.version ) + " ]")
  scli.$.blue("\t Handlebars: \t [ " + scli.$$.r( handlebars.VERSION ) + " ]")
  scli.$.blue("\t Node.js: \t [ " + scli.$$.r( process.versions.node ) + " ]")
  scli.$.blue("\t V8 (Engine): \t [ " + scli.$$.r( process.versions.v8 ) + " ]")
  process.exit(0) 
}

var error = function appError(err, line) {
  scli.error(err, line)
}

var preProcessCheck = function() {
  var newTime = new Date().getTime()
  if(parseInt( newTime - lastCompileTime) >= app.timeout ) {
    startTime = new Date().getTime()
    count = skipped = remaining = 0
    lastCompileTime = newTime
    run()
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
  try {
    data = data || ""
    if(data == "")
      return ""
    else
      return handlebars.precompile( data, {})
  } catch(err) {
    scli.error(err);
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

  // Replace all placeholders in output file with appropriate data
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

var init = function appInit() {
  if(!fs.existsSync( path.resolve(app.infile) ) ) {
    scli.error("Input folder '" + app.infile + "' does not exist!")
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
  Miyagi.emit('read:folder', path.resolve(app.infile))
}

Miyagi.once('app:watch', function() {
  watch(app.infile, function(file) {
    scli("File change detected: " + file)
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
      var fp = path.resolve(folder + path.sep + file)
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
    fs.readFile(path.resolve(app.infile + path.sep + name), 'utf8', function readInFile(err, fileContents) {
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
  fs.writeFile(app.outfile, prepareFile(output), function(err) {
    if(err) throw err
    var msg = "[#" + iteration + ", " + new Date().toLocaleTimeString() + "] "
    if(compileErrors)
      msg += scli.$$.R("[" + compileErrors + ((compileErrors > 1) ? " ERRORS" : " ERROR") + "!] ")

    msg += "Compiled " + _.size(compiled) + " templates to " + app.outfile + " in " + elapsedTime
    if(skipped > 0)
      msg += ", skipping " + skipped + " that didn't change."

    if(compileErrors)
      scli.error(msg)
    else
      scli.success(msg)

    // Handle all our variables and whatnot
    iteration++

  })
}

/**
 * Bootstrap complete, start application
 */
init()

