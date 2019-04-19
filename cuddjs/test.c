
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define CUDDJS_DEBUG_MODE


#include "cudd.h"

#include "emscripten.h"
#include "emscripten/trace.h"

typedef DdNode *Atom;
typedef DdNode *Bdd;


void die(char *msg, ...)
{
	va_list l;
	va_start(l, msg);
	vfprintf(stderr, msg, l);
	va_end(l);
	fputs("\n", stderr);
#ifdef __EMSCRIPTEN__
	EM_ASM(
		throw new Error('Cuddjs just died');
	);
#else
	exit(EXIT_FAILURE);
#endif
}


DdManager *ddm;
bool debug_on = false;

#ifdef CUDDJS_DEBUG_MODE
#	define STACK_MAX 10
//#	include <execinfo.h>
// 	/* https://www.gnu.org/software/libc/manual/html_node/Backtraces.html */
// 	/* Obtain a backtrace and print it to stderr. */
// 	void print_trace(void) {
// 		void *array[STACK_MAX];
// 		size_t size = backtrace(array, STACK_MAX);
// 		fprintf(stderr, "Obtained %zd stack frames.\n", size);
// 		backtrace_symbols_fd(array, size, 2);
// 	}

	void print_stats();

	void debug(char *msg) {
		printf("%s\n", msg);
		if (Cudd_DebugCheck(ddm) != 0) {
			print_stats();
// 			print_trace();
			die("CUDD Debug Check failed");
		}
	}
#	define DEBUG(msg) do{if(debug_on) debug(msg);}while(0)
#endif


EMSCRIPTEN_KEEPALIVE
void set_debug_mode(bool debug) {
	debug_on = debug;
}

// void safe_deref(DdNode *node) {
// 	if ( ! Cudd_bddIsVar(ddm, node)) Cudd_RecursiveDeref(ddm, node);
// }

enum CuddJS_ErrorType {
	CUDDJS_NO_ERROR,
	CUDDJS_UNMET_ASSERTION,
	CUDDJS_NOT_INTERNAL_NODE,
	CUDDJS_UNEXPECTED_ERROR,
};

enum CuddJS_ErrorType error_code = CUDDJS_NO_ERROR;

EMSCRIPTEN_KEEPALIVE
char *get_error() {
	char *msg;
	Cudd_ErrorType errType = Cudd_ReadErrorCode(ddm);
	switch (errType) {
		case CUDD_NO_ERROR:
			switch(error_code) {
				case CUDDJS_NO_ERROR:
					msg = "no error";
					break;
				case CUDDJS_UNMET_ASSERTION:
					msg = "unmet assertion in wrapped CUDD code";
					break;
				case CUDDJS_NOT_INTERNAL_NODE:
					msg = "cannot retrieve characteristic: not an internal node";
					break;
				case CUDDJS_UNEXPECTED_ERROR:
					msg = "unexpected error";
					break;
				default:
					msg = "unrecognized error";
					break;
			}
			break;
		case CUDD_MEMORY_OUT:
			msg = "CUDD: out of memory";
			break;
		case CUDD_TOO_MANY_NODES:
			msg = "CUDD: too many nodes";
			break;
		case CUDD_MAX_MEM_EXCEEDED:
			msg = "CUDD: maximum memory exceeded";
			break;
		case CUDD_TIMEOUT_EXPIRED:
			msg = "CUDD: timeout expired";
			break;
		case CUDD_INVALID_ARG:
			msg = "CUDD: invalid arg";
			break;
		case CUDD_INTERNAL_ERROR:
			msg = "CUDD: internal error";
			break;
		default:
			msg = "CUDD: unrecognized error";
			break;
	}
	Cudd_ClearErrorCode(ddm);
	error_code = CUDDJS_NO_ERROR;
	return msg;
}

/**
 * Indicate whether the given node is a TRUE leaf.
 */
EMSCRIPTEN_KEEPALIVE
bool is_true(DdNode *node) {
	return Cudd_IsConstant(node) && ! Cudd_IsComplement(node);
}

/**
 * Indicate whether the given node is a FALSE leaf.
 */
EMSCRIPTEN_KEEPALIVE
bool is_false(DdNode *node) {
	return Cudd_IsConstant(node) && Cudd_IsComplement(node);
}

/**
 * Indicate whether the given BDD is consistent.
 */
EMSCRIPTEN_KEEPALIVE
bool is_consistent(Bdd bdd) {
	return ! is_false(bdd);
}

/**
 * Indicate whether the two given BDDs are equivalent.
 */
EMSCRIPTEN_KEEPALIVE
bool are_equivalent(Bdd f, Bdd g) {
	return f == g;
}

/**
 * Return a cube of the variables of which the given BDD depends.
 * Do not forget to destroy it!
 */
EMSCRIPTEN_KEEPALIVE
Bdd support(Bdd f) {
	DdNode *res = Cudd_Support(ddm, f);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	return res;
}

/**
 * Indicate whether the given node is an internal node.
 */
EMSCRIPTEN_KEEPALIVE
bool is_internal_node(DdNode *node) {
	return Cudd_IsNonConstant(node);
}

enum CuddJS_InternalCharacteristic {
	CUDDJS_ATOM, CUDDJS_THEN, CUDDJS_ELSE,
};
DdNode *get_internal_characteristic(DdNode *node, enum CuddJS_InternalCharacteristic ic) {
	if (Cudd_IsConstant(node)) {
		error_code = CUDDJS_NOT_INTERNAL_NODE;
		return NULL;
	}
	switch (ic) {
		case CUDDJS_ATOM:
			{
				unsigned int index = Cudd_NodeReadIndex(node);
				if (index > (unsigned int)INT_MAX) {
					error_code = CUDDJS_UNMET_ASSERTION;
					return NULL;
				}
				return Cudd_bddIthVar(ddm, (int)index);
			}
		case CUDDJS_THEN:
			return Cudd_IsComplement(node) ? Cudd_E(node) : Cudd_T(node);
		case CUDDJS_ELSE:
			return Cudd_IsComplement(node) ? Cudd_T(node) : Cudd_E(node);
		default:
			error_code = CUDDJS_UNEXPECTED_ERROR;
			return NULL;
	}
}

/**
 * Return the atom of the given node.
 * TODO check what happens if not an internal node
 */
EMSCRIPTEN_KEEPALIVE
Atom get_atom_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_ATOM);
}

/**
 * Return the THEN child of the given node.
 * TODO check what happens if not an internal node
 */
EMSCRIPTEN_KEEPALIVE
DdNode *get_then_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_THEN);
}

/**
 * Return the ELSE child of the given node.
 * TODO check what happens if not an internal node
 */
EMSCRIPTEN_KEEPALIVE
DdNode *get_else_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_ELSE);
}


/**
 * Ask a new atom to be declared.
 *
 * @return the new atom
 */
EMSCRIPTEN_KEEPALIVE
Atom make_new_atom() {
	DdNode *tmp = Cudd_bddNewVar(ddm);
	return tmp;
}

/**
 * Create a new BDD equivalent to FALSE.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_false() {
	DEBUG("create false");
	DdNode *tmp = Cudd_ReadLogicZero(ddm);
	Cudd_Ref(tmp);
	DEBUG("false ref'ed");
	return tmp;
}

/**
 * Create a new BDD equivalent to TRUE.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_true() {
	DEBUG("create true");
	DdNode *tmp = Cudd_ReadOne(ddm);
	Cudd_Ref(tmp);
	DEBUG("true ref'ed");
	return tmp;
}

/**
 * Create a new BDD equivalent to the literal x, where is x the atom
 * of the given number.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_literal(Atom var) {
	DEBUG("create literal");
	Cudd_Ref(var);
	DEBUG("literal ref'ed");
	return var;
}

enum CuddJS_BinaryOperator {
	CUDDJS_AND, CUDDJS_OR, CUDDJS_IMPLIES, CUDDJS_EQUIV
};

Bdd apply_binary_op(Bdd n1, Bdd n2, enum CuddJS_BinaryOperator op) {
	//fprintf(stderr, "debug op 1: %d\n", Cudd_DebugCheck(ddm));
	DdNode *res;
	DEBUG("binop start");
	switch (op) {
		case CUDDJS_AND:
			res = Cudd_bddAnd(ddm, n1, n2);
			break;
		case CUDDJS_OR:
			res = Cudd_bddOr(ddm, n1, n2);
			break;
		case CUDDJS_IMPLIES:
			res = Cudd_bddIte(ddm, n1, n2, Cudd_ReadOne(ddm));
			break;
		case CUDDJS_EQUIV:
			res = Cudd_bddXnor(ddm, n1, n2);
			break;
	}
	//DEBUG("binop done");
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	DEBUG("binop ref'ed result");
	//fprintf(stderr, "debug op 2: %d\n", Cudd_DebugCheck(ddm));
	Cudd_RecursiveDeref(ddm, n1);
	Cudd_RecursiveDeref(ddm, n2);
	DEBUG("binop derefs done");
	//fprintf(stderr, "debug op 3: %d\n", Cudd_DebugCheck(ddm));
	return res;
}

/**
 * Combine two given BDDs by applying a conjunction.
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_and(Bdd n1, Bdd n2) {
	return apply_binary_op(n1, n2, CUDDJS_AND);
}

/**
 * Combine two given BDDs by applying a disjunction.
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_or(Bdd n1, Bdd n2) {
	return apply_binary_op(n1, n2, CUDDJS_OR);
}

/**
 * Modify the given BDD by applying a negation.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_not(Bdd n) {
	DdNode *res = Cudd_Not(n);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	Cudd_RecursiveDeref(ddm, n);
	return res;
}

/**
 * Combine two given BDDs by applying a implication (f → g).
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_implies(Bdd f, Bdd g) {
	return apply_binary_op(f, g, CUDDJS_IMPLIES);
}

/**
 * Combine two given BDDs by applying an equivalence (f ↔ g).
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_equiv(Bdd f, Bdd g) {
	return apply_binary_op(f, g, CUDDJS_EQUIV);
}

/**
 * Combine three given BDDs by applying an if-then-else ((f∧g)∨(¬f∧h)).
 * Be careful that the three BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_ite(Bdd f, Bdd g, Bdd h) {
	DdNode *res = Cudd_bddIte(ddm, f, g, h);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	Cudd_RecursiveDeref(ddm, f);
	Cudd_RecursiveDeref(ddm, g);
	Cudd_RecursiveDeref(ddm, h);
	return res;
}

/**
 * Modify the given BDD by forgetting the given variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 * NB: the variables are given as nodes that are special, they do not
 * need to be deref'ed.
 */
Bdd apply_forget(Bdd f, Atom vars[], int nb, bool existential) {
	//fprintf(stderr, "debug forget 1: %d\n", Cudd_DebugCheck(ddm));
	DdNode *cube = Cudd_bddComputeCube(ddm, vars, NULL, nb);
	if (cube == NULL) return NULL;
	Cudd_Ref(cube);
	DdNode *res = existential ?
		Cudd_bddExistAbstract(ddm, f, cube) :
		Cudd_bddUnivAbstract(ddm, f, cube);
	//fprintf(stderr, "debug forget 2: %d\n", Cudd_DebugCheck(ddm));
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	Cudd_RecursiveDeref(ddm, cube);
	Cudd_RecursiveDeref(ddm, f);
	//fprintf(stderr, "debug forget 3: %d\n", Cudd_DebugCheck(ddm));
	return res;
}

/**
 * Modify the given BDD by existentially forgetting the given variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_existential_forget(Bdd f, Atom vars[], int nb) {
	return apply_forget(f, vars, nb, true);
}

/**
 * Modify the given BDD by universally forgetting the given variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_universal_forget(Bdd f, Atom vars[], int nb) {
	return apply_forget(f, vars, nb, false);
}


//
// removed: from JS, it's probably more work to malloc and copy 
// than to compute the cube.
//
// EMSCRIPTEN_KEEPALIVE
// Bdd create_cube(Atom vars[], bool values[], int nb) {
// 	DdNode *res = Cudd_bddComputeCube(ddm, vars, (int *)values, nb);
// 	if (res == NULL) return NULL;
// 	Cudd_Ref(res);
// 	return res;
// }

/**
 * Modify the given BDD by conditioning it with the given cube.
 * Be careful that neither the former BDD nor the cube should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_conditioning(Bdd f, Bdd cube) {
	/* conditioning is implemented via bddAndAbstract, which makes a
	 * conjunction and forgets the variables in a cube at the same time */
	DdNode *res = Cudd_bddAndAbstract(ddm, f, cube, cube);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	Cudd_RecursiveDeref(ddm, cube);
	Cudd_RecursiveDeref(ddm, f);
	return NULL;
}

/**
 * Modify the given BDD by replacing the given "old" variables by the given "new" variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_renaming(Bdd f, Atom oldvars[], Atom newvars[], int nb) {
	DdNode *res = Cudd_bddSwapVariables(ddm, f, oldvars, newvars, nb);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	Cudd_RecursiveDeref(ddm, f);
	return res;
}

/**
 * Create a copy of the given BDD.
 * This is useful when one needs to combine a BDD with another, while still
 * keeping the original BDD.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_copy(Bdd f) {
	DEBUG("copying");
	Cudd_Ref(f);
	DEBUG("copy ref'ed");
	return f;
}

/**
 * Destroy the given BDD. It should not be used afterwards.
 */
EMSCRIPTEN_KEEPALIVE
void destroy(Bdd f) {
	Cudd_RecursiveDeref(ddm, f);
}

/**
 * Return a random solution of a given BDD.
 * TODO: in what form??
 */
EMSCRIPTEN_KEEPALIVE
DdNode *pick_random_solution(Bdd f) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

/*
#define MAX_STORED 100

int nb_stored = 0;
DdNode *stored[MAX_STORED];

EMSCRIPTEN_KEEPALIVE
int index_stored(DdNode *node) {
	for (int i = 0; i < MAX_STORED; i++) {
		if (stored[i] == node) {
			return i;
		}
	}
	return -1;
}

EMSCRIPTEN_KEEPALIVE
void save(DdNode *node) {
	if (nb_stored == MAX_STORED) {
		die("Error: max number of stored node reached (%d)\n", MAX_STORED);
	}
	if (nb_stored == 0) {
		stored[0] = node;
	} else {
		for (int i = 0; i < MAX_STORED; i++) {
			if (stored[i] == NULL) {
				stored[i] = node;
				break;
			}
		}
	}
	nb_stored++;
	Cudd_Ref(node);
}

EMSCRIPTEN_KEEPALIVE
void trash(DdNode *node) {
	int index = index_stored(node);
	if (index == -1) die("Error: node not stored? %p\n", node);
	stored[index] = NULL;
	nb_stored--;
	//safe_deref(node);
	Cudd_RecursiveDeref(ddm, node);
}

EMSCRIPTEN_KEEPALIVE
int get_nb_stored() {
	return nb_stored;
}
*/

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

EMSCRIPTEN_KEEPALIVE
void print_info() {
	Cudd_PrintInfo(ddm, stdout);
}


EMSCRIPTEN_KEEPALIVE
void dump_dot(DdNode *node) {
	//DdManager *ddm = Cudd_Init(100, 100, CUDD_UNIQUE_SLOTS, CUDD_CACHE_SLOTS, 100);
	if (node == NULL) puts("nothing to dump");
	else {
		fprintf(stderr, "debug dump 1: %d\n", Cudd_DebugCheck(ddm));
		DdNode *tmp = Cudd_BddToAdd(ddm, node);
		Cudd_Ref(tmp);
		fprintf(stderr, "debug dump 2: %d\n", Cudd_DebugCheck(ddm));
		Cudd_ReduceHeap(ddm, CUDD_REORDER_SIFT, 0);
		fprintf(stderr, "debug dump 3: %d\n", Cudd_DebugCheck(ddm));
		puts("### START ###");
		Cudd_DumpDot(ddm, 1, &tmp, NULL, NULL, stdout);
		puts("### -END- ###");
		//Cudd_Deref(node);
		Cudd_RecursiveDeref(ddm, tmp);
		fprintf(stderr, "debug dump 4: %d\n", Cudd_DebugCheck(ddm));
	}
}

EMSCRIPTEN_KEEPALIVE
int referenced_count() {
	return Cudd_CheckZeroRef(ddm);
}

unsigned int dead_count() {
	return Cudd_ReadDead(ddm);
}

EMSCRIPTEN_KEEPALIVE
long peak_node_count() {
	//DdManager *ddm = Cudd_Init(100, 100, CUDD_UNIQUE_SLOTS, CUDD_CACHE_SLOTS, 100);
	return Cudd_ReadPeakNodeCount(ddm);
}


EMSCRIPTEN_KEEPALIVE
void init()
{
	puts("*** CuddJS init ***");
	emscripten_trace_configure("http://127.0.0.1:5000/", "CUDDJS");
    
	ddm = Cudd_Init(100, 100, CUDD_UNIQUE_SLOTS, CUDD_CACHE_SLOTS, 100);
	Cudd_ClearErrorCode(ddm);
// 	printf("p=%p\n", get_literal_as_bdd(3));
// 	printf("p=%p\n", get_conjunction(get_literal_as_bdd(0), get_literal_as_bdd(1)));
	printf("nb=%ld\n", peak_node_count());
}

void print_stats() {
 	printf("refs=%u, dead=%u\n", referenced_count(), dead_count());
}

void tests() {
	// for testing things
	init();
	DdNode *t = create_true();
	print_stats();
 	printf("debug: "); Cudd_DebugCheck(ddm);
 	puts("");puts("");
// 	printf("refs=%d\n", referenced_count());
// 	printf("debug: "); Cudd_DebugCheck(ddm);
// 	printf("refs=%d\n", referenced_count());
// 	printf("debug: "); Cudd_DebugCheck(ddm);
// 	puts("ssssssssssssssssssssssssss");
	DdNode *f = create_false();
	DdNode *vx = make_new_atom();
	DdNode *i = create_literal(vx);
	//dump_dot(t);
	printf("%d (exp 0)\n", is_false(t));
	printf("%d (exp 1)\n", is_true(t));
	printf("%d (exp 0)\n", is_internal_node(t));

	printf("%d (exp 1)\n", is_false(f));
	printf("%d (exp 0)\n", is_true(f));
	printf("%d (exp 0)\n", is_internal_node(f));

	printf("%d (exp 0)\n", is_false(i));
	printf("%d (exp 0)\n", is_true(i));
	printf("%d (exp 1)\n", is_internal_node(i));

	DdNode *vy = make_new_atom();
	DdNode *j = create_literal(vy);
	print_stats();
	DdNode *conj = apply_and(i, j);
	print_stats();
	if (conj == NULL) die("oh oh");
	//Cudd_Ref(conj);
	//dump_dot(conj);
	//safe_deref(conj);
	print_stats();
	DdNode *vars[] = { vx };
	create_copy(conj);
	DdNode *forg = apply_existential_forget(conj, vars, 1);
	print_stats();
	//dump_dot(forg);
// 	destroy(i);
// 	print_stats();
//  	printf("debug1: "); Cudd_DebugCheck(ddm); puts("");
// 	destroy(j);
// 	print_stats();
//  	printf("debug2: "); Cudd_DebugCheck(ddm); puts("");
// 	destroy(t);
// 	print_stats();
//  	printf("debug3: "); Cudd_DebugCheck(ddm); puts("");
// 	destroy(f);
// 	print_stats();
//  	printf("debug4: "); Cudd_DebugCheck(ddm); puts("");
//
	destroy(conj);
	print_stats();
 	printf("debug5: \n"); Cudd_DebugCheck(ddm); puts("");

	destroy(forg);
//	apply_existential_forget(conj, vars, 1);
	print_stats();
 	printf("debug6: "); Cudd_DebugCheck(ddm); puts("");
	//printf("%s\n", get_error());
}

#define ASSERT(test, msg) do{if(test);else{printf("assert failed: %s\n", msg);}}while(0)
void simpleformulatest() {
	init();
	Atom p = make_new_atom();
	Bdd bAtomP = create_literal(p);
	Bdd bTrue = create_true();
	Bdd bFalse = create_false();

	ASSERT(get_atom_of(bAtomP) == p, "p is p.");

	apply_ite(create_copy(bAtomP), create_copy(bTrue), create_copy(bFalse));

	ASSERT(!is_internal_node(bTrue), "True is not an InternalNode");
	ASSERT(is_internal_node(bAtomP), "p is an InternalNode");

	ASSERT(get_atom_of(apply_and(create_copy(bAtomP), create_copy(bTrue))) == p, "service.getAtomOf(apply_And([bAtomP, bTrue]) == p");

	ASSERT(is_false(apply_and(create_copy(bAtomP), create_copy(bFalse))), "(p and false) is false");
	ASSERT(is_true(apply_or(create_copy(bAtomP), create_copy(bTrue))), "(p or true) is true");

	Bdd notP = apply_not(create_copy(bAtomP));

	ASSERT(is_false(apply_and(create_copy(bAtomP), create_copy(notP))), "(p and not p) is false");
	ASSERT(is_true(apply_or(create_copy(bAtomP), create_copy(notP))), "(p or not p) is true");

	ASSERT(is_false(apply_not(create_true())), "not true is false");
	ASSERT(is_true(apply_not(create_false())), "not false is true");

	Atom q = make_new_atom();
	Bdd bAtomQ = create_literal(q);

	puts("je suis ici"); 
	Bdd or1 = apply_and(create_literal(q), create_literal(p));
	puts("je suis là"); 

	Bdd or2 = apply_or(create_copy(bAtomQ), create_copy(bAtomP));
	puts("je suis là-bas"); 
	destroy(or1);
	destroy(or2);
}


int main() {
	// for testing things
	puts("*** THIS IS THE CUDDJS MAIN ***");
	//tests();
	//simpleformulatest();
	//
	//
	// DONE: decide how refs are handled.
	// it is not easy to ref args then deref them afterwards,
	// because it would imply that all operations return an unreferenced node,
	// which is impossible if we want to keep the dead node count correct in cudd
	// (this is useful for debugging).
	// all operations could return a referenced node, and deref their args,
	// but then the caller must be very cautious.
	// maybe there should be a debug mode, writing down all current references,
	// and warning the user when they do forbidden things? and when the app
	// is OK, all checks are removed. use asserts for this?
	//
	// DECISION: operations deref their args and returned a reffed node.
	// the caller must be cautious by create_copy'ing args if necessary,
	// and destroying unused BDDs. A debug mode can be implemented on
	// the JS side: wrap the nodes and throw exception if node is used
	// in operation two times or something.
}


