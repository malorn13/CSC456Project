/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog4/triangles.json"; // triangles file loc
const TEXTURES_URL = "https://ncsucgclass.github.io/prog4/";
var Eye = new vec4.fromValues(0.5, 0.5, -0.5, 1.0); // default eye position in world space
var viewUp = new vec3.fromValues(0.0, 1.0, 0.0); // look up vector
var lookAt = new vec3.fromValues(0.5,0.5,0.5); // look at vector
var projection = mat4.create(); // projection matrix
var modelview = mat4.create(); // modelview matrix

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = [];
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexNormalAttrib; // where to put the normal for vertex shader
var vertexUVAttrib; // where to put the UVs for the shader
var vertexDiffuseAttrib; // where to put the diffuse color for fragment shader
var vertexSpecularAttrib; // where to put the specular color for fragment shader
var vertexAmbientAttrib; // where to put the ambient color for fragment shader
var vertexReflectivityAttrib; // where to put the reflectivity for fragment shader
var vertexAlphaAttrib; // where to put the reflectivity for fragment shader
var normalBuffer; // this contains normal coordinates in triples
var uvsBuffer; // this contains the UV coordinates in doubles
var diffuseBuffer; // this contains diffuse values in triples
var specularBuffer; // this contains specular values in triples
var ambientBuffer; // this contains ambient values in triples
var reflectivityBuffer; // this contains reflectivity values
var alphaBuffer; // this contains alpha values

var angY = 0;
var angX = 0;
var lookAtX = lookAt[0];
var lookAtY = lookAt[1];
var lookAtZ = lookAt[2];

var textureArray = []; // contains the textures
var mode = 0; // different texture blending modes
var shaderProgram = null
var vertexSet = []; // used for tracking which set we are on during rendering
var alphas = []; // used for detecting an opaque vs transparent model
var models = [];
var numberTri = 0;

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

	var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
	var cw = imageCanvas.width, ch = imageCanvas.height; 
	imageContext = imageCanvas.getContext("2d"); 
	var bkgdImage = new Image(); 
	bkgdImage.crossOrigin = "Anonymous";
	bkgdImage.src = "https://ncsucgclass.github.io/prog4/sky.jpg";
	bkgdImage.onload = function(){
		var iw = bkgdImage.width, ih = bkgdImage.height;
		imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
	} // end onload callback

	// create a webgl canvas and set it up
	var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
	gl = webGLCanvas.getContext("webgl", { alpha: false }); // get a webgl object from it
	try {
	if (gl == null) {
		throw "unable to create gl context -- is your browser gl ready?";
	} else {
		//gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
		gl.clearDepth(1.0); // use max when we clear the depth buffer
		gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
		}
	} // end try
    catch(e) {
      console.log(e);
    } // end catch
} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles() {
    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL, "triangles");
    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indexArray = []; // 1D array of triangle coords
        var vertexBufferSize = 0;
        var vertexToAdd = [];
        var indexOffset = vec3.create();
        var triToAdd = vec3.create();

        var normalArray = [];
    	var normalToAdd = [];
    	var uvsArray = [];
    	var uvsToAdd = [];
    	
        var diffuseArray = [];
        var diffuseToAdd = vec3.create();
        var specularArray = [];
        var specularToAdd = vec3.create();
        var ambientArray = [];
        var ambientToAdd = vec3.create();
        var reflectivityArray = [];
        var alphaArray = [];
        
        for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
        	vec3.set(indexOffset, vertexBufferSize, vertexBufferSize, vertexBufferSize);
            
            // set up the vertex coord array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++){
                vertexSet.push(whichSet);
            	vertexToAdd = inputTriangles[whichSet].vertices[whichSetVert];
            	coordArray.push(vertexToAdd[0], vertexToAdd[1], vertexToAdd[2]);
            }
            
            // set up the triangle array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++){
            	numberTri++;
            	vec3.add(triToAdd, indexOffset, inputTriangles[whichSet].triangles[whichSetTri]);
            	indexArray.push(triToAdd[0], triToAdd[1], triToAdd[2]);
            }
            
            // set up the normal array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].normals.length; whichSetVert++){
            	normalToAdd = inputTriangles[whichSet].normals[whichSetVert];
            	normalArray.push(normalToAdd[0], normalToAdd[1], normalToAdd[2]);
            }
            
            // set up the uvs array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].uvs.length; whichSetVert++){
            	uvsToAdd = inputTriangles[whichSet].uvs[whichSetVert];
            	uvsArray.push(uvsToAdd[0], uvsToAdd[1]);
            }
            
            // set up the diffuse color array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++){
            	diffuseToAdd = inputTriangles[whichSet].material.diffuse;
            	diffuseArray.push(diffuseToAdd[0], diffuseToAdd[1], diffuseToAdd[2]);
            	diffuseArray.push(diffuseToAdd[0], diffuseToAdd[1], diffuseToAdd[2]);
            	diffuseArray.push(diffuseToAdd[0], diffuseToAdd[1], diffuseToAdd[2]);
            }
            
            // set up the specular color array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++){
            	specularToAdd = inputTriangles[whichSet].material.specular;
            	specularArray.push(specularToAdd[0], specularToAdd[1], specularToAdd[2]);
            	specularArray.push(specularToAdd[0], specularToAdd[1], specularToAdd[2]);
            	specularArray.push(specularToAdd[0], specularToAdd[1], specularToAdd[2]);
            }
            
            // set up the ambient color array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++){
            	ambientToAdd = inputTriangles[whichSet].material.ambient;
            	ambientArray.push(ambientToAdd[0], ambientToAdd[1], ambientToAdd[2]);
            	ambientArray.push(ambientToAdd[0], ambientToAdd[1], ambientToAdd[2]);
            	ambientArray.push(ambientToAdd[0], ambientToAdd[1], ambientToAdd[2]);
            }
            
            // set up the reflectivity coefficient array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++){
            	reflectivityArray.push(inputTriangles[whichSet].material.n);
            	reflectivityArray.push(inputTriangles[whichSet].material.n);
            	reflectivityArray.push(inputTriangles[whichSet].material.n);
            }
            
            // set up the alpha array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++){
            	alphaArray.push(inputTriangles[whichSet].material.alpha);
            	alphaArray.push(inputTriangles[whichSet].material.alpha);
            	alphaArray.push(inputTriangles[whichSet].material.alpha);
            }
            
            alphas.push(inputTriangles[whichSet].material.alpha);
            
            textureArray.push(loadTextures(TEXTURES_URL + inputTriangles[whichSet].material.texture));
            
            vertexBufferSize += inputTriangles[whichSet].vertices.length;
            triBufferSize += inputTriangles[whichSet].triangles.length;
                        
        } // end for each triangle set 
        triBufferSize *= 3
        
        mat4.perspective(projection, (90 * Math.PI / 180), (gl.canvas.clientWidth / gl.canvas.clientHeight), 0.1, 100);
		mat4.lookAt(modelview, Eye, lookAt, viewUp);
        
        var model2 = [];
        model2 = init_sort(inputTriangles[1], model2);
        model2 = sort_triangles(inputTriangles[1], model2);
        console.log(model2);
        
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW); // coords to that buffer
                
        normalBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray), gl.STATIC_DRAW); // coords to that buffer
        
        uvsBuffer = gl.createBuffer(); // init empty buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvsArray), gl.STATIC_DRAW); // coords to that buffer
        
        diffuseBuffer = gl.createBuffer(); // init empty diffuse buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuseArray), gl.STATIC_DRAW); // coords to that buffer
                
        specularBuffer = gl.createBuffer(); // init empty specular buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularArray), gl.STATIC_DRAW); // coords to that buffer
        
        ambientBuffer = gl.createBuffer(); // init empty ambient buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambientArray), gl.STATIC_DRAW); // coords to that buffer
        
        reflectivityBuffer = gl.createBuffer(); // init empty reflectivity buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, reflectivityBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(reflectivityArray), gl.STATIC_DRAW); // coords to that buffer
         
        alphaBuffer = gl.createBuffer(); // init empty alpha buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphaArray), gl.STATIC_DRAW); // coords to that buffer
        
        triangleBuffer = gl.createBuffer(); // init empty index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW); // coords to that buffer
        
    } // end if triangles found
} // end load triangles

function loadTextures(url) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	var pixel = new Uint8Array([0, 0, 255, 255]);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
	
	var image = new Image();
	image.addEventListener('load', function() {
		console.log("#### TEXTURE LOADED ####");
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		
		// if image is a power of 2
		if (((image.width & (image.width - 1)) == 0) && ((image.height & (image.height - 1)) == 0)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	});
	image.crossOrigin = "";   // ask for CORS permission
	image.src = url;
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		
	return texture;

} // end load textures

function init_sort(model, sorted){
    var number = model.triangles.length
	if (number > 0) {
        sorted = new Array(number);
    	for (var j = 0; j < number; j++) {
    		sorted[j] = [j, 0.0]; // [triangle #, distance from camera]
       	}
    }
    return sorted;
}

function sort_triangles(model, sorted) {
	var whichTri, vertices, z, k;
	var number = model.triangles.length
	vertices = model.vertices;
	for (var j = 0; j < number; j++) {
		whichTri = sorted[j][0];
		z = 10e10;
		for (var n = 0; n < 3; n++) {
			var one_vertex = new Array(3);
			one_vertex[0] = vertices[n][0];
			one_vertex[1] = vertices[n][1];
			one_vertex[2] = vertices[n][2];
			var transformed_vertex = new vec3.create();
			vec3.transformMat4(transformed_vertex, one_vertex, modelview);
			if (transformed_vertex[2] < z) {
				z = transformed_vertex[2];
			}
		}
		sorted[j][1] = z;
	}
	
	for (var j = 0; j < number; j++) {
		var temp = sorted[j];
		k = j - 1;
		while(k >= 0 && sorted[k][1] > temp[1]) {
			sorted[k + 1] = sorted[k];
			k--;
		}
		sorted[k + 1] = temp;
	}
	return sorted;
}

// setup the webGL shaders
function setupShaders() {
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
    	precision mediump float;
    	
    	varying vec3 normalInterp; // vertex normal
    	varying vec2 texPos; // texture position
    	varying vec3 vertPos; // vertex position
    	varying vec3 diffuseColor; // vertex diffuse
    	varying vec3 specularColor; // vertex specular
    	varying vec3 ambientColor; // vertex ambient
    	varying float alph;
    	varying float reflectivity; // vertex reflectivity
    	
    	uniform sampler2D texture;
    	uniform int mode;
    	
    	const vec3 lightPos = vec3(-3, 1, -0.5); // light position
    	
        void main(void) {
        
        	vec3 normal = normalize(normalInterp);
        	vec3 lightDir = normalize(lightPos - vertPos);
        	
        	float NdotL = max(dot(normal, lightDir), 0.0);
        	float specular = 0.0;
        	
        	if (NdotL > 0.0) {
        		vec3 viewDir = normalize(-vertPos);
        		vec3 halfDir = normalize(lightDir + viewDir);
        		float NdotH = max(dot(normal, halfDir), 0.0);
        		specular = pow(NdotH, reflectivity);
        	}
        	
        	if (mode == 0) {
        		gl_FragColor = texture2D(texture, texPos);
        		gl_FragColor.a = alph;
        	}
        	else if (mode == 1) {
        		gl_FragColor = vec4(ambientColor + NdotL * diffuseColor + specular * specularColor, alph) * texture2D(texture, texPos);
        	}
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 vertexNormal;
        attribute vec2 texturePosition;
        attribute vec3 vDiff; // vertex diffuse
        attribute vec3 vSpec; // vertex specular
        attribute vec3 vAmbi; // vertex ambient
        attribute float alpha;
        attribute float reflect; // vertex reflectivity
        
        uniform mat4 projection, modelview;
        
        varying vec3 normalInterp; // vertex normal
        varying vec2 texPos;
    	varying vec3 vertPos; // vertex position
    	varying vec3 diffuseColor; // vertex diffuse
    	varying vec3 specularColor; // vertex specular
    	varying vec3 ambientColor; // vertex ambient
    	varying float alph;
    	varying float reflectivity; // vertex reflectivity

        void main(void) {
        	vertPos = vertexPosition;
            normalInterp = vertexNormal;
            texPos = texturePosition;
        	diffuseColor = vDiff;
        	specularColor = vSpec;
        	ambientColor = vAmbi;
        	alph = alpha;
        	reflectivity = reflect;
            gl_Position = projection * modelview * vec4(vertexPosition, 1.0);
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
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
            shaderProgram = gl.createProgram(); // create the single shader program
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
                
                vertexUVAttrib = gl.getAttribLocation(shaderProgram, "texturePosition"); 
                gl.enableVertexAttribArray(vertexUVAttrib); // input to shader from array
                
                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib);
                                
                vertexDiffuseAttrib = gl.getAttribLocation(shaderProgram, "vDiff");
                gl.enableVertexAttribArray(vertexDiffuseAttrib);
                
                vertexSpecularAttrib = gl.getAttribLocation(shaderProgram, "vSpec");
                gl.enableVertexAttribArray(vertexSpecularAttrib);
                
                vertexAmbientAttrib = gl.getAttribLocation(shaderProgram, "vAmbi");
                gl.enableVertexAttribArray(vertexAmbientAttrib);
                
                vertexReflectivityAttrib = gl.getAttribLocation(shaderProgram, "reflect");
                gl.enableVertexAttribArray(vertexReflectivityAttrib);
                
                vertexAlphaAttrib = gl.getAttribLocation(shaderProgram, "alpha");
                gl.enableVertexAttribArray(vertexAlphaAttrib);
                
                var modeUni = gl.getUniformLocation(shaderProgram, "mode");
                gl.uniform1i(modeUni, mode);
                
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
        debugger;
    } // end catch
} // end setup shaders

// render the loaded models
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    requestAnimationFrame(renderTriangles); // repeat this function
    setupShaders();
    
    for (var i = 0; i < triBufferSize; i += 3) {
    	
    	if (alphas[vertexSet[i]] == 1.0) {
    		gl.disable(gl.BLEND);
    		gl.depthMask(true); // z-write on
    	}
    	else {
    		gl.enable(gl.BLEND);
    		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    		gl.depthMask(false); // z-write off
    	}
    	
    	mat4.perspective(projection, (90 * Math.PI / 180), (gl.canvas.clientWidth / gl.canvas.clientHeight), 0.1, 100);
		mat4.lookAt(modelview, Eye, lookAt, viewUp);
    	
		// vertex buffer: activate and feed into vertex shader
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate
		gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer); // activate
		gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer); // activate
		gl.vertexAttribPointer(vertexUVAttrib, 2, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer); // activate
		gl.vertexAttribPointer(vertexDiffuseAttrib, 3, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer); // activate
		gl.vertexAttribPointer(vertexSpecularAttrib, 3, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer); // activate
		gl.vertexAttribPointer(vertexAmbientAttrib, 3, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, reflectivityBuffer); // activate
		gl.vertexAttribPointer(vertexReflectivityAttrib, 1, gl.FLOAT, false, 0, 0); // feed

		gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer); // activate
		gl.vertexAttribPointer(vertexAlphaAttrib, 1, gl.FLOAT, false, 0, 0); // feed
		
		var projectionUni = gl.getUniformLocation(shaderProgram, "projection");
		gl.uniformMatrix4fv(projectionUni, false, projection);
	
		var modelviewUni = gl.getUniformLocation(shaderProgram, "modelview");
		gl.uniformMatrix4fv(modelviewUni, false, modelview);

		var textureUni = gl.getUniformLocation(shaderProgram, "texture");
		gl.bindTexture(gl.TEXTURE_2D, textureArray[vertexSet[i]]);
        gl.uniform1i(textureUni, textureArray[0]);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, i * 2);
	}

} // end render triangles

window.addEventListener("keydown", function (event) {
	if (event.defaultPrevented) {
    	return; // do nothing if the event was already processed
    }
    
    // INTERACTIVELY CHANGE VIEW

	// translate view left along view X
    if (event.key == "a") {
    	Eye[0] += 0.1;
    	lookAt[0] += 0.1;
    }
    
    // translate view right along view X
    else if (event.key == "d") {
    	Eye[0] -= 0.1;
    	lookAt[0] -= 0.1;
    }
    
    // translate view forward along view Z
    else if (event.key == "w") {
    	Eye[2] += 0.1;
    	lookAt[2] += 0.1;
    }
    
    // translate view backward along view Y
    else if (event.key == "s") {
    	Eye[2] -= 0.1;
    	lookAt[2] -= 0.1;
    }
    
    // translate view up along view Y
    else if (event.key == "q") {
    	Eye[1] += 0.1;
    	lookAt[1] += 0.1;
    }
    
    // translate view down along view Y
    else if (event.key == "e") {
    	Eye[1] -= 0.1;
    	lookAt[1] -= 0.1;
    }
    
    // rotate view left around view Y (yaw)
    else if (event.key == "A") {
    	angY += 5;
    	var angle = angY * (Math.PI/180);
    	var cos = Math.cos(angle);
    	var sin = Math.sin(angle);
    	lookAt[0] = lookAtX * cos + lookAtZ * sin;
    	lookAt[2] = -lookAtX * sin + lookAtZ * cos;
    }
    
    // rotate view right around view Y (yaw)
    else if (event.key == "D") {
    	angY -= 5;
    	var angle = angY * (Math.PI/180);
    	var cos = Math.cos(angle);
    	var sin = Math.sin(angle);
    	lookAt[0] = lookAtX * cos + lookAtZ * sin;
    	lookAt[2] = -lookAtX * sin + lookAtZ * cos;
    }
    
    // rotate view forward around view X (pitch)
    else if (event.key == "W") {
    	angX -= 5;
    	var angle = angX * (Math.PI/180);
    	var cos = Math.cos(angle);
    	var sin = Math.sin(angle);
    	lookAt[1] = lookAtY * cos - lookAtZ * sin;
    	lookAt[2] = lookAtY * sin + lookAtZ * cos;
    }
    
    // rotate view backward around view X (pitch)
    else if (event.key == "S") {
    	angX += 5;
    	var angle = angX * (Math.PI/180);
    	var cos = Math.cos(angle);
    	var sin = Math.sin(angle);
    	lookAt[1] = lookAtY * cos - lookAtZ * sin;
    	lookAt[2] = lookAtY * sin + lookAtZ * cos;
    }
    
    else if (event.key == "b") {
    	if (mode == 0) {
    		mode = 1;
    	}
    	else if (mode == 1) {
    		mode = 0;
    	}
    }
    
    event.preventDefault();
});

/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  //setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main
