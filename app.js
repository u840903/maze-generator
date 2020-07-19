(async function () {

    const _WIDTH = 40;
    const _HEIGHT = 40;
    const _ROOM_SIZE = 24;
    const _TILE_SIZE = 8;
    const _ROOMS_PER_TICK = 32;

    const corridor = 10;

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

        if (!north?.visited) {
            neighbors.push(north);
        }
        if (!east?.visited) {
            neighbors.push(east);
        }
        if (!south?.visited) {
            neighbors.push(south);
        }
        if (!west?.visited) {
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
        context.drawImage(tiles[Math.floor(Math.random() * 8)], x, y);
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
    current.visited = true;

    function update() {

        // Get a random, unvisited, neighbor.
        const next = findRandomNeighbor(current);

        if (next) {
            // Open the walls between current and next.
            openWalls(current, next);

            // Push current to stack
            stack.push(current);

            // Next as current and mark as visited.
            current = next;
            current.visited = true;

        } else if (stack.length > 0) {
            current = stack.pop();
        }

    }

    function render() {
        rooms.forEach((room) => {

            const x = room.x * _ROOM_SIZE;
            const y = room.y * _ROOM_SIZE;

            if (room.visited) {
                context.drawImage(tiles[corridor], x + _TILE_SIZE, y + _TILE_SIZE);
            }

            // North
            if (!room.north) {
                context.drawImage(tiles[corridor], x + _TILE_SIZE, y);
            }

            // East
            if (!room.east) {
                context.drawImage(tiles[corridor], x + _TILE_SIZE * 2, y + _TILE_SIZE);
            }

            // South
            if (!room.south) {
                context.drawImage(tiles[corridor], x + _TILE_SIZE, y + _TILE_SIZE * 2);
            }

            // West
            if (!room.west) {
                context.drawImage(tiles[corridor], x, y + _TILE_SIZE);
            }
        });

    }

    function tick() {
        for (let i = 0; i < _ROOMS_PER_TICK; i++) {
            update();
        }

        if (rooms.find(cell => !cell.visited)) {
            requestAnimationFrame(tick);
        } else {
            // Add entry and exit.
            rooms[0].north = false;
            rooms[rooms.length - 1].south = false;
        }

        render();

    }

    tick();


}())
