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
		createAtom: Module.cwrap('create_atom', 'number', ['number']),
		createValuation: Module.cwrap('create_valuation', 'number', ['array', 'array', 'number']),
		createAnd: Module.cwrap('create_and', 'number', ['number', 'number']),
		createAnd: (nodes) => {
			const binary_and = Module.cwrap('create_and', 'number', ['number', 'number']);
			if (arguments.length > 1) nodes = arguments;
			let res = api.createTrue();
			for (const n of nodes) {
				res = binary_and(res, n);
			}
			return res;
		},
		createOr: Module.cwrap('create_or', 'number', ['number', 'number']),
		createNot: Module.cwrap('create_not', 'number', ['number']),
		createImplies: Module.cwrap('create_implies', 'number', ['number', 'number']),
		createEquiv: Module.cwrap('create_equiv', 'number', ['number', 'number']),
		createIte: Module.cwrap('create_ite', 'number', ['number', 'number', 'number']),
		createExistentialForget: Module.cwrap('create_existential_forget', 'number', ['number', 'array', 'number']),
		createUniversalForget: Module.cwrap('create_universal_forget', 'number', ['number', 'array', 'number']),
		createConditioning: Module.cwrap('create_conditioning', 'number', ['number']),
		createRenaming: Module.cwrap('create_renaming', 'number', ['array', 'array', 'number']),
		pickRandomSolution: Module.cwrap('pick_random_solution', 'number', ['number']),

		indexStored: Module.cwrap('index_stored', 'number', ['number']),
		isStored: (node) => (api.indexStored(node) >= 0),
		trash: Module.cwrap('trash', '', ['number']),
		save: Module.cwrap('save', '', ['number']),
		getNbStored: Module.cwrap('get_nb_stored', 'number'),

		printInfo: Module.cwrap('print_info'),
		referencedCount: Module.cwrap('referenced_count', 'number'),
		peakNodeCount: Module.cwrap('peak_node_count', 'number'),
		getDot: (node) => {
			const dump = Module.cwrap('dump_dot', '', ['number']);
			dump(node);
			const res = Module.capturedOutput;
			Module.capturedOutput = null;
			return res;
		},

		init: Module.cwrap('init'),

	};

	api.init();
	console.log('peak = ', api.peakNodeCount());
	console.log('refs = ', api.referencedCount());
	const bdds = [];
	for (let i = 0; i < 30; i++) {
		bdds.push(api.createNewVar(i));
	}
	console.log('refs = ', api.referencedCount());
	console.log('peak = ', api.peakNodeCount());
	//api.print_info();
	console.log(bdds[0]);
	const conj = api.createAnd(bdds);
	console.log('conj: ', conj);
	api.save(conj);
	console.log('refs = ', api.referencedCount());
	console.log('nb stored = ', api.getNbStored());
	//api.print_info();
	viz.renderSVGElement(api.getDot(conj))
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

