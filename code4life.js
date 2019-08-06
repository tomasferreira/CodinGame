// Steps:
// - Collect sample data files from the SAMPLES module.
// - Analyze sample data files at the DIAGNOSIS module to get a list of molecules for the associated medicine.
// - Gather required molecules for the medicines at the MOLECULES module.
// - Produce the medicines at the LABORATORY module and collect your health points.

// Robots:
// Each player has one robot. Both robots have the same starting position.
// A robot can carry up to 3 sample data files and 10 molecules.
// A player can move their robot from one module to another by means of the GOTO module command.
// Once the robot is at a module's interface, it can connect to it with the CONNECT command. This will have a different effect for each module.
// Moving from one module to another takes a number of turns depending on the distance involved (see matrix below).
// Once movement has started, it cannot be interrupted. Any commands given by the player during the turns when the robot is mobile will be ignored.

// Data:
// A sample data file is an item representing all known data on a tissue sample collected from an untreated patient. Researching this sample may ultimately lead to the production of medicine to prolong the lives of all patients with the same ailment.
// Sample data files can be in one of two states: undiagnosed (initial state) or diagnosed.
// A diagnosed sample data is associated with the list of molecules needed to produce the medicine for that sample.
// Each sample data file has a rank: 1, 2 or 3. The higher the rank, the more health points you will get from the medicine - but more molecules will be needed to produce the medicine.

// Molecule types: A, B, C, D, E

// Modules:
// The samples module:
// - Connecting to this module with CONNECT rank, where rank is an integer between 1 and 3, will transfer an undiagnosed sample data file of rank rank to your robot.

// The diagnosis machine:
// - Connecting to this module with CONNECT id:
//   - where id is the identifier of an undiagnosed sample data file the player is carrying, will change the sample's state to diagnosed.
//   - where id is the identifier of a diagnosed sample data file the player is carrying, will transfer the sample data from the player to the cloud, where it will remain until a player takes it.
//   - where id is the identifier of a diagnosed sample data file stored in the cloud, will transfer the sample data from the cloud to the player.

// The molecule distribution module:
// Connecting to this module with CONNECT type, where type is one of the molecule types, will transfer an available molecule to your robot of the desired type.
// The terminal will only provide a maximum of 5 molecules per type, until molecules are spent in the lab.

// The laboratory module:
// To use this module, the player's robot must be carrying a sample data file as well as the required amount of molecules for producing that sample's medicine.
// Connecting to this module with CONNECT id where id is the identifier of a sample data the player can research, will have several effects:
// - The sample data id as well as the associated molecules are removed from play.
// - The players scores as many points as the sample's health points.
// - The player acquires molecule expertise: the robot will need 1 less molecule of the type specified by the sample for producing all subsequent medicines.

// Concurrency:
// In the event that both players try to take sample data from the cloud on the same turn, only the player who had previously diagnosed this sample will successfully complete the transfer.
// In the event that both players request the last molecule of a given type, the module will provide an extra molecule but will wait for at least 2 molecules of that type to be spent in the lab before providing new ones.

// Science projects
// In addition to scoring points by helping Roche create new medicine for untreated diseases, a player may also further apply medical science by completing Science projects.
// Each science project is worth 50 health points. It can be completed by either player.
// Each game starts out with 3 random active science projects. To complete one, players must gather the required amount of molecule expertise for each type (A,B,C,D & E).

// Constraints:
// Health points scored with a rank 1 sample = 1 or 10
// Health points scored with a rank 2 sample = 10, 20 or 30
// Health points scored with a rank 3 sample = 30, 40 or 50
// 3≤ Total molecule cost for a rank 1 sample ≤5
// 5≤ Total molecule cost for a rank 2 sample ≤8
// 7≤ Total molecule cost for a rank 3 sample ≤14
// Response time for first turn ≤ 1000ms
// Response time for one turn ≤ 50ms

// Initialization input:
// Line 1:projectCount, number of science projects.
// Next projectCount lines: 5 integers, the required amount of molecule expertise needed for each type.

// Input for one game turn:
// For each player, 1 line: 1 string followed by 12 integers (you are always the first player):
// target: module where the player is or is going to.
// eta: number of turns before reaching the module (if greater than 0 the player's action will be ignored).
// score: the player's number of health points
// storageA, storageB, storageC, storageD, storageE: number of molecules held by the player for each molecule type.
// expertiseA, expertiseB, expertiseC, expertiseD, expertiseE: the molecule expertise for each molecule type.

// Next line:availableA, availableB, availableC, availableD, availableE: 5 integers, the number of available molecules for each type.

// Next line:sampleCount: the number of samples currently in the game.
// Next sampleCount lines:
// sampleId: unique id for the sample.
// carriedBy: 0 if the sample is carried by you, 1 by the other robot, -1 if the sample is in the cloud.
// rank: rank of the sample 1, 2 or 3.
// gain: expertise molecule gained when researching this sample A B C D or E.
// health: number of health points you gain from this sample.
// costA, costB, costC, costD, costE: number of molecules of each type needed to research the sample

// Output for one game turn:
// Each turn issue one of the following command:
// GOTO module: move towards the target module.
// CONNECT id/type/ rank: connect to the target module with the specified sample id or retrieve a sample of a given rank at the SAMPLES module, or molecule of the given type at the MOLECULES module.
// WAIT: do nothing.

const MODULES = {
    START_POS: {
        SAMPLES: 2,
        DIAGNOSIS: 2,
        MOLECULES: 2,
        LABORATORY: 2,
    },
    SAMPLES: {
        DIAGNOSIS: 3,
        MOLECULES: 3,
        LABORATORY: 3,
        ID: 'SAMPLES'
    },
    DIAGNOSIS: {
        SAMPLES: 3,
        MOLECULES: 3,
        LABORATORY: 4,
        ID: 'DIAGNOSIS'
    },
    MOLECULES: {
        SAMPLES: 3,
        DIAGNOSIS: 3,
        LABORATORY: 3,
        ID: 'MOLECULES'
    },
    LABORATORY: {
        SAMPLES: 3,
        DIAGNOSIS: 4,
        MOLECULES: 3,
        ID: 'LABORATORY'
    }
};
//STATES:
const START = 'start';
const SAMPLES = 'samples';
const DIAGNOSIS = 'diagnosis';
const MOLECULES = 'molecules';
const LAB = 'laboratory';
const WAITING = 'waiting';

const INITIAL_STATE = START;

const FUNCTIONS = {
    default: getDefaultTurn,
    start: getStartTurn,
    moving: getMovingTurn,
    samples: getSamplesTurn,
    diagnosis: getDiagTurn,
    molecules: getMolTurn,
    laboratory: getLabTurn,
};
const IS_PLAYING = true;
const MAX_MOL = 1;
const turns = [];

getProjectData();
let turnCounter = 0;
while (IS_PLAYING) {
    let turnData = {};
    turnData.number = turnCounter;
    let players = getTurnPlayers();
    turnData.me = players.me;
    turnData.op = players.op;
    turnData.availability = getTurnAvailability();
    let samples = getTurnSamples();
    turnData.mySamples = samples.mySamples;
    turnData.opSamples = samples.opSamples;
    turnData.unCarriedSamples = samples.unCarriedSamples;

    turnData.previousState = getPreviousState();
    turnData.movingCounter = Math.max(0, getPreviousMovingCounter() - 1);
    turns.push(turnData);

    let turn = getTurn(turnData);
    turnData.action = turn.action;
    turnData.state = turn.state;
    if (turn.movingCounter) turnData.movingCounter = + turn.movingCounter;
    turnData.target = turn.target || '';

    // printErr(turnData);

    print(turnData.action);
    turnCounter++;
}

function getPreviousMovingCounter() {
    if (turns.length === 0) return 0;
    else return turns[turns.length - 1].movingCounter === 0 ? 0 : turns[turns.length - 1].movingCounter;
}

function getPreviousState() {
    if (turns.length === 0) return INITIAL_STATE;
    else return turns[turns.length - 1].state;
}

function getTurn(turn) {
    if (turn.movingCounter !== 0) {
        return getMovingTurn(turn);
    }
    let state = turn.previousState;
    let stateFunction = FUNCTIONS[state] || FUNCTIONS['default'];
    //printErr('turn start', turn.number, 'state', state, 'func', stateFunction);
    return stateFunction.call(this, turn);
}


///////////////////////////////////////
///////////////////////////////////////
//// STATE-BASED ACTION FUNCTIONS: ////
///////////////////////////////////////
///////////////////////////////////////
function getDefaultTurn() {
    let action = 'WAIT';
    let state = WAITING;
    return { action, state };
}

function getStartTurn() {
    let action = 'GOTO ' + MODULES.SAMPLES.ID;
    let state = SAMPLES;
    let movingCounter = MODULES.START_POS.SAMPLES;
    return { action, state, movingCounter };
}

function getMovingTurn(turn) {
    let action = 'WAIT';
    let state = turn.previousState;
    return { action, state };
}

function getSamplesTurn(turn) {
    let ret = {};
    ret.action = 'WAIT';
    ret.state = SAMPLES;
    if (turn.mySamples.size < MAX_MOL) {
        let sampleRank = getNextRank();
        ret.action = 'CONNECT ' + sampleRank;
    } else {
        ret.action = 'GOTO ' + MODULES.DIAGNOSIS.ID;
        ret.state = DIAGNOSIS;
        ret.movingCounter = MODULES.SAMPLES.DIAGNOSIS;
    }

    return ret;
}

function getDiagTurn(turn) {
    //diagnose all samples
    //if all are diagnosed, move to mols
    //if mysamp is empty, return to samples
    let ret = {};
    ret.action = 'WAIT';
    ret.state = DIAGNOSIS;

    if(turn.mySamples.size < 1){
        ret.action = 'GOTO ' + MODULES.SAMPLES.ID;
        ret.state = SAMPLES;
        ret.movingCounter = MODULES.DIAGNOSIS.SAMPLES;
    } else {
        for(let i in turn.mySamples){
            let sample = turn.mySamples[i];
            if(sample.totalSampleCost <= 0){
                ret.action = 'CONNECT ' + sample.id;
                return ret;
            }
        }

        ret.action = 'GOTO ' + MODULES.MOLECULES.ID;
        ret.state = MOLECULES;
        ret.movingCounter = MODULES.DIAGNOSIS.MOLECULES;
    }

    return ret;
}

function getMolTurn(turn) {
    let ret = {};
    ret.action = 'WAIT';
    ret.state = MOLECULES;

    if(turn.mySamples.size < 1){
        ret.action = 'GOTO ' + MODULES.SAMPLES.ID;
        ret.state = SAMPLES;
        ret.movingCounter = MODULES.MOLECULES.SAMPLES;
    } else {
        for(let i in turn.mySamples){
            let sample = turn.mySamples[i];
            printErr(sample);
            //GET ALL MOLS
            //CHANGE ISCOMPLETE
        }
        ret.action = 'GOTO ' + MODULES.LABORATORY.ID;
        ret.state = LAB;
        ret.movingCounter = MODULES.MOLECULES.LABORATORY;
    }
    return ret;
}

function getLabTurn(turn) {
    let ret = {};
    ret.action = 'WAIT';
    ret.state = LAB;

    if(turn.mySamples.size < 1){
        ret.action = 'GOTO ' + MODULES.SAMPLES.ID;
        ret.state = SAMPLES;
        ret.movingCounter = MODULES.LABORATORY.SAMPLES;
    } else {
        for(let i in turn.mySamples){
            let sample = turn.mySamples[i];
            if(sample.isComplete){
                ret.action = 'CONNECT ' + sample.id;
                return ret;
            }
        }
        ret.action = 'GOTO ' + MODULES.SAMPLES.ID;
        ret.state = SAMPLES;
        ret.movingCounter = MODULES.LABORATORY.SAMPLES;
    }
    return ret;
}

///////////////////////////
///////////////////////////
//// HELPER FUNCTIONS: ////
///////////////////////////
///////////////////////////
function getNextRank(){
    return 1;
}

//////////////////////////////////////
//////////////////////////////////////
//// TURN INPUT GETTER FUNCTIONS: ////
//////////////////////////////////////
//////////////////////////////////////
function getTurnPlayers() {
    let me;
    let op;
    for (let i = 0; i < 2; i++) {
        let player = {};
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

        if(i === 0) me = player;
        else op = player;
    }

    return {me, op};
}

function getTurnAvailability() {
    let inputs = readline().split(' ');
    let a = parseInt(inputs[0]);
    let b = parseInt(inputs[1]);
    let c = parseInt(inputs[2]);
    let d = parseInt(inputs[3]);
    let e = parseInt(inputs[4]);

    return { a, b, c, d, e };
}

function getTurnSamples() {
    let sampleCount = parseInt(readline());
    let mySamples = { size: 0, isFull: false };
    let opSamples = { isEmpty: true };
    let unCarriedSamples = { isEmpty: true };
    for (let i = 0; i < sampleCount; i++) {
        let sample = {};
        sample.isComplete = false;
        let inputs = readline().split(' ');
        let id = parseInt(inputs[0]);
        sample.id = id;
        let carriedBy = parseInt(inputs[1]);
        sample.rank = parseInt(inputs[2]);
        sample.expertiseGain = inputs[3];
        sample.health = parseInt(inputs[4]);
        sample.costA = parseInt(inputs[5]);
        sample.costB = parseInt(inputs[6]);
        sample.costC = parseInt(inputs[7]);
        sample.costD = parseInt(inputs[8]);
        sample.costE = parseInt(inputs[9]);
        sample.totalSampleCost = sample.costA + sample.costB + sample.costC + sample.costD + sample.costE;
        switch (carriedBy) {
            case 0:
                mySamples[id] = sample;
                mySamples.size++;
                break;
            case 1:
                opSamples[id] = sample;
                opSamples.isEmpty = false;
                break;
            case 2:
                unCarriedSamples[id] = sample;
                unCarriedSamples.isEmpty = false;
                break;
        }
    }
    return { mySamples, opSamples, unCarriedSamples };
}

//////////////////////////////////////////
//////////////////////////////////////////
//// GAME (INITIAL) GETTER FUNCTIONS: ////
//////////////////////////////////////////
//////////////////////////////////////////
function getProjectData() {
    let projects = [];
    let projectCount = parseInt(readline());
    for (var i = 0; i < projectCount; i++) {
        let inputs = readline().split(' ');
        let a = parseInt(inputs[0]);
        let b = parseInt(inputs[1]);
        let c = parseInt(inputs[2]);
        let d = parseInt(inputs[3]);
        let e = parseInt(inputs[4]);
        projects.push({ a, b, c, d, e });
    }
    return projects;
}

/*
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
            a: storage.a,
            b: storage.b,
            c: storage.c,
            d: storage.d,
            e: storage.e,

        });

        for (const mol in storage) {
            if (storage.hasOwnProperty(mol)) {
                storage[mol] = 0;
            }
        }
    });
}

function checkSamples() {
    let total = {
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        e: 0
    };
    let isCheap = sampleStateArr.every((elem) => {
        let sample = samples[elem.id];
        total.a += sample.costA;
        total.b += sample.costB;
        total.c += sample.costC;
        total.d += sample.costD;
        total.e += sample.costE;
        let isCheap = sample.costA <= maxIndMol && sample.costB <= maxIndMol && sample.costC <= maxIndMol && sample.costD <= maxIndMol && sample.costE <= maxIndMol;
        elem.isCheap = isCheap;
        return isCheap;
    });

    let totalByMol = total.a <= maxIndMol && total.b <= maxIndMol && total.c <= maxIndMol && total.d <= maxIndMol && total.e <= maxIndMol;

    let totalCar = (total.a + total.b + total.c + total.d + total.e) <= maxMol;
    printErr('mol: ' + totalByMol + ' car: ' + totalCar);
    return isCheap && totalByMol && totalCar;
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
        return element.a < samples[sampleId].costA;
    }
    function needsMoleculeB() {
        return element.b < samples[sampleId].costB;
    }
    function needsMoleculeC() {
        return element.c < samples[sampleId].costC;
    }
    function needsMoleculeD() {
        return element.d < samples[sampleId].costD;
    }
    function needsMoleculeE() {
        return element.e < samples[sampleId].costE;
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

*/


//TODO: check this logic:
/*
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
    */