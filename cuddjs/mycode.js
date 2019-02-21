"use strict";

async function mycode() {
	const viz = new Viz();

	const api = {
		getError: Module.cwrap('get_error', 'string'),
		isTrue: Module.cwrap('is_true', 'boolean', ['number']),
		isFalse: Module.cwrap('is_false', 'boolean', ['number']),
		isInternalNode: Module.cwrap('is_internal_node', 'boolean', ['number']),
		getVarOf: Module.cwrap('get_var_of', 'number', ['number']),
		getThenOf: Module.cwrap('get_then_of', 'number', ['number']),
		getElseOf: Module.cwrap('get_else_of', 'number', ['number']),
		createFalse: Module.cwrap('create_false', 'number'),
		createTrue: Module.cwrap('create_true', 'number'),
		createNewVar: Module.cwrap('create_new_var', 'number'),
		init: Module.cwrap('init'),
		print_info: Module.cwrap('print_info'),
		count: Module.cwrap('peak_node_count', 'number'),
		literal: Module.cwrap('get_literal_as_bdd', 'number', ['number']),
		referenced_count: Module.cwrap('referenced_count', 'number'),

		index_stored: Module.cwrap('index_stored', 'number', ['number']),
		is_stored: (node) => (api.index_stored(node) >= 0),
		trash: Module.cwrap('trash', '', ['number']),
		store: Module.cwrap('store', '', ['number']),
		get_nb_stored: Module.cwrap('get_nb_stored', 'number'),

		get_conjunction: (nodes) => {
			const gc = Module.cwrap('get_conjunction', 'number', ['number', 'number']);
			if (arguments.length > 1) nodes = arguments;
			let res = api.get_true();
			for (const n of nodes) {
				res = gc(res, n);
			}
			return res;
		},

		get_dot: (node) => {
			const dump = Module.cwrap('dump_dot', '', ['number']);
			dump(node);
			const res = Module.capturedOutput;
			Module.capturedOutput = null;
			return res;
		},
	};

	api.init();
	console.log('peak = ', api.count());
	console.log('refs = ', api.referenced_count());
	const bdds = [];
	let sign = 1;
	for (let i = 0; i < 30; i++) {
		bdds.push(api.literal(sign * i));
		sign *= -1;
	}
	console.log('refs = ', api.referenced_count());
	console.log('peak = ', api.count());
	//api.print_info();
	console.log(bdds[0]);
	const conj = api.get_conjunction(bdds);
	console.log('conj: ', conj);
	api.store(conj);
	console.log('refs = ', api.referenced_count());
	console.log('nb stored = ', api.get_nb_stored());
	//api.print_info();
	viz.renderSVGElement(api.get_dot(conj))
		.then(function(element) {
			document.body.appendChild(element);
		})
		.catch(error => {
			// Create a new Viz instance (@see Caveats page for more info)
			viz = new Viz();
			// Possibly display the error
			console.error(error);
		});
}

