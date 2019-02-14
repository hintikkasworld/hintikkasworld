'use strict';


/**
This class contains a set of objects.
Objects are unique in the sense that there is at most one object of a given JSON code.
It can not contain an object {x: 5, y: 6} and another object {x: 5, y: 6}.
*/
class SetOfObjects
{
  constructor()
  {
    this.set = new Set();
    this.setJSON = new Set();
  }

  /**
  add object to the set. It does nothing if the set already contains a set whose JSON code is the same
  */
  add(object)
  {
    if(!this.has(object))
    {
      this.set.add(object);
      this.setJSON.add(JSON.stringify(object));
      return true;
    }
    else {
      return false;
    }
  }

/**
returns true if it contains object (that is an object
whose JSON code is the same)*/
  has(object)
  {
      return this.setJSON.has(JSON.stringify(object));
  }

/*enables to use for(let of this) {...}*/
  [Symbol.iterator]() {
    return this.set;
     }

}



/**
if stringSet = ["arf", "miaou"] then it returns the object
 {"arf": 0, "miaou" : 1}
*/
function getStringIntArrayFromStringSetTo(stringSet)
{
  let A = {};
  let c = 0;
  for(var string of stringSet)
  {
      A[string] = c;
      c++;
  }
  return A;
}
