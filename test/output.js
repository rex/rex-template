/**
 * Compiled by Rex-Template on Tue Oct 01 2013 08:27:39 GMT-0500 (CDT)
 *
 * Total Compiles : 1
 * Templates : 5
 * Compile Time : 0.01 seconds
 * Skipped Templates: 0
 * Compile Errors: 0
 * Compile Time Rex-Template has Saved You: 0 seconds
 *
 * About Rex-Template:
 *   Version : 1.2.0
 *   Input File : /Users/pierce/GitHub/rex/rex-template/test/tpl
 *   Output File : /Users/pierce/GitHub/rex/rex-template/test/output.js
 *   Extensions Handled : .hb, .hbs, .handlebars, .tpl, .template, .mustache, .mst
 *   Duplicate Prevention Timeout : 1000
 *
 * Having issues? Send an email to me@prex.io or open an issue here: https://github.com/rex/rex-template/issues
 */
 // Node.js API Compilation

module.exports = function(Handlebars) {
var template = Handlebars.template, templates = partials = Handlebars.templates = Handlebars.templates || {}; Handlebars.partials = Handlebars.templates;
  Handlebars.templates['toplevel_one'] = template(function (Handlebars,depth0,helpers,partials,data) { this.compilerInfo = [4,'>= 1.0.0'];helpers = this.merge(helpers, Handlebars.helpers); data = data || {}; var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression; buffer += "This template file is accessible at \""; if (stack1 = helpers.path) { stack1 = stack1.call(depth0, {hash:{},data:data}); } else { stack1 = depth0.path; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; } buffer += escapeExpression(stack1) + "\"."; return buffer; });
  Handlebars.templates['toplevel_two'] = template(function (Handlebars,depth0,helpers,partials,data) { this.compilerInfo = [4,'>= 1.0.0'];helpers = this.merge(helpers, Handlebars.helpers); data = data || {}; var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression; buffer += "This template file is accessible at \""; if (stack1 = helpers.path) { stack1 = stack1.call(depth0, {hash:{},data:data}); } else { stack1 = depth0.path; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; } buffer += escapeExpression(stack1) + "\"."; return buffer; });
  Handlebars.templates['sub/sublevel_one'] = template(function (Handlebars,depth0,helpers,partials,data) { this.compilerInfo = [4,'>= 1.0.0'];helpers = this.merge(helpers, Handlebars.helpers); data = data || {}; var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression; buffer += "This template file is accessible at \""; if (stack1 = helpers.path) { stack1 = stack1.call(depth0, {hash:{},data:data}); } else { stack1 = depth0.path; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; } buffer += escapeExpression(stack1) + "\"."; return buffer; });
  Handlebars.templates['sub/sublevel_two'] = template(function (Handlebars,depth0,helpers,partials,data) { this.compilerInfo = [4,'>= 1.0.0'];helpers = this.merge(helpers, Handlebars.helpers); partials = this.merge(partials, Handlebars.partials); data = data || {}; var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this; buffer += "This template file is accessible at \""; if (stack1 = helpers.path) { stack1 = stack1.call(depth0, {hash:{},data:data}); } else { stack1 = depth0.path; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; } buffer += escapeExpression(stack1) + "\", also see "; stack1 = self.invokePartial(partials.toplevel_one, 'toplevel_one', depth0, helpers, partials, data); if(stack1 || stack1 === 0) { buffer += stack1; } buffer += " and "; stack1 = self.invokePartial(partials.subsublevel_one, 'subsublevel_one', depth0, helpers, partials, data); if(stack1 || stack1 === 0) { buffer += stack1; } buffer += "."; return buffer; });
  Handlebars.templates['sub/sub/subsublevel_one'] = template(function (Handlebars,depth0,helpers,partials,data) { this.compilerInfo = [4,'>= 1.0.0'];helpers = this.merge(helpers, Handlebars.helpers); data = data || {}; var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression; buffer += "This template file is accessible at \""; if (stack1 = helpers.path) { stack1 = stack1.call(depth0, {hash:{},data:data}); } else { stack1 = depth0.path; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; } buffer += escapeExpression(stack1) + "\"."; return buffer; });

  return Handlebars.templates 
}







