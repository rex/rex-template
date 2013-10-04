// Generated by CoffeeScript 1.6.3
(function() {
  var EventEmitter, Handlebars, Rex, app, argv, async, cli, fs, log, path, pkg, watch, _;

  pkg = require('../package');

  app = pkg.config;

  _ = require('rex-utils')._;

  cli = require('rex-shell');

  EventEmitter = require('events').EventEmitter;

  Handlebars = require('handlebars');

  fs = require('fs');

  path = require('path');

  async = require('async');

  watch = require('node-watch');

  argv = require('optimist').usage(app.cli.usage).alias('h', 'help').alias('v', 'version').alias('s', 'source').describe('s', app.cli.args.source.description)["default"]('s', app.cli.args.source["default"]).alias('d', 'dest').describe('d', app.cli.args.dest.description)["default"]('d', app.cli.args.dest["default"]).alias('w', 'watch').describe('w', app.cli.args.watch.description)["default"]('w', app.cli.args.watch["default"]).boolean('w').alias('q', 'quiet').describe('q', app.cli.args.quiet.description)["default"]('q', app.cli.args.quiet["default"]).boolean('q').argv;

  log = function() {
    return console.log.apply(console, arguments);
  };

  Rex = (function() {
    function Rex(Params) {
      log("Constructing new Rex App");
      if (!Params) {
        Params = {};
      }
      this.settings = _.extend(pkg.config, Params, {
        version: pkg.version
      });
      this.times = {};
      this.counts = {
        iteration: 1
      };
      this.paths = {
        source: _.osPath(this.settings.source),
        dest: _.osPath(this.settings.dest)
      };
      this.templates = {};
      this.compiled = {};
      this.activeFiles = [];
      this.errors = [];
      this.cache = {};
      this.Miyagi = new EventEmitter;
      this.HB = Handlebars;
      if (Params.handlebars) {
        this.attach(Params.handlebars);
      }
      this.validateFiles();
    }

    Rex.prototype.validateFiles = function() {
      var thys;
      thys = this;
      _.each(this.paths, function(filePath) {
        return thys.fileExists(filePath);
      });
      return this;
    };

    Rex.prototype.fileExists = function(filePath) {
      if (!fs.existsSync(filePath)) {
        this.errors.push("Required file missing: " + filePath);
        return false;
      } else {
        return true;
      }
    };

    Rex.prototype.getTemplate = function(filePath) {
      var fullPath;
      fullPath = path.resolve(this.paths.source, filePath);
      if (this.fileExists(fullPath)) {
        return this.HB.compile(fs.readFileSync(fullPath, {
          encoding: 'utf-8'
        }));
      } else {
        throw "Template not found: " + filePath + " at " + fullPath;
      }
    };

    Rex.prototype.error = function(message) {
      this.errors.push("Error: " + message);
      return this;
    };

    Rex.prototype.die = function() {
      cli.error("Rex-Template errors: (" + this.errors.length + " \n");
      _.each(this.errors, function(err) {
        return cli.$.red("> " + err);
      });
      _.showAdvancedHelp(pkg);
      return process.exit(1);
    };

    Rex.prototype.on = function(event, callback) {
      this.Miyagi.on(event, callback);
      return this;
    };

    Rex.prototype.emit = function() {
      this.Miyagi.emit.apply(this, arguments);
      return this;
    };

    Rex.prototype.attach = function(handlebars) {
      this.HB = handlebars;
      return this;
    };

    Rex.prototype.registerHelper = function(name, callback) {
      this.HB.registerHelper(name, callback);
      return this;
    };

    Rex.prototype.registerPartial = function(name, string) {
      this.HB.registerPartial(name, string);
      return this;
    };

    Rex.prototype.bootCLI = function() {
      app.version = pkg.version;
      _.defaults(argv, app);
      if (app.quiet || _.contains(argv._, 'quiet')) {
        cli.config.hideName();
      }
      if (argv.help || _.contains(argv._, 'help')) {
        _.showAdvancedHelp(pkg);
        cli.$.blue("What is this? " + (cli.$$.y(pkg.description)));
        cli.$.blue("I'm stuck and need help. " + (cli.$$.y(pkg.author)));
        cli.$.blue("GitHub repo? " + (cli.$$.y(pkg.homepage)));
        cli.$.blue("Command what?");
        cli.$.GREEN("  rex-template \r\n\t " + (cli.$$.y('Compiles ./public/js/templates/**/* into ./public/js/templates.js.')));
        cli.$.GREEN("  rex-template -w \r\n\t " + (cli.$$.y('Compiles the folder of templates and and watches the folder for changes.')));
        cli.$.GREEN("  rex-template -q \r\n\t " + (cli.$$.y("Compiles the folder of templates and reduces the text logged to the console.")));
        cli.$.GREEN("  rex-template -s './other/templates/folder/' -d './js/folder/templates.js' -w -q \r\n\t " + (cli.$$.y("Changes the input/output paths, reduces console logging, and watches for changes.")));
      }
      if (argv.version || _.contains(argv._, 'version')) {
        _.displayVersion(pkg, {
          Handlebars: this.HB.VERSION
        });
      }
      return this;
    };

    Rex.prototype.run = _.debounce(function() {
      console.time("Rex-Template Compile");
      this.counts({
        count: 0,
        skipped: 0,
        remaining: 0,
        errors: 0
      });
      this.Miyagi.once('app:write', this.write);
      this.Miyagi.emit('read:folder', this.paths.source);
      return this;
    }, pkg.config.timeout);

    Rex.prototype.canSkip = function(name, lastModified) {
      var cached, check;
      if (!_.has(this.compiled, name)) {
        false;
      }
      cached = new Date(this.compiled[name].modified).getTime();
      check = new Date(lastModified).getTime();
      return cached === check;
    };

    Rex.prototype.precompile = function(html) {
      if (html) {
        return this.HB.precompile(html, {});
      } else {
        return "";
      }
    };

    Rex.prototype.reset = function() {};

    Rex.prototype.clean = function(output) {
      return output.replace(/<!--(.*?)-->/gm, "").replace(/[\t]/gm, "").replace(/(\r\n|\n|\r|\\n)/gm, "").replace(/\s{2,}/g, ' ');
    };

    Rex.prototype.write = function() {
      return console.timeEnd("Rex-Template Compile");
    };

    Rex.prototype.complete = function() {};

    Rex.prototype.express = function(req, res, next) {
      res.render = function(template, params) {
        if (this.cache[template]) {
          return res.send(200, this.cache[template](params));
        } else {
          return res.send(200, this.getTemplate(template)(params));
        }
      };
      return next();
    };

    return Rex;

  })();

  module.exports = {
    init: function(Params) {
      var App;
      App = new Rex(Params);
      return App.bootCLI();
    },
    rex: Rex,
    Rex: Rex,
    version: pkg.version,
    pkg: pkg,
    something: function(thing) {
      return console.log("Thing: " + thing);
    }
  };

}).call(this);
