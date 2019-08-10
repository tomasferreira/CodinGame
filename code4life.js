const DEBUG = true;
if (!DEBUG) {
	printErr = function () {
		return;
	};
}

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
// const LEVEL_ONE_EXPERTISE = 0;
// const LEVEL_TWO_EXPERTISE = 3;
// const LEVEL_THREE_EXPERTISE = 6;
const LEVEL_ONE_RANK = 1;
const LEVEL_TWO_RANK = 2;
const LEVEL_THREE_RANK = 3;

const PANIC_LEVEL_ONE_TURN = 175;
const PANIC_LEVEL_TWO_TURN = 150;

const LEVEL_TWO_TURN = 45;
const LEVEL_THREE_TURN = 1250;

const MIN_HEALTH_RANK_ONE = 9;
const MIN_HEALTH_RANK_TWO = 19;
const MIN_HEALTH_RANK_THREE = 39;

//minpos = paniclevel - posstrat
// const PROJECT_TYPE = 9;
const PROJ_MIN = 1;
const VALUE_STRATEGY = 1;
const POSSIBLE_STRATEGY = 1;

let projects = getProjectData();
let turns = [];
let turnCounter = 0;
while (IS_PLAYING) {
	let turn = {};
	turn.number = turnCounter;
	turn.projects = projects;
	let players = getTurnPlayers();
	turn.me = players.me;
	turn.op = players.op;

	turn.availability = getTurnAvailability();

	let samples = getTurnSamples();
	turn.mySamples = samples.mySamples;
	turn.opSamples = samples.opSamples;
	turn.unCarriedSamples = samples.unCarriedSamples;

	turn.previousState = getPreviousState(turns);
	turn.movingCounter = Math.max(0, getPreviousMovingCounter() - 1);
	turn.level = getLevel(turn);
	turn.panicLevel = getPanicLevel(turn);
	turn.maxSamples = getMaxSamplesNum(turn);
	turn.sampleRank = getSampleRank(turn);
	turn.minValuable = getMinValuableSampleNum(turn);
	turn.minPossible = getMinPossibleSampleNum(turn);
	setUpdatedSampleCost(players.me.expertise, samples.mySamples);
	setSamplesData(turn);
	updateProjectData(turn);

	turns.push(turn);

	printErr('turn', turn.number, '|| level', turn.level, '|| max', turn.maxSamples, ' || prevState', turn.previousState);
	printErr('samples', samples.mySamples);
	printErr('player', players.me);
	printErr('avail', turn.availability);
	printErr('proj', turn.projects);
	let action = getAction(turn);
	turn.action = action.action;
	turn.state = action.state;
	if (action.movingCounter) turn.movingCounter = + action.movingCounter;
	turn.target = action.target || '';

	print(turn.action);
	turnCounter++;
}


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
///////////////////// STATE-BASED ACTION FUNCTIONS: /////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
function getAction(turn) {
	if (turn.movingCounter !== 0) {
		return getMovingTurn(turn);
	}
	let state = turn.previousState;
	let stateFunction = FUNCTIONS[state] || FUNCTIONS['default'];
	//printErr('turn start', turn.number, 'state', state, 'func', stateFunction);
	return stateFunction.call(this, turn);
}

function getDefaultTurn() {
	printErr('DEFAULT');
	let action = 'WAIT';
	let state = WAITING;
	return { action, state };
}

function getStartTurn() {
	printErr('START');
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
	let samples = turn.mySamples;
	let maxSamples = turn.maxSamples;
	let sampleRank = turn.sampleRank;
	if (samples.length < maxSamples) {
		ret.action = 'CONNECT ' + sampleRank;
		return ret;
	} else {
		return goTo(SAMPLES, DIAGNOSIS);
	}
}

function getDiagTurn(turn) {
	let ret = {};
	ret.action = 'WAIT';
	ret.state = DIAGNOSIS;

	let mySamples = turn.mySamples;
	let maxSamples = turn.maxSamples;
	let unFinishedProject = projects.filter(project => !project.isFinished).pop();
	// printErr('PROJJJJ', unFinishedProject);

	if (mySamples.length < 1) {
		return goTo(MOLECULES, SAMPLES);
	}

	if (turn.diagnosedCount !== mySamples.length) {

		printErr('1');
		for (let sample of mySamples) {
			if (!sample.isDiagnosed) {
				ret.action = 'CONNECT ' + sample.id;
				return ret;
			}
		}
	} else if (turn.expertiseCount < maxSamples) {
		printErr('2');
		let notExpertiseSamples = mySamples.filter(sample => !sample.isExpertise);
		for (let sample of notExpertiseSamples) {
			ret.action = 'CONNECT ' + sample.id;
			return ret;
		}
		return goTo(DIAGNOSIS, SAMPLES);
	} else if (unFinishedProject && turn.projectCount < PROJ_MIN) {
		printErr('3');
		let notProjectSamples = mySamples.filter(sample => !sample.isProject);
		for (let sample of notProjectSamples) {
			ret.action = 'CONNECT ' + sample.id;
			return ret;
		}
		return goTo(DIAGNOSIS, SAMPLES);
	} else if (turn.valuableCount < turn.minValuable) {
		printErr('4');
		let notValuableSamples = mySamples.filter(sample => !sample.isValuable);
		for (let sample of notValuableSamples) {
			ret.action = 'CONNECT ' + sample.id;
			return ret;
		}
		return goTo(DIAGNOSIS, SAMPLES);
	} else if (turn.possibleCount < turn.minPossible) {
		let notPossibleSamples = mySamples.filter(sample => !sample.isPossible);
		printErr('WWWWTTTFFFF');
		for (let sample of notPossibleSamples) {
			ret.action = 'CONNECT ' + sample.id;
			return ret;
		}
		return goTo(DIAGNOSIS, SAMPLES);
	} else {
		return goTo(DIAGNOSIS, MOLECULES);
	}
}

function getMolTurn(turn) {
	let ret = {};
	ret.action = 'WAIT';
	ret.state = MOLECULES;

	let samples = turn.mySamples;

	if (samples.length < 1) {
		return goTo(MOLECULES, SAMPLES);
	}

	let possibleSample = samples.filter(sample => sample.isPossible).pop();

	if (!possibleSample) {
		possibleSample = samples.pop();
	}

	if (isSampleComplete(possibleSample, turn)) {
		return goTo(MOLECULES, LABORATORY);
	} else if (possibleSample.isPossible) {
		let avail = turn.availability;
		let storage = turn.me.storage;

		let molID = getNextMolID(possibleSample, avail, storage);
		//if we can't find mol for this sample, wait one turn
		if (molID === null) {
			printErr('NULL');
			return ret;
		}
		ret.action = 'CONNECT ' + molID;
	} else if (samples.length < getMaxSamplesNum(turn)) {
		goTo(MOLECULES, SAMPLES);
	}
	return ret;
}

function getLabTurn(turn) {
	let ret = {};
	ret.action = 'WAIT';
	ret.state = LABORATORY;

	if (turn.mySamples.length < 1) {
		return goTo(LABORATORY, SAMPLES);
	} else {
		for (let sample of turn.mySamples) {

			if (isSampleComplete(sample, turn)) {
				ret.action = 'CONNECT ' + sample.id;
				return ret;
			}
		}
		return goTo(LABORATORY, MOLECULES);
	}
}

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//////////////////////// HELPER FUNCTIONS: //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
function updateProjectData(turn) {
	let expertise = turn.me.expertise;
	let projects = turn.projects;

	let expertiseTotal = expertise.a + expertise.b + expertise.c + expertise.d + expertise.e;
	let mySamples = turn.mySamples;
	if(expertiseTotal <= 0){
		if(mySamples.filter(sample => sample.isDiagnosed).length > 0){
			expertise = mySamples[0].cost;
			mySamples.forEach(sample => sample.isProject = true);
			turn.projectCount = mySamples.filter(sample => sample.isDiagnosed).length;
		}
	}
	projects.forEach(project => {
		if (project.a >= expertise.a && project.b >= expertise.b && project.c >= expertise.c && project.d >= expertise.d && project.e >= expertise.e) project.isFinished = true;
		project.dificulty = project.a - expertise.a + project.b - expertise.b + project.c - expertise.c + project.d - expertise.d + project.e - expertise.e;
	});

	projects.sort((projectA, projectB) => projectA.dificulty - projectB.dificulty);
}

function setSamplesData(turn) {
	//checks:
	//expertise gain won't make it bigger than 5
	//updated cost is equal or less than availability

	let samples = turn.mySamples;
	let expertise = turn.me.expertise;
	let projects = turn.projects;
	// let availability = turn.availability;
	let possibleCount = 0;
	let expertiseCount = 0;
	let diagnosedCount = 0;
	let projectCount = 0;
	let valuableCount = 0;
	samples.forEach(function (sample) {
		if (sample.cost.total < 0) return;

		diagnosedCount++;
		let isExpertise = true;
		let isPossible = true;
		let isProject = false;
		let isValuable = false;
		let updatedCost = sample.updatedCost;
		let health = sample.health;
		let gain = sample.expertiseGain;
		let rank = sample.rank;
		let totalCost = sample.updatedCost.total;

		if (totalCost > 10) isExpertise = false;

		switch (rank) {
			case 1:
				if (health > MIN_HEALTH_RANK_ONE) isValuable = true;
				break;
			case 2:
				if (health > MIN_HEALTH_RANK_TWO) isValuable = true;
				break;
			case 3:
				if (health > MIN_HEALTH_RANK_THREE) isValuable = true;
				break;
		}

		let unFinishedProject = projects.filter(project => !project.isFinished).pop();

		switch (gain) {
			case 'A':
				if (expertise.a === 5) isExpertise = false;
				if (unFinishedProject && unFinishedProject.a - expertise.a > 0) isProject = true;
				break;
			case 'B':
				if (expertise.b === 5) isExpertise = false;
				if (unFinishedProject && unFinishedProject.b - expertise.b > 0) isProject = true;
				break;
			case 'C':
				if (expertise.c === 5) isExpertise = false;
				if (unFinishedProject && unFinishedProject.c - expertise.c > 0) isProject = true;
				break;
			case 'D':
				if (expertise.d === 5) isExpertise = false;
				if (unFinishedProject && unFinishedProject.d - expertise.d > 0) isProject = true;
				break;
			case 'E':
				if (expertise.e === 5) isExpertise = false;
				if (unFinishedProject && unFinishedProject.e - expertise.e > 0) isProject = true;
				break;
		}

		if (updatedCost.a > 5) {
			isPossible = false;
		}
		if (updatedCost.b > 5) {
			isPossible = false;
		}
		if (updatedCost.c > 5) {
			isPossible = false;
		}
		if (updatedCost.d > 5) {
			isPossible = false;
		}
		if (updatedCost.e > 5) {
			isPossible = false;
		}


		sample.isPossible = isPossible;
		sample.isExpertise = isExpertise;
		sample.isProject = isProject;
		sample.isValuable = isValuable;
		if (isExpertise) expertiseCount++;
		if (isPossible) possibleCount++;
		if (isProject) projectCount++;
		if (isValuable) valuableCount++;
	});
	turn.possibleCount = possibleCount;
	turn.expertiseCount = expertiseCount;
	turn.diagnosedCount = diagnosedCount;
	turn.projectCount = projectCount;
	turn.valuableCount = valuableCount;
}

function getPreviousMovingCounter() {
	if (turns.length === 0) return 0;
	else return turns[turns.length - 1].movingCounter === 0 ? 0 : turns[turns.length - 1].movingCounter;
}

function getPreviousState(turns) {
	if (turns.length === 0) return START_POS;
	else return turns[turns.length - 1].state;
}

function getSampleRank(turn) {
	let level = turn.level;
	if (level === 1) return LEVEL_ONE_RANK;
	if (level === 2) return LEVEL_TWO_RANK;
	if (level === 3) return LEVEL_THREE_RANK;
}

function getMinValuableSampleNum(turn){
	let maxSamples = turn.maxSamples;
	let minValue = Math.round((VALUE_STRATEGY/3) * maxSamples);
	return minValue;
}

function getMinPossibleSampleNum(turn){
	let panicLevel = turn.panicLevel;
	let maxSamples = turn.maxSamples;
	let minPos = Math.round((POSSIBLE_STRATEGY / 3) * panicLevel);
	if(minPos < maxSamples) return maxSamples;
	return minPos;
}

function getLevel(turn) {
	let turnCounter = turn.number;
	if (turnCounter >= LEVEL_THREE_TURN) return 3;
	if (turnCounter >= LEVEL_TWO_TURN) return 2;
	return 1;
}

function getMaxSamplesNum(turn) {
	return turn.panicLevel;
}

function getPanicLevel(turn) {
	if (turn.number >= PANIC_LEVEL_ONE_TURN) return 1;
	if (turn.number >= PANIC_LEVEL_TWO_TURN) return 2;
	return 3;
}

function getNextMolID(sample, avail, storage) {

	let cost = sample.updatedCost;

	if (avail.a > 0 && cost.a > storage.a) {
		return 'A';
	}

	if (avail.b > 0 && cost.b > storage.b) {
		return 'B';
	}

	if (avail.c > 0 && cost.c > storage.c) {
		return 'C';
	}

	if (avail.d > 0 && cost.d > storage.d) {
		return 'D';
	}

	if (avail.e > 0 && cost.e > storage.e) {
		return 'E';
	}

	return null;
}

function isSampleComplete(sample, turn) {
	let cost = sample.updatedCost;
	let storage = turn.me.storage;
	return storage.a >= cost.a && storage.b >= cost.b && storage.c >= cost.c && storage.d >= cost.d && storage.e >= cost.e;
}

function goTo(start, target) {
	printErr('goto', start, target);
	let ret = {};
	ret.action = 'GOTO ' + MODULES[target].ID;
	ret.state = target;
	ret.movingCounter = MODULES[start][target];
	return ret;
}

function setUpdatedSampleCost(expertise, samples) {
	for (let sample of samples) {
		if (sample.cost.total < 0) continue;
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
		player.expertise.total = player.expertise.a + player.expertise.b + player.expertise.c + player.expertise.d + player.expertise.e;

		if (i === 0) me = player;
		else op = player;
	}

	return { me, op };
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
				if (sample.cost.total >= 0) {
					sample.isDiagnosed = true;
				} else {
					sample.isDiagnosed = false;
				}
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
		let total = a + b + c + d + e;
		let isFinished = false;
		let dificulty = total + 10;
		projects.push({ a, b, c, d, e, total, isFinished, dificulty });
	}
	projects.sort((projectA, projectB) => projectA.dificulty - projectB.dificulty);
	return projects;
}


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