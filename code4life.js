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
const START_POS = 'START_POS';
const SAMPLES = 'SAMPLES';
const DIAGNOSIS = 'DIAGNOSIS';
const MOLECULES = 'MOLECULES';
const LABORATORY = 'LABORATORY';
const WAITING = 'WAITING';

const FUNCTIONS = {
	default: getDefaultTurn,
	START_POS: getStartTurn,
	moving: getMovingTurn,
	SAMPLES: getSamplesTurn,
	DIAGNOSIS: getDiagTurn,
	MOLECULES: getMolTurn,
	LABORATORY: getLabTurn,
};
const IS_PLAYING = true;
const MAX_MOL = 3;
const MOLS_PER_TURN = 1;
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
	printErr(samples);
	turnData.mySamples = samples.mySamples;
	turnData.opSamples = samples.opSamples;
	turnData.unCarriedSamples = samples.unCarriedSamples;

	turnData.previousState = getPreviousState();
	turnData.movingCounter = Math.max(0, getPreviousMovingCounter() - 1);

	setUpdatedSampleCost(players.me.expertise, samples.mySamples);
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
	if (turns.length === 0) return START_POS;
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
	printErr('DEFAULT');
	let action = 'WAIT';
	let state = WAITING;
	return { action, state };
}

function getStartTurn() {
	return goTo(START_POS, SAMPLES);
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
	if (turn.mySamples.length < MAX_MOL) {
		let sampleRank = getNextRank();
		ret.action = 'CONNECT ' + sampleRank;
	} else {
		return goTo(SAMPLES, DIAGNOSIS);
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
		return goTo(DIAGNOSIS, SAMPLES);
	} else {
		for(let sample of turn.mySamples){

			if(sample.cost.total <= 0){
				ret.action = 'CONNECT ' + sample.id;
				return ret;
			}
		}
		return goTo(DIAGNOSIS, MOLECULES);
	}
}

function getMolTurn(turn) {
	let ret = {};
	ret.action = 'WAIT';
	ret.state = MOLECULES;

	if(turn.mySamples.size < 1){
		return goTo(MOLECULES, SAMPLES);
	} else {
		for(let sample of turn.mySamples){

			if(isSampleComplete(sample, turn)){
				return goTo(MOLECULES, LABORATORY);
			}
			let avail = turn.availability;
			let storage = turn.me.storage;

			let molID = getNextMolID(sample, avail, storage);

			//if we can't find mol for this sample, wait one turn
			if(molID === null) return ret;

			ret.action = 'CONNECT ' + molID;
			return ret;
		}
	}
}

function getLabTurn(turn) {
	let ret = {};
	ret.action = 'WAIT';
	ret.state = LABORATORY;

	if(turn.mySamples.length < 1){
		return goTo(LABORATORY, SAMPLES);
	} else {
		for(let sample of turn.mySamples){

			if(isSampleComplete(sample, turn)){
				ret.action = 'CONNECT ' + sample.id;
				return ret;
			}
		}
		return goTo(LABORATORY, MOLECULES);
	}
}

///////////////////////////
///////////////////////////
//// HELPER FUNCTIONS: ////
///////////////////////////
///////////////////////////
function getNextRank(){
	return 1;
}

function getNextMolID(sample, avail, storage){

	let cost = sample.updatedCost;
	printErr('sample', sample);
	printErr('avail', avail);
	printErr('storage', storage);

	if(avail.a > 0 && cost.a > storage.a){
		return 'A';
	}

	if(avail.b > 0 && cost.b > storage.b){
		return 'B';
	}

	if(avail.c > 0 && cost.c > storage.c){
		return 'C';
	}

	if(avail.d > 0 && cost.d > storage.d){
		return 'D';
	}

	if(avail.e > 0 && cost.e > storage.e){
		return 'E';
	}

	return null;
}

function isSampleComplete(sample, turn){
	let cost = sample.updatedCost;
	let storage = turn.me.storage;
	return storage.a >= cost.a && storage.b >= cost.b && storage.c >= cost.c && storage.d >= cost.d && storage.e >= cost.e;
}

function goTo(start, target){
	printErr('goto', start, target);
	let ret = {};
	ret.action = 'GOTO ' + MODULES[target].ID;
	ret.state = target;
	ret.movingCounter = MODULES[start][target];

	return ret;
}

function setUpdatedSampleCost(expertise, samples){
	for(let sample of samples){
		if(sample.cost.total <= 0) continue;
		let updatedCost = {};
		updatedCost.a = Math.max(0, sample.cost.a - expertise.a);
		updatedCost.b = Math.max(0, sample.cost.b - expertise.b);
		updatedCost.c = Math.max(0, sample.cost.c - expertise.c);
		updatedCost.d = Math.max(0, sample.cost.d - expertise.d);
		updatedCost.e = Math.max(0, sample.cost.e - expertise.e);
		updatedCost.total = updatedCost.a + updatedCost.b + updatedCost.c + updatedCost.d + updatedCost.e;
		sample.updatedCost = updatedCost;
	}
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
		player.storage = {};
		player.expertise = {};
		player.storage.a = parseInt(inputs[3]);
		player.storage.b = parseInt(inputs[4]);
		player.storage.c = parseInt(inputs[5]);
		player.storage.d = parseInt(inputs[6]);
		player.storage.e = parseInt(inputs[7]);
		player.expertise.a = parseInt(inputs[8]);
		player.expertise.b = parseInt(inputs[9]);
		player.expertise.c = parseInt(inputs[10]);
		player.expertise.d = parseInt(inputs[11]);
		player.expertise.e = parseInt(inputs[12]);

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
	let mySamples = [];
	let opSamples = [];
	let unCarriedSamples = [];
	for (let i = 0; i < sampleCount; i++) {
		let sample = {};
		let inputs = readline().split(' ');
		let id = parseInt(inputs[0]);
		sample.id = id;
		let carriedBy = parseInt(inputs[1]);
		sample.rank = parseInt(inputs[2]);
		sample.expertiseGain = inputs[3];
		sample.health = parseInt(inputs[4]);
		sample.cost = {};
		sample.cost.a = parseInt(inputs[5]);
		sample.cost.b = parseInt(inputs[6]);
		sample.cost.c = parseInt(inputs[7]);
		sample.cost.d = parseInt(inputs[8]);
		sample.cost.e = parseInt(inputs[9]);
		sample.cost.total = sample.cost.a + sample.cost.b + sample.cost.c + sample.cost.d + sample.cost.e;
		switch (carriedBy) {
			case 0:
				mySamples.push(sample);
				break;
			case 1:
				opSamples.push(sample);
				break;
			case 2:
				unCarriedSamples.push(sample);
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