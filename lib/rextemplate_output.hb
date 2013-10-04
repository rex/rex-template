/**
 * Compiled by Rex-Template on {{date}}
 *
 * Total Compiles : {{iteration}}
 * Templates : {{templateCount}}
 * Compile Time : {{compileTime}}
 * Skipped Templates: {{skipped}}
 * Compile Errors: {{compileErrors}}
 * Compile Time Rex-Template has Saved You: {{timeSaved}} seconds
 *
 * About Rex-Template:
 *   Version : {{version}}
 *   Input File : {{infile}}
 *   Output File : {{outfile}}
 *   Extensions Handled : {{extensions}}
 *   Duplicate Prevention Timeout : {{timeout}}
 *
 * Having issues? Send an email to me@prex.io or open an issue here: https://github.com/rex/rex-template/issues
 */
{{#if api.node}} // Node.js API Compilation

module.exports = function(Handlebars) {
var template = Handlebars.template, templates = partials = Handlebars.templates = Handlebars.templates || {}; Handlebars.partials = Handlebars.templates;
{{#if hb.partial}}{{#if oneTemplate}}return {{/if}}{{#each templates}}  Handlebars.partials['{{this.name}}'] = template({{{this.template}}});
{{/each}}{{else}}{{#if oneTemplate}}return {{/if}}{{#each templates}}  Handlebars.templates['{{this.name}}'] = template({{{this.template}}});
{{/each}}{{/if}}
  return Handlebars.templates 
}{{/if}}

{{#if api.browser}} // Browser API Compilation
var root = this
  , template = Handlebars.template || function() {}
  , templates = Handlebars.templates = Handlebars.templates || {}
  , partials = Handlebars.partials = Handlebars.templates
  ;

(function(Handlebars) {
{{#if hb.partial}}{{#if oneTemplate}}return {{/if}}{{#each templates}}  Handlebars.partials['{{this.name}}'] = template({{{this.template}}});
{{/each}}{{else}}{{#if oneTemplate}}return {{/if}}{{#each templates}}  Handlebars.templates['{{this.name}}'] = template({{{this.template}}});
{{/each}}{{/if}} })(Handlebars); {{/if}}

{{#if api.amd}} // AMD-Style Compilation
define(['{{hb.handlebarPath}}handlebars']), function(Handlebars) {

{{#if hb.partial}}
  {{#if oneTemplate}}  return {{/if}}{{#each templates}}  Handlebars.partials['{{this.name}}'] = template({{{this.template}}});
  {{/each}}
{{else}}
  {{#if oneTemplate}}  return {{/if}}{{#each templates}}  Handlebars.templates['{{this.name}}'] = template({{{this.template}}});
  {{/each}}
{{/if}}

{{#if hb.partial}}
  return Handlebars.partials;
{{else}}
  return Handlebars.templates;
{{/if}}

});
{{/if}}

{{#if api.commonjs}} // CommonJS-Style Compilation
var Handlebars = require("{{api.commonjs}}");
{{#if hb.partial}}
  {{#if oneTemplate}}  return {{/if}}{{#each templates}}  Handlebars.partials['{{this.name}}'] = template({{{this.template}}});
  {{/each}}
{{else}}
  {{#if oneTemplate}}  return {{/if}}{{#each templates}}  Handlebars.templates['{{this.name}}'] = template({{{this.template}}});
  {{/each}}
{{/if}}
{{/if}}

{{#if hb.simple}} // Simple Compile
  {{#each templates}}
    {{{this.template}}}
  {{/each}}
{{/if}}