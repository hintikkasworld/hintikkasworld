import { ExampleDescription } from '../environment/exampledescription';
import { Birthday } from './birthday';
import { Flatland } from './flatland';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Obs } from '../epistemicmodel/symbolic-relation';
import { ExactlyFormula, TrueFormula, AndFormula, ImplyFormula, AtomicFormula, NotFormula, OrFormula, Formula } from '../formula/formula';
import { WorldValuationType } from '../epistemicmodel/world-valuation-type';
import { SEModelDescriptor } from '../epistemicmodel/descriptor/se-model-descriptor';
import { Environment } from '../environment/environment';
import { EventModelAction } from '../environment/event-model-action';
import { SymbolicPublicAnnouncement } from '../eventmodel/symbolic-public-announcement';

class Cell {
    row: number;
    col: number;
}


class Point2D {
    x: number;
    y: number;
}

function getRandomNumber(a: number, b: number) {
    return a + Math.round(Math.random() * (b - a));
}
function curryClass(SourceClass, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    var curriedArgs = Array.prototype.slice.call(arguments, 1);

    return function curriedConstructor() {
        var combinedArgs = curriedArgs.concat(Array.prototype.slice.call(arguments, 0));

        // Create an object that inherits from `proto`
        var hasOwnProto = Object(SourceClass.prototype) === SourceClass.prototype;
        var obj = Object.create(hasOwnProto ? SourceClass.prototype : Object.prototype);

        // Apply the function setting `obj` as the `this` value
        var ret = SourceClass.apply(obj, combinedArgs);

        if (Object(ret) === ret) { // the result is an object?
            return ret;
        }

        return obj;
    };
};

/**
 * 
 * @param agent: name of the agent
 * @param col: column number 
 * @param row: row number
 * @returns the atom that says "in the bord of agent at cell (col,row) there is a part of a ship." 
 */
function getAtomIsTheCellOccupied(agent: string, col: number, row: number): string {
    return (agent + "_" + String.fromCharCode(64 + col) + row.toString())
}

/**
 * 
 * @param agent: name of the agent
 * @param direction: direction of the size (either "hor" for horizontal or "ver" for vertical) 
 * @param col: column number 
 * @param row: row number 
 * @param size: size of the ship
 * @returns: the atom that says "in the board of agent at cell (col,row), a ship of size 'size' and of direction 'direction' begins." 
 */

function getAtomBeginningShip(agent: string, direction: string, col: number, row: number, size: number): string {
    return (agent + "_" + direction + "_" + size + "_" + String.fromCharCode(64 + col) + row.toString())
}

class BattleShipWorld extends WorldValuation {
    readonly nbcols: number;
    readonly nbrows: number;
    readonly agents: string[];
    readonly ships: number[];
    static readonly xt = 16;
    static readonly yt = 0;
    readonly cellSize: number;
    static imgShipHorizontal = BattleShipWorld.getImage("ship_horizontal.png");
    static imgShipVertical = BattleShipWorld.getImage("ship_vertical.png");
    static imgExplosion = BattleShipWorld.getImage("explosion.png")
    readonly clickeda;
    readonly clickedb;
    readonly hasshipa;
    readonly hasshipb;

    constructor(nbrows: number, nbcols: number, agents: string[], ships:number[], clickeda, clickedb, hasshipa, hasshipb, valuation: Valuation) {
        super(valuation);
        this.nbrows = nbrows;
        this.nbcols = nbcols;
        this.agents = agents;
        this.ships = ships;
        this.clickeda = clickeda;
        this.clickedb = clickedb;
        this.hasshipa = hasshipa;
        this.hasshipb = hasshipb;
        this.cellSize = Math.min(16, Math.min((64 - BattleShipWorld.yt) / (nbrows + 1), (128 - BattleShipWorld.xt) / (3 + 2 * nbcols)));
        this.agentPos["a"] = { x: 10, y: 32, r: 10 };
        this.agentPos["b"] = { x: 128 - 10, y: 32, r: 10 };
    }

    isClickedA(row, col) {
        return this.clickeda[row * (this.nbcols + 1) + col];
    }
    isClickedB(row, col) {
        return this.clickedb[row * (this.nbcols + 1) + col];
    }
    hasShipA(row, col) {
        return this.hasshipa[row * (this.nbcols + 1) + col];
    }
    hasShipB(row, col) {
        return this.hasshipb[row * (this.nbcols + 1) + col];
    }

    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);

        // We draw the backgrounds of the grids.
        context.fillStyle = "#DDDDFF";

        context.fillRect(BattleShipWorld.xt, 0, this.nbcols * this.cellSize, this.nbrows * this.cellSize);
        context.fillRect(BattleShipWorld.xt + (this.nbcols + 1) * this.cellSize, 0, this.nbcols * this.cellSize, this.nbrows * this.cellSize);
        let imgFullPadding = 0;

        // We draw the left grid.
        context.strokeStyle = "black";
        for (let col = 0; col <= this.nbcols; col++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt);
            context.lineTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt + this.nbrows * this.cellSize);
            context.stroke();
        }
        for (let row = 0; row <= this.nbrows; row++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt, BattleShipWorld.yt + row * this.cellSize);
            context.lineTo(BattleShipWorld.xt + this.nbcols * this.cellSize, BattleShipWorld.yt + row * this.cellSize);
            context.stroke();
        }

        // We draw the right grid.
        for (let col = this.nbcols + 1; col <= 2 * this.nbcols + 1; col++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt);
            context.lineTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt + this.nbrows * this.cellSize);
            context.stroke();
        }
        for (let row = 0; row <= this.nbrows; row++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt + (this.nbcols + 1) * this.cellSize, BattleShipWorld.yt + row * this.cellSize);
            context.lineTo(BattleShipWorld.xt + (2 * this.nbcols + 1) * this.cellSize, BattleShipWorld.yt + row * this.cellSize);
            context.stroke();
        }

        // We place the boats of the left grid.

        context.strokeStyle = "b";
        context.fillStyle = "gray";
        for (let agent = 0; agent <= this.agents.length - 1; agent++) {
            for (let col = 1; col <= this.nbcols; col++) {
                for (let row = 1; row <= this.nbrows; row++) {
                    for (let size = 0; size <= this.ships.length - 1; size++) {
                        if (this.modelCheck(getAtomBeginningShip(this.agents[agent], "hor", col, row, this.ships[size]))) {
                            this.placeBoat(context, col, row, this.ships[size], agent * (this.nbcols + 1), "hor");
                        }
                        else {
                            if (this.modelCheck(getAtomBeginningShip(this.agents[agent], "ver", col, row, this.ships[size]))) {
                                this.placeBoat(context, col, row, this.ships[size], agent * (this.nbcols + 1), "ver");

                            }
                        }

                    }
                }
            }
        }
        let imgExplosionPadding = 0;
        for (let col = 1; col <= this.nbcols; col++) {
            for (let row = 1; row <= this.nbrows; row++) {
                if (this.isClickedA(row,col)) {
                    if (!(this.hasShipA(row,col))) {
                        context.fillStyle = "#0000CC";
                        context.fillRect(BattleShipWorld.xt + (col-1)*this.cellSize, (row-1)*this.cellSize, this.cellSize, this.cellSize ) ;
                    }
                    else {
                        context.fillStyle = "#FF3300"
                        context.drawImage(BattleShipWorld.imgExplosion,
                            BattleShipWorld.xt + (col - 1) * this.cellSize + imgExplosionPadding,
                            (row - 1) * this.cellSize + imgExplosionPadding,
                            this.cellSize - 2 * imgExplosionPadding,
                            this.cellSize - 2 * imgExplosionPadding);       
                    }
                                   }
                if (this.isClickedB(row,col)) {
                    if (!(this.hasShipB(row,col))) {
                        context.fillStyle = "#0000CC";
                        context.fillRect(BattleShipWorld.xt + (col-1+this.nbcols+1)*this.cellSize, (row-1)*this.cellSize, this.cellSize, this.cellSize );
                    }
                    else {
                        context.fillStyle = "#FF3300"
                        context.drawImage(BattleShipWorld.imgExplosion,
                            BattleShipWorld.xt + (this.nbcols + col) * this.cellSize + imgExplosionPadding,
                            (row - 1) * this.cellSize + imgExplosionPadding,
                            this.cellSize - 2 * imgExplosionPadding,
                            this.cellSize - 2 * imgExplosionPadding);  
                    }
                    
                }                
            }
        }
    }

    /**
     * Function that draws a boat.
     * @param context: the canvas to draw into 
     * @param col: the column of the start of the boat. 
     * @param row: the row of the start of the boat. 
     * @param size: the size of the boat. 
     * @param coloffset: the offset on the column if we have to draw on the grid on the right player. 
     * @param direction: the direction of the boat (either "hor" for horizontal or "ver" for vertical) 
     */
    placeBoat(context: CanvasRenderingContext2D, col: number, row: number, size: number, coloffset: number, direction: string) {
        const x1 = BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize;
        const y1 = (row - 1) * this.cellSize;
        if (direction == "hor") {
            

            context.drawImage(BattleShipWorld.imgShipHorizontal, x1, y1, size * this.cellSize, this.cellSize);
          /*  context.fillRect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, size * this.cellSize, this.cellSize);
            context.beginPath()
            context.rect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, 
            size * this.cellSize, this.cellSize)
            context.stroke();*/
        }
        else {
            if (direction == "ver") {
                context.drawImage(BattleShipWorld.imgShipVertical, x1, y1, this.cellSize, size * this.cellSize);
              /*  context.fillRect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, this.cellSize, size * this.cellSize);
                context.beginPath()
                context.rect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, this.cellSize, size * this.cellSize)
                context.stroke();*/
            }
        }

    }
    /*
     * returns the cell under the point (in point, x and y are in pixels)
     */
    getCellA(point: Point2D): Cell {
        if (point.x < BattleShipWorld.xt) return undefined;
        if (point.x > BattleShipWorld.xt + this.nbcols * this.cellSize) return undefined;
        if (point.y < BattleShipWorld.yt) return undefined;
        if (point.y > BattleShipWorld.yt + this.nbrows * this.cellSize) return undefined;

        return {
            col: Math.floor((point.x - BattleShipWorld.xt) / this.cellSize) + 1,
            row: Math.floor((point.y - BattleShipWorld.yt) / this.cellSize) + 1
        };
    }
    getCellB(point: Point2D): Cell {
        if (point.x < BattleShipWorld.xt + (this.nbcols + 1) * this.cellSize) return undefined;
        if (point.x > BattleShipWorld.xt + (2*this.nbcols + 1) * this.cellSize) return undefined;
        if (point.y < BattleShipWorld.yt) return undefined;
        if (point.y > BattleShipWorld.yt + this.nbrows  * this.cellSize) return undefined;

        return {
            col: Math.floor((point.x - (BattleShipWorld.xt + (this.nbcols + 1) * this.cellSize)) / this.cellSize) + 1,
            row: Math.floor((point.y - BattleShipWorld.yt) / this.cellSize) + 1
        };
    }
    /*
     * @returns the number of bombs in the neighborhood of cell
     */
    getHint(cell: Cell): number {
        let c = 0;
        for (let y = Math.max(1, cell.row - 1); y <= Math.min(this.nbrows, cell.row + 1); y++)
            for (let x = Math.max(1, cell.col - 1); x <= Math.min(this.nbcols, cell.col + 1); x++)
                if (this.modelCheck("m" + y + x))
                    c++;
        return c;
    }

    /*
     * @returns true iff there is a bomb at cell
     */
    isMine(cell: Cell) { return this.modelCheck("m" + cell.row + cell.col); }
}

export class BattleShip extends ExampleDescription {

    // nbcols : number of columns, nbrows : number of lines
    readonly nbcols: number;
    readonly nbrows: number;
    /* ships is an array containing the size of the ships. For instance [2,2,3] means there are 2 ships of size 2  
      and 1 of size 3 3 */    
    readonly ships: number[];
    // Agents names.
    readonly agents = ["a", "b"];
    clickeda;
    clickedb;
    hasshipa;
    hasshipb;
    // Atomic propositions
    
    readonly atmset: string[];

    /**
     * examples of propositions:
     * a_hor_3_A2: there is a horizontal ship of length 3 starting in A2 in a's grid  (the ship is in A2-A3-A4)
     * a_ver_3_A2: there is a vertical ship of length 3 starting in A2 in a's grid  (the ship is in A2-B2-C2)
     * */

    // Array corresponding to ships where duplicates are removed. For instance if ships = [2,2,2,3,3,4] then shipsduplfree = [2,3,4]
    readonly shipsduplfree: number[]
    
    
    constructor(nbrows: number, nbcols: number, ships: number[]) {
        super();
        this.nbcols = nbcols;
        this.nbrows = nbrows;
        this.ships = ships;
        this.atmset = [];
        for (let agentit = 0; agentit < this.agents.length; agentit++) {
            this.atmset = this.atmset.concat(this.generateAtomicPropositionsAgent(this.agents[agentit]));   
        }

        this.shipsduplfree = [];
        for (let i = 0; i <= this.ships.length - 1; i++) {
            if (!(this.shipsduplfree.includes(this.ships[i]))) {
                this.shipsduplfree.push(this.ships[i]);
            }
        }

    }

    getAtomicPropositions(): string[] {
        return this.atmset;
    }


     /**
     * 
     * @param {string} agent 
     * @param {number} size
     * @returns the array of propositions of the form agent_X_size_Y where X is either hor or ver and Y is a cell in the grid.
     */

    generateAtomicPropositionsAgentSize(agent:string, size: number): string[] {
        let Res = [];
        let ll = [];
        // Propositions for horizontal ships
        for (let x = 1; x <= this.nbcols + 1 - size; x++) {
            for (let y = 1; y <= this.nbrows; y++) {
               Res.push(getAtomBeginningShip(agent, "hor", x, y, size));
            }
        }
        // Propositions for vertical ships
        for (let x = 1; x <= this.nbcols; x++) {
            for (let y = 1; y <= this.nbrows + 1 - size; y++) {
                Res.push(getAtomBeginningShip(agent, "ver", x, y, size));
            }
        }      
        return Res; 
    }
     /**
     * 
     * @param {string} agent 
     * @returns the array of propositions of the form agent_X_S_Y where X is either hor or ver, S is a ships size and Y is a cell in the grid.
     */

    generateAtomicPropositionsAgent(agent:string): string[] {
        let S = [];
        let Res = [];
        for (let sizeit = 0; sizeit < this.ships.length; sizeit++) {
            if (!(S.includes(this.ships[sizeit]))) {
                S.push(this.ships[sizeit])
                Res = Res.concat(this.generateAtomicPropositionsAgentSize(agent,this.ships[sizeit]));
            }

        }       
        return Res; 
    }
    
    getName() {
        return "BattleShip.";
    }
     /**
     * 
     * @param {string} agent 
     * @param {number} s
     * @returns the formula saying how many ships of size @s we should put in agent @agent 's grid.
     */

    getConstraintNumberShips(agent:string, s: number): ExactlyFormula {
        let c = 0
        for (let j = 0; j < this.ships.length; j++) {
            if (this.ships[j] == s) {
                c+= 1
            }
        }
        return new ExactlyFormula(c, this.generateAtomicPropositionsAgentSize(agent,s))    
    }
     /**
     * 
     * @param {string} agent 
     * @param {number} s
     * @param {number} col
     * @param {number} row
     * @returns the formula saying that at cell (@col,@row) of @agent 's grid, it is not possible to have a ship of size @s starting both horizontally and vertically. Returns TrueFormula if it was not possible by construction to have both (for instance in the bottom left cell).
     */
    getConstraintNotBothHorVer(agent:string,s:number,col:number,row:number) : Formula {
        let ll = []
        if (col <= this.nbcols + 1 - s) {
            ll.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(agent, "hor", col, row, s))));
        }
        if (row <= this.nbrows + 1 - s) {
            ll.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(agent, "ver", col, row, s))));
        }         
        // Constraint: a ship cannot start both horizontally and vertically.
        if (ll.length == 2) {
           return new OrFormula(ll)      
        }        
        else {
            return new TrueFormula
        }
    }


    getConstraintOtherShipsHor(agent:string, s:number,col:number,row:number) : Formula{ 
        let l2 = [];

        for (let i2 = 0; i2 <= this.shipsduplfree.length - 1; i2++) {
            
            // Offset to say that if the size in the for loop if different, then the ships should also not be in the same cell.
            var offset = 0;
            if (this.shipsduplfree[i2] == s) {
                offset = 1
            }
            
            for (let col2 = col; col2 <= col+s-1; col2++) {

                if (col2 >= 1){        
                    for (let row2 = row-this.shipsduplfree[i2]+1; row2 <= row-offset; row2++) {
                        if ((row2 >= 1) && (row2 + this.shipsduplfree[i2] -1 <= this.nbrows)) {
                            l2.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(agent, "ver", col2, row2, this.shipsduplfree[i2]))))
                        }
                        
                    }
                }
            }
    
            for (let col2 = col-this.shipsduplfree[i2]+1; col2 <= col-offset; col2++) {
                if ((col2 >= 1) && (col2 + this.shipsduplfree[i2] -1 <= this.nbcols)) {
                    l2.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(agent, "hor", col2, row, this.shipsduplfree[i2]))))
                }
                
            }
        }
        if (l2.length == 1) {
            return new ImplyFormula(new AtomicFormula(getAtomBeginningShip(agent,"hor", col, row, s)), l2[0])
        }
        else if (l2.length >= 2) {
            return new ImplyFormula(new AtomicFormula(getAtomBeginningShip(agent,"hor", col, row, s)), new AndFormula(l2))
        }
        else {
            return new TrueFormula
        }
    }

    getConstraintOtherShipsVer(agent:string, s:number,col:number,row:number) : Formula{ 
        let l2 = [];

        for (let i2 = 0; i2 <= this.shipsduplfree.length - 1; i2++) {
            
            // Offset to say that if the size in the for loop if different, then the ships should also not be in the same cell.
            var offset = 0;
            if (this.shipsduplfree[i2] == s) {
                offset = 1
            }
            
            for (let row2 = row; row2 <= row+s-1; row2++) {                                        
                if (row2 >= 1){
                    for (let col2 = col-this.shipsduplfree[i2]+1; col2 <= col-offset; col2++) { 
                        if ((col2 >= 1) && (col2 + this.shipsduplfree[i2] -1 <= this.nbcols)){
                            l2.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(agent, "hor", col2, row2, this.shipsduplfree[i2]))))
                        }
                        
                    }
                }
            }
    
            for (let row2 = row-this.shipsduplfree[i2]+1; row2 <= row-offset; row2++) {
                if ((row2 >= 1) && (row2 + this.shipsduplfree[i2] -1 <= this.nbrows)) {
                    l2.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(agent, "ver", col, row2, this.shipsduplfree[i2]))))
                }
                
            }
        }
        if (l2.length == 1) {
            return new ImplyFormula(new AtomicFormula(getAtomBeginningShip(agent,"ver", col, row, s)), l2[0])
        }
        else if (l2.length >= 2) {
            return new ImplyFormula(new AtomicFormula(getAtomBeginningShip(agent,"ver", col, row, s)), new AndFormula(l2))
        }
        else {
            return new TrueFormula
        }
    }    

    getFormulaCellOccupied(agent:string,col:number,row:number):Formula {
        let l2 = [];

        for (let i2 = 0; i2 <= this.shipsduplfree.length - 1; i2++) {            
            for (let row2 = row-this.shipsduplfree[i2] + 1; row2 <= row; row2++) {                                        
                if ((row2 >= 1)&& (row2 + this.shipsduplfree[i2] -1 <= this.nbrows)){
                     l2.push(new AtomicFormula(getAtomBeginningShip(agent, "ver", col, row2, this.shipsduplfree[i2])))
                 }
                        
             }
    
            for (let col2 = col-this.shipsduplfree[i2] + 1; col2 <= col; col2++) {                                        
                if ((col2 >= 1) && (col2 + this.shipsduplfree[i2] -1 <= this.nbcols)){
                     l2.push(new AtomicFormula(getAtomBeginningShip(agent, "hor", col2, row, this.shipsduplfree[i2])))
                    }
                        
                }
        }
        return new OrFormula(l2)

    }
    getInitialEpistemicModel(): import("../epistemicmodel/epistemic-model").EpistemicModel {
        let example = this;

        this.clickeda = {};
        this.clickedb = {};
        this.hasshipa = {};
        this.hasshipb = {};
        class SEModelDescriptorBattleShip implements SEModelDescriptor {
            getAgents(): string[] {
                return example.agents;
            }
            getSetWorldsFormulaDescription(): import("../formula/formula").Formula {
                let l = [];         
                for (let i = 0; i < example.shipsduplfree.length ; i++) {

                    for (let agent = 0; agent <= example.agents.length - 1; agent++) {

                       l.push(example.getConstraintNumberShips(example.agents[agent],example.shipsduplfree[i]))

                       for (let col = 1; col <= example.nbcols; col++) {
                            for (let row = 1; row <= example.nbrows; row++) {
                            let f = example.getConstraintNotBothHorVer(example.agents[agent],example.shipsduplfree[i],col,row)
                            if (f instanceof OrFormula) {
                                l.push(f)
                            }        
                            if (col <= example.nbcols - example.shipsduplfree[i] + 1) {
                                let f2 = example.getConstraintOtherShipsHor(example.agents[agent],example.shipsduplfree[i],col,row)
                                if (f2 instanceof ImplyFormula) {
                                    l.push(f2)
                                }
                            }
                            if (row <= example.nbrows - example.shipsduplfree[i] + 1) {
                                let f2 = example.getConstraintOtherShipsVer(example.agents[agent],example.shipsduplfree[i],col,row)
                                if (f2 instanceof ImplyFormula) {
                                    l.push(f2)
                                }
                            }
                        }
                    }
                }
            }
                return new AndFormula(l)
            
            }
            getRelationDescription(agent: string): import("../epistemicmodel/symbolic-relation").SymbolicRelation {
                return new Obs(example.generateAtomicPropositionsAgent(agent))
            }
            getPointedValuation(): Valuation {
                return example.getValuationExample();
            }
            getAtomicPropositions(): string[] {
                return example.getAtomicPropositions();
        }
    }
        let M = new SymbolicEpistemicModel(this.getWorldClass(), new SEModelDescriptorBattleShip());        
        return M;
    }

    getValuationExample(): Valuation {
        let V = []
        let filled = []
        for (let agent = 0; agent < this.agents.length; agent++) {
            let filled2 = []
            filled2.push(new Array())
            for (let row = 1; row <= this.nbrows; row++) {
                let tab = new Array()
                tab.push(false)
                for (let col = 1; col <= this.nbcols; col++) {
                    tab.push(false)
                }
                filled2.push(tab)
            }
            filled.push(filled2)
        }

        for (let agent = 0; agent <= this.agents.length - 1; agent++) {
            for (let i = 0; i <= this.ships.length - 1; i++) {
                while (true) {
                    if ((getRandomNumber(0, 1) == 0) && (this.ships[i] <= this.nbrows)) {
                        const dir = "ver"
                        const col = getRandomNumber(1, this.nbcols);
                        const row = getRandomNumber(1, this.nbrows + 1 - this.ships[i]);
                        var b = true;
                        for (let x = row; x <= row + this.ships[i] - 1; x++) {
                            if (filled[agent][x][col]) {
                                b = false
                            }
                        }
                        if (b) {
                            for (let x = row; x <= row + this.ships[i] - 1; x++) {
                                filled[agent][x][col] = true
                            }
                            V.push(getAtomBeginningShip(this.agents[agent], dir, col, row, this.ships[i]))
                            break;
                        }
                    }
                    else {
                        if (this.ships[i] <= this.nbcols) {
                            const dir = "hor"
                            const col = getRandomNumber(1, this.nbcols + 1 - this.ships[i]);
                            const row = getRandomNumber(1, this.nbrows);
                            var b = true;
                            for (let y = col; y <= col + this.ships[i] - 1; y++) {
                                if (filled[agent][row][y]) {
                                    b = false
                                }
                            }
                            if (b) {
                                for (let y = col; y <= col + this.ships[i] - 1; y++) {
                                    filled[agent][row][y] = true
                                }
                                V.push(getAtomBeginningShip(this.agents[agent], dir, col, row, this.ships[i]))
                                break;
                            }
                        }
                    }

                }
            }
        }

        return new Valuation(V);
    }



    getWorldExample() : BattleShipWorld {
        return new BattleShipWorld(this.nbrows, this.nbcols, this.agents, this.ships, {},{},{},{}, this.getValuationExample());
    }
    onRealWorldClick(env: Environment, point) {
        let M: SymbolicEpistemicModel = <SymbolicEpistemicModel>env.getEpistemicModel();
        let pointedWorld: BattleShipWorld = <BattleShipWorld>M.getPointedWorld();
        let cella = pointedWorld.getCellA(point)
        let cellb = pointedWorld.getCellB(point)
        let agent = ""
        let cell = undefined
        if (cella != undefined) {
            agent = "a"
            cell = cella
            this.clickeda[cella.row * (this.nbcols+1) + cella.col] = true;
            
        }
        else if (cellb != undefined) {
            agent = "b"
            cell = cellb
            this.clickedb[cellb.row * (this.nbcols+1) + cellb.col] = true;
        }
        else {
            return;
        }
        let phi = this.getFormulaCellOccupied(agent,cell.col,cell.row)
        if (M.checkBooleanFormula(phi)) {
            if (agent == "a") {
                this.hasshipa[cella.row * (this.nbcols+1) + cella.col] = true;
            }
            else {
                this.hasshipb[cellb.row * (this.nbcols+1) + cellb.col] = true;
            }
            env.perform(new EventModelAction({
                name: "give hint",
                eventModel: new SymbolicPublicAnnouncement(phi)
            }));
        }
        else {
            if (agent == "a") {
                this.hasshipa[cella.row * (this.nbcols+1) + cella.col] = false;
            }
            else {
                this.hasshipb[cellb.row * (this.nbcols+1) + cellb.col] = false;
            }            
            env.perform(new EventModelAction({
                name: "give hint",
                eventModel: new SymbolicPublicAnnouncement(new NotFormula(phi))
            }));          
        }

        
    }
    

    getWorldClass(): import("../epistemicmodel/world-valuation-type").WorldValuationType {
        return <WorldValuationType><unknown>curryClass(BattleShipWorld, this.nbrows, this.nbcols, this.agents, this.ships, this.clickeda, this.clickedb, this.hasshipa, this.hasshipb);
    }
    getDescription(): string[] {
        return [""]
    }
    getActions() {
        return [];
    }


}
