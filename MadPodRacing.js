var boostAvailable = true;
var checkpoints = [];
var listComplete = false;
var turn = 0;

const boostRadius = 2000;

const radius = 350;

const brakeStep1 = 1300;
const brakeStep2 = 1100;
const brakeStep3 = 800;

var log = (name, value) => {
    printErr(`${name}: ${value}`);
};

Math.dist = (x1, y1, x2 = 0, y2 = 0) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
var distanceBetween = (point1, point2) => Math.dist(point1.x, point1.y, point2.x, point2.y);

var areEqual = (point1, point2) => point1.x == point2.x && point1.y == point2.y;

var indexOf = checkpoint => {
    for (var i = 0, length = checkpoints.length; i < length; i++) {
        if (areEqual(checkpoints[i], checkpoint)) {
            return i;
        }
    }
    return -1;
}

var adjustSpeed = (distance, angle) => {
    log('adjusting speed', '');
    log('angle', angle);
    log('dist', distance);

    if (angle >= 90 || angle <= -90) {
        return 0;
    }
    
    else if (distance > boostRadius && boostAvailable && angle === 0 && listComplete) {
        boostAvailable = false;
        return 'BOOST';
    } else if (distance <= brakeStep3) {
        return 25;
    } else if (distance <= brakeStep2) {
        return 50;
    } else if (distance <= brakeStep1) {
        return 75;
    }

    return 100;
};

var calculateGoal = (current, goal) => {
    log('calculating goal', '');
    let m, b, goalY2, x1, x2, point1, point2;

    // y = m * x + b

    // m = (y2 - y1) / (x2 - x1)
    m = (goal.y - current.y) / (goal.x - current.x);

    // b = y - m * x
    b = goal.y - m * goal.x;

    x1 = (goal.x + radius / Math.sqrt(1 + m * m));
    x2 = (goal.x - radius / Math.sqrt(1 + m * m));
    
    log('current', current.x + ' , ' + current.y);
    log('goal', goal.x + ' , ' + goal.y);
    
    
    point1 = {
        x: x1,
        y: m * x1 + b
    };
    

    point2 = {
        x: x2,
        y: m * x2 + b
    };

    log('1', Math.round(point1.x) + ' , ' + Math.round(point1.y));
    log('2', Math.round(point2.x) + ' , ' + Math.round(point2.y));

    if (distanceBetween(current, point1) < distanceBetween(current, point2)) {
        return point1;
    }

    return point2;
};

var laps = parseInt(readline());
log('laps', laps)
var checkCount = parseInt(readline());
log('checkCount', checkCount);

for(let i = 0; i < checkCount; i++) {
    let inputs = readline().split(' ');
    let checkpoint = {};
    checkpoint.x = parseInt(inputs[0]);
    checkpoint.y = parseInt(inputs[1]);

    checkpoints.push(checkpoint);
    log('checkpoint', checkpoint.x + ' , ' + checkpoint.y);
}

while (true) {

    log('turn', turn);

    var inputs = readline().split(' ');

    var racer = {
        x: parseInt(inputs[0]),
        y: parseInt(inputs[1])
    };

    log('racer', racer.x + ' , ' + racer.y);

    var checkP = {
        x: parseInt(inputs[2]),
        y: parseInt(inputs[3])
    };

    var nextCheckpointDist = parseInt(inputs[4]); // distance to the next checkpoint
    var nextCheckpointAngle = parseInt(inputs[5]); // angle between your pod orientation and the direction of the next checkpoint
    var inputs = readline().split(' ');

    var opponent = {
        x: parseInt(inputs[0]),
        y: parseInt(inputs[1])
    }

    var goal;

    var checkIndex = indexOf(checkP);

    if (checkIndex === 0 && checkpoints.length > 1) {
        listComplete = true;
    }

    log('listComplete', listComplete);

    if (checkIndex < 0) {
        log('checkIndex < 0', '');
        checkpoints.push(checkP);

        goal = calculateGoal(racer, checkP);

    }
    else if (listComplete) {
        log('list is complete', '');
        let nextCheck = (checkIndex + 1 == checkpoints.length) ? checkpoints[0] : checkpoints[checkIndex + 1];

        goal = calculateGoal(nextCheck, checkP);
    }

    let speed = adjustSpeed(distanceBetween(racer, goal), nextCheckpointAngle);

    log('actual goal', goal.x + ' , ' + goal.y);

    print(Math.round(goal.x) + ' ' + Math.round(goal.y) + ' ' + speed);

    turn++;
}
