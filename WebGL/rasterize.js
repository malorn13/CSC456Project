/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
var Eye = new vec4.fromValues(0.2, 0.5, 0.1, 1.0); // default eye position in world space
var viewUp = new vec3.fromValues(0.0, 1.0, 0.0); // look up vector
var center = new vec3.fromValues(0.0, 0.0, 1.0); // look at vector
var lookAt = new vec3.fromValues(0.2, 0.5, 0.6); // center of view
var projection = mat4.create(); // projection matrix
var modelview = mat4.create(); // modelview matrix
var mode = 0; // mode for Phong vs Blinn-Phong

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexNormalAttrib; // where to put the normal for vertex shader
var vertexDiffuseAttrib; // where to put the diffuse color for fragment shader
var vertexSpecularAttrib; // where to put the specular color for fragment shader
var vertexAmbientAttrib; // where to put the ambient color for fragment shader
var vertexReflectivityAttrib; // where to put the reflectivity for fragment shader
var normalBuffer; // this contains normal coordinates in triples
var diffuseBuffer; // this contains diffuse values in triples
var specularBuffer; // this contains specular values in triples
var ambientBuffer; // this contains ambient values in triples
var reflectivityBuffer; // this contains reflectivity values
var angY = 0;
var angX = 0;
var lookAtX = lookAt[0];
var lookAtY = lookAt[1];
var lookAtZ = lookAt[2];
var num = 0;
var highlight = -1;
var specInt = 0;
var ambiW = 1;
var diffW = 1;
var specW = 1;
var inputTriangles;
var transform = mat4.create();
var rotate = [0, 0, 0];
var rotX = 0;
var rotY = 0;
var rotZ = 0;
var shaderProgram = null
var vertexSet = [];
var translation = [0, 0, 0];
var specInt = 0;
var ref = 0;
var diffW = 1;
var diff = 1;
var ambiW = 1;
var ambi = 1;
var specW = 1;
var spec = 1;

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it

    try {
        if (gl == null) {
            throw "unable to create gl context -- is your browser gl ready?";
        } else {
            gl.clearColor(1.0, 1.0, 1.0, 1.0); // use black when we clear the frame buffer
            gl.clearDepth(1.0); // use max when we clear the depth buffer
            gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
        }
    } // end try

    catch (e) {
        console.log(e);
    } // end catch

} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles() {
    inputTriangles = [
        {
            "material": {
                "ambient": [
                    0.1,
                    0.1,
                    0.1
                ],
                "diffuse": [
                    0.6,
                    0.4,
                    0.4
                ],
                "specular": [
                    0.3,
                    0.3,
                    0.3
                ],
                "n": 11
            },
            "vertices": [
                [
                    0.15,
                    0.6,
                    0.75
                ],
                [
                    0.25,
                    0.9,
                    0.75
                ],
                [
                    0.35,
                    0.6,
                    0.75
                ]
            ],
            "normals": [
                [
                    0,
                    0,
                    -1
                ],
                [
                    0,
                    0,
                    -1
                ],
                [
                    0,
                    0,
                    -1
                ]
            ],
            "triangles": [
                [
                    0,
                    1,
                    2
                ]
            ]
        },
        {
            "material": {
                "ambient": [
                    0.1,
                    0.1,
                    0.1
                ],
                "diffuse": [
                    0.6,
                    0.6,
                    0.4
                ],
                "specular": [
                    0.3,
                    0.3,
                    0.3
                ],
                "n": 17
            },
            "vertices": [
                [
                    0.15,
                    0.15,
                    0.75
                ],
                [
                    0.15,
                    0.35,
                    0.75
                ],
                [
                    0.35,
                    0.35,
                    0.75
                ],
                [
                    0.35,
                    0.15,
                    0.75
                ]
            ],
            "normals": [
                [
                    0,
                    0,
                    -1
                ],
                [
                    0,
                    0,
                    -1
                ],
                [
                    0,
                    0,
                    -1
                ],
                [
                    0,
                    0,
                    -1
                ]
            ],
            "triangles": [
                [
                    0,
                    1,
                    2
                ],
                [
                    2,
                    3,
                    0
                ]
            ]
        }
    ];
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
        var diffuseArray = [];
        var diffuseToAdd = vec3.create();
        var specularArray = [];
        var specularToAdd = vec3.create();
        var ambientArray = [];
        var ambientToAdd = vec3.create();
        var reflectivityArray = [];

        for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
            vec3.set(indexOffset, vertexBufferSize, vertexBufferSize, vertexBufferSize);

            // set up the vertex coord array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++) {
                vertexSet.push(whichSet);
                vertexToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                coordArray.push(vertexToAdd[0], vertexToAdd[1], vertexToAdd[2]);
            }

            // set up the triangle array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd, indexOffset, inputTriangles[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0], triToAdd[1], triToAdd[2]);
            }

            // set up the normal array
            for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].normals.length; whichSetVert++) {
                normalToAdd = inputTriangles[whichSet].normals[whichSetVert];
                normalArray.push(normalToAdd[0], normalToAdd[1], normalToAdd[2]);
            }

            // set up the diffuse color array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                diffuseToAdd = inputTriangles[whichSet].material.diffuse;
                diffuseArray.push(diffuseToAdd[0], diffuseToAdd[1], diffuseToAdd[2]);
                diffuseArray.push(diffuseToAdd[0], diffuseToAdd[1], diffuseToAdd[2]);
                diffuseArray.push(diffuseToAdd[0], diffuseToAdd[1], diffuseToAdd[2]);
            }

            // set up the specular color array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                specularToAdd = inputTriangles[whichSet].material.specular;
                specularArray.push(specularToAdd[0], specularToAdd[1], specularToAdd[2]);
                specularArray.push(specularToAdd[0], specularToAdd[1], specularToAdd[2]);
                specularArray.push(specularToAdd[0], specularToAdd[1], specularToAdd[2]);
            }

            // set up the ambient color array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                ambientToAdd = inputTriangles[whichSet].material.ambient;
                ambientArray.push(ambientToAdd[0], ambientToAdd[1], ambientToAdd[2]);
                ambientArray.push(ambientToAdd[0], ambientToAdd[1], ambientToAdd[2]);
                ambientArray.push(ambientToAdd[0], ambientToAdd[1], ambientToAdd[2]);
            }

            // set up the reflectivity coefficient array
            for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
                reflectivityArray.push(inputTriangles[whichSet].material.n);
                reflectivityArray.push(inputTriangles[whichSet].material.n);
                reflectivityArray.push(inputTriangles[whichSet].material.n);
            }

            vertexBufferSize += inputTriangles[whichSet].vertices.length;
            triBufferSize += inputTriangles[whichSet].triangles.length;

        } // end for each triangle set
        num = inputTriangles.length;
        triBufferSize *= 3

        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW); // coords to that buffer

        normalBuffer = gl.createBuffer(); // init empty index buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray), gl.STATIC_DRAW); // coords to that buffer

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

        triangleBuffer = gl.createBuffer(); // init empty index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW); // coords to that buffer

    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
    	precision mediump float;
    	
    	varying vec3 normalInterp; // vertex normal
    	varying vec3 vertPos; // vertex position
    	varying vec3 diffuseColor; // vertex diffuse
    	varying vec3 specularColor; // vertex specular
    	varying vec3 ambientColor; // vertex ambient
    	varying float reflectivity; // vertex reflectivity
    	
    	uniform int mode; // Phong or Blinn-Phong lighting, 0 or 1
    	uniform float refE, diffW, ambiW, specW;

        const vec3 lightPos = vec3(-3, 1, -0.5); // light position
        
        void main(void) {
        	gl_FragColor = vec4(diffuseColor, 1.0);
        }
        
    `;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 vertexNormal;
        attribute vec3 vDiff; // vertex diffuse
        attribute vec3 vSpec; // vertex specular
        attribute vec3 vAmbi; // vertex ambient
        attribute float reflect; // vertex reflectivity
        
        uniform mat4 projection, modelview, transform; // matrices

        varying vec3 normalInterp; // vertex normal
    	varying vec3 vertPos; // vertex position
    	varying vec3 diffuseColor; // vertex diffuse
    	varying vec3 specularColor; // vertex specular
    	varying vec3 ambientColor; // vertex ambient
    	varying float reflectivity; // vertex reflectivity
                
        void main(void) {
            vertPos = vertexPosition;
            normalInterp = vertexNormal;
        	diffuseColor = vDiff;
        	specularColor = vSpec;
        	ambientColor = vAmbi;
        	reflectivity = reflect;
            gl_Position = projection * modelview * transform * vec4(vertexPosition, 1.0);
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

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 

    catch (e) {
        console.log(e);
        debugger;
    } // end catch
} // end setup shaders

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    var bgColor = (bgColor < 1) ? (bgColor + 0.001) : 0;
    gl.clearColor(bgColor, 0, 0, 1.0);
    var scale = [1, 1, 1];
    //requestAnimationFrame(renderTriangles);
    setupShaders();

    for (var i = 0; i < triBufferSize; i += 3) {

        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // activate
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer); // activate
        gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer); // activate
        gl.vertexAttribPointer(vertexDiffuseAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer); // activate
        gl.vertexAttribPointer(vertexSpecularAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer); // activate
        gl.vertexAttribPointer(vertexAmbientAttrib, 3, gl.FLOAT, false, 0, 0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, reflectivityBuffer); // activate
        gl.vertexAttribPointer(vertexReflectivityAttrib, 1, gl.FLOAT, false, 0, 0); // feed

        if (vertexSet[i] == highlight) {
            mat4.identity(transform);
            mat4.translate(transform, transform, translation);
            mat4.rotateX(transform, transform, rotX * (Math.PI / 180));
            mat4.rotateY(transform, transform, rotY * (Math.PI / 180));
            mat4.rotateZ(transform, transform, rotZ * (Math.PI / 180));
            scale = [1.2, 1.2, 1.2];

            ref = specInt;
            diff = diffW;
            ambi = ambiW;
            spec = specW;
        }
        else {
            scale = [1.0, 1.0, 1.0];
            ref = 0;
            diff = 1;
            ambi = 1;
            spec = 1;
        }

        mat4.perspective(projection, (90 * Math.PI / 180), (gl.canvas.clientWidth / gl.canvas.clientHeight), 0.1, 100);
        mat4.lookAt(modelview, Eye, lookAt, viewUp);
        mat4.scale(transform, transform, scale);

        var transformUni = gl.getUniformLocation(shaderProgram, "transform");
        gl.uniformMatrix4fv(transformUni, false, transform);

        var modeUni = gl.getUniformLocation(shaderProgram, "mode");
        gl.uniform1i(modeUni, mode);

        var refUni = gl.getUniformLocation(shaderProgram, "refE");
        gl.uniform1f(refUni, ref);

        var diffUni = gl.getUniformLocation(shaderProgram, "diffW");
        gl.uniform1f(diffUni, diff);

        var ambiUni = gl.getUniformLocation(shaderProgram, "ambiW");
        gl.uniform1f(ambiUni, ambi);

        var specUni = gl.getUniformLocation(shaderProgram, "specW");
        gl.uniform1f(specUni, spec);

        var projectionUni = gl.getUniformLocation(shaderProgram, "projection");
        gl.uniformMatrix4fv(projectionUni, false, projection);

        var modelviewUni = gl.getUniformLocation(shaderProgram, "modelview");
        gl.uniformMatrix4fv(modelviewUni, false, modelview);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, i * 2);

        mat4.identity(transform);
    }

} // end render triangles

/*
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
        var angle = angY * (Math.PI / 180);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        lookAt[0] = lookAtX * cos + lookAtZ * sin;
        lookAt[2] = -lookAtX * sin + lookAtZ * cos;
    }

    // rotate view right around view Y (yaw)
    else if (event.key == "D") {
        angY -= 5;
        var angle = angY * (Math.PI / 180);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        lookAt[0] = lookAtX * cos + lookAtZ * sin;
        lookAt[2] = -lookAtX * sin + lookAtZ * cos;
    }

    // rotate view forward around view X (pitch)
    // need to change viewUp vector
    else if (event.key == "W") {
        angX -= 5;
        var angle = angX * (Math.PI / 180);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        lookAt[1] = lookAtY * cos - lookAtZ * sin;
        lookAt[2] = lookAtY * sin + lookAtZ * cos;
    }

    // rotate view backward around view X (pitch)
    // need to change viewUp vector
    else if (event.key == "S") {
        angX += 5;
        var angle = angX * (Math.PI / 180);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        lookAt[1] = lookAtY * cos - lookAtZ * sin;
        lookAt[2] = lookAtY * sin + lookAtZ * cos;
    }

    // INTERACTIVELY SECLECT MODEL

    // select and highlight the previous triangle set
    else if (event.key == "ArrowLeft") {
        if (highlight == -1) {
            highlight = 0;
        }
        else if (highlight > 0) {
            highlight -= 1;
            specInt = 0;
            ambiW = 1;
            diffW = 1;
            specW = 1;
            vec3.set(translation, 0, 0, 0);
            rotX = 0;
            rotY = 0;
            rotZ = 0;

        }
    }

    // select and highlight the next set
    else if (event.key == "ArrowRight") {
        if (highlight == -1) {
            highlight = 0;
        }
        else if (highlight < num - 1) {
            highlight += 1;
            specInt = 0;
            ambiW = 1;
            diffW = 1;
            specW = 1;
            vec3.set(translation, 0, 0, 0);
            rotX = 0;
            rotY = 0;
            rotZ = 0;
        }
    }

    // deselect and turn off highlight
    else if (event.key == " ") {
        highlight = -1;
        specInt = 0;
        ambiW = 1;
        diffW = 1;
        specW = 1;
        vec3.set(translation, 0, 0, 0);
        rotX = 0;
        rotY = 0;
        rotZ = 0;
    }

    // INTERACTIVELY CHANGE LIGHTING ON A MODEL

    // toggle between Phong and Blinn-Phong lighting
    else if (event.key == "b") {
        if (mode == 0) {
            mode = 1;
        }
        else if (mode == 1) {
            mode = 0;
        }
    }

    // increment the specular integer exponent by 1 (wrap from 20 to 0)
    else if (event.key == "n") {
        if (specInt < 20) {
            specInt++;
        }
        else {
            specInt = 0;
        }
    }

    // increase the ambient weight by 0.1 (wrap from 1 to 0)
    else if (event.key == "1") {
        if (ambiW > 0) {
            ambiW -= 0.1;
        }
        else {
            ambiW = 1;
        }
    }

    // increase the diffuse weight by 0.1 (wrap from 1 to 0)
    else if (event.key == "2") {
        if (diffW > 0) {
            diffW -= 0.1;
        }
        else {
            diffW = 1;
        }
    }

    // increase the specular weight by 0.1 (wrap from 1 to 0)
    else if (event.key == "3") {
        if (specW > 0) {
            specW -= 0.1;
        }
        else {
            specW = 1;
        }
    }

    // INTERACTIVELY TRANSFORM MODELS

    // translate selection left along view X
    else if (event.key == "k") {
        translation[0] += 0.1;
    }

    // translate selection right along view X
    else if (event.key == ";") {
        translation[0] -= 0.1;
    }

    // translate selection forward along view Z
    else if (event.key == "o") {
        translation[2] += 0.1;
    }

    // translate selection backward along view Z
    else if (event.key == "l") {
        translation[2] -= 0.1;
    }

    // translate selection up along view Y
    else if (event.key == "i") {
        translation[1] += 0.1;
    }

    // translate selection down along view Y
    else if (event.key == "p") {
        translation[1] -= 0.1;
    }

    // rotate selection left around view Y (yaw)
    else if (event.key == "K") {
        rotY += 5;
    }

    // rotate selection right around view Y (yaw)
    else if (event.key == ":") {
        rotY -= 5;
    }

    // rotate selection forward around view X (pitch)
    else if (event.key == "O") {
        rotX += 5;
    }

    // rotate selection backward around view X (pitch)
    else if (event.key == "L") {
        rotX -= 5;
    }

    // rotate selection clockwise around view Z (roll)
    else if (event.key == "I") {
        rotZ += 5;
    }

    // rotate selection counterclockwise around view Z (roll)
    else if (event.key == "P") {
        rotX -= 5;
    }

    event.preventDefault();
});
*/


/* MAIN -- HERE is where execution begins after window load */

function main() {

    var i = performance.now();
    setupWebGL(); // set up the webGL environment
    loadTriangles(); // load in the triangles from tri file
    //setupShaders(); // setup the webGL shaders
    renderTriangles(); // draw the triangles using webGL
    console.log("Milliseconds taken: ");
    console.log(performance.now() - i);

} // end main