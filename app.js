(async function () {

    const _WIDTH = 20;
    const _HEIGHT = 20;
    const _ROOM_SIZE = 24;
    const _TILE_SIZE = 8;
    const _ROOMS_PER_TICK = 1;
    const _ROOM_TILE_ID = 7;

    // Start GIF recording.
    const gif = new GIF({
        workers: 4,
        workerScript: './gif/gif.worker.js',
        width: _WIDTH * _ROOM_SIZE,
        height: _HEIGHT * _ROOM_SIZE
    });

    gif.on('start', () => console.log('START'));
    gif.on('finished', function (blob) {
        const image = document.createElement('img');
        image.src = URL.createObjectURL(blob);
        document.body.appendChild(image);
    });


    const rooms = [];
    const stack = [];

    function indexToCoordinates(i) {
        const x = i % _WIDTH;
        const y = Math.floor(i / _WIDTH);
        return {x, y}
    }

    function coordinatesToIndex(x, y) {
        if (x < 0 || y < 0 || x > _WIDTH - 1 || y > _HEIGHT - 1) {
            return -1;
        }
        return x + y * _WIDTH;
    }

    function openWalls(a, b) {

        const horizontal = a.x - b.x;
        const vertical = a.y - b.y;

        if (horizontal === 1) {
            a.west = false;
            b.east = false;
        } else if (horizontal === -1) {
            a.east = false;
            b.west = false;
        } else if (vertical === 1) {
            a.north = false;
            b.south = false;
        } else if (vertical === -1) {
            a.south = false;
            b.north = false;
        }
    }

    function findRandomNeighbor({x, y}) {

        const neighbors = [];

        const north = rooms[coordinatesToIndex(x, y - 1)];
        const east = rooms[coordinatesToIndex(x + 1, y)];
        const south = rooms[coordinatesToIndex(x, y + 1)];
        const west = rooms[coordinatesToIndex(x - 1, y)];

        if (north && !north?.visited) {
            neighbors.push(north);
        }
        if (east && !east?.visited) {
            neighbors.push(east);
        }
        if (south && !south?.visited) {
            neighbors.push(south);
        }
        if (west && !west?.visited) {
            neighbors.push(west);
        }

        if (neighbors.length) {
            const rnd = Math.floor(Math.random() * neighbors.length);
            return neighbors[rnd];
        } else {
            return undefined;
        }
    }

    // Load sprite with gradients.
    const sprite = await new Promise(resolve => {
        const image = document.createElement('img');
        image.onload = () => resolve(image);
        image.src = 'sprite.png';
    })

    // Create offscreen canvas tile set.
    const tiles = [];
    for (let i = 0; i < (sprite.width / _TILE_SIZE); i++) {
        const canvas = new OffscreenCanvas(8, 8);
        const context = canvas.getContext('2d');
        const sy = i * _TILE_SIZE;
        context.drawImage(sprite, sy, 0, _TILE_SIZE, _TILE_SIZE, 0, 0, _TILE_SIZE, _TILE_SIZE);
        tiles.push(canvas);
    }

    // Create canvas.
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = _WIDTH * _ROOM_SIZE;
    canvas.height = _HEIGHT * _ROOM_SIZE;
    document.body.appendChild(canvas);

    // Draw random background.
    for (let i = 0; i < (_WIDTH * _HEIGHT) * Math.pow(_ROOM_SIZE / _TILE_SIZE, 2); i++) {
        const x = (i % (_WIDTH * 3)) * _TILE_SIZE;
        const y = Math.floor(i / (_WIDTH * 3)) * _TILE_SIZE;
        context.drawImage(tiles[Math.floor(Math.random() * 4)], x, y);
    }

    // Create rooms.
    for (let i = 0; i < _WIDTH * _HEIGHT; i++) {
        const {x, y} = indexToCoordinates(i);
        const room = {
            x,
            y,
            north: true,
            east: true,
            south: true,
            west: true,
            visited: false
        }
        rooms.push(room);
    }

    let current = rooms[0];

    function update() {

        current.visited = true;

        // Get a random, unvisited, neighbor.
        const next = findRandomNeighbor(current);

        if (next) {

            next.visited = true;

            // Push current to stack
            stack.push(current);

            // Open the walls between current and next.
            openWalls(current, next);

            // Next as current and mark as visited.
            current = next;

        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            current = undefined;
        }

    }

    function render() {
        rooms.forEach((room) => {

            const x = room.x * _ROOM_SIZE;
            const y = room.y * _ROOM_SIZE;

            if (room.visited) {
                if (room === current) {
                    context.drawImage(tiles[0], x + _TILE_SIZE, y + _TILE_SIZE);
                } else {
                    context.drawImage(tiles[_ROOM_TILE_ID], x + _TILE_SIZE, y + _TILE_SIZE);
                }
            }

            // North
            if (!room.north) {
                context.drawImage(tiles[_ROOM_TILE_ID], x + _TILE_SIZE, y);
            }

            // East
            if (!room.east) {
                context.drawImage(tiles[_ROOM_TILE_ID], x + _TILE_SIZE * 2, y + _TILE_SIZE);
            }

            // South
            if (!room.south) {
                context.drawImage(tiles[_ROOM_TILE_ID], x + _TILE_SIZE, y + _TILE_SIZE * 2);
            }

            // West
            if (!room.west) {
                context.drawImage(tiles[_ROOM_TILE_ID], x, y + _TILE_SIZE);
            }
        });

        gif.addFrame(context, {copy: true, delay: 20});
    }

    function tick() {

        for (let i = 0; i < _ROOMS_PER_TICK; i++) {
            update();
        }
        render();

        if (rooms.find(room => !room.visited)) {
            requestAnimationFrame(tick);
        } else {
            gif.render();
        }

    }

    tick();


}())
