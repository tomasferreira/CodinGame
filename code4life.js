/*eslint indent: ["error", 4, { "SwitchCase": 1 }]*/
/*global print readline printErr*/
/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
/*eslint no-unused-vars: 0*/

/**
 * Bring data on patient samples from the diagnosis machine to the laboratory with enough molecules to produce medicine!
 **/

getUselessStuff();

const modules = {
    START_POS: {
        id: 'START_POS',
        nextModule: 'SAMPLES',
        previousModule: 'NULL'
    },
    SAMPLES: {
        id: 'SAMPLES',
        nextModule: 'DIAGNOSIS',
        previousModule: 'LABORATORY'
    },
    DIAGNOSIS: {
        id: 'DIAGNOSIS',
        nextModule: 'MOLECULES',
        previousModule: 'SAMPLES'
    },
    MOLECULES: {
        id: 'MOLECULES',
        nextModule: 'LABORATORY',
        previousModule: 'DIAGNOSIS'
    },
    LABORATORY: {
        id: 'LABORATORY',
        nextModule: 'SAMPLES',
        previousModule: 'MOLECULES'
    }
};

var sampleRank = 1;
const changeRate1 = 5;
const changeRate2 = 100;
const totalSamples = 2;

var mod = 'START_POS';
var hasDiagnosis = false;
var hasMolecules = false;
var isMoving = false;
var hasSamples = false;
var sampleIsGood = false;
var allConnected = false;

var timer = 1;

var sampleStateArr = [];

while (true) {
    printErr(' ');
    printErr(' ');
    printErr(' ');

    if (isMoving) {
        if (timer === 0) {
            printErr('Reached destination');
            timer = 2;
            isMoving = false;
        } else {
            timer--;
        }
    }

    var players = getTurnPlayers();
    var me = players[0];
    var storage = {
        a: me.storageA,
        b: me.storageB,
        c: me.storageC,
        d: me.storageD,
        e: me.storageE
    };

    var carrying = storage.a + storage.b + storage.c + storage.d + storage.e;

    var enemy = players[1];

    var expertiseTotal = me.expertiseA + me.expertiseB + me.expertiseC + me.expertiseD + me.expertiseE;

    if (expertiseTotal === changeRate1) {
        sampleRank = 2;
    }

    if (expertiseTotal === changeRate2) {
        sampleRank = 3;
    }

    var availability = getTurnAvailability();

    let samplesObj = getTurnSamples();

    var samplesArr = samplesObj.samplesArr;
    var mySamples = samplesArr.filter((sample) => {
        return sample.carriedBy === 0;
    });
    var samples = samplesObj.samples;

    if(sampleStateArr.length){
        updateSamples();
    }

    printErr('state: ' + mod);
    printErr('availability: ' + JSON.stringify(availability));
    printErr('player: ' + JSON.stringify(me));
    //printErr('sample: ' + JSON.stringify(samples[sampleId]));
    printErr('mySamples: ' + JSON.stringify(mySamples));
    printErr('numSamples: ' + mySamples.length);
    printErr('sampleState: ' + JSON.stringify(sampleStateArr));

    if (isMoving) {
        print('WAIT');
        printErr('Moving');
    } else {
        getAction();
    }
}

function updateSamples(){
    sampleStateArr.forEach((sampleState) => {
        let id = sampleState.id;
    });
}

function getAction() {

    switch (mod) {
        case 'START_POS':
            next();
            break;
        case 'SAMPLES':
            if (!hasSamples) {
                getSample();
                if (mySamples.length === totalSamples - 1) {
                    hasSamples = true;
                    next();
                }
            }
            break;
        case 'DIAGNOSIS':
            if (sampleStateArr.length === 0) {
                fillState();
            }
            if (hasSamples && !allConnected) {
                connectSamples('isDiagnosed');
            } else {
                if (hasSamples && checkSamples()) {
                    next();
                    allConnected = false;
                } else if (hasSamples && !checkSamples()) {
                    connectSamples('isCheap'); //deliver sample to the cloud
                    allConnected = false;
                    hasSamples = false;
                } else {
                    next('SAMPLES');
                    sampleStateArr = [];
                }
            }
            break;
        case 'MOLECULES':
            if (!hasMolecules) {
                getMolecule();
            }
            if (hasMolecules) {
                hasMolecules = false;
                next();
            }
            break;
        case 'LABORATORY':
            if (!allConnected) {
                connectSamples('isDelivered');
            }
            if (allConnected) {
                next();
                allConnected = false;
                hasSamples = false;
                sampleStateArr = [];
            }
            break;
        default:
            break;
    }
}

function fillState() {
    printErr('length: ' + mySamples.length);
    mySamples.forEach((sample) => {
        printErr('filling sample ' + sample.id);
        sampleStateArr.push({
            id: sample.id,
            isDiagnosed: false,
            isCheap: false,
            isDelivered: false,
            hasMolecules: false,
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            e: 0,
            
        });
    });

    if (carrying > 0) {
        //check for leftovers
    }
}

function getSample() {
    print('CONNECT ' + sampleRank);
}

function checkSamples() {
    return sampleStateArr.every((elem) => {
        let sample = samples[elem.id];
        let isCheap = sample.costA < 6 && sample.costB < 6 && sample.costC < 6 && sample.costD < 6 && sample.costE < 6;
        elem.isCheap = isCheap;
        return isCheap;
    });
}

function getSampleId() {
    let sampleId;

    sampleId = samplesArr.filter((sample) => {
        return sample.carriedBy === 0;
    })[0].id;

    return sampleId;
}

function getMolecule() {
    for (let index = 0; index < sampleStateArr.length; index++) {
        var element = sampleStateArr[index];
        var sampleId = element.id;
        printErr('checking for molecules for sample ' + sampleId);

        if (needsMoleculeA() && availMolA()) {
            print('CONNECT A');
            element.a++;
            return;
        }
        if (needsMoleculeB() && availMolB()) {
            print('CONNECT B');
            element.b++;
            return;
        }
        if (needsMoleculeC() && availMolC()) {
            print('CONNECT C');
            element.c++;
            return;
        }
        if (needsMoleculeD() && availMolD()) {
            print('CONNECT D');
            element.d++;
            return;
        }
        if (needsMoleculeE() && availMolE()) {
            print('CONNECT E');
            element.e++;
            return;
        }
        if (hasEnoughtMolecules()) {
            printErr('has enough sample id: ' + sampleId);
            element.hasMolecules = true;
        }
    }
    if (checkMolecules()) {
        hasMolecules = true;
    } else {
        print('WAIT');
    }

    function checkMolecules() {
        return sampleStateArr.every((sample) => {
            return sample.hasMolecules;
        });
    }

    function hasEnoughtMolecules() {
        var enough = !(needsMoleculeA() || needsMoleculeB() || needsMoleculeC() || needsMoleculeD() || needsMoleculeE());
        return enough;
    }

    function availMolA() {
        return availability.a > 0;
    }
    function availMolB() {
        return availability.b > 0;
    }
    function availMolC() {
        return availability.c > 0;
    }
    function availMolD() {
        return availability.d > 0;
    }
    function availMolE() {
        return availability.e > 0;
    }
    function needsMoleculeA() {
        return element.a !== samples[sampleId].costA;
    }
    function needsMoleculeB() {
        return element.b !== samples[sampleId].costB;
    }
    function needsMoleculeC() {
        return element.c !== samples[sampleId].costC;
    }
    function needsMoleculeD() {
        return element.d !== samples[sampleId].costD;
    }
    function needsMoleculeE() {
        return element.e !== samples[sampleId].costE;
    }
}

function connectSamples(valueCheck) {
    for (let index = 0; index < sampleStateArr.length; index++) {
        var element = sampleStateArr[index];
        if (!element[valueCheck]) {
            print('CONNECT ' + element.id);
            element[valueCheck] = true;
            return;
        }
    }
    printErr('all connected');
    allConnected = true;
}

function next(target) {
    if (typeof target == 'undefined') {
        print('GOTO ' + modules[mod].nextModule);
        mod = modules[mod].nextModule;
    } else {
        print('GOTO ' + target);
        mod = target;
    }
    isMoving = true;
}

function getUselessStuff() {
    let projectCount = parseInt(readline());
    for (var i = 0; i < projectCount; i++) {
        let inputs = readline().split(' ');
        let a = parseInt(inputs[0]);
        let b = parseInt(inputs[1]);
        let c = parseInt(inputs[2]);
        let d = parseInt(inputs[3]);
        let e = parseInt(inputs[4]);
    }
}

function getTurnPlayers() {
    let players = [];
    for (let i = 0; i < 2; i++) {
        let player = {};
        player.id = i;
        let inputs = readline().split(' ');
        player.target = inputs[0];
        player.eta = parseInt(inputs[1]);
        player.score = parseInt(inputs[2]);
        player.storageA = parseInt(inputs[3]);
        player.storageB = parseInt(inputs[4]);
        player.storageC = parseInt(inputs[5]);
        player.storageD = parseInt(inputs[6]);
        player.storageE = parseInt(inputs[7]);
        player.expertiseA = parseInt(inputs[8]);
        player.expertiseB = parseInt(inputs[9]);
        player.expertiseC = parseInt(inputs[10]);
        player.expertiseD = parseInt(inputs[11]);
        player.expertiseE = parseInt(inputs[12]);

        players.push(player);
    }

    return players;
}

function getTurnAvailability() {
    let inputs = readline().split(' ');
    let a = parseInt(inputs[0]);
    let b = parseInt(inputs[1]);
    let c = parseInt(inputs[2]);
    let d = parseInt(inputs[3]);
    let e = parseInt(inputs[4]);

    return {
        a,
        b,
        c,
        d,
        e
    };
}

function getTurnSamples() {
    let sampleCount = parseInt(readline());
    printErr('Available samples: ' + sampleCount);
    let samples = {};
    let samplesArr = [];
    for (let i = 0; i < sampleCount; i++) {
        let sample = {};
        let inputs = readline().split(' ');
        let id = parseInt(inputs[0]);
        sample.id = id;
        sample.carriedBy = parseInt(inputs[1]);
        sample.rank = parseInt(inputs[2]);
        sample.expertiseGain = inputs[3];
        sample.health = parseInt(inputs[4]);
        sample.costA = Math.max(0, parseInt(inputs[5]) - me.expertiseA);
        sample.costB = Math.max(0, parseInt(inputs[6]) - me.expertiseB);
        sample.costC = Math.max(0, parseInt(inputs[7]) - me.expertiseC);
        sample.costD = Math.max(0, parseInt(inputs[8]) - me.expertiseD);
        sample.costE = Math.max(0, parseInt(inputs[9]) - me.expertiseE);
        sample.totalSampleCost = sample.costA + sample.costB + sample.costC + sample.costD + sample.costE;
        samples[id] = sample;
        samplesArr.push(sample);
    }

    return {
        samples,
        samplesArr
    };
}