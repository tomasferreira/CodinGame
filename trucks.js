/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var boxCount = parseInt(readline());
var trucks = new Array(100);
for (let i = 0; i < trucks.length; i++) {
    trucks[i] = {
        load: 0,
        volume: 0
    };
}

var boxes = [];
var totalWeight = 0;
var totalVolume = 0
for (var i = 0; i < boxCount; i++) {
    var inputs = readline().split(' ');
    var weight = parseFloat(inputs[0]);
    var volume = parseFloat(inputs[1]);
    
    boxes.push({
        id: i,
        weight,
        volume,
        target: -1
    });
    
    totalWeight+= weight;
    totalVolume += volume;
}

boxes.sort((a, b) => {
    return a.volume < b.volume;
});

printErr(JSON.stringify(boxes));

var avgWeight = totalWeight / 100;
//var avgVol = totalVolume / 100;
var avgBuf = avgWeight * 2;

var output = '';


boxes.forEach(box => {
    // printErr('loading box ' + box.id + ' with weight ' + box.weight);
    for(let i = 0; i < trucks.length; i++){
        // printErr('checking truck ' + i + ' with load ' + trucks[i].load + ' | count: ' + trucks[i].boxCount);
        if(trucks[i].load + box.weight < avgBuf && trucks[i].volume + box.volume < 100) {
            box.target = i;
            trucks[i].load += box.weight;
            trucks[i].volume += box.volume;
            
            //printErr(i + ': load: ' + trucks[i]);
            break;
        }
    }
    
    //output += box.target + ' ';
});

boxes.sort((a, b) => {
    return a.id > b.id;
});

boxes.forEach(box => {
    output += box.target + ' ';
});

// printErr(JSON.stringify(boxes));
// printErr(JSON.stringify(trucks[0]));



// Write an action using print()
// To debug: printErr('Debug messages...');

print(output);