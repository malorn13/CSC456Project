
/* classes */

// Color constructor
class Color {
	constructor(r, g, b, a) {
		try {
			if ((typeof (r) !== "number") || (typeof (g) !== "number") || (typeof (b) !== "number") || (typeof (a) !== "number"))
				throw "color component not a number";
			else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
				throw "color component less than 0";
			else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
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
	change(r, g, b, a) {
		try {
			if ((typeof (r) !== "number") || (typeof (g) !== "number") || (typeof (b) !== "number") || (typeof (a) !== "number"))
				throw "color component not a number";
			else if ((r < 0) || (g < 0) || (b < 0) || (a < 0))
				throw "color component less than 0";
			else if ((r > 255) || (g > 255) || (b > 255) || (a > 255))
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
function drawPixel(imagedata, x, y, color) {
	try {
		if ((typeof (x) !== "number") || (typeof (y) !== "number"))
			throw "drawpixel location not a number";
		else if ((x < 0) || (y < 0) || (x >= imagedata.width) || (y >= imagedata.height))
			throw "drawpixel location outside of image";
		else if (color instanceof Color) {
			var pixelindex = (y * imagedata.width + x) * 4;
			imagedata.data[pixelindex] = color.r;
			imagedata.data[pixelindex + 1] = color.g;
			imagedata.data[pixelindex + 2] = color.b;
			imagedata.data[pixelindex + 3] = color.a;
		} else
			throw "drawpixel color is not a Color";
	} // end try

	catch (e) {
		console.log(e);
	}
} // end drawPixel

function truncate(number) {
	var truncatedNumber = (Math.round(number * Math.pow(10, 5))) / Math.pow(10, 5);
	return truncatedNumber;
}

// get dot product
function dot(a, b) {
	return truncate(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
}

// get cross product
function cross(a, b) {
	return [truncate(a[1] * b[2] - a[2] * b[1]),
	truncate(a[2] * b[0] - a[0] * b[2]),
	truncate(a[0] * b[1] - a[1] * b[0])];
}

// normalize vector
function normalize(v) {
	var lenDenom = 1 / Math.sqrt(dot(v, v));
	return ([truncate(lenDenom * v[0]), truncate(lenDenom * v[1]), truncate(lenDenom * v[2])]);

} // end normalize

function shadePixel(imagedata, pixX, pixY, light, color, triangle, normal, intersection) {
	var newColor = new Color(0, 0, 0, 255);
	light = normalize(light);
	intersection = normalize(intersection);
	lVect = [light[0] - intersection[0], light[1] - intersection[1], light[2] - intersection[2]];
	lVect = normalize(lVect); // normalize light vector
	normal = normalize(normal); // normalize normal vector
	var distance = 1 / Math.sqrt(dot(light, light));
	distance = distance * distance;
	var NdotL = Math.max(dot(normal, lVect), 0.0);

	var negInt = [intersection[0] * -1, intersection[1] * -1, intersection[2] * -1];
	var view = normalize(negInt);
	var halfway = [lVect[0] + view[0], lVect[1] + view[1], lVect[2] + view[2]];
	halfway = normalize(halfway); // normalize halfway vector
	var NdotH = Math.max(dot(normal, halfway), 0.0);

	// calc diffuse color
	difColorR = truncate((triangle.material.diffuse[0] * 255) * (color.r / 255) * NdotL);
	difColorG = truncate((triangle.material.diffuse[1] * 255) * (color.g / 255) * NdotL);
	difColorB = truncate((triangle.material.diffuse[2] * 255) * (color.b / 255) * NdotL);

	// calc specular color
	specColorR = truncate((triangle.material.specular[0] * 255) * (color.r / 255) * truncate(Math.pow(NdotH, triangle.material.n + 1)));
	specColorG = truncate((triangle.material.specular[1] * 255) * (color.g / 255) * truncate(Math.pow(NdotH, triangle.material.n + 1)));
	specColorB = truncate((triangle.material.specular[2] * 255) * (color.b / 255) * truncate(Math.pow(NdotH, triangle.material.n + 1)));
	//console.log("specColorR: " + truncate(Math.pow(NdotH,triangle.material.n+1)));

	// calc ambient color
	ambiColorR = triangle.material.ambient[0] * 255 * (color.r / 255);
	ambiColorG = triangle.material.ambient[1] * 255 * (color.g / 255);
	ambiColorB = triangle.material.ambient[2] * 255 * (color.b / 255);

	// calc overall color
	newColor.r = truncate(difColorR + specColorR + ambiColorR);
	newColor.g = truncate(difColorG + specColorG + ambiColorG);
	newColor.b = truncate(difColorB + specColorB + ambiColorB);

	drawPixel(imagedata, pixX, pixY, newColor);
} // end shade pixel

// detect if a given intersection is inside an edge
function side(n, i, v1, v2) {
	var foo = [truncate(i[0] - v1[0]), truncate(i[1] - v1[1]), truncate(i[2] - v1[2])];
	var bar = [truncate(v2[0] - v1[0]), truncate(v2[1] - v1[1]), truncate(v2[2] - v1[2])];
	var sign = truncate(dot(n, (cross(foo, bar))));

	if (Math.sign(sign) == 1) {
		return 1;
	}
	else {
		return -1;
	}
} // end side

function fillTriangle(imageData, v0, v1, v2) {
	var minX = Math.floor(Math.min(v0.x, v1.x, v2.x));
	var maxX = Math.ceil(Math.max(v0.x, v1.x, v2.x));
	var minY = Math.floor(Math.min(v0.y, v1.y, v2.y));
	var maxY = Math.ceil(Math.max(v0.y, v1.y, v2.y));

	var data = imageData.data;
	var width = imageData.width;

	// p is our 2D pixel location point
	var p = {};

	for (var y = minY; y < maxY; y++) {
		for (var x = minX; x < maxX; x++) {
			// sample from the center of the pixel, not the top-left corner
			p.x = x + 0.5; p.y = y + 0.5;

			// if the point is not inside our polygon, skip fragment
			if (cross(v1, v2, p) < 0 || cross(v2, v0, p) < 0 || cross(v0, v1, p) < 0) {
				continue;
			}

			// set pixel
			var index = (y * width + x) * 4;
			data[index] = 255;
			data[index + 1] = 255;
			data[index + 2] = 255;
			data[index + 3] = 255;
		}
	}
}

/* main -- here is where execution begins after window load */

function main() {

	// Get the canvas and context
	var canvas = document.getElementById("viewport");
	var context = canvas.getContext("3d");

	// Create the image

}