````
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
⌦  Hi, I'm Rex-Template. I'm here to make your life easier. ⌫
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
````

Rex-Template
===

> Install it in the root of your project, run `rex-template -w`, and just start building your website. Easy as pie.


No, Seriously. WTF is this?
---
Rex-Template ***recursively*** compiles all of the Handlebars templates in a folder into a single file, watching for changes afterward.

How do I use the templates once they're compiled?
---
Rex-Template compiles the templates it finds into a namespaced extension of the `Handlebars.templates` object, **without** the file extension (`.hb`,`.hbs`,`.handlebars`, etc)

####Take for example:

**Folder Structure** (> is Folder, - is file)
````
> BaseProjectFolder
  > protected
  > public
    > images
    > css
    > js
      > libs
      > templates
        - home.hb
        > user
          - avatar.hb
          - settings.hb
        > dashboard
          > graphs
            - tallGraph.hb
            - shortGraph.hb
          > feed
            - entry.hb
          - main.hb
        > navigation
          - bar.hb
          - menuLeft.hb
          - menuRight.hb
````

Now, simply navigate to the BaseProjectFolder and run `rex-template` on the command line. 
You should now have the following templates, ready to use in your code:

* `Handlebars.templates['home']`
* `Handlebars.templates['user/avatar']`
* `Handlebars.templates['user/settings']`
* `Handlebars.templates['dashboard/graphs/tallGraph']`
* `Handlebars.templates['dashboard/graphs/shortGraph']`
* `Handlebars.templates['dashboard/feed/entry']`
* `Handlebars.templates['dashboard/main']`
* `Handlebars.templates['navigation/bar']`
* `Handlebars.templates['navigation/menuLeft']`
* `Handlebars.templates['navigation/menuRight']`

How do I use them in my code?
---
Exactly the way that I listed above. Instead of doing this:

````
var template = Handlebars.compile( $("#someElement").html() )
$("#anotherElement").html( template({ name : "Blah", age : "BlahBlah" }) )
```

You would instead do this:

````
$("#anotherElement").html( Handlebars.templates['some/template']({ name : "Blah", age : "BlahBlah" }) )
````

I'm stuck and need help.
---
Email me. **Pierce Moore <me@prex.io>**

GitHub repo?
---
Sure do. [rex/rex-template](https://github.com/rex/rex-template)

I heard a rumor you do a cool nerdy trick with versions...
---
Sure do. Run Rex-Template with the `-v` flag and you will see your version of Rex-Template, Handlebars, Node, and the V8 Engine.

````
Rex-Template Version Tree:
  Rex-Template:  [ 1.1.5 ]
  Handlebars:    [ 1.0.0 ]
  Node.js:       [ 0.10.9 ]
  V8 (Engine):   [ 3.14.5.9 ]
````

How do I use this thing?
---

####`rex-template`
    
> Compiles ./public/js/templates into ./public/js/templates.js.

####`rex-template -w`
     
> Compiles the folder of templates and and watches the folder for changes.

####`rex-template`
     
> Compiles the folder of templates and reduces the text logged to the console.

####`rex-template -i './other/templates/folder/' -o './js/folder/templates.js' -wq`
     
> Changes the input/output paths, reduces console logging, and watches for changes.

Does Rex-Template have awesome Command-Line flags?
---

Pshh, is that even a question?

Flag    | What it does  |  Default Value
--------|---------------|--------------
  -h, --help    |  Show usage information   | [boolean]  [default: false]
  -i, --in     |  Folder of templates to compile   | [default: "./public/js/templates"]
  -o, --out    |   Compiled output file             | [default: "./public/js/templates.js"]
  -m, --minify |   Remove extra comments and whitespace | [boolean]  [default: true]
  -w, --watch  |   Monitor the input folder for changes | [boolean]  [default: false]
  -v, --version | Display the version tree       | [boolean]
  -q, --quiet |   Reduce console output        |   [boolean]  [default: false]

Have fun, kids!
