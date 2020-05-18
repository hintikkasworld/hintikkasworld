export class Scheme {
    /*this an interpreter of the language Scheme in Javascript called JavaSc...heme!*/
    /*author : François Schwarzentruber
      (the squeleton was taken from Internet, GPL, but I do not remember where...)*/
    /*how to use it !
    scheme.eval("(+ 1 2)"); //returns 3
    scheme.eval("(define (f x) (+ x 1))"); //returns "f defined"
    scheme.eval("(f 4)"); // returns 5
    scheme.eval("'((f g) h)"); //returns the array [["f", "g"], "h"]
    */

    ///////////////////////////////

    private static global_env = Scheme.add_global(Scheme.Env({ formal: [], actual: [], outer: undefined }));

    private static trim(s) {
        s = s.replace(/(^\s*)|(\s*$)/gi, '');
        s = s.replace(/[ ]{2,}/gi, ' ');
        s = s.replace(/\n /, '\n');
        return s;
    }

    private static unifyConstructVal(objectToBeMatched, pattern, val) {
        if (pattern instanceof Array) {
            if (pattern[0] === 'quote') {
                if (pattern[1] === objectToBeMatched) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (objectToBeMatched instanceof Array) {
                    if (objectToBeMatched.length != pattern.length) {
                        return false;
                    }

                    for (let i = 0; i < objectToBeMatched.length; i++) {
                        if (!Scheme.unifyConstructVal(objectToBeMatched[i], pattern[i], val)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            }
        } else {
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

    static unify(objectToBeMatched, pattern) {
        let val = { formal: [], actual: [] };

        if (Scheme.unifyConstructVal(objectToBeMatched, pattern, val)) {
            return val;
        } else {
            return undefined;
        }
    }

    static debugmessage(message) {
        // console.log(message);
    }

    static debugerrormessage(message) {
        console.log('debugerrormessage');
        throw new Error('Error in parsing expression. ' + message);
    }

    static find(o, x) {
        if (o.hasOwnProperty(x)) {
            return o;
        } else {
            Scheme.debugerrormessage('impossible to find ' + x + ' in the environment');

            return {};
        }
    }

    static Env(args) {
        let env = {};
        let outer = args.outer || {};
        for (let i in outer) {
            env[i] = outer[i];
        }
        if (args.formal.length === args.actual.length) {
            for (let i = 0; i < args.formal.length; i++) {
                env[args.formal[i]] = args.actual[i];
            }
        }

        return env;
    }

    /*add standard functions in the environment*/

    static add_global(env2) {
        let env = {};
        let primitives = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'floor', 'min', 'max', 'sqrt', 'abs'];
        for (let i = 0; i < primitives.length; i++) {
            env[primitives[i]] = Math[primitives[i]];
        }

        env['#f'] = false;
        env['#t'] = true;

        env['+'] = function (x, y) {
            return x + y;
        };

        env['-'] = function (x, y) {
            return x - y;
        };

        env['*'] = function (x, y) {
            return x * y;
        };

        env['/'] = function (x, y) {
            return x / y;
        };

        env['>'] = function (x, y) {
            return x > y;
        };

        env['<'] = function (x, y) {
            return x < y;
        };

        env['>='] = function (x, y) {
            return x >= y;
        };

        env['<='] = function (x, y) {
            return x <= y;
        };

        env['='] = function (x, y) {
            return x === y;
        };

        env['car'] = function (x) {
            return x[0];
        };

        env['caar'] = function (x) {
            return x[0][0];
        };

        env['cadr'] = function (x) {
            return x[1];
        };

        env['caddr'] = function (x) {
            return x[2];
        };

        env['cdr'] = function (x) {
            return x.slice(1);
        };

        env['list'] = function () {
            return Array.prototype.slice.call(arguments);
        };

        env['eq?'] = function (x, y) {
            return x === y;
        };

        env['cons'] = function (x, y) {
            return [x].concat(y);
        };

        env['append'] = // function (x, y)
            // { try {return x.concat(y);} catch(err) {debugerrormessage("error in append. Object was: " +  x + " Argument was: " + y);} };

            function () {
                try {
                    let result = arguments[arguments.length - 1];

                    for (let i = arguments.length - 2; i >= 0; i--) {
                        result = arguments[i].concat(result);
                    }

                    return result;
                } catch (err) {
                    Scheme.debugerrormessage('error in append. Arguments were: ' + arguments);
                }
            };

        env['not'] = function (x) {
            return !x;
        };

        env['and'] = function (x, y) {
            return x && y;
        };

        env['or'] = function (x, y) {
            return x || y;
        };

        env['length'] = function (x) {
            return x.length;
        };

        env['list?'] = function (x) {
            return x instanceof Array;
        };

        env['null?'] = function (x) {
            return !x || x.length == 0;
        };

        env['symbol?'] = function (x) {
            return typeof x == 'string';
        };

        env['symbol-uppercase?'] = function (x) {
            if (!(typeof x == 'string')) {
                return false;
            } else {
                return x == x.toUpperCase();
            }
        };

        env['map'] = function (functionForEachElement, listForMap) {
            return listForMap.map(function (x) {
                return functionForEachElement.apply(null, [x]);
            });
        };

        env['filter'] = function (functionForEachElement, listToFilter) {
            return listToFilter.filter(function (x) {
                return functionForEachElement.apply(null, [x]);
            });
        };

        return env;
    }

    static quasiquoteReplaceUnquoteExpressions(schemeExpression, env) {
        if (schemeExpression instanceof Array) {
            if (schemeExpression.length === 0) {
                return schemeExpression;
            } else {
                if (schemeExpression[0] === 'unquote') {
                    return Scheme.evalte(schemeExpression[1], env);
                } else {
                    let result = [];

                    for (let i in schemeExpression) {
                        result.push(Scheme.quasiquoteReplaceUnquoteExpressions(schemeExpression[i], env));
                    }

                    return result;
                }
            }
        } else {
            return schemeExpression;
        }
    }

    /*evaluation of the s-expression x in the environment env*/

    static evalte(x, env = {}) {
        env = env || Scheme.global_env;

        if (x === undefined) {
            Scheme.debugerrormessage('internal error in evalte(x, env): x is undefined');
        } else if (typeof x == 'string') {
            return Scheme.find(env, x)[x];
        } else if (typeof x == 'number') {
            return x;
        } else if (x[0] == 'quote') {
            return x[1];
        } else if (x[0] == 'quasiquote') {
            return Scheme.quasiquoteReplaceUnquoteExpressions(x[1], env);
        } else if (x[0] == 'if') {
            let test = x[1];

            let conseq = x[2];

            let alt = x[3];

            if (Scheme.evalte(test, env)) {
                return Scheme.evalte(conseq, env);
            } else {
                return Scheme.evalte(alt, env);
            }
        } else if (x[0] === 'set!') {
            Scheme.find(env, x[1])[x[1]] = Scheme.evalte(x[2], env);

            return 'value of ' + x[0] + ' set';
        } else if (x[0] === 'define') {
            let variableDefined;

            if (x[1] instanceof Array) {
                variableDefined = x[1][0];

                let vars = x[1].slice(1);

                let exp = x[2];

                env[variableDefined] = function () {
                    return Scheme.evalte(exp, Scheme.Env({ formal: vars, actual: arguments, outer: env }));
                };
            } else {
                variableDefined = x[1];

                env[x[1]] = Scheme.evalte(x[2], env);
            }

            Scheme.debugmessage(variableDefined + ' defined');

            return variableDefined + ' defined';
        } else if (x[0] === 'lambda' || x[0] === 'λ') {
            let vars = x[1];

            let exp = x[2];

            return function () {
                return Scheme.evalte(exp, Scheme.Env({ formal: vars, actual: arguments, outer: env }));
            };
        } else if (x[0] === 'let') {
            let extractvars = function (tab) {
                let V = [];

                for (let i in tab) {
                    V.push(tab[i][0]);
                }

                return V;
            };

            let vars = extractvars(x[1]);

            let extractargs = function (tab) {
                let A = [];

                for (let i in tab) {
                    A.push(Scheme.evalte(tab[i][1], env));
                }

                return A;
            };

            let args = extractargs(x[1]);

            let exp = x[2];

            return Scheme.evalte(exp, Scheme.Env({ formal: vars, actual: args, outer: env }));
        } else if (x[0] === 'let*') {
            let newenv = {};

            for (let i in env) {
                newenv[i] = env[i];
            }

            let tab = x[1];

            for (let i in tab) {
                newenv[tab[i][0]] = Scheme.evalte(tab[i][1], newenv);
            }

            let exp = x[2];

            return Scheme.evalte(exp, newenv);
        } else if (x[0] === 'match') {
            let objectToBeMatched = Scheme.evalte(x[1], env);

            for (let i = 2; i < x.length; i++) {
                let val = Scheme.unify(objectToBeMatched, x[i][0]);

                if (val != undefined) {
                    // val.outer = env;///removed because TypeScript does not like it

                    return Scheme.evalte(x[i][1], Scheme.Env(val));
                }
            }

            Scheme.debugerrormessage('match unsuccessful');
        } else if (x[0] === 'begin') {
            let val;

            for (let i = 1; i < x.length; i++) {
                val = Scheme.evalte(x[i], env);
            }

            return val;
        } else {
            let exps = [];

            Scheme.debugmessage('miaou: ');

            for (let i = 0; i < x.length; i++) {
                exps[i] = Scheme.evalte(x[i], env);

                Scheme.debugmessage('arg' + i + ' = ' + exps[i]);
            }

            let proc = exps.shift();

            // now, proc is the function to be executed

            // and exps are the arguments

            let result;

            if (proc === undefined) {
                Scheme.debugerrormessage("function '" + x[0] + "'undefined in [" + x + ']'); // of length " + x.length);

                result = 0;
            } else if (typeof proc != 'function') {
                Scheme.debugerrormessage(x[0] + ' is not a function');

                result = 0;
            } else {
                result = proc.apply(null, exps);
            }

            Scheme.debugmessage('result = ' + result);

            return result;
        }
    }

    /*parse the string s and returns the internal representation of s*/

    static parser(s: string) {
        let tokens = Scheme.tokenize(s);
        let syntacticTree = Scheme.read_from(tokens, s);

        if (tokens.length > 0) {
            let rest = tokens.join(' ');
            Scheme.debugerrormessage(
                "In the expression '" + s + "', I understood the beginning of it but I did not understand the end '" + rest + "'"
            );
        }

        return syntacticTree;
    }

    /*lexical analyzer*/
    static tokenize(s: string): [string] {
        if (s == '') {
            Scheme.debugerrormessage('Empty expression!');
        }

        let tab = s.split('\n');
        tab = tab.filter(function (line) {
            return !Scheme.trim(line).startsWith(';');
        });
        s = tab.join('\n');

        let result = Scheme.trim(s.replace(/'/g, "' ").replace(/`/g, '` ').replace(/,/g, ', ').replace(/\(/g, ' ( ').replace(/\)/g, ' ) '))
            .replace(/\s+/g, ' ')
            .split(' ');

        if (result.length == 0) {
            Scheme.debugerrormessage('no token found. Expression seems to be empty string.');
        }
        return result;
    }

    /*syntactic analyzer*/
    static read_from(tokens, expression) {
        if (tokens.length == 0) {
            Scheme.debugerrormessage('Expression "' + expression + '" contains ) that do not match with (');
        }

        let token = tokens.shift();
        if ("'" == token) {
            let L = [];
            L.push('quote');
            L.push(Scheme.read_from(tokens, expression));
            return L;
        }
        if ('`' == token) {
            let L = [];
            L.push('quasiquote');
            L.push(Scheme.read_from(tokens, expression));
            return L;
        }
        if (',' == token) {
            let L = [];
            L.push('unquote');
            L.push(Scheme.read_from(tokens, expression));
            return L;
        }
        if ('(' == token) {
            let L = [];
            while (tokens[0] != ')' && tokens.length > 0) {
                L.push(Scheme.read_from(tokens, expression));
            }
            if (tokens.length == 0) {
                Scheme.debugerrormessage(') expected in expression "' + expression + '"');
            } else {
                tokens.shift();
            }
            return L;
        } else if (')' == token) {
            Scheme.debugerrormessage(') unexpected in expression "' + expression + '"');
        } else {
            return Scheme.atom(token);
        }
    }

    static atom(token) {
        if (!isNaN(token)) {
            return Number(token);
        } else {
            return token;
        }
    }

    /*transform the internal representation of an s-express o in a string*/

    static prettyprint(o) {
        if (o instanceof Array) {
            return '(' + o.map(Scheme.prettyprint).join(' ') + ')';
        } else {
            return o;
        }
    }

    static eval(s) {
        if (typeof s === 'string') {
            return Scheme.evalte(Scheme.parser(s));
        } else {
            return Scheme.evalte(s);
        }
    }

    /*read a string as "'(1 2)" and returns a string representing the evaluation of it, for instance "(1 2)"*/

    static evalprettyprint(s) {
        return Scheme.prettyprint(Scheme.evalte(Scheme.parser(s)));
    }

    static apply(functionName, argument) {
        return Scheme.evalte([functionName, argument]);
    }

    /*load a scheme file on the web and evaluate it (it puts all the definition in the global environment)*/

    /* loadfile(url) {

         var result;

         $.ajax(

             {

                 mimeType: 'text/plain; charset=x-user-defined',

                 type: 'GET',

                 async: false,

                 url: url,

                 dataType: "text",

                 success: function (data) {

                     result = data;

                     var t = tokenize(data);

                     while (t.length > 0) {

                         evalte(read_from(t));

                     }

                 }

             });

         return result;

     }

 };*/
}
