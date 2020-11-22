In a typical MVC architecture, once the view is presented, the processing is over. Period. No questions asked!

But what if one could manipulate the view, its data and what not AFTER the html has been rendered? **This provides exactly the same capabilities and more!**

  

This is derieved from the idea of Webforms in ASP. Loved that each page can be assigned a codebehind file (a js file in this case) which can manipulate data in the page.

  **How to use?**
In app.js:

	    // Create an express app
	    var app = express();
	    // Require and ask for manipulation
        require('codebehind').apply(app, {codebehindPath: __dirname + '/codebehind'});
		// codebehindPath: Directory where 'js' files are located which will be loaded when any view calls the particular file (Required) (See below)

  
Example view (Note that here we have taken pug example, but this in independent of the view engine, the codebehind js file is attached AFTER the html has been rendered!)

## Notes:

 - html tag MUST HAVE (runat='server' language='js' codebehind='Home')
   
 - codebehind='Home' : We need to have a Home.js in the codebehindPath specified above!
   
 - All the runat=server can be directly accessed inside the codebehind File as this.elts.<name  of  component>
   
 - For input or buttons with onclick and runat=server, when the button will be clicked, the corresponding onclick will be executed in the    server when the button is clicked in the client (After a post or get request is sent to the server)
<pre>
doctype html

html(runat='server' language='js' codebehind='Home')
	head
		title= title
		link(rel='stylesheet', href='/stylesheets/style.css')
    body  
	    |Welcome 
	    label(runat='server', id='lblInit') 
	    label(runat='server', id='lbl')  
	    | to my site 
	    form(runat='server', method='POST')
			h1 Welcome
			label Enter your name:
			input(name='name', id='name', runat='server')
			br
		    button(runat='server' name='submit' onclick='btnSubmit_click') Submit
			br
		    button(runat='server' name='erase' onclick='btnErase_click' value='Eraser') Erase
		    br
</pre>

The Home.js for the above can be:
<pre>
    const Page = require('codebehind').Page;

    function Home(name, doc, options) {

        Page.apply(this, arguments); // Must call superclass

    }



    Home.__proto__ = Page // MUST to assign

    Home.prototype = Object.create(Page.prototype); // MUST to assign

    Home.prototype.init = function () { // Called after Home Page view elements are initiated

        var txtName = this.document.getElementById('name');

        this.elts.lblInit.innerHTML = (txtName || '') + ' Init';

    }



    Home.register(function () { // Register these 2 handlers to be called when the buttons are clicked

        this.btnSubmit_click = btnSubmit_click;

        this.btnErase_click = btnErase_click;

    });



    Home.prototype.start = function () { // This will be called in case of no button is clicked i.e. in a get request from the browser address bar

        this.elts.lbl.innerHTML = "Hello " + this.elts.name.value + '! ';

    }



    function btnSubmit_click(btn, eventArgs) { // Manipulate some values

        this.elts.lbl.innerHTML += ' - You clicked on Submit!';

        this.elts.lbl.style['background-color'] = 'blue';

        this.elts.lbl.style.color = 'white';

        this.elts.lbl.style['border'] = 'double purple';

    }



    function btnErase_click(btn, eventArgs) { // Manipulate some other values

        this.elts.lbl.innerHTML += ' - You clicked on Erase!';

        this.elts.lbl.style.border = 'solid 3px red';

        this.elts.lbl.style.color = 'blue';

    }

    module.exports = Home;
</pre>

The above describes the way when AFTER a view is rendered, the codebehind is instantiated and the corresponding methods are called.

**Another way, the codebehind can be used is like a router. For Example, if I add the following code to the Home.js:**
<pre>
  Home.post('/myHome', function (req, res, next) {

    this.view('home');

    this.elts.lbl.innerHTML += 'myHome ';

    this.render();

});



Home.get('/myHome', function (req, res, next) {

    this.render('home');

});
    
</pre>
And, in app.js, I make:

	    app.use('/', require('./codebehind/Home').__router__);

The Home.js will act as a router + a codebehind file.

The view will be specified inside the codebehind (As opposite to the above), it will be instantiated, and then it can be manipulated. Finally, it can be rendered.
"# node-codebehind" 
"# node-codebehind" 
