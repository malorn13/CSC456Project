
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

//draw 2d projections traingle from the JSON file at class github
function drawInputTrainglesUsingPaths(context) {
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
					1 - 0.15,
					1 - 0.6,
					1 - 0.75
				],
				[
					1 - 0.25,
					1 - 0.9,
					1 - 0.75
				],
				[
					1 - 0.35,
					1 - 0.6,
					1 - 0.75
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
					1 - 0.15,
					1 - 0.15,
					1 - 0.75
				],
				[
					1 - 0.15,
					1 - 0.35,
					1 - 0.75
				],
				[
					1 - 0.35,
					1 - 0.35,
					1 - 0.75
				],
				[
					1 - 0.35,
					1 - 0.15,
					1 - 0.75
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
		var c = new Color(0, 0, 0, 0); // the color at the pixel: black
		var w = context.canvas.width;
		var h = context.canvas.height;
		var n = inputTriangles.length;

		// Loop over the input files
		for (var f = 0; f < n; f++) {
			var tn = inputTriangles[f].triangles.length;

			// Loop over the triangles, draw each in 2d
			for (var t = 0; t < tn; t++) {
				var vertex1 = inputTriangles[f].triangles[t][0];
				var vertex2 = inputTriangles[f].triangles[t][1];
				var vertex3 = inputTriangles[f].triangles[t][2];

				var vertexPos1 = inputTriangles[f].vertices[vertex1];
				var vertexPos2 = inputTriangles[f].vertices[vertex2];
				var vertexPos3 = inputTriangles[f].vertices[vertex3];

				context.fillStyle =
					"rgb(" + Math.floor(inputTriangles[f].material.diffuse[0] * 255)
					+ "," + Math.floor(inputTriangles[f].material.diffuse[1] * 255)
					+ "," + Math.floor(inputTriangles[f].material.diffuse[2] * 255) + ")"; // diffuse color

				var path = new Path2D();
				path.moveTo(w * vertexPos1[0], h * vertexPos1[1]);
				path.lineTo(w * vertexPos2[0], h * vertexPos2[1]);
				path.lineTo(w * vertexPos3[0], h * vertexPos3[1]);
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

	drawInputTrainglesUsingPaths(context);

	// Create the image

}