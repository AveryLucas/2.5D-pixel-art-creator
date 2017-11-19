var canvas = document.getElementById('canvas');
// canvas.addEventListener( "keydown", doKeyDown, true);
c = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 640;

width = canvas.width;
// height = canvas.height;
gridSize = 32;
height = canvas.height - Math.round(canvas.height/gridSize);
pixelSize = width/gridSize;

followMouse = false;
slowchange = 0.25;
eraser = false;
mousedown = false;
movelayer = false;

var drawnBlocks = [];
var layers = [[], new Layer()];
var processedLayers = [[]];
var currentLayer = 1;
var currentLayerData = [];

function Block(xPos, yPos, color) {
    this.x = xPos;
    this.y = yPos;
    this.color = color;
    return this;
}

function Layer(){
    this.blocks = [];
    return this;
}

function ProcessedLayer(img){
    this.offset = 0;
    this.rotate = true;
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.img = img;
    return this;
}

function Drawer(){
    //rotation settings
    this.rotationTargetY = 0;
    this.rawLayers = [[]];
    return this;
}

Drawer.prototype.drawLayer = function(index){
    layer = layers[index];
    for(var j = 0; j < layer.blocks.length; j++){

        //Save current context settings.
        c.save();
        
        //Settings
        c.fillStyle = layer.blocks[j].color;

        //Make sure block is dimmed if dim other layers mode is on.
        if(index != currentLayer && !followMouse){
            if(abs(currentLayer - index) > 2){
                c.globalAlpha=0.25;
            }else{
                c.globalAlpha=0.50;
            }

            if(index < currentLayer){
                c.fillStyle = "#c3ff96";
            }
        }

        //Draw the block
        c.fillRect(layer.blocks[j].x, layer.blocks[j].y, pixelSize, pixelSize);

        //Reset settings back to before drawing this block.
        c.restore();
    }
}

Drawer.prototype.drawAllLayers = function(){
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    for(var i = 1; i < layers.length; i++){
        this.drawLayer(i);
    }
    
    drawgrid();
    c.fillStyle = $("#currentcolor").attr('value');
}

Drawer.prototype.processLayers = function(){
    processedLayers = [[]];
    for(var i = 1; i < layers.length; i++){
        c.clearRect(0, 0, width, height);
        this.drawLayer(i);
        processedLayers.push(new ProcessedLayer(convertCanvasToImage(canvas)));
    }

    followMouse = true;
}

Drawer.prototype.drawProcessedLayers = function(){
    c.clearRect(0, 0, width, height);
    for(var i = 1; i < processedLayers.length; i++){
        c.save();
        
        c.translate(width/2, height/2);
        c.rotate(processedLayers[i].rotation);
        c.drawImage(processedLayers[i].img, processedLayers[i].x-width/2, processedLayers[i].y-height/2);
        
        c.restore();
    }
}

Drawer.prototype.setBlockAtMouse = function(e){
    var mousePos = getMousePos(canvas, e);
    var mouseX = mousePos.x;
    var mouseY = mousePos.y;
    
    var xPos = Math.floor(mouseX / (width/ gridSize ));
    var yPos = Math.floor(mouseY / (height/ gridSize ));

    var xPosAfterCalc = (pixelSize * xPos) - (pixelSize/2);
    var yPosAfterCalc = (pixelSize * yPos) - (pixelSize/2);

    var x = xPosAfterCalc;
    var y = yPosAfterCalc;

    // console.log(mousePos); 

    //If there is no block here and we arnt erasing, place a block here
    if(getBlockHere(x, y) == null && !eraser){
        layers[currentLayer].blocks.push(new Block(x, y, $("#currentcolor").attr('value')));
        console.log("here");
    }
    //If there is a block here but we are NOT erasing, remove the block thats there and place new one.
    else if(getBlockHere(x, y) == null && !eraser){
        layers[currentLayer].blocks.splice(getBlockHere(x, y), 1);
        layers[currentLayer].blocks.push(new Block(x, y, $("#currentcolor").attr('value')));
    }
    //If there is a block here and we are erasing, erase this block only.
    else if(getBlockHere(x, y) != null && eraser){
        if(eraser){
            layers[currentLayer].blocks.splice(getBlockHere(x, y), 1);
            // this.rawLayers[currentLayer].blocks()
        }
    }
    drawer.drawAllLayers();    
}

var drawer = new Drawer();

drawgrid();

function drawgrid(){
    c.strokeStyle = "lightgrey";
    
    c.moveTo(width/2, 0);
    c.lineTo(width/2, height);
    c.stroke();

    c.moveTo(0, height/2);
    c.lineTo(width, height/2);
    c.stroke();
}

//check array for block at specific coordinates.
function getBlockHere(x, y){
    for(var i = 0; i < layers[currentLayer].blocks.length; i++){
        if(layers[currentLayer].blocks[i].x == x && layers[currentLayer].blocks[i].y == y){
            return i;
        }
    }
    return null;
}

$('#canvas').mousedown(function(e){
    // Mouse down location
    mousedown = true;
    drawer.setBlockAtMouse(e);
});

$('#canvas').mouseup(function(e){
    mousedown = false;
});

canvas.addEventListener('mousemove', function(e) {
    // Storing Mousepos here for easy access.
    var mousePos = getMousePos(canvas, e);
    var invertedMouseY = height - mousePos.y;
    
    // Turns mouse position into a position on grid
    var xPos = Math.floor(mousePos.x / (width/ gridSize ));
    var yPos = Math.floor(mousePos.y / (height/ gridSize ));

    // Accounts for pixelsize when drawing and gets the real x, y from (8, 32) to (34, 345) *math is not real there*
    var xPosAfterCalc = (pixelSize * xPos) - (pixelSize/2);
    var yPosAfterCalc = (pixelSize * yPos) - (pixelSize/2);


    if(mousedown){
        mousedown = true;
        drawer.setBlockAtMouse(e);
    }

    if(followMouse){
        // Variables
        var centerX = width/2;
        var centerY = height/2;
        var offsetX = mousePos.x - centerX;
        var offsetY = mousePos.y - centerY;

        if(offsetX < 0){
            temp = drawer.rotationTargetY;
            drawer.rotationTargetY = easeTo(drawer.rotationTargetY, invertedMouseY, 25);
            console.log(temp, drawer.rotationTargetY);
        }else{
            drawer.rotationTargetY = easeTo(drawer.rotationTargetY, mousePos.y + (Math.sign(mousePos.y) + 20), 35);
        }
        

        for(var i = 1; i < processedLayers.length; i++){
            
            // Determining angle to rotate at to face mouse.
            // NEED TO FIX -OFFSET X LOGIC
            // rotation when offset x is negative is atleast two times greater then the alternative and at most.. well alot greater.
            var targetX  = mousePos.x + width/2;
            var targetY  = drawer.rotationTargetY - height/2;
            var rotation = Math.atan2(targetY, targetX);

            // I Cant figure out how to fix the rotation when mouse is on left side of center.
            // Work around is to set a max rotation when this happens.
            if(offsetX < 0){
                if(rotation > 0.4){
                    rotation = 0.4;
                }

                if (rotation < -0.4){
                    rotation = -0.4;
                }
            }

            // Updating position and rotation based on mouse.
            processedLayers[i].rotation = rotation;
            processedLayers[i].x = 0 - (offsetX * (processedLayers[i].offset * (slowchange)));
            processedLayers[i].y = 0 - (offsetY * (processedLayers[i].offset * (slowchange)));
        }
        drawer.drawProcessedLayers();

        // c.fillRect(mouseX, invertedMouseY, 20, 20);
    }
}, false);


//Keyboard Commands
document.onkeydown = function(event){

    // ENTER PRESS
    if(event.keyCode == 13) {
        if(followMouse){
            followMouse = false;
            drawer.drawAllLayers();
        }else{
            console.log("processing layers");
            drawer.processLayers();
        }
    }

    // UP ARROW
    if(event.keyCode == 38){
        if(!movelayer){
            if(layers[currentLayer].blocks.length != 0){
                layers.push(new Layer());
                currentLayer += 1;
            }
        } else {
            if(layers[currentLayer + 1] != null){
                layers.swap(currentLayer, currentLayer + 1);
                currentLayer += 1;
            }
        }

        if(!followMouse){
            drawer.drawAllLayers();
        }
    }

    // DOWN ARROW
    if(event.keyCode == 40){
        if(!movelayer){
            if(currentLayer != 1){
                //Remove layer if there is nothing on it.
                if(layers[currentLayer ].blocks.length == 0){
                    layers.splice(currentLayer, 1);
                }
                currentLayer -= 1;
            }
        } else {
            if(currentLayer != 1){
                layers.swap(currentLayer, currentLayer - 1);
                currentLayer-= 1;
            }
        }

        if(!followMouse){
            drawer.drawAllLayers();
        }
    }

    // RIGHT ARROW
    if(event.keyCode == 39){
        fixedOffset = (processedLayers[currentLayer].offset + slowchange).toFixed(2);
        processedLayers[currentLayer].offset = parseFloat(fixedOffset);
    }

    // LEFT ARROW
    if(event.keyCode == 37){
        fixedOffset = (processedLayers[currentLayer].offset - slowchange).toFixed(2);
        processedLayers[currentLayer].offset = parseFloat(fixedOffset);
    }

    // CONTROL PRESS
    if(event.keyCode == 17){
        if(slowchange == .25){
            slowchange = .05;
            $('#slowchange').html("slow change: 1/2");
        }else if(slowchange == .05){
             slowchange = .01;
             console.log(slowchange);
             $('#slowchange').html("slow change: .01%");
        }
        else{
            slowchange = .25;
            $('#slowchange').html("slow change: disabled");
        }
    }

    // SHIFT PRESS
    if(event.keyCode == 16){
        movelayer = !movelayer;
    }

    // E PRESS
    if(event.keyCode == 69){
        eraser = !eraser;
    }

    $('#currentlayer').html("current layer: " + currentLayer);
    $('#currentlayeroffset').html("layer offset force: " + processedLayers[currentLayer].offset);
    $('#erasermode').html("eraser mode: " + eraser);
    $('#switchlayers').html("move layers: " + movelayer);
}

// Responsible for taking a picture of canvas
function convertCanvasToImage(canvas) {
	var image = new Image();
	image.src = canvas.toDataURL("image/png");
	return image;
}

// Get mouse position
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

//Switch places with layers
Array.prototype.swap = function (x,y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
}

function easeTo(number, target, by){

    if(Math.abs(number - target) < by){
        return number;
    }

    if(number > target){
        return number - by;
    }else if(number < target){
        return number + by;
    }
    else {
        return number;
    }
}