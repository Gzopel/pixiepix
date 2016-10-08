var Cell = function (x,y,walkable) {
    this.x=x;
    this.y=y;
    this.walkable=walkable;
    this.pieces = [];
};
Cell.prototype = Object.create(Object.prototype);


var Piece = module.exports.Piece = function (config) {
    this.point = config.point || {x:0,y:0};
    this.hitRadius= config.hitRadius || 10;
    this.orientation = config.orientation || 0;
    this.step = config.step || 10;
    this.sideStep = Math.sqrt((this.step*this.step)/2);
    this.collidable = config.collidable;
};
Piece.prototype = Object.create(Object.prototype);
Piece.prototype.distanceToPiece= function(target){
    return (Math.sqrt(dist2(this.point, target.point)))-(target.hitRadius + this.hitRadius);
};
Piece.prototype.calculateMovement = function(){
    var destination = {
        x : this.point.x,
        y : this.point.y
    };

    if ( this.orientation === 0 ){//UP
        destination.y+= this.step;
    } else if ( this.orientation === 45 ){ //UP RIGHT
        destination.y+= this.sideStep;
        destination.x+= this.sideStep;
    } else if ( this.orientation === 90 ){ //RIGHT
        destination.x+=this.step;
    } else if ( this.orientation === 135 ){ // DOWN RIGHT
        destination.y-= this.sideStep;
        destination.x+= this.sideStep;
    } else if ( this.orientation === 180 ){ // DOWN
        destination.y-=this.step;
    } else if ( this.orientation === 225 ){ // DOWN LEFT
        destination.y-= this.sideStep;
        destination.x-= this.sideStep;
    } else if ( this.orientation === 270 ){ // LEFT
        destination.x-=this.step;
    } else if ( this.orientation === 315 ){ //UP LEFT
        destination.y+= this.sideStep;
        destination.x-= this.sideStep;
    }
    return destination;
};



var Shot = module.exports.Shot = function (shooter) {
    Piece.call(this,{
        hitRadius:4,
        step:20,
        collidable:false,
        orientation : shooter.orientation,
        point : {x:shooter.point.x,y:shooter.point.y}
    });
    this.owner = shooter.id;
};
Shot.prototype = Object.create(Piece.prototype);


var Character = module.exports.Character = function (conf) {
    Piece.call(this,conf);
    this.id = conf.id;
    this.hits=0;
    this.kills=0;
};
Character.prototype = Object.create(Piece.prototype);


var Board = module.exports.Board = function (config) {
    this.width = config.board.width || 600;
    this.height = config.board.height || 600;
    this.xMax = config.board.columns || 10;
    this.yMax = config.board.rows || 10;
    this.xScale=this.width/this.xMax;
    this.yScale=this.height/this.yMax;
    this.startingPositions=[];
    this.startingPositions[1] = [{x:150,y:150},{x:450,y:450},{x:150,y:450},{x:450,y:150},
        {x:150,y:300},{x:300,y:150},{x:450,y:300},{x:300,y:450}];
    this.startingPositions[2] = [{x:1350,y:1350},{x:1650,y:1650},{x:1350,y:1650},{x:1650,y:1250},
        {x:1350,y:1500},{x:1500,y:1350},{x:1650,y:1500},{x:1500,y:1650}];

    var xIndex;
    var yIndex;
    var b = this.board = new Array(this.xMax);
    for (xIndex = 0; xIndex < this.xMax; xIndex++ ) {
        this.board[xIndex] = new Array(this.yMax);
        for (yIndex = 0; yIndex < this.yMax; yIndex++ ) {
            var w = ((xIndex>0)&&(yIndex>0)&&(xIndex <(this.xMax-1))&& (yIndex<this.yMax-1));
            this.board[xIndex][yIndex] = new Cell(xIndex,yIndex,w);
            /*if(!w){
                walls.push({x: xIndex,y: yIndex});
            }*/
        }
    }

    var walls = [];
    var createWall = function(i,j){
        var c = b[i][j];
        c.walkable=false;
        walls.push({x: i,y: j});
    };

    var createLineWall = function(i,j,k,l){
        var y = j;
        var dxy = (i-k)?(j-l)/(i-k):(j-l);
        for(var x = 0;x<=k-i;x++){
            var dy=Math.abs(Math.floor((x+1)*dxy));
            for(var yy=0;yy<=dy;yy++){
                createWall(i+x,y+yy);
            }
            y+=dy;
        }
    };

    createLineWall(9,2,9,3);
    createLineWall(9,6,9,7);
    createLineWall(2,9,3,9);
    createLineWall(6,9,7,9);

    createLineWall(21,23,21,24);
    createLineWall(21,26,21,27);
    createLineWall(23,21,24,21);
    createLineWall(26,21,27,21);

    var forestArea = [{x:1,y:20},{x:10,y:20},
                    {x:1,y:10},{x:20,y:10},
                    {x:10,y:1},{x:20,y:1}];
    var trees = [];
    forestArea.forEach(function(area){
       for(var i=area.x;i<=area.x+9;i++){
           for(var j=area.y;j<=area.y+9;j++){
               if(Math.floor(Math.random()*10/8)){
                   var c = b[i][j];
                   c.walkable=false;
                   trees.push({x: i,y: j});
               }
           }
       }
    });

    this.wallList=walls;
    this.trees = trees;
};

Board.prototype = Object.create(Object.prototype);
Board.prototype.convertToCellCoordinate = function (point){
    return {//I SUCK
        x:Math.floor(point.x/this.xScale),
        y:Math.floor(point.y/this.yScale)
    };
};
Board.prototype.putPieceAtCell = function(piece,x,y){
    this.board[x][y].pieces.push(piece);
    piece.cell = this.board[x][y];
};
Board.prototype.putPieceAtCoordinate = function(piece,point){
    var c = this.convertToCellCoordinate(point);
    this.putPieceAtCell(piece,c.x, c.y);
};

function removeFromArray(e,a){
    var index = a.indexOf(e);
    if (index > -1) {
        a.splice(index,1);
    }
}

Board.prototype.movePiece = function (piece,destination) {
    removeFromArray(piece, piece.cell.pieces);
    this.putPieceAtCoordinate(piece,destination);
};

Board.prototype.removePiece = function (piece) {
    if(piece.cell) {
        removeFromArray(piece, piece.cell.pieces);
    }
};

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if (t < 0) return dist2(p, v);
    if (t > 1) return dist2(p, w);
    return dist2(p, { x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y) });
}

function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
//TODO refactor collisionWalnk & Point to reuse iteration for different callback
Board.prototype.collisionWalk = function(playerPiece,target){
    var colliding = {
        pieces : [],
        cells : []
    };

    var targets = [target,{
        x:target.x+playerPiece.hitRadius,
        y:target.y
    },{
        x:target.x-playerPiece.hitRadius,
        y:target.y
    },{
        x:target.x,
        y:target.y-playerPiece.hitRadius
    },{
        x:target.x,
        y:target.y+playerPiece.hitRadius
    }];
    var xScale = this.xScale;
    var yScale = this.yScale;
    var b=this.board;

    var checks = [];
    var check = function(t){
        var c = {
            x: Math.floor(t.x/xScale),
            y: Math.floor(t.y/yScale)
        };

        if (b[c.x] &&  b[c.x][c.y]) {
            var cell = b[c.x][c.y];
            var checked = false;
            checks.forEach(function(past){
                checked = checked ||( past === cell);
            });
            if (!checked) {
                checks.push(cell);
                if(!cell.walkable){
                    colliding.cells.push(c);
                } else {
                    cell.pieces.forEach(function(piece){
                        if (piece.collidable && (piece.id !== playerPiece.id)){
                            var distance = Math.sqrt(dist2(target, piece.point));
                            var radiusGap = playerPiece.hitRadius + piece.hitRadius;
                            if (distance < radiusGap) {
                                console.log('collision '+playerPiece.point.x+','+playerPiece.point.y+'  '+target.x+','+target.y+' '+piece.point.x+','+piece.point.y+'  ');
                                colliding.pieces.push(piece);
                            }
                        }
                    });
                }
            }
        }
    };

    targets.forEach(check);
    return colliding;
};

Board.prototype.collisionPoint = function(hitRadius,target){
    var colliding = {
        pieces : [],
        cells : []
    };

    var targets = [target,{
        x:target.x+hitRadius,
        y:target.y
    },{
        x:target.x-hitRadius,
        y:target.y
    },{
        x:target.x,
        y:target.y-hitRadius
    },{
        x:target.x,
        y:target.y+hitRadius
    }];
    var xScale = this.xScale;
    var yScale = this.yScale;
    var b=this.board;

    var checks = [];
    var check = function(t){
        var c = {
            x: Math.floor(t.x/xScale),
            y: Math.floor(t.y/yScale)
        };

        if (b[c.x] &&  b[c.x][c.y]) {
            var cell = b[c.x][c.y];
            var checked = false;
            checks.forEach(function(past){
                checked = checked ||( past === cell);
            });
            if (!checked) {
                checks.push(cell);
                if(!cell.walkable){
                    colliding.cells.push(c);
                }
                cell.pieces.forEach(function(piece){
                    if (piece.collidable){
                        var distance = Math.sqrt(dist2(target, piece.point));
                        var radiusGap = hitRadius + piece.hitRadius;
                        if (distance < radiusGap) {
                           colliding.pieces.push(piece);
                        }
                    }
                });
            }
        }
    };

    targets.forEach(check);
    return colliding;
};

module.exports.createGame = function (config) {
    var board = new Board(config);
    return {
        board:board,
        pieces: [],
        players: [],
        getPieceById : function(id) {
            var i;
            for ( i=0;i<this.pieces.length;i++){
                if(this.pieces[i].id===id){
                    return this.pieces[i];
                }
            }
            return null;
        },
        getPlayerById : function(id) {
            var i;
            for ( i=0;i<this.players.length;i++){
                if(this.players[i].id===id){
                    return this.players[i];
                }
            }
            return null;
        },
        getStartingPosition : function(team,hitRadius) {
            var i;
            for (i = 0; i < board.startingPositions[team].length; i++) {
                var collisions = board.collisionPoint(hitRadius, board.startingPositions[team][i]);
                if (!collisions.pieces.length && !collisions.cells.length) {
                    return board.startingPositions[team][i];
                }
            }
            return board.startingPositions[team][0];
        }
    }
};