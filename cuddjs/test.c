
//TODO: use typedef?

#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#include "cudd.h"

#include "emscripten.h"

typedef DdNode *Variable;
typedef DdNode *Bdd;

// Useless, pedantic check to ensure that MAX_ATOM is correctly usable
// -- see https://stackoverflow.com/a/29809849
#if (INT_MAX+INT_MIN > 0)
#  error "Nonconforming implementation: INT_MAX is greater than the negation of INT_MIN"
#endif

#define MAX_ATOM INT_MAX
#define MAX_LIT_PER_TERM 1000

void die(char *msg, ...)
{
	va_list l;
	va_start(l, msg);
	vfprintf(stderr, msg, l);
	va_end(l);
	fputs("\n", stderr);
	exit(EXIT_FAILURE);
}


DdManager *ddm;

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
 * Indicate whether the given node is an internal node.
 */
EMSCRIPTEN_KEEPALIVE
bool is_internal_node(DdNode *node) {
	return Cudd_IsNonConstant(node);
}

enum CuddJS_internal_characteristic {
	CUDDJS_VAR, CUDDJS_THEN, CUDDJS_ELSE,
};
DdNode *get_internal_characteristic(DdNode *node, enum CuddJS_internal_characteristic ic) {
	if (Cudd_IsConstant(node)) {
		error_code = CUDDJS_NOT_INTERNAL_NODE;
		return NULL;
	}
	switch (ic) {
		case CUDDJS_VAR:
			{
				unsigned int var = Cudd_NodeReadIndex(node);
				if (var > (unsigned int)INT_MAX) {
					error_code = CUDDJS_UNMET_ASSERTION;
					return NULL;
				}
				return Cudd_bddIthVar(ddm, (int)var);
			}
		case CUDDJS_THEN:
			return Cudd_T(node);
		case CUDDJS_ELSE:
			return Cudd_E(node);
		default:
			error_code = CUDDJS_UNEXPECTED_ERROR;
			return NULL;
	}
}

/**
 * Return the variable of the given node.
 * TODO check what happens if not an internal node
 */
EMSCRIPTEN_KEEPALIVE
Variable get_var_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_VAR);
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
 * Declare a new variable.
 */
EMSCRIPTEN_KEEPALIVE
Variable make_new_var() {
	DdNode *tmp = Cudd_bddNewVar(ddm);
	return tmp;
}

/**
 * Create a new BDD equivalent to FALSE.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_false() {
	DdNode *tmp = Cudd_ReadLogicZero(ddm);
	Cudd_Ref(tmp);
	return tmp;
}

/**
 * Create a new BDD equivalent to TRUE.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_true() {
	DdNode *tmp = Cudd_ReadOne(ddm);
	Cudd_Ref(tmp);
	return tmp;
}

/**
 * Create a new BDD equivalent to the literal x, where is x the atom
 * of the given number.
 */
EMSCRIPTEN_KEEPALIVE
Bdd create_literal(Variable var) {
	//DdNode *res = Cudd_bddIthVar(ddm, var);
	Cudd_Ref(var);
	return var;
}

// /**
//  * Create a new valuation of the given variables with the given polarities.
//  */
// EMSCRIPTEN_KEEPALIVE
// DdNode *create_valuation(DdNode **vars, bool *polarities, int nb) {
// 	DdNode *res = Cudd_bddComputeCube(ddm, vars, (int *)polarities, nb);
// 	Cudd_Ref(res);
// 	return res;
// }

/**
 * Combine two given BDDs by applying a conjunction.
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_and(Bdd n1, Bdd n2) {
	//fprintf(stderr, "debug and 1: %d\n", Cudd_DebugCheck(ddm));
	DdNode *res;
	res = Cudd_bddAnd(ddm, n1, n2);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	//fprintf(stderr, "debug and 2: %d\n", Cudd_DebugCheck(ddm));
	Cudd_RecursiveDeref(ddm, n1);
	Cudd_RecursiveDeref(ddm, n2);
	//fprintf(stderr, "debug and 3: %d\n", Cudd_DebugCheck(ddm));
	return res;
}

/**
 * Combine two given BDDs by applying a disjunction.
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_or(Bdd n1, Bdd n2) {
	//TODO
	die("TO BE IMPLEMENTED");
	return NULL;
}

/**
 * Modify the given BDD by applying a negation.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_not(Bdd n) {
	//TODO
	die("TO BE IMPLEMENTED");
	return NULL;
}

/**
 * Combine two given BDDs by applying a implication (f → g).
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_implies(Bdd f, Bdd g) {
	//TODO
	die("TO BE IMPLEMENTED");
	return NULL;
}

/**
 * Combine two given BDDs by applying an equivalence (f ↔ g).
 * Be careful that the two BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_equiv(Bdd f, Bdd g) {
	//TODO
	die("TO BE IMPLEMENTED");
	return NULL;
}

/**
 * Combine three given BDDs by applying an if-then-else ((f∧g)∨(¬f∧h)).
 * Be careful that the three BDDs should not be reused afterwards:
 * if they are still needed, they must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_ite(Bdd f, Bdd g, Bdd h) {
	//TODO
	die("TO BE IMPLEMENTED");
	return NULL;
}

/**
 * Modify the given BDD by forgetting the given variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 * NB: the variables are given as nodes that are special, they do not
 * need to be deref'ed.
 */
Bdd apply_forget(Bdd f, Variable vars[], int nb, bool existential) {
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
Bdd apply_existential_forget(Bdd f, Variable vars[], int nb) {
	return apply_forget(f, vars, nb, true);
}

/**
 * Modify the given BDD by universally forgetting the given variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_universal_forget(Bdd f, Variable vars[], int nb) {
	return apply_forget(f, vars, nb, false);
}

/**
 * Modify the given BDD by conditioning it with the given values for the given variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_conditioning(Bdd f, Variable vars[], bool values[], int nb) {
	DdNode *valuation = Cudd_bddComputeCube(ddm, vars, (int *)values, nb);
	Cudd_Ref(valuation);
	/* conditioning is implemented via bddAndAbstract, which makes a
	 * conjunction and forgets the variables in a cube at the same time */
	DdNode *res = Cudd_bddAndAbstract(ddm, f, valuation, valuation);
	if (res == NULL) return NULL;
	Cudd_Ref(res);
	Cudd_RecursiveDeref(ddm, valuation);
	Cudd_RecursiveDeref(ddm, f);
	return NULL;
}

/**
 * Modify the given BDD by replacing the given "old" variables by the given "new" variables.
 * Be careful that the former BDD should not be reused afterwards:
 * if it is still needed, it must be copied first.
 */
EMSCRIPTEN_KEEPALIVE
Bdd apply_renaming(Bdd f, Variable oldvars[], Variable newvars[], int nb) {
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
	Cudd_Ref(f);
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
	DdNode *vx = make_new_var();
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

	DdNode *vy = make_new_var();
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


int main() {
	// for testing things
	puts("*** THIS IS THE CUDDJS MAIN ***");
	//tests();
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
