#cc -Wall -Wpedantic --static -I../lib/include/ -L../lib/  main.c -lcudd -lmtr -lst -lutil -lepd  -lm
#cc -Wall -Wpedantic --static -I../lib/include/ -L../lib/  main.c -lcudd -lm

[ "$EMSDK" != "" ] || {
	printf >&2 '%s\n%s\n' "please run this:" ". ~/src/external/emsdk/emsdk_env.sh"
	exit 1
}

compile_wasm () {
		# 
		#-s EXPORTED_FUNCTIONS='["_get_literal_as_bdd", "_peak_node_count"]' 
		#-s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'
		emcc test.c --closure 1 --tracing -O3 -s NO_EXIT_RUNTIME=1 -s ASSERTIONS=1 -s ALLOW_MEMORY_GROWTH=1 -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "stackTrace"]' -I ./vendor/cudd/ -L ./vendor/cudd/.libs/ -lm -lcudd "$@"
}

case "$1" in
	native)
		gcc -Wall -Wpedantic --static  -I cudd/include/ -I ~/src/external/emsdk/emscripten/1.38.27/system/include/emscripten/ -L cudd/ test.c -lcudd -lm -o out/test
		;;
	js)
		compile_wasm --emrun --shell-file template.html -o out/test.html
		# emrun --serve_root . out/test.html
		;;
	module)
		compile_wasm -s MODULARIZE=1 -o release/cuddjs.js
		cp release/cuddjs.wasm release/cuddjs.wasm2
		;;
	*)
		echo >&2 "unknown mode: '$1'"
		exit 1
		;;
esac

