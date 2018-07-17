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

const sampleRank = 1;
const totalSamples = 2;

var mod = 'START_POS';
var hasDiagnosis = false;
var hasMolecules = false;
var delivered = false;
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
    var enemy = players[1];

    var availability = getTurnAvailability();

    let samplesObj = getTurnSamples();

    var samplesArr = samplesObj.samplesArr;
    var mySamples = samplesArr.filter((sample) => {
        return sample.carriedBy === 0;
    });
    var samples = samplesObj.samples;

    printErr('state: ' + mod);
    printErr('availability: ' + JSON.stringify(availability));
    printErr('player: ' + JSON.stringify(me));
    //printErr('sample: ' + JSON.stringify(samples[sampleId]));
    printErr('mySamples: ' + JSON.stringify(mySamples));
    printErr('numSamples: ' + mySamples.length);

    if (isMoving) {
        print('WAIT');
        printErr('Moving');
        continue;
    }

    switch (mod) {
        case 'START_POS':
            next();
            break;
        case 'SAMPLES':
            if (!hasSamples) {
                getSample();
                if (mySamples.length === totalSamples - 1) {
                    hasSamples = true;
                    fillState();
                    next();
                }
            }
            break;
        case 'DIAGNOSIS':
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
            if (!delivered && !allConnected) {
                connectSamples('isDelivered');
            } else {
                next();
                allConnected = false;
                hasSamples = false;
            }
            break;
        default:
            break;
    }
    //printErr(JSON.stringify(samples[sampleId]));
    //printErr(JSON.stringify(me));

    //printErr(JSON.stringify(samples));
}

function fillState() {
    mySamples.forEach((sample) => {
        sampleStateArr.push({
            id: sample.id,
            isDiagnosed: false,
            isCheap: false,
            isDelivered: false,
            hasMolecules: true
        });
    });
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
    printErr('st: ' + me.storageA + ' ' + me.storageB + ' ' + me.storageC + ' ' + me.storageD + ' ' + me.storageE);

    for (let index = 0; index < sampleStateArr.length; index++) {
        var element = sampleStateArr[index];
        var sampleId = element.id;

        if (needsMoleculeA() && availMolA()) {
            print('CONNECT A');
            return;
        }
        if (needsMoleculeB() && availMolB()) {
            print('CONNECT B');
            return;
        }
        if (needsMoleculeC() && availMolC()) {
            print('CONNECT C');
            return;
        }
        if (needsMoleculeD() && availMolD()) {
            print('CONNECT D');
            return;
        }
        if (needsMoleculeE() && availMolE()) {
            print('CONNECT E');
            return;
        }
        if (hasEnoughtMolecules()) {
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
        return !(needsMoleculeA() || needsMoleculeB() || needsMoleculeC() || needsMoleculeD() || needsMoleculeE());
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
        return me.storageA !== Math.max(0, samples[sampleId].costA - me.expertiseA);
    }
    function needsMoleculeB() {
        return me.storageB !== Math.max(0, samples[sampleId].costB - me.expertiseB);
    }
    function needsMoleculeC() {
        return me.storageC !== Math.max(0, samples[sampleId].costC - me.expertiseC);
    }
    function needsMoleculeD() {
        return me.storageD !== Math.max(0, samples[sampleId].costD - me.expertiseD);
    }
    function needsMoleculeE() {
        return me.storageE !== Math.max(0, samples[sampleId].costE - me.expertiseE);
    }
}

function connectSamples(valueCheck) {
    for (let index = 0; index < sampleStateArr.length; index++) {
        const element = sampleStateArr[index];
        if (!element[valueCheck]) {
            print('CONNECT ' + element.id);
            element[valueCheck] = true;
            return;
        }
    }
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
        sample.costA = parseInt(inputs[5]) - me.expertiseA;
        sample.costB = parseInt(inputs[6]) - me.expertiseB;
        sample.costC = parseInt(inputs[7]) - me.expertiseC;
        sample.costD = parseInt(inputs[8]) - me.expertiseD;
        sample.costE = parseInt(inputs[9]) - me.expertiseE;
        sample.totalSampleCost = sample.costA + sample.costB + sample.costC + sample.costD + sample.costE;
        samples[id] = sample;
        samplesArr.push(sample);
    }

    return {
        samples,
        samplesArr
    };
}