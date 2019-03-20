
/* classes */ 

// Color constructor
class Color {
    constructor(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end try
        
        catch (e) {
            console.log(e);
        }
    } // end Color constructor

        // Color change method
    change(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end throw
        
        catch (e) {
            console.log(e);
        }
    } // end Color change method
} // end color class

/* utility functions */

// draw a pixel at x,y using color
function drawPixel(imagedata,x,y,color) {
    try {
        if ((typeof(x) !== "number") || (typeof(y) !== "number"))
            throw "drawpixel location not a number";
        else if ((x<0) || (y<0) || (x>=imagedata.width) || (y>=imagedata.height))
            throw "drawpixel location outside of image";
        else if (color instanceof Color) {
            var pixelindex = (y*imagedata.width + x) * 4;
            imagedata.data[pixelindex] = color.r;
            imagedata.data[pixelindex+1] = color.g;
            imagedata.data[pixelindex+2] = color.b;
            imagedata.data[pixelindex+3] = color.a;
        } else 
            throw "drawpixel color is not a Color";
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end drawPixel

function truncate(number) {
	var truncatedNumber = (Math.round(number * Math.pow(10,5)))/Math.pow(10,5);
	return truncatedNumber;
}

// get dot product
function dot(a, b) {
	return truncate(a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
}

// get cross product
function cross(a, b) {
  return [truncate(a[1]*b[2] - a[2]*b[1]),
          truncate(a[2]*b[0] - a[0]*b[2]),
          truncate(a[0]*b[1] - a[1]*b[0])];
}

// normalize vector
function normalize(v) {
	var lenDenom = 1/Math.sqrt(dot(v,v));
	return([truncate(lenDenom * v[0]), truncate(lenDenom * v[1]), truncate(lenDenom * v[2])]);

} // end normalize

function shadePixel(imagedata,pixX,pixY,light,color,triangle,ray,normal,intersection) {
        var newColor = new Color(0,0,0,255);
        light = normalize(light);
        intersection = normalize(intersection);
        lVect = [light[0] - intersection[0],light[1] - intersection[1],light[2] - intersection[2]];
        lVect = normalize(lVect); // normalize light vector
        normal = normalize(normal); // normalize normal vector
        var distance = 1/Math.sqrt(dot(light,light));
        distance = distance * distance;
        var NdotL = Math.max(dot(normal, lVect), 0.0);
        
        var negInt = [intersection[0]*-1,intersection[1]*-1,intersection[2]*-1];
        var view = normalize(negInt);
        var halfway = [lVect[0] + view[0], lVect[1] + view[1], lVect[2] + view[2]];
        halfway = normalize(halfway); // normalize halfway vector
        var NdotH = Math.max(dot(normal, halfway), 0.0);

        // calc diffuse color
        difColorR = truncate((triangle.material.diffuse[0]*255) * (color.r/255) * NdotL);
        difColorG = truncate((triangle.material.diffuse[1]*255) * (color.g/255) * NdotL);
        difColorB = truncate((triangle.material.diffuse[2]*255) * (color.b/255) * NdotL);
                
        // calc specular color
        specColorR = truncate((triangle.material.specular[0]*255) * (color.r/255) * truncate(Math.pow(NdotH,triangle.material.n+1)));
        specColorG = truncate((triangle.material.specular[1]*255) * (color.g/255) * truncate(Math.pow(NdotH,triangle.material.n+1)));
        specColorB = truncate((triangle.material.specular[2]*255) * (color.b/255) * truncate(Math.pow(NdotH,triangle.material.n+1)));
        //console.log("specColorR: " + truncate(Math.pow(NdotH,triangle.material.n+1)));
        
        // calc ambient color
        ambiColorR = triangle.material.ambient[0]*255 * (color.r/255);
        ambiColorG = triangle.material.ambient[1]*255 * (color.g/255);
        ambiColorB = triangle.material.ambient[2]*255 * (color.b/255);
        
        // calc overall color
        newColor.r = truncate(difColorR + specColorR + ambiColorR);
        newColor.g = truncate(difColorG + specColorG + ambiColorG);
        newColor.b = truncate(difColorB + specColorB + ambiColorB);
        
        drawPixel(imagedata,pixX,pixY,newColor);
} // end shade pixel

//get the input triangles from the standard class URL
function getInputTriangles() {
    const INPUT_TRIANGLES_URL = 
        "https://ncsucgclass.github.io/prog1/triangles.json";
        
    // load the triangles file
    var httpReq = new XMLHttpRequest(); // a new http request
    httpReq.open("GET",INPUT_TRIANGLES_URL,false); // init the request
    httpReq.send(null); // send the request
    var startTime = Date.now();
    while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
        if ((Date.now()-startTime) > 3000)
            break;
    } // until its loaded or we time out after three seconds
    if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE)) {
        console.log*("Unable to open input triangles file!");
        return String.null;
    } else
        return JSON.parse(httpReq.response); 
} // end get input triangles

// detect if a given intersection is inside an edge
function side(n,i,v1,v2) {
	var foo = [truncate(i[0] - v1[0]), truncate(i[1] - v1[1]), truncate(i[2] - v1[2])];
	var bar = [truncate(v2[0] - v1[0]), truncate(v2[1] - v1[1]), truncate(v2[2] - v1[2])];
	var sign = truncate(dot(n,(cross(foo, bar))));
	
	if (Math.sign(sign) == 1) {
		return 1;
	}
	else {
		return -1;
	}
} // end side

//put random points in the triangles from the class github
function drawRandPixelsInInputTriangles(context) {
    var inputTriangles = getInputTriangles();
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w,h);
    const PIXEL_DENSITY = 0.1;
    var numCanvasPixels = (w*h)*PIXEL_DENSITY; 
    
    if (inputTriangles != String.null) { 
        var x = 0; var y = 0; // pixel coord init
        var cx = 0; var cy = 0; // init center x and y coord
        var numTrianglePixels = 0; // init num pixels in triangle
        var c = new Color(0,0,0,0); // init the triangle color
        var n = inputTriangles.length; // the number of input files
        //console.log("number of files: " + n);

        // Loop over the triangles, draw rand pixels in each
        for (var f=0; f<n; f++) {
        	var tn = inputTriangles[f].triangles.length;
        	//console.log("number of triangles in this files: " + tn);
        	
        	// Loop over the triangles, draw each in 2d
        	for(var t=0; t<tn; t++){
        		var vertex1 = inputTriangles[f].triangles[t][0];
        		var vertex2 = inputTriangles[f].triangles[t][1];
        		var vertex3 = inputTriangles[f].triangles[t][2];

        		var vertexPos1 = inputTriangles[f].vertices[vertex1];
        		var vertexPos2 = inputTriangles[f].vertices[vertex2];
        		var vertexPos3 = inputTriangles[f].vertices[vertex3];
        		//console.log("vertexPos1 " + vertexPos1);
        		//console.log("vertexPos2 " + vertexPos2);
        		//console.log("vertexPos3 " + vertexPos3);
        		
        		// triangle position on canvas
        		
        		var v1 = [w*vertexPos1[0], h*vertexPos1[1]];
        		var v2 = [w*vertexPos2[0], h*vertexPos2[1]];
        		var v3 = [w*vertexPos3[0], h*vertexPos3[1]];
        		
        		// calculate triangle area on canvas (shoelace formula)
        		var triangleArea = 0.5*Math.abs(v1[0]*v2[1]+v2[0]*v3[1]+v3[0]*v1[1]-v2[0]*v1[1]-v3[0]*v2[1]-v1[0]*v3[1]);
        		var numTrianglePixels = triangleArea; // init num pixels in triangle
            	//console.log("triangle area " + triangleArea);
            	numTrianglePixels *= PIXEL_DENSITY; // percentage of triangle area to render to pixels
            	numTrianglePixels = Math.round(numTrianglePixels);
            	// console.log("numTrianglePixels " + numTrianglePixels);
            	c.change(
            		inputTriangles[f].material.diffuse[0]*255,
                	inputTriangles[f].material.diffuse[1]*255,
                	inputTriangles[f].material.diffuse[2]*255,
                	255); // triangle diffuse color
            	for (var p=0; p<numTrianglePixels; p++) {
                    var point; // on canvas plane
            		var triangleTest = 0;
            		while (triangleTest == 0 ){ //if the pixel outside the triangle
                  
            			point = [Math.floor(Math.random()*w), Math.floor(Math.random()*h)];
                    	// plane checking
            			
                    	var t1 = ((point[0]-v2[0]) * (v1[1] - v2[1]) - (v1[0] - v2[0]) * (point[1] - v2[1])) < 0.0;
                    	var t2 = ((point[0]-v3[0]) * (v2[1] - v3[1]) - (v2[0] - v3[0]) * (point[1] - v3[1])) < 0.0;
                    	var t3 = ((point[0]-v1[0]) * (v3[1] - v1[1]) - (v3[0] - v1[0]) * (point[1] - v1[1])) < 0.0;
                    	
                    	if((t1==t2)&&(t2==t3)) // draw the pixel if inside the triangle
                    		triangleTest = 1;
            		}
            		drawPixel(imagedata,point[0],point[1],c);
                	//console.log("color: ("+c.r+","+c.g+","+c.b+")");
                	//console.log("x: "+ x);
                	//console.log("y: "+ y);
            	} // end for pixels in triangle
        	} // end for triangles
    	} // end for files
        context.putImageData(imagedata, 0, 0);
    } // end if triangle file found
} // end draw rand pixels in input triangles

//ray cast the colored triangles in the input file without lighting
function rayCastInputTriangles(context) {
    var inputTriangles = getInputTriangles();
    var width = context.canvas.width;
    var height = context.canvas.height;
    var imagedata = context.createImageData(width,height);
    var eye = [0.5, 0.5, -0.5]; // the eye
	var numPixels = width*height;
    
    if (inputTriangles != String.null) {
        var x = 0; var y = 0; // pixel coord init
        var cx = 0; var cy = 0; // init center x and y coord
        var numTrianglePixels = 0; // init num pixels in triangle
        var c = new Color(0,0,0,255); // init the triangle color
        var n = inputTriangles.length; // the number of input files
        var window = ([1,1,0], [1,0,0], [0,0,0], [0,1,0]); // the viewport window
        
        // loop over each pixel on the screen
		for (var w = 0; w < width; w++) { // For each screen pixel
			for (var h = 0; h < height; h++) {
				c = new Color(0,0,0,255);
				var closestTriangle = -1; //closest triangle to pixel
				var closestDistance = -1;
				// Find the ray from the eye through the pixel
        		var percentWidth = w/width; // convert width to world coordinates
        		var percentHeight = h/height; // convert height to world coordinates
        		var point = [percentWidth, 1 - percentHeight, 0]; // world pixel location
        		var rayVector =[point[0] - eye[0], point[1] - eye[1], point[2] - eye[2]]; // vector from eye to pixel
			 	// Loop over the input files
        		for (var f = 0; f < n; f++) {
        		    var tn = inputTriangles[f].triangles.length; // number of triangles
					// Loop over the triangles
        			for (var t = 0; t < tn; t++) { // For each object in the scene
        				var vertex1 = inputTriangles[f].triangles[t][0];
        				var vertex2 = inputTriangles[f].triangles[t][1];
        				var vertex3 = inputTriangles[f].triangles[t][2];
        				var vertexPos1 = inputTriangles[f].vertices[vertex1];
        				var vertexPos2 = inputTriangles[f].vertices[vertex2];
        				var vertexPos3 = inputTriangles[f].vertices[vertex3];
        				
        				var BA = [truncate(vertexPos2[0]-vertexPos1[0]),truncate(vertexPos2[1]-vertexPos1[1]),truncate(vertexPos2[2]-vertexPos1[2])];
        				var CA = [truncate(vertexPos3[0]-vertexPos1[0]),truncate(vertexPos3[1]-vertexPos1[1]),truncate(vertexPos3[2]-vertexPos1[2])];
        				var normalVector = cross(BA,CA);
        				var planeConstant = truncate(normalVector[0] * vertexPos1[0] + normalVector[1] * vertexPos1[1] + normalVector[2] * vertexPos1[2]);
        				
        				if (dot(normalVector,rayVector) != 0) {
        					var scalarDistance = truncate(planeConstant - dot(normalVector,eye))/(dot(normalVector,rayVector));
        					var intersection = [truncate(eye[0] + rayVector[0] * scalarDistance), truncate(eye[1] + rayVector[1] * scalarDistance), truncate(eye[2] + rayVector[2] * scalarDistance)];
        					
        					// if ray intersects the triangle
        					if (side(normalVector,intersection,vertexPos1,vertexPos2) == side(normalVector,intersection,vertexPos2,vertexPos3) && side(normalVector,intersection,vertexPos2,vertexPos3) == side(normalVector,intersection,vertexPos3,vertexPos1)) {
        						// Record intersection and object
        						if (closestDistance == -1) {
        							closestDistance = scalarDistance;
        							closestTriangle = inputTriangles[f];
        						}
        						if (scalarDistance < closestDistance) {
        							closestDistance = scalarDistance;
        							closestTriangle = inputTriangles[f];
        						}
        							
        					}
        				}
        			} // end of loop over triangles   
        		} // end for files
        		
        		// change pixel to be the color of the closest triangle
        		if (closestTriangle == -1) {
        			drawPixel(imagedata, w, h, c);
        		}
        		else {
        			c.change(
            			closestTriangle.material.diffuse[0]*255,
                		closestTriangle.material.diffuse[1]*255,
                		closestTriangle.material.diffuse[2]*255,
                		255); // triangle diffuse color
                	drawPixel(imagedata, w, h, c);
                }

			} // end of height loop
		} // end of width loop
		context.putImageData(imagedata, 0, 0);
    } // end if triangle file found
} // end ray cast the colored triangles in the input file without lighting

// color triangles with illumination
function illuminateInputTriangles(context) {
    var inputTriangles = getInputTriangles();
    var width = context.canvas.width;
    var height = context.canvas.height;
    var imagedata = context.createImageData(width,height);
    var eye = [0.5, 0.5, -0.5]; // the eye location
    var light = [-3, 1, -0.5]; // the light location
    var lightColor = new Color(255,255,255,255); // the light color
	var numPixels = width*height;
    
    if (inputTriangles != String.null) {
        var x = 0; var y = 0; // pixel coord init
        var cx = 0; var cy = 0; // init center x and y coord
        var numTrianglePixels = 0; // init num pixels in triangle
        var c = new Color(0,0,0,255); // init the triangle color
        var n = inputTriangles.length; // the number of input files
        var window = ([1,1,0], [1,0,0], [0,0,0], [0,1,0]); // the viewport window
        
        // loop over each pixel on the screen
		for (var w = 0; w < width; w++) { // For each screen pixel
			for (var h = 0; h < height; h++) {
				c = new Color(0,0,0,255);
				var closestTriangle = -1; // closest triangle to pixel
				var closestDistance = -1; // distance to closest triangle
				var objectPos = -1; // position of triangle intersection
				var normal = -1; // normal vector to the plane;
				// Find the ray from the eye through the pixel
        		var percentWidth = w/width; // convert width to world coordinates
        		var percentHeight = h/height; // convert height to world coordinates
        		var point = [percentWidth, 1 - percentHeight, 0]; // world pixel location
        		var rayVector =[point[0] - eye[0], point[1] - eye[1], point[2] - eye[2]]; // vector from eye to pixel
        		var lightVector = [point[0] - light[0], point[1] - light[1], point[2] -light[2]];
			 	// Loop over the input files
        		for (var f = 0; f < n; f++) {
        		    var tn = inputTriangles[f].triangles.length; // number of triangles
					// Loop over the triangles
        			for (var t = 0; t < tn; t++) { // For each object in the scene
        				var vertex1 = inputTriangles[f].triangles[t][0];
        				var vertex2 = inputTriangles[f].triangles[t][1];
        				var vertex3 = inputTriangles[f].triangles[t][2];
        				var vertexPos1 = inputTriangles[f].vertices[vertex1];
        				var vertexPos2 = inputTriangles[f].vertices[vertex2];
        				var vertexPos3 = inputTriangles[f].vertices[vertex3];
        				
        				var BA = [truncate(vertexPos2[0]-vertexPos1[0]),truncate(vertexPos2[1]-vertexPos1[1]),truncate(vertexPos2[2]-vertexPos1[2])];
        				var CA = [truncate(vertexPos3[0]-vertexPos1[0]),truncate(vertexPos3[1]-vertexPos1[1]),truncate(vertexPos3[2]-vertexPos1[2])];
        				var normalVector = cross(BA,CA);
        				var planeConstant = truncate(normalVector[0] * vertexPos1[0] + normalVector[1] * vertexPos1[1] + normalVector[2] * vertexPos1[2]);
        				
        				if (dot(normalVector,rayVector) != 0) {
        					var scalarDistance = truncate(planeConstant - dot(normalVector,eye))/(dot(normalVector,rayVector));
        					var intersection = [truncate(eye[0] + rayVector[0] * scalarDistance), truncate(eye[1] + rayVector[1] * scalarDistance), truncate(eye[2] + rayVector[2] * scalarDistance)];
        					
        					// if ray intersects the triangle
        					if (side(normalVector,intersection,vertexPos1,vertexPos2) == side(normalVector,intersection,vertexPos2,vertexPos3) && side(normalVector,intersection,vertexPos2,vertexPos3) == side(normalVector,intersection,vertexPos3,vertexPos1)) {
        						// Record intersection and object
        						if (closestDistance == -1) {
        							closestDistance = scalarDistance;
        							closestTriangle = inputTriangles[f];
        							objectPos = intersection;
        							normal = normalVector;
        						}
        						if (scalarDistance < closestDistance) {
        							closestDistance = scalarDistance;
        							closestTriangle = inputTriangles[f];
        							objectPos = intersection;
        							normal = normalVector;
        						}
        							
        					}
        				}
        			} // end of loop over triangles   
        		} // end for files
        		
        		// change pixel to be the color of the closest triangle
        		if (closestTriangle == -1) {
        			drawPixel(imagedata, w, h, c);
        		}
        		else {
                	shadePixel(imagedata, w, h, lightVector, lightColor, closestTriangle, rayVector, normal, objectPos);
                }
			} // end of height loop
		} // end of width loop
		context.putImageData(imagedata, 0, 0);
    } // end if triangle file found
} // end illuminate triangles

//draw 2d projections traingle from the JSON file at class github
function drawInputTrainglesUsingPaths(context) {
    var inputTriangles = getInputTriangles();
    
    if (inputTriangles != String.null) { 
        var c = new Color(0,0,0,0); // the color at the pixel: black
        var w = context.canvas.width;
        var h = context.canvas.height;
        var n = inputTriangles.length; 
        //console.log("number of files: " + n);

        // Loop over the input files
        for (var f=0; f<n; f++) {
        	var tn = inputTriangles[f].triangles.length;
        	//console.log("number of triangles in this files: " + tn);
        	
        	// Loop over the triangles, draw each in 2d
        	for(var t=0; t<tn; t++){
        		var vertex1 = inputTriangles[f].triangles[t][0];
        		var vertex2 = inputTriangles[f].triangles[t][1];
        		var vertex3 = inputTriangles[f].triangles[t][2];

        		var vertexPos1 = inputTriangles[f].vertices[vertex1];
        		var vertexPos2 = inputTriangles[f].vertices[vertex2];
        		var vertexPos3 = inputTriangles[f].vertices[vertex3];
        		//console.log("vertexPos1 " + vertexPos1);
        		//console.log("vertexPos2 " + vertexPos2);
        		//console.log("vertexPos3 " + vertexPos3);
        		
            	context.fillStyle = 
            	    "rgb(" + Math.floor(inputTriangles[f].material.diffuse[0]*255)
            	    +","+ Math.floor(inputTriangles[f].material.diffuse[1]*255)
            	    +","+ Math.floor(inputTriangles[f].material.diffuse[2]*255) +")"; // diffuse color
            
            	var path=new Path2D();
            	path.moveTo(w*vertexPos1[0],h*vertexPos1[1]);
            	path.lineTo(w*vertexPos2[0],h*vertexPos2[1]);
            	path.lineTo(w*vertexPos3[0],h*vertexPos3[1]);
            	path.closePath();
            	context.fill(path);

        	} // end for triangles
        } // end for files
    } // end if triangle files found
} // end draw input triangles

/* main -- here is where execution begins after window load */

function main() {

    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
 
    // Create the image
    
    //drawRandPixelsInInputTriangles(context);
    // shows how to draw pixels and read input file
    
    //rayCastInputTriangles(context);
	//ray cast the colored triangles in the input file without lighting
	
	illuminateInputTriangles(context);
	// color triangles with illumination
	
    //drawInputTrainglesUsingPaths(context);
    // shows how to read input file, but not how to draw pixels
}