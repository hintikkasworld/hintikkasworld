import { Rectangle } from './../rectangle';
import { environment } from 'src/environments/environment';


export abstract class World {
  protected agentPos;
  private static agentImages = World.getAgentImages();

  static getAgents() {
    return environment.agents;
  }

  
  static getImage(filename) {
    let image = new Image();
    image.src = "assets/img/" + filename;
  }


  static getAgentImages() {
    let agentImages = {};
    for (let agent of this.getAgents()) {
      agentImages[agent] = new Image();
      agentImages[agent].src = environment.agentImageURL[agent];
    }
    return agentImages;
  }

  constructor() {

  }



  drawAgents(context: CanvasRenderingContext2D) {
    for (let a of World.getAgents())
      if (this.agentPos[a] != undefined)
        context.drawImage(World.agentImages[a], this.agentPos[a].x - this.agentPos[a].r,
          this.agentPos[a].y - this.agentPos[a].r,
          this.agentPos[a].r * 2, this.agentPos[a].r * 2);
  }



  getAgentRectangle(agentName: string) {
    if (this.agentPos[agentName] == undefined)
      return new Rectangle(1000, 1000, -1, -1);
    else
      return new Rectangle(this.agentPos[agentName].x - this.agentPos[agentName].r,
        this.agentPos[agentName].y - this.agentPos[agentName].r,
        this.agentPos[agentName].r * 2, this.agentPos[agentName].r * 2);
  }


  drawAgentSelection(context: CanvasRenderingContext2D, agentName: string) {
    context.beginPath();

    let rectangle = this.getAgentRectangle(agentName);
    // context.strokeStyle = getAgentColor(agentName);
    context.fillStyle = environment.agentColor[agentName];

    let triangleHeight = 8;
    let triangleEspacement = 4;
    context.moveTo(rectangle.x1, rectangle.y1 - triangleHeight - triangleEspacement);
    context.lineTo(rectangle.x1 + rectangle.w / 2, rectangle.y1 - triangleEspacement);
    context.lineTo(rectangle.x1 + rectangle.w, rectangle.y1 - triangleHeight - triangleEspacement);
    //context.rect(rectangle.x1, rectangle.y1, rectangle.w, rectangle.h);
    context.fill();
  }






/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
private roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }

}



drawCard(context: CanvasRenderingContext2D, card: any) {
  if (card.fontSize == undefined)
    card.fontSize = 16;

  if (card.h == undefined)
    card.h = card.w;

  if (card.color == undefined)
    card.color = "#000000";

  context.font = card.fontSize + "px Verdana";
  let w2 = 2 + context.measureText(card.text).width / 2;
  let h2 = 10;


  context.lineWidth = 0.5;
  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "#000000";
  let ROUNDRECT_RADIUS = 2;
  let YLINEBASIS = 5;
  this.roundRect(context, card.x, card.y, card.w, card.h, ROUNDRECT_RADIUS, true, true);

  context.fillStyle = card.color;
  context.fillText(card.text, card.x + card.w / 2 - context.measureText(card.text).width / 2, card.y + card.h / 2 + card.h / 3);
}









abstract draw(context: CanvasRenderingContext2D);
abstract modelCheck(phi: string);
abstract toString();
}
