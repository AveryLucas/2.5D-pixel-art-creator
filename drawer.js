var canvas = document.getElementById('canvas');
fitToContainer(canvas);
var c = canvas.getContext("2d");

var gridSize = 64;
var width = canvas.width;
var height = canvas.height - Math.round(canvas.height/gridSize);
var pixelSize = width/gridSize;

//TOOLS
var slowchange = 0.25;
var eraser = false;
var movelayer = false;
var onionskin = true;
var rotationSettingsMode = false;

var mousedown = false;

var processingLayers = false;
var followMouse = false;

var layers = [[], new Layer()];
var processedLayers = [[]];
var currentLayer = 1;

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
    this.rotationStrength = 1;
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
    var layer = layers[index];
    for(var j = 0; j < layer.blocks.length; j++){

        //Save current context settings.
        c.save();
        
        //Settings
        c.fillStyle = layer.blocks[j].color;

        //Make sure block is dimmed if dim other layers mode is on.
        if(index != currentLayer && !followMouse && !processingLayers && onionskin){
          console.log("HERE!");
            switch(Math.abs(currentLayer - index)){
              case 1:
                c.globalAlpha=0.20;
                break;
              case 2:
                c.globalAlpha=0.05;
                break;
              default:
                c.globalAlpha=0;
            }

            if(index < currentLayer){
                c.fillStyle = "#c3ff96";
            }
          
            if(index > currentLayer){
                  c.fillStyle = "#93bcff";
            }
        }else{
            c.globalAlpha=1;
        }

        //Draw the block
        c.fillRect(layer.blocks[j].x, layer.blocks[j].y, pixelSize, pixelSize);
        c.fillRect(layer.blocks[j].x, layer.blocks[j].y, pixelSize, pixelSize);
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
    // processedLayers = [[]];
    var tempProcessedLayers = [[]];
    processingLayers = true;
    var index = 0;
    for(var i = 1; i < layers.length; i++){
        c.clearRect(0, 0, width, height);
        this.drawLayer(i);
        if(processedLayers[i] != null){
            tempProcessedLayers[i] = processedLayers[i];
            tempProcessedLayers[i].img = convertCanvasToImage(canvas);
        }else{
            tempProcessedLayers.push(new ProcessedLayer(convertCanvasToImage(canvas)));
        }
        index = i;
    }
    processedLayers = tempProcessedLayers;
    //Remove excess layers
    console.log(index, "WOOP!");
    // console.log(processedLayers);
    // if(!followMouse){
        // processedLayers = processedLayers.splice(index-2);
    // }
    console.log(processedLayers);
    processingLayers = false;
    followMouse = true;
}

Drawer.prototype.drawProcessedLayers = function(){
    c.clearRect(0, 0, width, height);
    for(var i = 1; i < processedLayers.length; i++){
        c.save();
        
        c.translate(width/2, height/2);
        c.rotate(processedLayers[i].rotation * processedLayers[i].rotationStrength);
        c.drawImage(processedLayers[i].img, processedLayers[i].x-width/2, processedLayers[i].y-height/2);
        
        c.restore();
    }
}

Drawer.prototype.setBlockAtMouse = function(e){
    // Storing Mousepos here for easy access.
    var mouseInfo = getMouseInformation(canvas, e);

    var x = mouseInfo.xPosAfterCalc;
    var y = mouseInfo.yPosAfterCalc;

    // console.log(mousePos); 

    //If there is no block here and we arnt erasing, place a block here
    if(getBlockHere(x, y) == null && !eraser){
        layers[currentLayer].blocks.push(new Block(x, y, $("#color").attr('value')));
        console.log("here");
    }
    //If there is a block here but we are NOT erasing, remove the block thats there and place new one.
    else if(getBlockHere(x, y) == null && !eraser){
        layers[currentLayer].blocks.splice(getBlockHere(x, y), 1);
        layers[currentLayer].blocks.push(new Block(x, y, $("#color").attr('value')));
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

//check if there is a block where clicked
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
    var mouseInfo = getMouseInformation(canvas, e);
    var invertedMouseY = canvas.height - mouseInfo.mousePos.y;

    //If holding down mouse continue to draw.
    if(mousedown){
        mousedown = true;
        drawer.setBlockAtMouse(e);
    }

    if(followMouse){
        // Variables
        var centerX = width/2;
        var centerY = height/2;
        var offsetX = mouseInfo.mousePos.x - centerX;
        var offsetY = mouseInfo.mousePos.y - centerY;

        if(offsetX < 0){
            var temp = drawer.rotationTargetY;
            drawer.rotationTargetY = easeTo(drawer.rotationTargetY, invertedMouseY, 25);
            console.log(invertedMouseY, drawer.rotationTargetY);
        }else{
            drawer.rotationTargetY = easeTo(drawer.rotationTargetY, mouseInfo.mousePos.y + (Math.sign(mouseInfo.mousePos.y) + 20), 35);
        }
        

        for(var i = 1; i < processedLayers.length; i++){
            
            // Determining angle to rotate at to face mouse.
            // NEED TO FIX -OFFSET X LOGIC
            // rotation when offset x is negative is atleast two times greater then the alternative and at most.. well alot greater.
            var targetX  = mouseInfo.mousePos.x + width/2;
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
        


        //Debuging purposes. Shows where inverted mouse is when working on -offsetX problem
        drawer.drawProcessedLayers();
        console.log(processedLayers);
        c.fillRect(mouseInfo.mousePos.x, invertedMouseY, 20, 20);
    }
}, false);


//Keyboard Commands
document.onkeydown = function(event){
    console.log(event.keyCode);
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
  
    // S PRESS
    if(event.keyCode == 83) {
        alert("Saving information will be copied to clipboard. Paste this somewhere safe.");
        var temp = $('#saveinfo');
        save = [JSON.stringify(layers), JSON.stringify(processedLayers)];
        temp.html(JSON.stringify(save));
        
        temp.select();
      
        try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          console.log('Copying text command was ' + msg);
        } catch (err) {
          console.log('Oops, unable to copy');
        }
    }
    
  // L PRESS
    if(event.keyCode == 76) {
        var data = prompt("Enter data. This will clear whatever is on your screen. BE CAREFUL!");
        save = JSON.parse(data);
        console.log(save);
        layers = JSON.parse(save[0]);
        processedLayers = JSON.parse(save[1]);
        drawer.drawAllLayers();
        // alert(JSON.stringify(layers));
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
        if(!rotationSettingsMode){
            var fixedOffset = (processedLayers[currentLayer].offset + slowchange).toFixed(2);
            processedLayers[currentLayer].offset = parseFloat(fixedOffset);
        }else{
            var fixedOffset = (processedLayers[currentLayer].rotationStrength + slowchange).toFixed(2);
            processedLayers[currentLayer].rotationStrength = parseFloat(fixedOffset);
        }
    }

    // LEFT ARROW
    if(event.keyCode == 37){
        if(!rotationSettingsMode){
            var fixedOffset = (processedLayers[currentLayer].offset - slowchange).toFixed(2);
            processedLayers[currentLayer].offset = parseFloat(fixedOffset);
        }
        else{
            var fixedOffset = (processedLayers[currentLayer].rotationStrength - slowchange).toFixed(2);
            processedLayers[currentLayer].rotationStrength = parseFloat(fixedOffset);
        }
    }

    // CONTROL PRESS
    if(event.keyCode == 17){
        if(slowchange == .25){
            slowchange = .05;
            $('#slowchange').html("slow change mode: .05");
        }else if(slowchange == .05){
             slowchange = .01;
             console.log(slowchange);
             $('#slowchange').html("slow change mode: .01");
        }
        else{
            slowchange = .25;
            $('#slowchange').html("slow change mode: disabled");
        }
    }

    if(event.keyCode == 20){
        rotationSettingsMode = !rotationSettingsMode;
    }

    // SHIFT PRESS (toggle move layer mode)
    if(event.keyCode == 16){
        movelayer = !movelayer;
    }

    // E PRESS (Turn on eraser)
    if(event.keyCode == 69){
        eraser = true;
    }

    // B PRESS (Turn off eraser)
    if(event.keyCode == 66){
        eraser = false;
    }

    // O PRESS (Toggle Onion Skin)
    if(event.keyCode == 79){
        onionskin = !onionskin;
    }

    
    $('#currentlayer').html("current layer: " + currentLayer);
    if(processedLayers[currentLayer]){
        $('#currentlayeroffset').html("layer offset force: " + processedLayers[currentLayer].offset);
        $("#rotationstrength").html("rotation strength: " + processedLayers[currentLayer].rotationStrength);
    }else{
        $('#currentlayeroffset').html("layer offset force: please process layers");
        $("#rotationstrength").html("rotation strength: please process layers");
    }
    $('#erasermode').html("eraser mode: " + eraser);
    $('#switchlayers').html("move layers: " + movelayer);
}

$('#eraser').click(function(){
    eraser = true;
});

$('#brush').click(function(){
    eraser = false;
});

$("#applycolor").click(function(){
    console.log($("#hexcolor")["0"].value);

    if($("#hexcolor")["0"].value.length == 6){
        $("#hexcolor")["0"].value = "#" + $("#hexcolor")["0"].value;
    }
    $("#color")["0"].value = $("#hexcolor")["0"].value;
    // console.log()
});

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

function fitToContainer(canvas){
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='100%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

function getMouseInformation(canvas, e){
    var mousePos = getMousePos(canvas, e);
    return {
        // Returns current mouse position
        mousePos,
        // Turns mouse position into a position on grid 1200 300 64
        xPos: Math.round(mousePos.x / (width/ gridSize )),
        yPos: Math.round(mousePos.y / (width/ gridSize )),
        // Accounts for pixelsize when drawing and gets the real x, y from (8, 32) to (34, 345) *math is not real there*
        xPosAfterCalc: (pixelSize * Math.round(mousePos.x / (width/ gridSize ))) - pixelSize/2,
        yPosAfterCalc: (pixelSize * Math.round(mousePos.y / (width/ gridSize ))) - pixelSize/3
    }
}