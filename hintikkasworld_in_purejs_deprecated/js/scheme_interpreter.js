'use strict';/*this an interpreter of the language Scheme in Javascript called JavaSc...heme!*/


/*author : François Schwarzentruber
  (the squeleton was taken from Internet, GPL, but I do not remember where...)*/

/*how to use it !
scheme.eval("(+ 1 2)"); //returns 3


scheme.eval("(define (f x) (+ x 1))"); //returns "f defined"
scheme.eval("(f 4)"); // returns 5

scheme.eval("'((f g) h)"); //returns the array [["f", "g"], "h"]
*/











function trim(s) {
			s = s.replace(/(^\s*)|(\s*$)/gi,"");
			s = s.replace(/[ ]{2,}/gi," ");
			s = s.replace(/\n /,"\n");
			return s;
		}







	function unifyConstructVal(objectToBeMatched, pattern, val)
	{
		if(pattern instanceof Array)
		{
			if(pattern[0] === "quote")
			{
				if(pattern[1] === objectToBeMatched)
					return true;
				else
					return false;
			}
			else
			{
				if(objectToBeMatched instanceof Array)
				{
					if(objectToBeMatched.length != pattern.length)
						return false;

					for(var i = 0;  i < objectToBeMatched.length; i++)
					{
						if(!unifyConstructVal(objectToBeMatched[i], pattern[i], val))
							return false;

					}
					return true;

				}
				else
					return false;

			}




		}
		else
		{
			val.formal.push(pattern);
			val.actual.push(objectToBeMatched);
			return val;

		}
	}


/*unify(["not", "p"], [["quote", "not"], "phi"])
  unify(["miaou", "p"], [["quote", "not"], "phi"])
  unify(["non", "p", "e"], [["quote", "not"], "phi"])
  unify("e", [["quote", "not"], "phi"])
  unify("e",  "phi")
  unify(["p", "and", "q"],  ["phi", ["quote", "and"], "psi"])
*/
	function unify(objectToBeMatched, pattern)
	{
		var val = {formal: [], actual: []};
		if(unifyConstructVal(objectToBeMatched, pattern, val))
			return val;
		else
			return undefined;

	}


var scheme = (function()
{

	function debugmessage(message)
	{
		//console.log(message);
	}



	function debugerrormessage(message)	{		console.log("debugerrormessage");		throw new Error("Error in parsing expression. " + message);	}


	function find(o, x)
	{
		if(o.hasOwnProperty(x))
			return o;
		else
		{
			debugerrormessage("impossible to find " + x + " in the environment");
			return {};
		}
	}

	function  Env(args){
		var env={};
		let outer=args.outer||{}
		for( var i in outer)
			env[i]=outer[i];
		if(args.formal.length===args.actual.length){
			for(var i = 0; i < args.formal.length; i++)
				  env[args.formal[i]] = args.actual[i];
		}

		return env;
	}

	/*add standard functions in the environment*/
	function add_global(env){

		var env={};

		var primitives=["sin","cos","tan","asin","acos","atan","exp","log","floor","min","max","sqrt","abs"];

		for(var i=0; i<primitives.length; i++)
		{
			env[primitives[i]] = Math[primitives[i]];
		}

		env["#f"] = false;
		env["#t"] = true;
		env["+"] = function(x,y) {return x + y;}
		env["-"] = function (x, y) {return x - y;}
		env["*"] = function (x, y) {return x * y;}
		env["/"] = function (x, y) {return x / y;}
		env[">"] = function (x, y) {return x > y;}
		env["<"] = function (x, y) {return x < y;}
		env[">="] = function (x, y) {return x >= y;}
		env["<="] = function (x, y) {return x <= y;}
		env["="] = function (x, y) {return x ===y;}
		env["car"] = function (x) { return x[0]}
		env["caar"] = function (x) { return x[0][0]}
		env["cadr"] = function (x) { return x[1]}
		env["caddr"] = function (x) { return x[2]}
		env["cdr"] = function (x) { return x.slice(1)}
		env['list'] = function () { return Array.prototype.slice.call(arguments); };
		env["eq?"] = function (x, y) {return x === y;}
		env["cons"] = function (x, y) {return [x].concat(y); }
		env["append"] = //function (x, y)
			     // { try {return x.concat(y);} catch(err) {debugerrormessage("error in append. Object was: " +  x + " Argument was: " + y);} };
		 function (){
		   try {
		    var result = arguments[arguments.length-1];
		    for(var i = arguments.length-2; i>=0; i--)
			result = arguments[i].concat(result);
		    return result;
		    }
		    catch(err) {debugerrormessage("error in append. Arguments were: " +  arguments);

		    }
		}
		env["not"] = function (x) {return !x;}
		env["and"] = function(x,y) {return (x && y);}
		env["or"] = function(x,y) {return (x || y);}
		env["length"] = function (x) { return x.length; }
		env["list?"] = function (x) { return (x instanceof Array);}
		env["null?"] = function (x) { return (!x || x.length == 0); }
		env["symbol?"] = function (x) {  return (typeof(x) == "string"); }
		env["symbol-uppercase?"] = function (x) { if( !(typeof(x) == "string"))
														return false;
												   else return (x == x.toUpperCase()); }
		env["map"] = function (functionForEachElement, listForMap) {return listForMap.map(function (x) {return functionForEachElement.apply(null, [x]);});}
		env["filter"] = function (functionForEachElement, listToFilter) {return listToFilter.filter(function (x) {return functionForEachElement.apply(null, [x]);});}




	  return env;
	}



	function quasiquoteReplaceUnquoteExpressions(schemeExpression, env)
	{
	    if(schemeExpression instanceof Array)
	    {
	      if(schemeExpression.length === 0)
		  return schemeExpression;
	      else
	      {
		if(schemeExpression[0] === 'unquote')
		{
		    return evalte(schemeExpression[1], env);
		}
		else
		{
		    var result = [];

		    for(var i in schemeExpression)
		    {
			result.push(quasiquoteReplaceUnquoteExpressions(schemeExpression[i], env));


		    }

		    return result;


		}

	      }

	    }
	    else
	      return schemeExpression;

	}



	/*evaluation of the s-expression x in the environment env*/
	function evalte(x,env){
		env = env || global_env;
		if (x === undefined)
			debugerrormessage("internal error in evalte(x, env): x is undefined");
		else if (typeof x == "string")
			return find(env, x)[x];
		else if (typeof x =='number')
			return x;
		else if (x[0] == 'quote')
			return x[1];
		else if (x[0] == 'quasiquote')
			return quasiquoteReplaceUnquoteExpressions(x[1], env);

		else if (x[0] == 'if') {
			var test = x[1];
			var conseq = x[2];
			var alt = x[3];
			if (evalte(test, env))
				return evalte(conseq, env);
			else
				return evalte(alt, env);
			}
		else if (x[0] === 'set!'){
			find(env, x[1])[x[1]] = evalte(x[2], env);
			return "value of " + x[0] + " set"
			}
		else if (x[0] === 'define'){
			var variableDefined;
			if(x[1] instanceof Array) //constructions as "(define (f x y) ....)
			{
				variableDefined = x[1][0];
				var vars = x[1].slice(1);
				var exp = x[2];
				env[variableDefined] = function () {
					return evalte(exp, Env({formal: vars, actual: arguments,outer:env}));
				};
			}
			else  //constructions as "(define x ....)
			{
				variableDefined = x[1];
				env[x[1]] = evalte(x[2], env);
			}
			debugmessage(variableDefined + " defined");
			return variableDefined + " defined"
			}
		else if ((x[0] === 'lambda') || (x[0] === 'λ')) {
			var vars = x[1];
			var exp = x[2];
			return function () {
				return evalte(exp, Env({formal: vars, actual: arguments,outer:env}));
				};
			}
		else if (x[0] === 'let') {
			var extractvars = function(tab)
			{
				var V = new Array();
				for(var i in tab)
				{
					V.push(tab[i][0]);
				}

				return V;
			}
			var vars = extractvars(x[1]);

			var extractargs = function(tab)
			{
				var A = new Array();
				for(var i in tab)
				{
					A.push(evalte(tab[i][1], env));
				}

				return A;
			}

			var args = extractargs(x[1]);
			var exp = x[2];

			return evalte(exp, Env({formal: vars, actual: args,outer:env}));

		}
		else if (x[0] === 'let*') {
			var newenv = {};

			for(var i in env)
				newenv[i]=env[i];

			var tab = x[1];


			for(var i in tab)
			{
				newenv[tab[i][0]] = evalte(tab[i][1], newenv);
			}

			var exp = x[2];

			return evalte(exp, newenv);

		}
		else if (x[0] === 'match') {
			var objectToBeMatched = evalte(x[1], env);

			for (i = 2; i < x.length; i++)
				{
					var val = unify(objectToBeMatched, x[i][0]);


					if(val != undefined)
					{
						val.outer = env;
						return evalte(x[i][1], Env(val));
					}
				}


			debugerrormessage("match unsuccessful");
		}
		else if (x[0] === 'begin') {
			var val;
			for (var i = 1; i < x.length; i++)
			val = evalte(x[i], env);
			return val;
			}
		else
			{
				var exps = [];
				debugmessage("miaou: ");
				for (i = 0; i < x.length; i++)
				{
					exps[i] = evalte(x[i], env);
					debugmessage("arg" + i + " = " + exps[i]);
				}
				var proc = exps.shift();

				//now, proc is the function to be executed
				//and exps are the arguments

				var result;
				if(proc === undefined)
				{
					debugerrormessage("function '" + x[0] + "'undefined in [" + x + "]");// of length " + x.length);
					result = 0;
				}
				else if(typeof proc != "function")
				{
					debugerrormessage(x[0] + " is not a function");
					result = 0;
				}
				else
				{
					result = proc.apply(null, exps);
				}
				debugmessage("result = " + result);
				return result;
			 }




	}
	///////////////////////////////
	let global_env = add_global(Env({formal:[],actual:[]}));



	/*parse the string s and returns the internal representation of s*/
	function parser(s){		let tokens = tokenize(s);
		let syntacticTree = read_from(tokens, s);

		if(tokens.length > 0)
		{
				let rest = tokens.join(" ");
				debugerrormessage("In the expression '" + s + "', I understood the beginning of it but I did not understand the end '" +rest + "'")
		}


		return syntacticTree;	}

	/*lexical analyzer*/
	function tokenize(s){
		if(s == "")			debugerrormessage("Empty expression!")
		let tab = s.split("\n");		tab = tab.filter(function(line) {return !trim(line).startsWith(";");});		s = tab.join("\n");
		let result = trim(s.replace(/'/g, "' ")		          .replace(/`/g, "` ")
			  .replace(/,/g, ", ")
				.replace(/\(/g," ( ")
				.replace(/\)/g," ) "))
				.replace(/\s+/g," ")
				.split(" ");

  	if(result.length == 0)
					debugerrormessage("no token found. Expression seems to be empty string.");
		return result;	}


	/*syntactic analyzer*/
	function read_from(tokens, expression){
	  if(tokens.length == 0)	  {				debugerrormessage( 'Expression "' + expression + '" contains ) that do not match with (');	  }


	  var token = tokens.shift();
	  if("'" == token)
	  {
		var L = [];
		L.push('quote');
		L.push(read_from(tokens, expression));
		return L;
	  }
	  if("`" == token)
	  {
		var L = [];
		L.push('quasiquote');
		L.push(read_from(tokens, expression));
		return L;
	  }
	  if("," == token)
	  {
		var L = [];
		L.push('unquote');
		L.push(read_from(tokens, expression));
		return L;
	  }
	  if("(" == token){
		var L = [];
		while((tokens[0] != ")") && (tokens.length > 0)){
		  L.push(read_from(tokens, expression));
		}
		if(tokens.length == 0)		{		  debugerrormessage(') expected in expression "' + expression + '"');		}
		else
		   tokens.shift();
		return L;
	  }
	  else if(")" == token)				debugerrormessage(') unexpected in expression "' + expression + '"');
	  else
		return atom(token);
	}

	function atom(token){
	  if (!(isNaN(token)))					return Number(token);	  else					return token;

	}



	/*transform the internal representation of an s-express o in a string*/
	function prettyprint(o)
	{
		if(o instanceof Array)
		{
			return "(" + o.map(prettyprint).join(" ") + ")";
		}
		else
		{
			return o;
		}

	}


	/*return the scheme interpreter object*/
	return {
	/*read a string as "(+ 2 3)", or an array as ['+', 1, 2] and returns the internal representation of the evaluation of it

eg. scheme.eval("(+ 1 2)")
    scheme.eval(['+', 1, 2]);

    scheme.eval("(let ((x 1) (y (+ x 1))) (* y 2))") returns NaN
    scheme.eval("(let* ((x 1) (y (+ x 1))) (* y 2))") returns 4
    scheme.eval("(quasiquote (2 3 (unquote (+ 2 3))))")
    scheme.eval("`(2 3 ,(+ 2 3))")
    scheme.eval("(match '(1 2) ((a b) (+ a b)) (a a))")
    scheme.eval("(match 'z ((a b) (+ a b)) (a `(,a)))")
    scheme.eval("(filter (lambda (x) (> x 0)) '( 1 2))")
    scheme.eval("(map (lambda (x) (* 2 x)) '( 1 2))")
	scheme.eval("(map sin '(1  2 7))")
*/
	"eval": function(string)
	{

		if((typeof string) === "string")
		{
			return evalte(parser(string));
		}
		else
		{
			return evalte(string);
		}

	},



	"parser": function(string)
	{
	    return parser(string);
	},

	/*read a string as "'(1 2)" and returns a string representing the evaluation of it, for instance "(1 2)"*/
	"evalprettyprint": function(string)
	{
		return prettyprint(evalte(parser(string)));
	},


	/*takes a scheme expression (usually an array) and transform it in a string with a lot of parenthesis*/
	"prettyprint": function(schemeExpression)
	{
		return prettyprint(schemeExpression);
	},


	"apply" : function(functionName, argument)
	{
		return evalte([functionName, argument]);
	},

	/*load a scheme file on the web and evaluate it (it puts all the definition in the global environment)*/
	"loadfile": function(url)
	{
		  var result;
		  $.ajax(
		  {
 			mimeType: 'text/plain; charset=x-user-defined',
			type: 'GET',
			async: false,
			url:  url,
			dataType: "text",
			success: function(data) {
				result = data;

				var t = tokenize(data);

				while(t.length > 0)
				{
					evalte(read_from(t));
				}
			}
		  });
		  return result;

	}
	};

	})();
