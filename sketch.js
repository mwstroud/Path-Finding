// Path finding algorithm basic first. 6 tiles: start, flag, hidden, searched,neighbor, wall

let cnv;
let cols;
let rows;
let resolution;
let bevel = 5;
let startRow,startCol,flagRow,flagCol;
// Variables for the simulation
let simulation = false;
let queue = [];
let path= [];
let endSearch = false;
let endPath = false;
let started = false;
let success = false;
let pause = true;
let bump = 0;
let pathfound = false;




// Variables for moving the flag and start
let startdragging = false;
let flagdragging = false;
let offsetX, offsetY;
let fX, fY, sX, sY;

// Variables for algorithm choice
let algorithm = 'bfs';
let bfs = document.getElementById("bfs")
let dfs = document.getElementById("dfs")
let dij = document.getElementById("dijkstra")
let a = document.getElementById("a*")





const radioButtons = document.querySelectorAll('input[name="alg"]');
for(const radioButton of radioButtons){
    radioButton.addEventListener('change', changeAlgorithm);
}

// Node Class and Nodes Object to store the nodes;
class myNode {
    constructor() {
        this.neighbors = [];
        this.parent = undefined;
        this.type = 'empty';
        this.dis;
    }
}

let Nodes = {};
let NodesIndex = [];

function preload(){ 
    // PNG by Freepik: "https://www.flaticon.com/free-icons/goal" title="goal icons">Goal icons created by Freepik - Flaticon
	flag = loadImage("flag.png");
    // https://pixlok.com/icons/star-icon-svg-rating-svg-icon-free-download/
    star = loadImage("star.svg");

    wall = loadImage("wall.png")
}

function setup() {
    if(windowWidth<800){
        cnv=createCanvas(windowWidth-40,windowHeight-190);
        cnv.position(20, 20);
    }else{
        cnv=createCanvas(windowWidth-40,windowHeight-130);
        cnv.position(20, 20);
    }

    for (let element of document.getElementsByClassName("p5Canvas")) {
        element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    //frameRate(10);
    resolution = Math.floor((height)/15)-(1/15)
    cols = width / resolution -1;
    rows = height / resolution -1;
    //randomStart();
    
    generateNodes()
    randomStart();
    
    
}

function draw() {
    let backR = 10, backG= 10 , backB=10;
    background(backR,backB,backG);
    stroke(backR,backB,backG);

    if(flagCol > cols || flagRow > rows){
        flagCol = 1;
        flagRow = 0;
        Nodes[`${flagRow},${flagCol}`].type = 'flag';
        addMe(flagRow,flagCol);
    }
    if(startCol > cols || startRow > rows){
        startCol = 0;
        startRow = 0;
        Nodes[`${startRow},${startCol}`].type = 'start';
        addMe(startRow,startCol);
    }

    if(bump!==0){
        bump=bump-2
    }
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            let x = j * resolution;
            let y = i * resolution;
            // Render the squares

            strokeWeight(1);
            if(Nodes[`${i},${j}`].type === 'empty') {           // hidden - open
                let r = 40, g = 40, b = 70;
                fill(r,g,b);
                rect(x,y,resolution,resolution,bevel); 
            } else if (Nodes[`${i},${j}`].type === 'start') {  // start
                let r = 50, g = 50, b = 20;
                fill(r,g,b);
                rect(x,y,resolution,resolution,bevel); 
                image(star, x+2.5, y+2.5, resolution-5, resolution-5);
            } else if (Nodes[`${i},${j}`].type === 'flag' || `${i},${j}` === `${flagRow},${flagCol}`) {  // flag
                let r = 50, g = 20, b = 20;
                fill(r,g,b);
                rect(x,y,resolution,resolution,bevel); 
                image(flag, x, y, resolution, resolution);
            } else if (Nodes[`${i},${j}`].type === 'visited') {  // searched
                if(algorithm ==='dijkstra'){
                    let maxdist = distanceToGoal(`${startRow},${startCol}`);
                    let dropoff = 0.1
                    let r = 45, g = 220 - (Nodes[`${i},${j}`].dis/maxdist *220), b = 45+ (Nodes[`${i},${j}`].dis/maxdist *210);
                    fill(r,g,b);
                    rect(x,y,resolution,resolution,bevel); 
                }else if(algorithm ==='greedy'){
                    let maxdist = distanceToGoal(`${startRow},${startCol}`);
                    let r = 45, g = 220 - (Nodes[`${i},${j}`].dis/maxdist *200), b = 45+ (Nodes[`${i},${j}`].dis/maxdist *200);
                    fill(r,g,b);
                    rect(x,y,resolution,resolution,bevel); 
                }else if(algorithm ==='a*'){
                    let maxdist = distanceToRoot(`${flagRow},${flagCol}`) + distanceToGoal(`${i},${j}`);
                    let r = 45, g = 35+  (Nodes[`${i},${j}`].dis/maxdist *220), b = 220 - (Nodes[`${i},${j}`].dis/maxdist *220);
                    fill(r,g,b);
                    rect(x,y,resolution,resolution,bevel); 
                }else{
                    let r = 20, g = 220, b = 20;
                    fill(r,g,b);
                    rect(x,y,resolution,resolution,bevel); 
                }
            } else if (Nodes[`${i},${j}`].type === 'wall') {  // wall
                let r = 20, g = 20, b = 20;
                fill(r,g,b);
                rect(x,y,resolution,resolution,bevel); 
                image(wall, x+2.5, y+2.5, resolution-5, resolution-5);
            } else if (Nodes[`${i},${j}`].type === 'neighbor') {  // wall
                let r = 40, g = 40, b = 70;
                stroke(255,255,255);
                fill(r,g,b);
                rect(x+1,y+1,resolution-2,resolution-2,bevel); 
                stroke(backR,backB,backG);
            }
            
            // Mouse interactions
            if ((mouseX > x) && (mouseX <= x+resolution) && (mouseY > y) && (mouseY <= y+resolution)){
                // Wall Drawing and Erasing
                if(Nodes[`${i},${j}`].type !== 'start' && Nodes[`${i},${j}`].type !== 'flag' && mouseIsPressed && !startdragging && !flagdragging){
                    if(mouseButton ===LEFT && Nodes[`${i},${j}`].type !== 'wall'){
                        //console.log("draw!");
                        Nodes[`${i},${j}`].type = 'wall'
                        bump=10;
                        removeMe(i,j);
                        wallCornerRemove(i,j);
                    } else if(mouseButton ===RIGHT && Nodes[`${i},${j}`].type !== 'visited' && Nodes[`${i},${j}`].type !== 'neighbor'){
                        //console.log("erase!");
                        Nodes[`${i},${j}`].type = 'empty'
                        addMe(i,j);
                    }
                }
            } 
        }   
    }
    
    // We need a separate for loop to render the dragged objects on top of the other tiles
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            let x = j * resolution;
            let y = i * resolution;
            if ((mouseX > x) && (mouseX <= x+resolution) && (mouseY > y) && (mouseY <= y+resolution)){
                if (startdragging){
                    let r = 50, g = 50, b = 20;
                    sX = mouseX- resolution/2;
                    sY = mouseY- resolution/2;
                    stroke(255,255,255);
                    fill(r,g,b);
                    rect(sX,sY,resolution+2,resolution+2,bevel); 
                    image(star, sX+2.5, sY+2.5, resolution-5, resolution-5);
                } else if(flagdragging){
                    let r = 50, g = 20, b = 20;
                    fX = mouseX- resolution/2;
                    fY = mouseY- resolution/2;
                    stroke(255,255,255);
                    fill(r,g,b);
                    rect(fX,fY,resolution+2,resolution+2,bevel); 
                    image(flag, fX, fY, resolution, resolution);
                }  else if (Nodes[`${i},${j}`].type === 'wall') {  // wall
                    let r = 20, g = 20, b = 20;
                    fill(r,g,b);
                    rect(x-(bump/2),y-(bump/2),resolution+bump,resolution+bump,bevel); 
                    image(wall, x+2.5-(bump/2), y+2.5-(bump/2), resolution-5+bump, resolution-5+bump);
                }
            }
        }
    }

    if(simulation == true){
        if (algorithm === 'bfs'){
            BFS();
        } else if (algorithm === 'dfs'){
            DFS();
        } else if(algorithm === 'dijkstra'){
            dijkstra(); 
        } else if(algorithm === 'greedy'){
            greedy(); 
        } else if(algorithm === 'a*'){
            astar();
        }
    }
    if (endSearch && success){
        drawPath();
    }
}

function windowResized() {
    if(windowWidth<800){
        resizeCanvas(windowWidth-40,windowHeight-190);
        cnv.position(20,20)
        generateNodes();
        restart();
        Nodes[`${flagRow},${flagCol}`].type = 'flag';
        Nodes[`${startRow},${startCol}`].type = 'start';
    }else{
        resizeCanvas(windowWidth-40,windowHeight-130);
        cnv.position(20,20)
        generateNodes();
        restart();
        Nodes[`${flagRow},${flagCol}`].type = 'flag';
        Nodes[`${startRow},${startCol}`].type = 'start';
    }
}

function make2DArray(rows, cols){
    let arr = new Array(rows);
    for (let i = 0; i< arr.length; i++){
        arr[i] = new Array(cols);
    }
    return arr
}

function generateNodes(){
    cols = width / resolution -1;
    rows = height / resolution -1;
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            Nodes[`${i},${j}`] = new myNode; 
                if(i-1>=0){               // add the Top Neighbor index to the neighbors list if it is not the top row and if the neighbor is not a wall
                    Nodes[`${i},${j}`].neighbors.push(`${i-1},${j}`)
                }
                if(i+1<rows){             // add the Bottom Neighbor index to the neighbors list if it is not the bottom row and if the neighbor is not a wall
                    Nodes[`${i},${j}`].neighbors.push(`${i+1},${j}`)
                }
                if(j+1<cols){             // add the Right Neighbor index to the neighbors list if it is not the right column and if the neighbor is not a wall
                    Nodes[`${i},${j}`].neighbors.push(`${i},${j+1}`)
                }
                if(j-1>=0){               // add the Left Neighbor index to the neighbors list if it is not the left column and if the neighbor is not a wall
                    Nodes[`${i},${j}`].neighbors.push(`${i},${j-1}`)
                }
                //Corners
                if(i+1<rows && j+1<cols){                    // Bottom Right
                    Nodes[`${i},${j}`].neighbors.push(`${i+1},${j+1}`)
                }
                if(j-1>=0 && i+1<rows){                      // Bottom Left
                    Nodes[`${i},${j}`].neighbors.push(`${i+1},${j-1}`)
                }
                if(j+1<cols && i-1>=0){        // Top Right
                    Nodes[`${i},${j}`].neighbors.push(`${i-1},${j+1}`)
                }
                if(i-1>=0 && j-1>=0){          // Top Left
                    Nodes[`${i},${j}`].neighbors.push(`${i-1},${j-1}`)
                }
                
                
        }
    }
}

function randomStart(){
    //console.log('Creating Nodes');
    let flagX = Math.floor(Math.random()*cols);
    let flagY = Math.floor(Math.random()*rows);
    let startX = Math.floor(Math.random()*cols);
    let startY = Math.floor(Math.random()*rows);
    while(flagX === startX && flagY === startY){
        startX = Math.floor(Math.random()*cols);
        startY = Math.floor(Math.random()*rows);
    }
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            if(j===startX && i===startY){  // randomly place the start
                Nodes[`${i},${j}`].type = 'start';
                startRow = i;
                startCol = j;
            }
            if(j===flagX && i===flagY){ // randomly place the flag
                Nodes[`${i},${j}`].type = 'flag';
                flagRow = i;
                flagCol = j;
            }
        }
    }
}

function plainStart(){
    //console.log('Creating Nodes');
    let flagX = Math.floor(cols-5);
    let flagY = Math.floor(rows/2);
    let startX = Math.floor(5);
    let startY = Math.floor(rows/2);
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            if(j===startX && i===startY){  // randomly place the start
                Nodes[`${i},${j}`].type = 'start';
                startRow = i;
                startCol = j;
            }
            if(j===flagX && i===flagY){ // randomly place the flag
                Nodes[`${i},${j}`].type = 'flag';
                flagRow = i;
                flagCol = j;
            }
        }
    }
}

function startSim(){
    
    //console.log("Start!");
    if(endSearch || !pause){
        restart();
    }
    simulation = true
}

function stopSim(){
    simulation = false;
    pause = true;
    //console.log("Stop!");
}

function restart(){
    stopSim();
    
    path = [];
    queue = [];
    pathfound = false;
    endSearch = false;
    started = false;
    endPath = false;
    success = false;
    for (let j = 0; j< rows; j++){
        for (let k = 0; k< cols; k++){
            //console.log(Nodes[`${j},${k}`])
            if(Nodes[`${j},${k}`].type === "visited" || Nodes[`${j},${k}`].type === "neighbor"){
                Nodes[`${j},${k}`].type = 'empty';
                if(`${j},${k}` === `${flagRow},${flagCol}`){
                    Nodes[`${j},${k}`].type = 'flag';
                }
                if(`${j},${k}` === `${startRow},${startCol}`){
                    Nodes[`${j},${k}`].type = 'start';
                }
            }
        }
    }
    if(algorithm === 'dijkstra' || algorithm === 'greedy' || algorithm === 'a*'){
        NodesIndex = [];
        initpriority();
    }
}

function clearWalls(){
    restart();
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            if(Nodes[`${i},${j}`].type === "wall"){
                Nodes[`${i},${j}`].type = 'empty';
            }
            addMe(i,j)
        }
    }
}

function mousePressed() {
    pressed();
}

function mouseReleased() {
    released();
}

function pressed(){
    let startx = startCol * resolution;
    let starty = startRow * resolution;
    let flagx = flagCol * resolution;
    let flagy = flagRow * resolution;
    if ((mouseX > startx) && (mouseX < startx+resolution) && (mouseY > starty) && (mouseY < starty+resolution)){
        //console.log('start dragging')
        startdragging = true;
    } else if((mouseX > flagx) && (mouseX < flagx+resolution) && (mouseY > flagy) && (mouseY < flagy+resolution)){
        //console.log('start dragging')
        flagdragging = true;
    }
}

function released(){
    if(mouseX > 20 && mouseX <width+20 && mouseY>20 && mouseY <height+20){
        //console.log('released');
        if(startdragging){
            startdragging = false;
            for (let i = 0; i< rows; i++){
                for (let j = 0; j< cols; j++){
                    let x = j * resolution;
                    let y = i * resolution;
                    if ((mouseX > x) && (mouseX <= x+resolution) && (mouseY > y) && (mouseY <= y+resolution)){
                        Nodes[`${startRow},${startCol}`].type = 'empty';
                        Nodes[`${i},${j}`].type = 'start';
                        addMe(i,j);
                        startRow = i;
                        startCol = j;
                        if(startRow === flagRow && startCol ===flagCol){
                            if(startRow >0){
                                flagRow = startRow-1;
                                Nodes[`${flagRow},${flagCol}`].type = 'flag';
                                addMe(flagRow,flagCol);
                            } else if(startCol >0){
                                flagCol = startCol-1;
                                Nodes[`${flagRow},${flagCol}`].type = 'flag';
                                addMe(flagRow,flagCol);
                            }else if(startRow <rows){
                                flagRow = startRow+1;
                                Nodes[`${flagRow},${flagCol}`].type = 'flag';
                                addMe(flagRow,flagCol);
                            }else if(startCol <cols){
                                flagCol = startCol+1;
                                Nodes[`${flagRow},${flagCol}`].type = 'flag';
                                addMe(flagRow,flagCol);
                            }
                        }
                        restart()
                    }
                }
            }
        } else if(flagdragging){
            flagdragging = false;
            for (let i = 0; i< rows; i++){
                for (let j = 0; j< cols; j++){
                    let x = j * resolution;
                    let y = i * resolution;
                    if ((mouseX > x) && (mouseX <= x+resolution) && (mouseY > y) && (mouseY <= y+resolution)){
                        Nodes[`${flagRow},${flagCol}`].type = 'empty';
                        Nodes[`${i},${j}`].type = 'flag';
                        addMe(i,j);
                        flagRow = i;
                        flagCol = j;
                        if(startRow === flagRow && startCol ===flagCol){
                            if(flagRow >0){
                                startRow = flagRow-1;
                                Nodes[`${startRow},${startCol}`].type = 'start';
                                addMe(startRow,startCol);
                            } else if(flagCol >0){
                                startCol = flagCol-1;
                                Nodes[`${startRow},${startCol}`].type = 'start';
                                addMe(startRow,startCol);
                            }else if(flagRow <rows){
                                startRow = flagRow+1;
                                Nodes[`${startRow},${startCol}`].type = 'start';
                                addMe(startRow,startCol);
                            }else if(flagCol <cols){
                                startCol = flagCol+1;
                                Nodes[`${startRow},${startCol}`].type = 'start';
                                addMe(startRow,startCol);
                            }
                        }
                        restart()
                        //addNeighbor(i,j);
                    }
                }
            }
        }
    }
}




function getPath(node){
    if(!endPath){
        path.push(node)
        if(Nodes[node].parent === `${startRow},${startCol}`){
            endPath = true;
            return 1;
        }
        getPath(Nodes[node].parent);
    }   
}

function drawPath(){
    //if(algorithm === 'bfs' || algorithm === 'dfs'){
    if(!pathfound){
        getPath(`${flagRow},${flagCol}`);
        if (!path.includes(`${startRow},${startCol}`)){
            path.push(`${startRow},${startCol}`)
        }
        pathfound = true;
        //console.log(path);
    }
    
    
    //}
    if(!ispathBlocked()){
        for(let i = 0;i<path.length-1;i++){
            let firstIn = path[i].split(",").map(Number);
            let secondIn = path[i+1].split(",").map(Number);
            let y1 = firstIn[0] * resolution+ (resolution/2);
            let x1 = firstIn[1] * resolution+ (resolution/2);
            let y2 = secondIn[0] * resolution+ (resolution/2);
            let x2 = secondIn[1] * resolution+ (resolution/2);
            strokeWeight(5);
            stroke(240,220,20);
            line(x1,y1,x2,y2);
        }
    } else{
        restart()
    }
}

function ispathBlocked(){
    
    for(let p = 0;p<path.length;p++){
        
        if(Nodes[path[p]].type === 'wall'){
            return true;
        }
        let pathindex = path[p].split(",").map(Number)
        let i = pathindex[0];
        let j = pathindex[1];
        
        
        

        if(path.includes(`${i-1},${j-1}`)){          // Top Left
            if(iswall(`${i-1},${j}`) && iswall(`${i},${j-1}`)){ 
                return true;
            }
        }
        if(path.includes(`${i-1},${j+1}`)){        // Top Right
            if(iswall(`${i-1},${j}`) && iswall(`${i},${j+1}`)){
                return true;
            }
        }
        if(path.includes(`${i+1},${j+1}`)){     // Bottom Right
            if(iswall(`${i+1},${j}`) && iswall(`${i},${j+1}`)){
                return true;
            }
        }
        if(path.includes(`${i+1},${j-1}`)){   // Bottom Left
            if(iswall(`${i+1},${j}`) && iswall(`${i},${j-1}`)){
                return true;
            }
        }
    }
}


function addMe(i,j){
    if(i-1>=0 && !Nodes[`${i-1},${j}`].neighbors.includes(`${i},${j}`)){   
        //console.log(`${i-1},${j} adds ${i},${j}`);           
        Nodes[`${i-1},${j}`].neighbors.push(`${i},${j}`)
        addNeighbors(i-1,j);
    }
    if(j+1<cols && !Nodes[`${i},${j+1}`].neighbors.includes(`${i},${j}`)){            
        //console.log(`${i},${j+1} adds ${i},${j}`); 
        Nodes[`${i},${j+1}`].neighbors.push(`${i},${j}`)
        addNeighbors(i,j+1);
    }
    if(i+1<rows && !Nodes[`${i+1},${j}`].neighbors.includes(`${i},${j}`)){            
        //console.log(`${i+1},${j} adds ${i},${j}`); 
        Nodes[`${i+1},${j}`].neighbors.push(`${i},${j}`)
        addNeighbors(i+1,j);
    }
    if(j-1>=0 && !Nodes[`${i},${j-1}`].neighbors.includes(`${i},${j}`)){               
        //console.log(`${i},${j-1} adds ${i},${j}`); 
        Nodes[`${i},${j-1}`].neighbors.push(`${i},${j}`)
        addNeighbors(i,j-1);
    }
    // Corners
    if(i-1>=0 && j-1>=0  && !Nodes[`${i-1},${j-1}`].neighbors.includes(`${i},${j}`)){          // Top Left
        if(!(iswall(`${i-1},${j}`) && iswall(`${i},${j-1}`))){                                   // Using the ternary operator representation of XOR
            //console.log(`${i-1},${j-1} adds ${i},${j}`); 
            Nodes[`${i-1},${j-1}`].neighbors.push(`${i},${j}`)
            addNeighbors(i-1,j-1);
        }
    }
    if(j+1<cols && i-1>=0 &&  !Nodes[`${i-1},${j+1}`].neighbors.includes(`${i},${j}`)){        // Top Right
        if(!(iswall(`${i-1},${j}`) && iswall(`${i},${j+1}`))){
            //console.log(`${i-1},${j+1} adds ${i},${j}`); 
            Nodes[`${i-1},${j+1}`].neighbors.push(`${i},${j}`)
            addNeighbors(i-1,j+1);
        }
    }
    if(i+1<rows && j+1<cols  && !Nodes[`${i+1},${j+1}`].neighbors.includes(`${i},${j}`)){                    // Bottom Right
        if(!(iswall(`${i+1},${j}`) && iswall(`${i},${j+1}`))){
            //console.log(`${i+1},${j+1} adds ${i},${j}`); 
            Nodes[`${i+1},${j+1}`].neighbors.push(`${i},${j}`)
            addNeighbors(i+1,j+1);
        }
    }
    if(j-1>=0 && i+1<rows  && !Nodes[`${i+1},${j-1}`].neighbors.includes(`${i},${j}`)){                      // Bottom Left
        if(!(iswall(`${i+1},${j}`) && iswall(`${i},${j-1}`))){
            //console.log(`${i+1},${j-1} adds ${i},${j}`); 
            Nodes[`${i+1},${j-1}`].neighbors.push(`${i},${j}`)
            addNeighbors(i+1,j-1);
        }
    }
}

function addNeighbors(i,j){
    if(i-1>=0 && !iswall(`${i-1},${j}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i-1},${j}`)){          // Top 
        //console.log(`${i},${j} adds ${i-1},${j} Extra`);
        Nodes[`${i},${j}`].neighbors.push(`${i-1},${j}`)
    }
    if(j+1<cols && !iswall(`${i},${j+1}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i},${j+1}`)){        // Right 
        //console.log(`${i},${j} adds ${i},${j+1} Extra`);
        Nodes[`${i},${j}`].neighbors.push(`${i},${j+1}`)
    }
    if(i+1<rows && !iswall(`${i+1},${j}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i+1},${j}`)){        // Bottom 
        //console.log(`${i},${j} adds ${i+1},${j} Extra`);
        Nodes[`${i},${j}`].neighbors.push(`${i+1},${j}`)
    }
    if(j-1>=0 && !iswall(`${i},${j-1}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i},${j-1}`)){          // Left 
        //console.log(`${i},${j} adds ${i},${j-1} Extra`);
        Nodes[`${i},${j}`].neighbors.push(`${i},${j-1}`)
    }
    // Corners
    if(i-1>=0 && j-1>=0 && !iswall(`${i-1},${j-1}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i-1},${j-1}`)){          // Top Left
        if(!(iswall(`${i-1},${j}`) && iswall(`${i},${j-1}`))){
            //console.log(`${i},${j} adds ${i-1},${j-1} Extra`);
            Nodes[`${i},${j}`].neighbors.push(`${i-1},${j-1}`)
        }
    }
    if(j+1<cols && i-1>=0 && !iswall(`${i-1},${j+1}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i-1},${j+1}`)){        // Top Right
        if(!(iswall(`${i-1},${j}`) && iswall(`${i},${j+1}`))){
            //console.log(`${i},${j} adds ${i-1},${j+1} Extra`);
            Nodes[`${i},${j}`].neighbors.push(`${i-1},${j+1}`)
        }
    }
    if(i+1<rows && j+1<cols && !iswall(`${i+1},${j+1}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i+1},${j+1}`)){                    // Bottom Right
        if(!(iswall(`${i+1},${j}`) && iswall(`${i},${j+1}`))){
            //console.log(`${i},${j} adds ${i+1},${j+1} Extra`);
            Nodes[`${i},${j}`].neighbors.push(`${i+1},${j+1}`)
        }
    }
    if(j-1>=0 && i+1<rows && !iswall(`${i+1},${j-1}`) && !Nodes[`${i},${j}`].neighbors.includes(`${i+1},${j-1}`)){                      // Bottom Left
        if(!(iswall(`${i+1},${j}`) && iswall(`${i},${j-1}`))){
            //console.log(`${i},${j} adds ${i+1},${j-1} Extra`);
            Nodes[`${i},${j}`].neighbors.push(`${i+1},${j-1}`)
        }
    }
}

function removeMe(i,j){
    if(i-1>=0){               //Top Row
        Nodes[`${i-1},${j}`].neighbors = Nodes[`${i-1},${j}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    if(j+1<cols){             //Right Column
        Nodes[`${i},${j+1}`].neighbors = Nodes[`${i},${j+1}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    if(i+1<rows){             //Bottom Row
        Nodes[`${i+1},${j}`].neighbors = Nodes[`${i+1},${j}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    if(j-1>=0){               //Left Column
        Nodes[`${i},${j-1}`].neighbors = Nodes[`${i},${j-1}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    // Corners
    if(i-1>=0 && j-1>=0){          // Top Left
        Nodes[`${i-1},${j-1}`].neighbors = Nodes[`${i-1},${j-1}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    if(j+1<cols && i-1>=0){        // Top Right
        Nodes[`${i-1},${j+1}`].neighbors = Nodes[`${i-1},${j+1}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    if(i+1<rows && j+1<cols){                    // Bottom Right
        Nodes[`${i+1},${j+1}`].neighbors = Nodes[`${i+1},${j+1}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
    if(j-1>=0 && i+1<rows){                      // Bottom Left
        Nodes[`${i+1},${j-1}`].neighbors = Nodes[`${i+1},${j-1}`].neighbors.filter(function(item){return item !== `${i},${j}`})
    }
}

function removeNeighbors(i,j){
    if(i-1>=0){               //Top Row
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i-1},${j}`})
    }
    if(j+1<cols){             //Right Column
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i},${j+1}`})
    }
    if(i+1<rows){             //Bottom Row
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i+1},${j}`})
    }
    if(j-1>=0){               //Left Column
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i},${j-1}`})
    }
    // Corners
    if(i-1>=0 && j-1>=0){          // Top Left
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i-1},${j-1}`})
    }
    if(j+1<cols && i-1>=0){        // Top Right
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i-1},${j+1}`})
    }
    if(i+1<rows && j+1<cols){                    // Bottom Right
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i+1},${j+1}`})
    }
    if(j-1>=0 && i+1<rows){                      // Bottom Left
        Nodes[`${i},${j}`].neighbors = Nodes[`${i},${j}`].neighbors.filter(function(item){return item !== `${i+1},${j-1}`})
    }
}

function wallCornerRemove(i,j){
    if(i-1>=0 && j-1>=0){          // Top Left
        if(iswall(`${i-1},${j-1}`)){
            Nodes[`${i-1},${j}`].neighbors = Nodes[`${i-1},${j}`].neighbors.filter(function(item){return item !== `${i},${j-1}`})
            Nodes[`${i},${j-1}`].neighbors = Nodes[`${i},${j-1}`].neighbors.filter(function(item){return item !== `${i-1},${j}`})
        }
    }
    if(j+1<cols && i-1>=0){        // Top Right
        if(iswall(`${i-1},${j+1}`)){
            Nodes[`${i-1},${j}`].neighbors = Nodes[`${i-1},${j}`].neighbors.filter(function(item){return item !== `${i},${j+1}`})
            Nodes[`${i},${j+1}`].neighbors = Nodes[`${i},${j+1}`].neighbors.filter(function(item){return item !== `${i-1},${j}`})
        }
    }
    if(i+1<rows && j+1<cols){                    // Bottom Right
        if(iswall(`${i+1},${j+1}`)){
            Nodes[`${i+1},${j}`].neighbors = Nodes[`${i+1},${j}`].neighbors.filter(function(item){return item !== `${i},${j+1}`})
            Nodes[`${i},${j+1}`].neighbors = Nodes[`${i},${j+1}`].neighbors.filter(function(item){return item !== `${i+1},${j}`})
        }
    }
    if(j-1>=0 && i+1<rows){                      // Bottom Left
        if(iswall(`${i+1},${j-1}`)){
            Nodes[`${i+1},${j}`].neighbors = Nodes[`${i+1},${j}`].neighbors.filter(function(item){return item !== `${i},${j-1}`})
            Nodes[`${i},${j-1}`].neighbors = Nodes[`${i},${j-1}`].neighbors.filter(function(item){return item !== `${i+1},${j}`})
        }
    }
}

function wallCornerAdd(i,j){
    if(i-1>=0 && j-1>=0){          // Top Left
        if(iswall(`${i-1},${j-1}`)){
            Nodes[`${i-1},${j}`].neighbors.push(`${i},${j-1}`)
            Nodes[`${i},${j-1}`].neighbors.push(`${i-1},${j}`)
        }
    }
    if(j+1<cols && i-1>=0){        // Top Right
        if(iswall(`${i-1},${j+1}`)){
            Nodes[`${i-1},${j}`].neighbors.push(`${i},${j+1}`)
            Nodes[`${i},${j+1}`].neighbors.push(`${i-1},${j}`)
        }
    }
    if(i+1<rows && j+1<cols){                    // Bottom Right
        if(iswall(`${i+1},${j+1}`)){
            Nodes[`${i+1},${j}`].neighbors.push(`${i},${j+1}`)
            Nodes[`${i},${j+1}`].neighbors.push(`${i+1},${j}`)
        }
    }
    if(j-1>=0 && i+1<rows){                      // Bottom Left
        if(iswall(`${i+1},${j-1}`)){
            Nodes[`${i+1},${j}`].neighbors.push(`${i},${j-1}`)
            Nodes[`${i},${j-1}`].neighbors.push(`${i+1},${j}`)
        }
    }
}

function iswall(node){
    if(Nodes[node].type === 'wall'){
        return true
    }
    return false
}
function bfson(){
    algorithm='bfs';
    restart();
    //console.log(algorithm);
}

function dfson(){
    algorithm='dfs';
    restart();
    //console.log(algorithm);
}

function dijon(){
    algorithm='dijkstra';
    restart();
    //console.log(algorithm);
}

function greedon(){
    algorithm='greedy';
    restart();
    //console.log(algorithm);
}

function aon(){
    algorithm='a*';
    restart();
    //console.log(algorithm);
}

function BFS(){
    if(!endSearch){
        if(!started){
            queue.push(`${startRow},${startCol}`);
            started = true;
        }
        if(queue.length !==0 ){
            let node = queue.shift()
            if(Nodes[node].type!=='visited'){
                Nodes[node].type='visited';
                if(node===`${startRow},${startCol}`){
                    Nodes[node].type='start';
                }
            }
            for(let i =0;i< Nodes[node].neighbors.length;i++){
                let neighbor = Nodes[node].neighbors[i];
                if(Nodes[neighbor].type !== 'visited' && Nodes[neighbor].type !== 'start' && Nodes[neighbor].type !== 'neighbor'){
                    Nodes[neighbor].parent = node;
                    Nodes[neighbor].type = 'neighbor';
                    if(neighbor === `${flagRow},${flagCol}`){
                        Nodes[neighbor].type = 'flag';
                    }
                    if(neighbor === `${flagRow},${flagCol}`){
                        endSearch = true;
                        success = true;
                        return
                    }else{
                        queue.push(neighbor);
                    }  
                }
            }
        } else{
            endSearch = true;
            return
        }
    }
}

function DFS(){
    if(!endSearch){
        if(!started){
            queue.push(`${startRow},${startCol}`);
            started = true;
        }
        if(queue.length !==0 ){
            let node = queue.pop()
            if(node === `${flagRow},${flagCol}`){
                endSearch = true;
                success = true;
                return
            } 
            if(Nodes[node].type!=='visited'){
                Nodes[node].type='visited';
                if(node===`${startRow},${startCol}`){
                    Nodes[node].type='start';
                }
            }
            for(let i =0;i< Nodes[node].neighbors.length;i++){
                let neighbor = Nodes[node].neighbors[i];
                if(Nodes[neighbor].type !== 'visited' && Nodes[neighbor].type !== 'start'&& Nodes[neighbor].type !== 'neighbor'){
                    Nodes[neighbor].parent = node;
                    Nodes[neighbor].type = 'neighbor'
                    queue.push(neighbor);
                }
            }
        } else{
            endSearch = true;
            return
        }
    }
}

function dijkstra(){
    if(NodesIndex.length !== 0 && !endSearch){
        let node = NodesIndex.shift()[0];
        //console.log(Nodes[node].neighbors)
        if(node === `${flagRow},${flagCol}`){
            endSearch = true;
            success = true;
            return
        } else if(Nodes[node].type === 'wall'|| Nodes[node].dis===100000){
            endSearch = true;
            success = false;
            return
        }
        if(Nodes[node].type!=='visited'){
            Nodes[node].type='visited';
            if(node===`${startRow},${startCol}`){
                Nodes[node].type='start';
            }
        }
        for(let i =0;i< Nodes[node].neighbors.length;i++){
            let neighbor = Nodes[node].neighbors[i];
            if(Nodes[neighbor].type !== 'visited' && Nodes[neighbor].type !== 'start' && Nodes[neighbor].type !== 'neighbor'){
                Nodes[neighbor].dis = pathdistance(node,neighbor) 
                Nodes[neighbor].type = 'neighbor';
                Nodes[neighbor].parent = node; 
            }
            let temp = Nodes[neighbor].dis + Nodes[node].dis;
            if(temp < Nodes[neighbor].dis){
                Nodes[neighbor].dis = temp; 
                 
            }
        }
        NodesIndex.sort(compare); 
    }
    else{
        endSearch = true;
        return
    }
}

function greedy(){
    if(NodesIndex.length !== 0 && !endSearch){
        let node = NodesIndex.shift()[0];
        if(node === `${flagRow},${flagCol}`){
            endSearch = true;
            success = true;
            return
        } else if(Nodes[node].type === 'wall'|| Nodes[node].dis===100000){
            endSearch = true;
            success = false;
            return
        }
        if(Nodes[node].type!=='visited'){
            Nodes[node].type='visited';
            if(node===`${startRow},${startCol}`){
                Nodes[node].type='start';
            }
        }
        for(let i =0;i< Nodes[node].neighbors.length;i++){
            let neighbor = Nodes[node].neighbors[i];
            if(Nodes[neighbor].type !== 'visited' && Nodes[neighbor].type !== 'start' && Nodes[neighbor].type !== 'neighbor'){
                Nodes[neighbor].dis = distanceToGoal(neighbor) 
                Nodes[neighbor].type = 'neighbor';
                Nodes[neighbor].parent = node; 
            }
            let temp = Nodes[neighbor].dis + Nodes[node].dis;
            if(temp < Nodes[neighbor].dis){
                Nodes[neighbor].dis = temp; 
                 
            }
        }
        NodesIndex.sort(compare); 
    }
    else{
        endSearch = true;
        return
    }
}

function astar(){
    if(NodesIndex.length !== 0 && !endSearch){
        let node = NodesIndex.shift()[0];
        if(node === `${flagRow},${flagCol}`){
            endSearch = true;
            success = true;
            return
        } else if(Nodes[node].type === 'wall'|| Nodes[node].dis===100000){
            endSearch = true;
            success = false;
            return
        }
        if(Nodes[node].type!=='visited'){
            Nodes[node].type='visited';
            if(node===`${startRow},${startCol}`){
                Nodes[node].type='start';
            }
        }
        for(let i =0;i< Nodes[node].neighbors.length;i++){
            let neighbor = Nodes[node].neighbors[i];
            
            if(Nodes[neighbor].type !== 'visited' && Nodes[neighbor].type !== 'start' && Nodes[neighbor].type !== 'neighbor'){
                Nodes[neighbor].dis = pathdistance(node,neighbor) 
                Nodes[neighbor].type = 'neighbor';
                Nodes[neighbor].parent = node; 
            }
            
            let temp =  distanceToRoot(node) + distancebetween(node,neighbor) +  distanceToGoal(neighbor)
            if(temp<Nodes[neighbor].dis){
                Nodes[neighbor].dis = temp; 
            }
        }
        NodesIndex.sort(compare); 
    }
    else{
        endSearch = true;
        return
    }
}

function distanceToGoal(node){
    let currentindex = node.split(",")
    return Math.sqrt(Math.pow(currentindex[0]-flagRow,2)+Math.pow(currentindex[1]-flagCol,2))
}

function distanceToRoot(node){
    let currentindex = node.split(",")
    return Math.sqrt(Math.pow(currentindex[0]-startRow,2)+Math.pow(currentindex[1]-startCol,2))
}

function distancebetween(current,neighbor){
    let currentindex = current.split(",")
    let neighborindex = neighbor.split(",")
    return Math.sqrt(Math.pow(currentindex[0]-(neighborindex[0]),2)+Math.pow(currentindex[1]-(neighborindex[1]),2))
}

function pathdistance(current,neighbor){
    let currentindex = current.split(",")
    let neighborindex = neighbor.split(",")
    return Math.sqrt(Math.pow(currentindex[0]-(neighborindex[0]),2)+Math.pow(currentindex[1]-(neighborindex[1]),2)) + Nodes[current].dis
}

function assignDistance(){
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            Nodes[`${i},${j}`].dis = 100000;
        }
    }
}

function initpriority(){
    assignDistance();
    if (algorithm === 'dijkstra'){
        Nodes[`${startRow},${startCol}`].dis = 0
    } else if (algorithm === 'greedy' || algorithm === 'a*'){
        Nodes[`${startRow},${startCol}`].dis = distanceToGoal(`${startRow},${startCol}`)
    }
    for (let i = 0; i< rows; i++){
        for (let j = 0; j< cols; j++){
            NodesIndex.push([`${i},${j}`,Nodes[`${i},${j}`]])
        }
    }
    NodesIndex.sort(compare)
    //console.log(NodesIndex);
}

function compare( a, b ) {
    if ( a[1].dis > b[1].dis ){
      return 1;
    }
    if ( a[1].dis < b[1].dis ){
      return -1;
    }
    return 0;
}

