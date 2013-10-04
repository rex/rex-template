pkg = require '../package'
app = pkg.config
_ = require('rex-utils')._
cli = require 'rex-shell'
EventEmitter = require('events').EventEmitter
Handlebars = require 'handlebars'
fs = require 'fs'
path = require 'path'
async = require 'async'
watch = require 'node-watch'
argv = require('optimist')
	.usage(app.cli.usage)

	.alias('h','help')
	.alias('v','version')

	.alias('s', 'source')
	.describe('s', app.cli.args.source.description)
	.default('s', app.cli.args.source.default)

	.alias('d', 'dest')
	.describe('d', app.cli.args.dest.description)
	.default('d', app.cli.args.dest.default)

	.alias('w', 'watch')
	.describe('w', app.cli.args.watch.description)
	.default('w', app.cli.args.watch.default)
	.boolean('w')

	.alias('q', 'quiet')
	.describe('q', app.cli.args.quiet.description)
	.default('q', app.cli.args.quiet.default)
	.boolean('q')

	.argv

log = () ->
	console.log.apply console, arguments

class Rex
	constructor: (Params) ->
		log "Constructing new Rex App"
		unless Params then Params = {}

		@settings = _.extend pkg.config, Params, { version : pkg.version }
		@times = {}
		@counts = 
			iteration : 1
		@paths =
			source : _.osPath @settings.source
			dest : _.osPath @settings.dest
		@templates = {}
		@compiled = {}
		@activeFiles = []
		@errors = []
		@cache = {}

		# log "Rex App", this


		@Miyagi = new EventEmitter
		@HB = Handlebars

		if Params.handlebars
			@attach Params.handlebars

		@validateFiles()

	validateFiles: () ->
		thys = this

		_.each @paths, (filePath) ->
			thys.fileExists filePath
		this

	fileExists : (filePath) ->
		if !fs.existsSync filePath
			@errors.push "Required file missing: #{filePath}"
			false
		else
			true

	getTemplate : (filePath) ->
		fullPath = path.resolve @paths.source, filePath
		if @fileExists fullPath
			@HB.compile fs.readFileSync fullPath, { encoding : 'utf-8' }
		else
			throw "Template not found: #{filePath} at #{fullPath}"

	error : (message) ->
		@errors.push "Error: #{message}"
		this 

	die : () ->
		cli.error "Rex-Template errors: (#{@errors.length} \n"
		_.each @errors, (err) ->
			cli.$.red "> #{err}"

		_.showAdvancedHelp pkg
		process.exit 1

	on : (event, callback) ->
		@Miyagi.on event, callback
		this

	emit : () ->
		@Miyagi.emit.apply this, arguments
		this

	attach : (handlebars) ->
		@HB = handlebars
		this

	registerHelper : (name, callback) ->
		@HB.registerHelper name, callback
		this

	registerPartial : (name, string) ->
		@HB.registerPartial name, string
		this

	bootCLI : () ->
		app.version = pkg.version
		_.defaults argv, app

		if app.quiet or _.contains argv._, 'quiet' then cli.config.hideName()
		if argv.help or _.contains argv._, 'help'
			_.showAdvancedHelp(pkg)
			cli.$.blue "What is this? #{cli.$$.y(pkg.description)}"
			cli.$.blue "I'm stuck and need help. #{cli.$$.y(pkg.author)}"
			cli.$.blue "GitHub repo? #{cli.$$.y(pkg.homepage)}"
			cli.$.blue "Command what?"
			cli.$.GREEN "  rex-template \r\n\t #{cli.$$.y('Compiles ./public/js/templates/**/* into ./public/js/templates.js.')}"
			cli.$.GREEN "  rex-template -w \r\n\t #{cli.$$.y('Compiles the folder of templates and and watches the folder for changes.')}"
			cli.$.GREEN "  rex-template -q \r\n\t #{cli.$$.y("Compiles the folder of templates and reduces the text logged to the console.")}"
			cli.$.GREEN "  rex-template -s './other/templates/folder/' -d './js/folder/templates.js' -w -q \r\n\t #{cli.$$.y("Changes the input/output paths, reduces console logging, and watches for changes.")}"

		if argv.version or _.contains argv._, 'version'
			_.displayVersion pkg, {
				Handlebars : @HB.VERSION
			}

		# log "CLI App Settings: ", app, argv
		this

	run : _.debounce () ->
			console.time "Rex-Template Compile"
			@counts
				count : 0
				skipped : 0
				remaining : 0
				errors : 0
			@Miyagi.once 'app:write', @write
			@Miyagi.emit 'read:folder', @paths.source
			this
		, pkg.config.timeout

	canSkip : (name, lastModified) ->
		false unless _.has @compiled, name
		cached = new Date(@compiled[name].modified).getTime()
		check = new Date( lastModified ).getTime()
		cached == check

	precompile : (html) ->
		if html then @HB.precompile html, {} else ""

	reset : () ->

	clean : (output) ->
		output
	    .replace(/<!--(.*?)-->/gm, "")
	    .replace(/[\t]/gm, "")
	    .replace(/(\r\n|\n|\r|\\n)/gm,"")
	    .replace(/\s{2,}/g, ' ')

	write : () ->
		console.timeEnd "Rex-Template Compile"

	complete : () ->

	express : (req, res, next) ->
		res.render = (template, params) ->
			if @cache[template]
				res.send 200, @cache[template]( params )
			else
				res.send 200, @getTemplate(template)( params )

		next()

module.exports = 
	init : (Params) ->
		App = new Rex Params
		App.bootCLI()

	rex : Rex
	Rex : Rex
	version : pkg.version
	pkg : pkg

	something : (thing) ->
		console.log "Thing: #{thing}"


