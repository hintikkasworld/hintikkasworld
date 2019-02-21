
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#include "cudd.h"

#include "emscripten.h"


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

EMSCRIPTEN_KEEPALIVE
bool is_true(DdNode *node) {
	return Cudd_IsConstant(node) && Cudd_V(node) == CUDD_TRUE;
}

EMSCRIPTEN_KEEPALIVE
bool is_false(DdNode *node) {
	return Cudd_IsConstant(node) && Cudd_V(node) == CUDD_FALSE;
}

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
EMSCRIPTEN_KEEPALIVE
DdNode *get_var_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_VAR);
}

EMSCRIPTEN_KEEPALIVE
DdNode *get_then_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_THEN);
}

EMSCRIPTEN_KEEPALIVE
DdNode *get_else_of(DdNode *node) {
	return get_internal_characteristic(node, CUDDJS_ELSE);
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_false() {
	DdNode *tmp = Cudd_ReadLogicZero(ddm);
	return tmp;
}
EMSCRIPTEN_KEEPALIVE
DdNode *create_true() {
	DdNode *tmp = Cudd_ReadOne(ddm);
	return tmp;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_new_var() {
	return Cudd_bddNewVar(ddm);
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_valuation(DdNode **vars, bool *signs, int nb) {
	return Cudd_bddComputeCube(ddm, vars, (int *)signs, nb);
}
EMSCRIPTEN_KEEPALIVE
DdNode *create_and(DdNode *n1, DdNode *n2) {
	fprintf(stderr, "debug: %d\n", Cudd_DebugCheck(ddm));
	DdNode *res;
	//Cudd_Ref(n1);
	//Cudd_Ref(n2);
	res = Cudd_bddAnd(ddm, n1, n2);
	//FIXME
	if (res == NULL) die("Error: blow-up during conjunction\n");
	Cudd_Ref(res);
	//Cudd_Deref(n1);
	//Cudd_Deref(n2);
// 	Cudd_Deref(res);
	return res;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_or(DdNode *n1, DdNode *n2) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_not(DdNode *n) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_implies(DdNode *f, DdNode *g) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_equiv(DdNode *f, DdNode *g) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_ite(DdNode *f, DdNode *g, DdNode *h) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

DdNode *create_forget(DdNode *f, DdNode **vars, int nb, bool existential) {
	DdNode *cube = Cudd_bddComputeCube(ddm, vars, NULL, nb);
	if (cube == NULL) return NULL;
	return existential ?
		Cudd_bddExistAbstract(ddm, f, cube) :
		Cudd_bddUnivAbstract(ddm, f, cube);
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_existential_forget(DdNode *f, DdNode **vars, int nb) {
	return create_forget(f, vars, nb, true);
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_universal_forget(DdNode *f, DdNode **vars, int nb) {
	return create_forget(f, vars, nb, false);
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_conditioning(DdNode *f, DdNode *valuation) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

EMSCRIPTEN_KEEPALIVE
DdNode *create_renaming(DdNode *f, DdNode **oldvars, DdNode **newvars, int nb) {
	return Cudd_bddSwapVariables(ddm, f, oldvars, newvars, nb);
}

EMSCRIPTEN_KEEPALIVE
DdNode *pick_random_solution(DdNode *f) {
	die("TO BE IMPLEMENTED");
	return NULL;
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

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
	Cudd_RecursiveDeref(ddm, node);
}

EMSCRIPTEN_KEEPALIVE
int get_nb_stored() {
	return nb_stored;
}

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
		Cudd_Ref(node);
		DdNode *tmp = Cudd_BddToAdd(ddm, node);
		Cudd_Ref(tmp);
		fprintf(stderr, "debug dump 2: %d\n", Cudd_DebugCheck(ddm));
		Cudd_ReduceHeap(ddm, CUDD_REORDER_SIFT, 0);
		puts("### START ###");
		Cudd_DumpDot(ddm, 1, &tmp, NULL, NULL, stdout);
		puts("### -END- ###");
		//Cudd_Deref(node);
		Cudd_RecursiveDeref(ddm, tmp);
		fprintf(stderr, "debug dump 3: %d\n", Cudd_DebugCheck(ddm));
		Cudd_RecursiveDeref(ddm, node);
		fprintf(stderr, "debug dump 4: %d\n", Cudd_DebugCheck(ddm));
	}
}

EMSCRIPTEN_KEEPALIVE
int referenced_count() {
	return Cudd_CheckZeroRef(ddm);
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


int main() {
	// for testing things
	puts("*** THIS IS THE CUDDJS MAIN ***");
	//init();
	//printf("%p\n", Cudd_bddIthVar(ddm, INT_MAX/2));
	//printf("%s\n", get_error());
}
