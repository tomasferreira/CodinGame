try{
var opponentCount = parseInt(readline()); // Opponent count

var SQUARE_SIZE = 4;

var rounds = [];
var turn = 0;
var currPos;
var turnData = {};
var squareStage = 0;
var squareSide = 0;
var squareCount = 0;

var move = '';

var strategy = ''; //square, goToPoint
var target= {x: 0, y: 0}; 

// game loop
while (true) {
    //turn data
    setTurnData();
    setStrategy();
    printErr(turnData);
    // printErr(currPos);

    move = getMove();
    
    turn++;
    print(move);
    
    // Write an action using print()
    // To debug: printErr('Debug messages...');
    //print('17 10'); // action: "x y" to move or "BACK rounds" to go back in time
}
} catch(e){printErr(e);}

function setStrategy(){
    if(strategy === '') {
        target.x = 0;
        target.y = 0;
        strategy = 'goToPoint';
    }
    
    if(JSON.stringify(currPos) === JSON.stringify(target)){
        strategy = 'square';
    }
    
    //return 'square';
}

function getMove() {
    
    var move;
    
    switch(strategy){
        case 'goToPoint':
            move = goTo();
            break;
        case 'square':
            move = makeSquare();
            break;
        default:
            printErr('NO MOVE');
    }
    return move;
}

function makeSquare() {
    printErr('side: ' + squareSide + ' - ' + 'count: ' + squareCount);
    
    var move;
    
    switch(squareSide){
        case 0:
            squareCount ++;
            move = moveRight();
            break;
        case 1:
            squareCount ++;
            move = moveDown();
            break;
        case 2:
            squareCount ++;
            move = moveLeft();
            break;
        case 3:
            squareCount ++;
            move = moveUp();
            break;
        default:
            squareCount ++;
            move = moveRight();
            break;
    }
    
    if(squareCount === SQUARE_SIZE){
        squareCount = 0;
        squareSide ++;
        if(squareSide === 5) squareSide = 0;
    }
    
    return move;
}

function moveUp(){
    return currPos.x + ' ' + (currPos.y - 1);
}
function moveDown(){
    return currPos.x + ' ' + (currPos.y + 1);
}
function moveLeft(){
    return (currPos.x - 1) + ' ' + currPos.y;
}
function moveRight(){
    return (currPos.x + 1) + ' ' + currPos.y;
}

function goTo(){
    return target.x + ' ' + target.y;
}

function setTurnData() {
    var data = {};
    turnData.data = data;
    data.round = parseInt(readline());
    
    let inputs = readline().split(' ');
    data.pos = {};
    data.pos.x = parseInt(inputs[0]); // Your x position
    data.pos.y = parseInt(inputs[1]); // Your y position
    currPos = data.pos;
    
    var backInTimeLeft = parseInt(inputs[2]); // Remaining back in time
    var opps = [];
    for (let i = 0; i < opponentCount; i++) {
        opp = {};
        opps[i] = opp;
        let inputs = readline().split(' ');
        opp.x = parseInt(inputs[0]); // X position of the opponent
        opp.y = parseInt(inputs[1]); // Y position of the opponent
        var opponentBackInTimeLeft = parseInt(inputs[2]); // Remaining back in time of the opponent
    }
    
    let grid = [];
    for (let i = 0; i < 20; i++) {
        grid.push(readline().split()); // One line of the map ('.' = free, '0' = you, otherwise the id of the opponent)
    }
    
    rounds.push({data: data, opps: opps});
}