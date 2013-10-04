var package = require('../package')
  , _ = require('rex-utils')._
  , cli = require('rex-shell')
  , EventEmitter = require('events').eventemitter
  , Handlebars = require('handlebars')
  , fs = require('fs')
  , path = require('path')
  , async = require('async')

exports.Rex = var Rex = function(Params) {
  this.settings = _.extend(package.config, Params, { version : package.version })
  this.counts = {
    iteration : 1
  }
  this.times = {}
  this.paths = {
    source : _.osPath( this.settings.source ),
    dest : _.osPath( this.settings.dest )
  }
  this.templates = {}
  this.compiled = {}
  this.activeFiles = []
  this.errors = []

  /**
   * Instantiate and attach our libraries
   */
  this.Miyagi = new EventEmitter()
  this.HB = Handlebars

  /**
   * Now we take the Parameters into account to set specific things
   */
  if(Params.handlebars)
    this.attach(Params.handlebars)

  /**
   * Pre-boot routines
   */
  this.validateFiles()

  return this
}

Rex.prototype.validateFiles = function() {
  _.each(this.paths, function(path) {
    this.fileExists( path )
  })
  return this
}

Rex.prototype.fileExists = function(Path) {
  if( !fs.existsSync( Path ) ) {
    this.errors.push("Required file missing: "+ Path)
    return false
  } else {
    return true
  }
}

Rex.prototype.error = function(Message) {
  this.errors.push("Error: ", Message)
  return this
}

Rex.prototype.die = function() {
  cli.error("Rex-Template errors: ("+ this.errors.length +") \n")
  _.each(this.errors, function(err) {
    cli.$.red("> "+ err)
  })
  _.showAdvancedHelp(package)
  process.exit(1)
}

Rex.prototype.on = function(event, callback) {
  this.Miyagi.on(event, callback)
  return this
}

Rex.prototype.emit = function() {
  this.Miyagi.emit.apply(this, arguments)
  return this
}

Rex.prototype.attach = function(Handlebars) {
  this.HB = Handlebars
  return this
}

Rex.prototype.registerHelper = function(name, callback) {
  this.HB.registerHelper(name, callback)
  return this
}

Rex.prototype.registerPartial = function(name, string) {
  this.HB.registerPartial(name, string)
  return this
}

Rex.prototype.bootCLI = function() {
  //
}

Rex.prototype.run = _.debounce(function() {
  console.time("rex-template compile")
  this.counts = {
    count : 0,
    skipped : 0,
    remaining : 0,
    errors : 0
  }
  this.Miyagi.once('app:write', this.write )
  this.Miyagi.emit('read:folder', this.paths.source )

  return this
}, package.config.timeout )

Rex.prototype.canSkip = function(name, filesystemLastModified) {
  if( !_.has( this.compiled, name ) ) return false

  var cached = new Date( this.compiled[name].modified ).getTime()
    , check = new Date( filesystemLastModified ).getTime()

  return ( cached == check )
}

Rex.prototype.precompile = function(html) {
  ( html ) ? return this.HB.precompile( html, {}) : return ""
}

Rex.prototype.reset = function() {
  //
}

Rex.prototype.clean = function(output) {
  return output
        .replace(/<!--(.*?)-->/gm, "")
        .replace(/[\t]/gm, "")
        .replace(/(\r\n|\n|\r|\\n)/gm,"")
        .replace(/\s{2,}/g, ' ')
}

Rex.prototype.write = function() {
  console.timeEnd("rex-template compile")
  //
}

Rex.prototype.complete = function() {
  //
}