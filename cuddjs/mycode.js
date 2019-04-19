

//
// NOT UP TO DATE WITH C
// 


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
		makeNewAtom: Module.cwrap('make_new_atom', 'number'),
		getVar: (() => {
			const varMap = new Map();
			return (name) => {
				if (varMap.has(name)) return varMap.get(name);
				const v = api.makeNewAtom();
				varMap.set(name, v);
				return v;
			}
		})(),
		createLiteral: Module.cwrap('create_literal', 'number', ['number']),
		//createValuation: Module.cwrap('create_valuation', 'number', ['array', 'array', 'number']),
		applyAnd: Module.cwrap('apply_and', 'number', ['number', 'number']),
// 		createAnd: (nodes) => {
// 			const binary_and = Module.cwrap('create_and', 'number', ['number', 'number']);
// 			if (arguments.length > 1) nodes = arguments;
// 			let res = api.createTrue();
// 			for (const n of nodes) {
// 				res = binary_and(res, n);
// 			}
// 			return res;
// 		},
		applyOr: Module.cwrap('apply_or', 'number', ['number', 'number']),
		applyNot: Module.cwrap('apply_not', 'number', ['number']),
		apply_implies: Module.cwrap('apply_implies', 'number', ['number', 'number']),
		applyEquiv: Module.cwrap('apply_equiv', 'number', ['number', 'number']),
		applyIte: Module.cwrap('apply_ite', 'number', ['number', 'number', 'number']),
		applyExistentialForget: Module.cwrap('apply_existential_forget', 'number', ['number', 'array', 'number']),
		applyUniversalForget: Module.cwrap('apply_universal_forget', 'number', ['number', 'array', 'number']),
		applyConditioning: Module.cwrap('apply_conditioning', 'number', ['number', 'array', 'array', 'number']),
		applyRenaming: Module.cwrap('apply_renaming', 'number', ['array', 'array', 'number']),
		pickRandomSolution: Module.cwrap('pick_random_solution', 'number', ['number']),

// 		indexStored: Module.cwrap('index_stored', 'number', ['number']),
// 		isStored: (node) => (api.indexStored(node) >= 0),
// 		trash: Module.cwrap('trash', '', ['number']),
// 		save: Module.cwrap('save', '', ['number']),
// 		getNbStored: Module.cwrap('get_nb_stored', 'number'),

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

		mallocArray: (array) => {
    	/* build a typed array */
    	const data = new Int32Array(array);

    	/* copy it in the module heap */
    	const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    	const dataPtr = Module._malloc(nDataBytes);
    	const dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
    	dataHeap.set(new Uint8Array(data.buffer));
    	return dataHeap.byteOffset
		},

	};

	api.init();

	//console.log("test malloc: ", Module._malloc(1024*1024*1024*1024));
// 	console.log(Module.HEAPU8);
	let arr = [];
	for (let i = 0; i < 1024*1024; i++) arr[i] = i;
	for (let k = 0; k < 1100; k++) {
		//console.log("tt", 
		Module.print("test malloc");
		Module.print(api.mallocArray(arr));
		//console.log(Module.HEAPU8);
	}
// 	console.log("test malloc: ", Module._malloc(1024**5));
// 	console.log(Module.HEAPU8);
// 	console.log("test malloc: ", Module._malloc(1024**6));
// 	console.log(Module.HEAPU8);
// 	console.log("test malloc: ", Module._malloc(1024**7));
// 	console.log(Module.HEAPU8);
	console.log('peak = ', api.peakNodeCount());
	console.log('refs = ', api.referencedCount());
	const vars = [];
	for (let i = 0; i < 30; i++) {
		vars.push(api.makeNewAtom());
	}
	const bdds = vars.map(v => api.createLiteral(v));
	console.log('refs = ', api.referencedCount());
	console.log('peak = ', api.peakNodeCount());
	//api.print_info();
	console.log(bdds[0]);
	const conj = api.applyAnd(bdds[0], bdds[1]);
	console.log('conj: ', conj);
	//api.save(conj);
	console.log('refs = ', api.referencedCount());
	//console.log('nb stored = ', api.getNbStored());
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

