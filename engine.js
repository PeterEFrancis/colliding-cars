
const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");


const SIZE = canvas.height;
const LINE_WIDTH = 1; // works best if this is even


const SOUTH = 1;
const EAST = 2;
const DIAG = 3;
const ANTI = 4;

var num_squares = 300;
var board = [];
var p;

var dir = SOUTH;

var intervalId = 0;

var movement = [undefined, [], [], [], []];

var num_colors = [];

var num_cars;




var elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt, {
	expressions:false,
	keypad:false,
	settingsMenu:false,
	zoomButtons:false,
	lockViewport:true,
	showYAxis: true,
	showXAxis: true,
	xAxisStep: 1,
	xAxisMinorSubdivisions: 1,
	yAxisStep: 1,
	yAxisMinorSubdivisions: 1
});
calculator.setMathBounds({
  left: 0,
  right: 1,
  bottom: 0,
  top: 1
});



function get_random_color() {
	let r = Math.random();
	for (i = 1; i <= num_cars; i++) {
		if (r < i / num_cars) {
			return [SOUTH, EAST, DIAG, ANTI][i - 1];
		}
	}
}


function get_random_color2(num) {
	let r = Math.random();
	let t = (num / num_squares >= num_squares / 2);
	let l = (num % num_squares <= num_squares / 2);
	
	if (t && l) {
		if (r < 1/2) return SOUTH;
		        else return ANTI;
	} else if (t && !l) {
		if (r < 1/2) return EAST;
		        else return ANTI;
	} else if (!t && l) {
		if (r < 1/2) return SOUTH;
			      else return DIAG;
	} else if (!t && !l) {
		if (r < 1/2) return EAST;
			      else return DIAG;
	}
}


//
//    SD   ED
// 
//    SA   EA
// 


function randomize() {

	reset_game();

	for (let i = 0; i < num_squares ** 2; i++) {
		if (Math.random() < p) {
			let color = get_random_color(i);
			board[i] = color;
			num_colors[color] += 1;
		} else {
			board[i] = 0;
		}
	}

	plot();

}


function clear_display() {
	// clear the display
	ctx.clearRect(0, 0, SIZE, SIZE);

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, SIZE, SIZE);
}




function plot() {
	square_size = SIZE / num_squares;
	for (var i = 0; i < num_squares ** 2; i++) {
		let color = ['black', 'red', 'blue', 'green', 'yellow'][board[i]];
		ctx.fillStyle = color;
		var top_left_x = (i % num_squares) * (square_size);
		var top_left_y = (Math.floor(i / num_squares)) * (square_size);
		ctx.fillRect(top_left_x, top_left_y, square_size, square_size);
	}
}



function clear_desmos() {
	for (let j = 1; j <= 4; j++) {
		calculator.setExpression({
			id: j,
			latex: ''
		})
	}
}



function update_display() {
	
	clear_display();

	plot();

	//update desmos
	let points = [];
	// let max = Math.max(...movement.map(x => Math.max(...x)));
	for (let j = 1; j <= num_cars; j++) {
		if (movement[j].length > 0) {
			points = [];
			for (let i = 0 ; i < movement[j].length; i++) {
				points.push([i, movement[j][i] / num_colors[j]]);
			}
			let latex = '[' + points.map(p => '(' + p[0] + ',' + p[1] + ')') + ']';
			calculator.setExpression({
				id: j,
				latex: latex,
				lines: true,
				points: false,
				color: [0, 'red', 'blue', 'green', 'black'][j],
				lineWidth: 1
			});
		}
	}

	calculator.setMathBounds({
	  left: 0,
	  right: movement[1].length,
	  bottom: 0,
	  top: 1
	});

}




function reset_game() {

	// make a new (blank) board array
	board = [];
	for (var i = 0; i < num_squares ** 2; i++) {
		board.push(0);
	}

	movement = [[], [], [], [], []];
	num_colors = [0, 1, 1, 1, 1];

	clear_display();

	clear_desmos();

	clearInterval(intervalId);
}



function cycle_dir() {
	dir = 1 + (dir % num_cars);
}


function step() {
	let new_board = [];
	let count = 0;

	for (i = 0; i < num_squares ** 2; i++) {
		if (board[i] != dir) {
			new_board[i] = board[i];
		}
	}
	for (i = 0; i < num_squares ** 2; i++) {
		if (board[i] == dir) {
			let r = Math.floor(i / num_squares);
			let c = i % num_squares;
			if (dir == EAST) {
				c = (c + 1) % num_squares;
				if (c == 0) r += 1;
			}
			if (dir == SOUTH) {
				r = (r + 1) % num_squares;
				if (r == 0) c += 1;
			}
			if (dir == DIAG) {
				c = (c + 1) % num_squares;
				if (c == 0) r += 1;
				r = (r + 1) % num_squares;
			}
			if (dir == ANTI) {
				c = (c + 1 + num_squares) % num_squares;
				if (c == 0) r += 1;
				r = (r - 1 + num_squares) % num_squares;
			}

			r = (r + num_squares) % num_squares;
			c = (c + num_squares) % num_squares;

			let new_i = r * num_squares + c;
			if (board[new_i] == 0) {
				new_board[new_i] = dir;
				new_board[i] = 0;
				count += 1;
			} else {
				new_board[i] = dir;
			}

		}
	}
	board = new_board;
	update_display();

	return count;
}

function play() {

	num_squares = Number(document.getElementById('n').value)
	p = Number(document.getElementById('p').value);

	num_cars = Number(document.querySelector('input[name="numCars"]:checked').value);

	randomize();

	clearInterval(intervalId);
	intervalId = setInterval(function() {
		let count = step();
		movement[dir].push(count);
		cycle_dir();
		let last = movement.slice(1, num_cars + 1).map(x => x[x.length - 1]).reduce((a, b) => a + b);
		if (last == 0) {
			clearInterval(intervalId);
		}
	}, 10);

}



function clear_board() {
	for (var i = 0; i < num_squares * num_squares; i++) {
		board[i] = 0;
	}
	update_display();
}

