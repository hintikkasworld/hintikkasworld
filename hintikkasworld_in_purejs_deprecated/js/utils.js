'use strict';


function union(L1, L2)
{
	let L = new Array();

	for(let i in L1)
	{
		if(L.indexOf(L1[i]) == -1)
			L.push(L1[i]);
	}

	for(let i in L2)
	{
		if(L.indexOf(L2[i]) == -1)
			L.push(L2[i]);
	}

	return L;
}



function clone(e)
{
	if(e instanceof Function)
		return e;
	if(e instanceof Array)
	{
		var c = new Array();

		for(let i in e)	{
			c[i] = clone(e[i]);
		}

		return c;
	}
	else
	if(e instanceof Object)
	{
        var c = $.extend(true, Object.create(Object.getPrototypeOf(e)), e);;
		return c;
	}
	else
		return e;


}


function copy(array)
{
    var A = new Array();

    for(var p in array)
    {
        A[p] = array[p];
    }

    return A;

}





function contains(L, e)
{
	return L.indexOf(e) > -1;
}



function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min +1)) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


/**
* Supress duplication
*/
function cleanArray(array) {
  var i, j, len = array.length, out = [], obj = {};
  for (i = 0; i < len; i++) {
    obj[array[i]] = 0;
  }
  for (j in obj) {
    out.push(j);
  }
  return out;
}

function xor(p, q)
{
	return (p || q) && !(p && q);

}





let arrayIsEqual = function(array, testArr) {
    if (array.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (array[i].compare) {
            if (!array[i].compare(testArr[i])) return false;
        }
        if (array[i] !== testArr[i]) return false;
    }
    return true;
}








function loadImage(src)
{
	let img = new Image();
	img.src = src;
	return img;
}

















let getRandomElementPermutation = undefined;
let getRandomElementPermutationIndex = 0;

function createRandomPermutation(n) {
    let T = [];
    for(let i = 0; i < n; i++) 
        T[i] = i;
    
    for(let i = 0; i < n; i++) {
        let j = Math.floor(Math.random() * n);
        let swap = T[i];
        T[i] = T[j];
        T[j] = swap;
    }
    
    return T;
}


function getRandomElementInArray(array) {
    if(array.length > 100)
        return array[Math.floor(Math.random() * array.length)]
    else {
        if(getRandomElementPermutation == undefined)
            getRandomElementPermutation = createRandomPermutation(array.length);
        
        if(getRandomElementPermutation.length != array.length)
            getRandomElementPermutation = createRandomPermutation(array.length);
        
        getRandomElementPermutationIndex++;
        if(getRandomElementPermutationIndex >= array.length)
            getRandomElementPermutationIndex = 0;
        
        return array[getRandomElementPermutation[getRandomElementPermutationIndex]];
    }
}
