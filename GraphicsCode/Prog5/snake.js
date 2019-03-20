/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
var Eye = new vec4.fromValues(0.0, 0.0, 0.5, 1.0); // default eye position in world space
var viewUp = new vec3.fromValues(0.0, 1.0, 0.0); // look up vector
var lookAt = new vec3.fromValues(0.0, 0.0, 0.5); // look at vector

var modelview = mat4.create(); // modelview matrix

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var webGLCanvas;
var vertexBuffer; // this contains vertex coordinates in triples
var indexBuffer; // this contains indices into vertexBuffer in triples
var indexBufferSize = 0; // the number of indices in the index buffer
var vertexPositionAttrib; // where to put position for vertex shader
var color = new vec3.fromValues(1, 1, 1);

var grid = [], cols = 40;
var grid2 = [];
var speed = 5;
var frame = speed;
var canMove = true;

var arenaVertices = [];
var arenaIndices;

var foodBuffer;
var foodIndexBuffer;
var foodExists = false;
var bodies = [];
var growing = false;

var SNAKE_HEAD = {
	buffer: 0,
	indexBuffer: 0,
	vertices: [],
	indices: [0,2,3,0,1,3],
	size: 6,
	x: 20,
	y: 20,
	direction: "up"
}

class SNAKE_BODY {
	constructor(x, y, vertices) {
		this.x = x;
		this.y = y;
		this.vertices = vertices;
		this.indices = [0,2,3,0,1,3];
		this.buffer = gl.createBuffer();
		this.indexBuffer = gl.createBuffer();
		this.size = 6;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
	}
}

var SNAKE_TAIL = {
	buffer: 0,
	indexBuffer: 0,
	vertices: [],
	indices: [0,2,3,0,1,3],
	size: 6,
	x: 20,
	y: 21,
}

var NPC_SNAKE_HEAD = {
	buffer: 0,
	indexBuffer: 0,
	vertices: [],
	indices: [0,2,3,0,1,3],
	size: 6,
	x: 35,
	y: 35,
	direction: "up"
}

var NPC_SNAKE_TAIL = {
	buffer: 0,
	indexBuffer: 0,
	vertices: [],
	indices: [0,2,3,0,1,3],
	size: 6,
	x: 35,
	y: 37,
}

var NPCbodies = [];
var NPCgrowing = false;
var grid3 = [];
var NPCframe = speed;

// empty
// wall
// food
// snake
// a direction: up, down, left, right

// set up the webGL environment
function setupWebGL() {
	// create a webgl canvas and set it up
	webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
	gl = webGLCanvas.getContext("webgl"); // get a webgl object from it
	try {
	if (gl == null) {
		throw "unable to create gl context -- is your browser gl ready?";
	} else {
		gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
		gl.clearDepth(1.0); // use max when we clear the depth buffer
		gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
		}
	} // end try
    catch(e) {
      console.log(e);
    } // end catch
} // end setupWebGL

// setup the playing field for snake
function setupGrid() {
	for (var i = 0; i < 1600; i++) {
		grid[i] = "empty";
	}
	
	// sets top
	for (var i = 0; i < cols; i++) {
		grid[i] = "wall";
		grid[i + cols] = "wall";
	}
	// sets left side
	for (var i = 0; i < cols; i++) {
		grid[i * cols] = "wall";	
	}
	// sets bottom
	for (var i = 0; i < cols; i++) {
		grid[39 * cols + i] = "wall";
	}
	// sets right side
	for (var i = 0; i < cols; i++) {
		grid[i * cols + 39] = "wall";
		grid[i * cols + 38] = "wall";
	}
	
	var a = -0.94;
	var b = -0.99;

	arenaVertices = [b, a, 0.0,
            b, b, 0.0,
            a, b, 0.0,
            a, a, 0.0 ];
	arenaIndices = [3,2,1,3,1,0];
	indexBufferSize = 6;
	
	var j = 1;
	// left side
	for (var i = 4; i < 156; i += 4) {
		arenaVertices.push(b, a + 0.05*j, 0.0,
				b, b + 0.05*j, 0.0,
				a, b + 0.05*j, 0.0,
				a, a + 0.05*j, 0.0);
		arenaIndices.push(i + 3, i + 2, i + 1, i + 3, i + 1, i);
		j++;
		indexBufferSize+=6;
	}
	
	j = 1;
	// top
	for (var i = 156; i < 308; i += 4) {
		arenaVertices.push(b + 0.05*j, 0.96, 0.0,
					b + 0.05*j, 0.91, 0.0,
					a + 0.05*j, 0.91, 0.0,
					a + 0.05*j, 0.96, 0.0);
		arenaIndices.push(i + 3, i + 2, i + 1, i + 3, i + 1, i);
		j++;
		indexBufferSize+=6;
	}
	
	j = 1;
	// right side
	for (var i = 308; i < 460; i += 4) {
		arenaVertices.push(0.91, 0.96 - 0.05*j, 0.0,
					0.91, 0.91 - 0.05*j, 0.0,
					0.96, 0.91 - 0.05*j, 0.0,
					0.96, 0.96 - 0.05*j, 0.0);
		arenaIndices.push(i + 3, i + 2, i + 1, i + 3, i + 1, i);
		j++;
		indexBufferSize+=6;
	}
	
	j = 1;
	// bottom
	for (var i = 460; i < 612; i += 4) {
		arenaVertices.push(0.91 - 0.05*j, a, 0.0,
					0.91 - 0.05*j, b, 0.0,
					0.96 - 0.05*j, b, 0.0,
					0.96 - 0.05*j, a, 0.0);
		arenaIndices.push(i + 3, i + 2, i + 1, i + 3, i + 1, i);
		j++;
		indexBufferSize+=6;
	}
		
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arenaVertices), gl.STATIC_DRAW);
	
	indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arenaIndices), gl.STATIC_DRAW);

} // end setupArena

// setup the initial snake model
function setupSnake() {
	bodies = [];
	
	SNAKE_HEAD.vertices =[0, 0, 0.0,
			0.05, 0, 0.0,
			0, -0.05, 0.0,
			0.05, -0.05, 0.0];
	SNAKE_HEAD.x = 20;
	SNAKE_HEAD.y = 20;
	SNAKE_HEAD.direction = "up";

	SNAKE_HEAD.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, SNAKE_HEAD.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SNAKE_HEAD.vertices), gl.STATIC_DRAW);

	SNAKE_HEAD.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SNAKE_HEAD.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(SNAKE_HEAD.indices), gl.STATIC_DRAW);
	
	bodies.push(new SNAKE_BODY(20, 21, [0, 0.05, 0.0,
			0.05, 0.05, 0.0,
			0, 0, 0.0,
			0.05, 0.0, 0.0]));

	SNAKE_TAIL.vertices = [0, 0.1, 0.0,
			0.05, 0.1, 0.0,
			0, 0.05, 0.0,
			0.05, 0.05, 0.0]
	SNAKE_TAIL.x = 20;
	SNAKE_TAIL.y = 22;
	
	SNAKE_TAIL.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, SNAKE_TAIL.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SNAKE_TAIL.vertices), gl.STATIC_DRAW);

	SNAKE_TAIL.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SNAKE_TAIL.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(SNAKE_TAIL.indices), gl.STATIC_DRAW);

	grid[cols * SNAKE_HEAD.y + SNAKE_HEAD.x] = "snake";
	grid[cols * bodies[0].y + bodies[0].x] = "snake";
	grid[cols * SNAKE_TAIL.y + SNAKE_TAIL.x] = "snake";

} // end setupSnake

// setup the initial snake model
function setupNPCSnake() {
	NPCbodies = [];
	
	NPC_SNAKE_HEAD.vertices =[convertX(35), convertY(35), 0.0,
			convertX(35) + 0.05, convertY(35), 0.0,
			convertX(35), convertY(35) - 0.05, 0.0,
			convertX(35) + 0.05, convertY(35) - 0.05, 0.0];
	NPC_SNAKE_HEAD.x = 35;
	NPC_SNAKE_HEAD.y = 35;
	NPC_SNAKE_HEAD.direction = "up";

	NPC_SNAKE_HEAD.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, NPC_SNAKE_HEAD.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(NPC_SNAKE_HEAD.vertices), gl.STATIC_DRAW);

	NPC_SNAKE_HEAD.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, NPC_SNAKE_HEAD.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(NPC_SNAKE_HEAD.indices), gl.STATIC_DRAW);
	
	NPCbodies.push(new SNAKE_BODY(35, 36, [convertX(35), convertY(36), 0.0,
			convertX(35) + 0.05, convertY(36), 0.0,
			convertX(35), convertY(36) - 0.05, 0.0,
			convertX(35) + 0.05, convertY(36) - 0.05, 0.0]));

	NPC_SNAKE_TAIL.vertices = [convertX(35), convertY(37), 0.0,
			convertX(35) + 0.05, convertY(37), 0.0,
			convertX(35), convertY(37) - 0.05, 0.0,
			convertX(35) + 0.05, convertY(37) - 0.05, 0.0]
	NPC_SNAKE_TAIL.x = 35;
	NPC_SNAKE_TAIL.y = 37;
	
	NPC_SNAKE_TAIL.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, NPC_SNAKE_TAIL.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(NPC_SNAKE_TAIL.vertices), gl.STATIC_DRAW);

	NPC_SNAKE_TAIL.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, NPC_SNAKE_TAIL.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(NPC_SNAKE_TAIL.indices), gl.STATIC_DRAW);

	grid[cols * NPC_SNAKE_HEAD.y + NPC_SNAKE_HEAD.x] = "snake";
	grid[cols * NPCbodies[0].y + NPCbodies[0].x] = "snake";
	grid[cols * NPC_SNAKE_TAIL.y + NPC_SNAKE_TAIL.x] = "snake";

} // end setupNPCSnake

// moves the snake in the current direction
function moveSnake() {
	var back = cols * SNAKE_HEAD.y +  SNAKE_HEAD.x;
	if (frame <= 0) {
		// move HEAD
		grid2[cols * SNAKE_HEAD.y +  SNAKE_HEAD.x] = SNAKE_HEAD.direction;
		if (SNAKE_HEAD.direction == "up") {
			SNAKE_HEAD.y -= 1;
		}
		else if (SNAKE_HEAD.direction == "down") {
			SNAKE_HEAD.y += 1;
		}
		else if (SNAKE_HEAD.direction == "left") {
			SNAKE_HEAD.x -= 1;
		}
		else if (SNAKE_HEAD.direction == "right") {
			SNAKE_HEAD.x += 1;
		}
		
		if (grid[cols * SNAKE_HEAD.y + SNAKE_HEAD.x] == "food") {
			growing = true;
			bodies.push(new SNAKE_BODY(SNAKE_TAIL.x, SNAKE_TAIL.y, SNAKE_TAIL.vertices));
			foodExists = false;
		}
		
		if (grid[cols * SNAKE_HEAD.y + SNAKE_HEAD.x] == "wall" || 
			grid[cols * SNAKE_HEAD.y + SNAKE_HEAD.x] == "snake") {
			grid2 = [];
			grid[back] = "empty";
			grid[cols * SNAKE_TAIL.y +  SNAKE_TAIL.x] = "empty";
			for (var i = 0; i < bodies.length; i++) {
				grid[cols * bodies[i].y +  bodies[i].x] = "empty";
			}
			setupSnake();
		}
		else {
			SNAKE_HEAD.vertices = [(SNAKE_HEAD.x - 20) / 20, 1 - SNAKE_HEAD.y / 20 + 0.05, 0.0,
						(SNAKE_HEAD.x - 20) / 20 + 0.05, 1 - SNAKE_HEAD.y / 20 + 0.05, 0.0,
						(SNAKE_HEAD.x - 20) / 20, 1 - SNAKE_HEAD.y / 20, 0.0,
						(SNAKE_HEAD.x - 20) / 20 + 0.05, 1 - SNAKE_HEAD.y / 20, 0.0];
			gl.bindBuffer(gl.ARRAY_BUFFER, SNAKE_HEAD.buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SNAKE_HEAD.vertices), gl.STATIC_DRAW);
		
			grid[cols * SNAKE_HEAD.y + SNAKE_HEAD.x] = "snake";
			
			// move BODY
			for (var i = 0; i < bodies.length; i++) {
				var dir = grid2[cols * bodies[i].y + bodies[i].x];
				if (dir == "up") {
					bodies[i].y -= 1;
				}
				else if (dir == "down") {
					bodies[i].y += 1;
				}
				else if (dir == "left") {
					bodies[i].x -= 1;
				}
				else if (dir == "right") {
					bodies[i].x += 1;
				}
				else {
					bodies[i].y -= 1;
				}

				bodies[i].vertices = [(bodies[i].x - 20) / 20, 1 - bodies[i].y / 20 + 0.05, 0.0,
							(bodies[i].x - 20) / 20 + 0.05, 1 - bodies[i].y / 20 + 0.05, 0.0,
							(bodies[i].x - 20) / 20, 1 - bodies[i].y / 20, 0.0,
							(bodies[i].x - 20) / 20 + 0.05, 1 - bodies[i].y / 20, 0.0];
				gl.bindBuffer(gl.ARRAY_BUFFER, bodies[i].buffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bodies[i].vertices), gl.STATIC_DRAW);
			}
		
			if (!growing) {
				// move tail
				var dir = grid2[cols * SNAKE_TAIL.y + SNAKE_TAIL.x];
				grid2[cols * SNAKE_TAIL.y + SNAKE_TAIL.x] = undefined;
				grid[cols * SNAKE_TAIL.y + SNAKE_TAIL.x] = "empty";
				if (dir == "up") {
					SNAKE_TAIL.y -= 1;
				}
				else if (dir == "down") {
					SNAKE_TAIL.y += 1;
				}
				else if (dir == "left") {
					SNAKE_TAIL.x -= 1;
				}
				else if (dir == "right") {
					SNAKE_TAIL.x += 1;
				}
				else {
					SNAKE_TAIL.y -= 1;
				}

				SNAKE_TAIL.vertices = [(SNAKE_TAIL.x - 20) / 20, 1 - SNAKE_TAIL.y / 20 + 0.05, 0.0,
							(SNAKE_TAIL.x - 20) / 20 + 0.05, 1 - SNAKE_TAIL.y / 20 + 0.05, 0.0,
							(SNAKE_TAIL.x - 20) / 20, 1 - SNAKE_TAIL.y / 20, 0.0,
							(SNAKE_TAIL.x - 20) / 20 + 0.05, 1 - SNAKE_TAIL.y / 20, 0.0];
				gl.bindBuffer(gl.ARRAY_BUFFER, SNAKE_TAIL.buffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SNAKE_TAIL.vertices), gl.STATIC_DRAW);
			}
			else {
				growing = false;
			}
			frame = speed;
			canMove = true;
		}
	}
	else {
		frame--;
	}
} // end moveSnake

// moves the snake in the current direction
function moveNPCSnake() {
	var back = cols * NPC_SNAKE_HEAD.y +  NPC_SNAKE_HEAD.x;
	if (NPCframe <= 0) {
		// move HEAD
		var movement = Math.floor(Math.random() * (10 - 0) + 0);
		if (movement == 0) {
			if (NPC_SNAKE_HEAD.direction == "up") {
				NPC_SNAKE_HEAD.direction = "left";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "left";
			}
			else if (NPC_SNAKE_HEAD.direction == "left") {
				NPC_SNAKE_HEAD.direction = "down";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "down";
			}
			else if (NPC_SNAKE_HEAD.direction == "down") {
				NPC_SNAKE_HEAD.direction = "right";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "right";
			}
			else if (NPC_SNAKE_HEAD.direction == "right") {
				NPC_SNAKE_HEAD.direction = "up";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "up";
			}
		}
		else if (movement == 1) {
			if (NPC_SNAKE_HEAD.direction == "up") {
				NPC_SNAKE_HEAD.direction = "right";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "right";
			}
			else if (NPC_SNAKE_HEAD.direction == "right") {
				NPC_SNAKE_HEAD.direction = "down";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "down";
			}
			else if (NPC_SNAKE_HEAD.direction == "down") {
				NPC_SNAKE_HEAD.direction = "left";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "left";
			}
			else if (NPC_SNAKE_HEAD.direction == "left") {
				NPC_SNAKE_HEAD.direction = "up";
				grid[cols * (20 - NPC_SNAKE_HEAD.y * 20) + (NPC_SNAKE_HEAD.x * 20 + 20)] = "up";
			}
		}
		grid3[cols * NPC_SNAKE_HEAD.y +  NPC_SNAKE_HEAD.x] = NPC_SNAKE_HEAD.direction;
		if (NPC_SNAKE_HEAD.direction == "up") {
			NPC_SNAKE_HEAD.y -= 1;
		}
		else if (NPC_SNAKE_HEAD.direction == "down") {
			NPC_SNAKE_HEAD.y += 1;
		}
		else if (NPC_SNAKE_HEAD.direction == "left") {
			NPC_SNAKE_HEAD.x -= 1;
		}
		else if (NPC_SNAKE_HEAD.direction == "right") {
			NPC_SNAKE_HEAD.x += 1;
		}
		else {
			NPC_SNAKE_HEAD.y -= 1;
		}
		
		if (grid[cols * NPC_SNAKE_HEAD.y + NPC_SNAKE_HEAD.x] == "food") {
			NPCgrowing = true;
			NPCbodies.push(new SNAKE_BODY(NPC_SNAKE_TAIL.x, NPC_SNAKE_TAIL.y, NPC_SNAKE_TAIL.vertices));
			foodExists = false;
		}
		
		if (grid[cols * NPC_SNAKE_HEAD.y + NPC_SNAKE_HEAD.x] == "wall" || 
			grid[cols * NPC_SNAKE_HEAD.y + NPC_SNAKE_HEAD.x] == "snake") {
			grid3 = [];
			grid[back] = "empty";
			grid[cols * NPC_SNAKE_TAIL.y +  NPC_SNAKE_TAIL.x] = "empty";
			for (var i = 0; i < NPCbodies.length; i++) {
				grid[cols * NPCbodies[i].y +  NPCbodies[i].x] = "empty";
			}
			setupNPCSnake();
		}
		else {
			NPC_SNAKE_HEAD.vertices = [(NPC_SNAKE_HEAD.x - 20) / 20, 1 - NPC_SNAKE_HEAD.y / 20 + 0.05, 0.0,
						(NPC_SNAKE_HEAD.x - 20) / 20 + 0.05, 1 - NPC_SNAKE_HEAD.y / 20 + 0.05, 0.0,
						(NPC_SNAKE_HEAD.x - 20) / 20, 1 - NPC_SNAKE_HEAD.y / 20, 0.0,
						(NPC_SNAKE_HEAD.x - 20) / 20 + 0.05, 1 - NPC_SNAKE_HEAD.y / 20, 0.0];
			gl.bindBuffer(gl.ARRAY_BUFFER, NPC_SNAKE_HEAD.buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(NPC_SNAKE_HEAD.vertices), gl.STATIC_DRAW);
		
			grid[cols * NPC_SNAKE_HEAD.y + NPC_SNAKE_HEAD.x] = "snake";
			
			// move BODY
			for (var i = 0; i < NPCbodies.length; i++) {
				var dir = grid3[cols * NPCbodies[i].y + NPCbodies[i].x];
				if (dir == "up") {
					NPCbodies[i].y -= 1;
				}
				else if (dir == "down") {
					NPCbodies[i].y += 1;
				}
				else if (dir == "left") {
					NPCbodies[i].x -= 1;
				}
				else if (dir == "right") {
					NPCbodies[i].x += 1;
				}
				else {
					NPCbodies[i].y -= 1;
				}

				NPCbodies[i].vertices = [(NPCbodies[i].x - 20) / 20, 1 - NPCbodies[i].y / 20 + 0.05, 0.0,
							(NPCbodies[i].x - 20) / 20 + 0.05, 1 - NPCbodies[i].y / 20 + 0.05, 0.0,
							(NPCbodies[i].x - 20) / 20, 1 - NPCbodies[i].y / 20, 0.0,
							(NPCbodies[i].x - 20) / 20 + 0.05, 1 - NPCbodies[i].y / 20, 0.0];
				gl.bindBuffer(gl.ARRAY_BUFFER, NPCbodies[i].buffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(NPCbodies[i].vertices), gl.STATIC_DRAW);
			}
		
			if (!NPCgrowing) {
				// move tail
				var dir = grid3[cols * NPC_SNAKE_TAIL.y + NPC_SNAKE_TAIL.x];
				grid3[cols * NPC_SNAKE_TAIL.y + NPC_SNAKE_TAIL.x] = undefined;
				grid[cols * NPC_SNAKE_TAIL.y + NPC_SNAKE_TAIL.x] = "empty";
				if (dir == "up") {
					NPC_SNAKE_TAIL.y -= 1;
				}
				else if (dir == "down") {
					NPC_SNAKE_TAIL.y += 1;
				}
				else if (dir == "left") {
					NPC_SNAKE_TAIL.x -= 1;
				}
				else if (dir == "right") {
					NPC_SNAKE_TAIL.x += 1;
				}
				else {
					NPC_SNAKE_TAIL.y -= 1;
				}

				NPC_SNAKE_TAIL.vertices = [(NPC_SNAKE_TAIL.x - 20) / 20, 1 - NPC_SNAKE_TAIL.y / 20 + 0.05, 0.0,
							(NPC_SNAKE_TAIL.x - 20) / 20 + 0.05, 1 - NPC_SNAKE_TAIL.y / 20 + 0.05, 0.0,
							(NPC_SNAKE_TAIL.x - 20) / 20, 1 - NPC_SNAKE_TAIL.y / 20, 0.0,
							(NPC_SNAKE_TAIL.x - 20) / 20 + 0.05, 1 - NPC_SNAKE_TAIL.y / 20, 0.0];
				gl.bindBuffer(gl.ARRAY_BUFFER, NPC_SNAKE_TAIL.buffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(NPC_SNAKE_TAIL.vertices), gl.STATIC_DRAW);
			}
			else {
				NPCgrowing = false;
			}
			NPCframe = speed;
		}
	}
	else {
		NPCframe--;
	}
} // end moveNPCSnake

// spawns the food in the arena in a random place
function spawnFood() {
	if (foodExists == false) {
		var min = -17;
		var max = 17;
		var a = Math.random() * (+max - +min) + +min;
		a = Math.floor(a)*0.05;
		var b = Math.random() * (+max - +min) + +min;
		b = Math.floor(b)*0.05;
		var foodArray = [a, b, 0.0,
				a + 0.025, b, 0.0,
				a, b + 0.025, 0.0,
				a + 0.025, b + 0.025, 0.0];
		var indices = [0,2,3,0,1,3];
		
		if (grid[cols * (20 - b * 20) + (a * 20 + 20)] != "empty") {
			return;
		}
		grid[cols * (20 - b * 20) + (a * 20 + 20)] = "food";
		
		foodBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, foodBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(foodArray), gl.STATIC_DRAW);
		
		foodIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, foodIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		foodExists = true;
	}

} // end spawnFood

// converts x coord from grid space to world space
function convertX(x) {
	return (x - 20) / 20
} // end convertX

// converts y coord from grid space to world space
function convertY(y) {
	return 1 - y / 20
} // end convertY

// setup the webGL shaders
function setupShaders() {
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
    	precision mediump float;

    	uniform vec3 color; // vertex diffuse

        void main(void) {
        	gl_FragColor = vec4(color, 1.0);
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        
        uniform mat4 modelview;   

        void main(void) {
            gl_Position = modelview * vec4(vertexPosition, 1.0);
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                // get pointer to vertex shader input
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                
                var colorUni = gl.getUniformLocation(shaderProgram, "color");
                gl.uniform3fv(colorUni, color);       
                				
				mat4.lookAt(modelview, Eye, lookAt, viewUp);

				var modelviewUni = gl.getUniformLocation(shaderProgram, "modelview");
				gl.uniformMatrix4fv(modelviewUni, false, modelview);
                
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
        debugger;
    } // end catch
} // end setup shaders

// render the models
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    requestAnimationFrame(render); // repeat this function
    setupShaders();
    spawnFood();

    // * RENDER THE ARENA * //

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate
	gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.drawElements(gl.TRIANGLES, indexBufferSize, gl.UNSIGNED_SHORT, 0);
	
	// * RENDER THE SNAKE * //
	
	// head
	gl.bindBuffer(gl.ARRAY_BUFFER, SNAKE_HEAD.buffer); // activate
	gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SNAKE_HEAD.indexBuffer);
	gl.drawElements(gl.TRIANGLES, SNAKE_HEAD.size, gl.UNSIGNED_SHORT, 0);
	
	// tail
	gl.bindBuffer(gl.ARRAY_BUFFER, SNAKE_TAIL.buffer); // activate
	gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SNAKE_TAIL.indexBuffer);
	gl.drawElements(gl.TRIANGLES, SNAKE_TAIL.size, gl.UNSIGNED_SHORT, 0);
	
	// body
	for (var i = 0; i < bodies.length; i++) {
		gl.bindBuffer(gl.ARRAY_BUFFER, bodies[i].buffer); // activate
		gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodies[i].indexBuffer);
		gl.drawElements(gl.TRIANGLES, bodies[i].size, gl.UNSIGNED_SHORT, 0);
	}
	
	// * RENDER THE NPC SNAKE * //
	
	// head
	gl.bindBuffer(gl.ARRAY_BUFFER, NPC_SNAKE_HEAD.buffer); // activate
	gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, NPC_SNAKE_HEAD.indexBuffer);
	gl.drawElements(gl.TRIANGLES, NPC_SNAKE_HEAD.size, gl.UNSIGNED_SHORT, 0);
	
	// tail
	gl.bindBuffer(gl.ARRAY_BUFFER, NPC_SNAKE_TAIL.buffer); // activate
	gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, NPC_SNAKE_TAIL.indexBuffer);
	gl.drawElements(gl.TRIANGLES, NPC_SNAKE_TAIL.size, gl.UNSIGNED_SHORT, 0);
	
	// body
	for (var i = 0; i < NPCbodies.length; i++) {
		gl.bindBuffer(gl.ARRAY_BUFFER, NPCbodies[i].buffer); // activate
		gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, NPCbodies[i].indexBuffer);
		gl.drawElements(gl.TRIANGLES, NPCbodies[i].size, gl.UNSIGNED_SHORT, 0);
	}
	
	// * RENDER THE FOOD * //
	
	gl.bindBuffer(gl.ARRAY_BUFFER, foodBuffer); // activate
	gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed
	
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, foodIndexBuffer);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	
	moveSnake();
	moveNPCSnake();

} // end render

window.addEventListener("keydown", function (event) {
	if (event.defaultPrevented) {
    	return; // do nothing if the event was already processed
    }
    if (canMove) {
		// turn the snake left
		if (event.key == "a" || event.key == "ArrowLeft") {
			if (SNAKE_HEAD.direction == "up") {
				SNAKE_HEAD.direction = "left";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "left";
			}
			else if (SNAKE_HEAD.direction == "left") {
				SNAKE_HEAD.direction = "down";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "down";
			}
			else if (SNAKE_HEAD.direction == "down") {
				SNAKE_HEAD.direction = "right";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "right";
			}
			else if (SNAKE_HEAD.direction == "right") {
				SNAKE_HEAD.direction = "up";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "up";
			}
		}
	
		// turn the snake right
		else if (event.key == "d" || event.key == "ArrowRight") {
			if (SNAKE_HEAD.direction == "up") {
				SNAKE_HEAD.direction = "right";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "right";
			}
			else if (SNAKE_HEAD.direction == "right") {
				SNAKE_HEAD.direction = "down";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "down";
			}
			else if (SNAKE_HEAD.direction == "down") {
				SNAKE_HEAD.direction = "left";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "left";
			}
			else if (SNAKE_HEAD.direction == "left") {
				SNAKE_HEAD.direction = "up";
				grid[cols * (20 - SNAKE_HEAD.y * 20) + (SNAKE_HEAD.x * 20 + 20)] = "up";
			}
		}
		canMove = false;
    }
    
    if (event.key == " " ) {
    	if (speed == 5) {
    		speed = 10;
    	}
    	else if (speed == 10) {
    		speed = 20;
    	}
    	else if (speed == 20) {
    		speed = 5;
    	}
    }
    
    event.preventDefault();
});

/* MAIN -- HERE is where execution begins after window load */
function main() {
  setupWebGL(); // set up the webGL environment
  setupGrid();
  setupSnake();
  setupNPCSnake();
  render(); // draw the triangles using webGL
} // end main