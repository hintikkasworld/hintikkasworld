export class Rectangle {
    x1;
    y1;
    w;
    h;
    
    constructor (x1, y1, w, h) {
        this.x1 = x1;
        this.y1 = y1;
        this.w = w;
        this.h = h;
      }
    
    
    /**
    @returns true if point is inside the rectangle; false otherwise.
    */
      isPointIn(point) {
          return  (this.x1 <= point.x) && (point.x <= this.x1 + this.w) &&
                   (this.y1 <= point.y) && (point.y <= this.y1 + this.h);
      }
}
