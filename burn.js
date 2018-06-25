// Config
const LOGGING = false;
let config = {
    trafficWeight: "linear",
    distanceWeight: "square",
    nodeCount: 30,
    packetSpawnChance: 1 / 60,
    addRemoveNodes: true,
    addRemoveChance: 1 / 100,
    packetOfDeath: false,
    deadNodeTTL: 10 * 60
};
// Globals
const nav = new Map();
let frameCount = 0;
let Scene = null;
function log(str) {
    if (LOGGING)
        console.log(str);
}
let getId = (function () {
    let id = 0;
    return function getId() { return id += 1; };
}());
function randomSelection(target) {
    const index = Math.floor(Math.random() * target.length);
    return target[index];
}
// Data Types
class Packet {
    constructor(target, isPOD = false) {
        this.id = getId();
        this.target = target;
        this.isPOD = isPOD;
        this.TAToB = null;
        this.TProgress = null;
        this.TSpeed = null;
    }
}
class Pipe {
    constructor(a, b) {
        this.ends = [a, b];
        this._weight = 1;
        this.inflight = new Set();
        let dx = Math.abs(a.position[0] - b.position[0]);
        let dy = Math.abs(a.position[1] - b.position[1]);
        this._length = Math.pow(dx, 2) + Math.pow(dy, 2);
    }
    incrementWeight() {
        this._weight += 1;
    }
    decrementWeight() {
        // this formula stolen verbatim from chemicalburn,
        this._weight = ((this.weight - 1) * 0.99) + 1;
    }
    get weight() {
        let w = this._weight;
        switch (config.trafficWeight) {
            case "none":
                return 1;
            case "linear":
                return w;
            case "sqrt":
                return Math.sqrt(w);
            case "square":
                return Math.pow(w, 2);
            case "exp":
                return Math.min(1e6, Math.exp(w / 3));
            case "log":
                return Math.log(w) + 1;
            case "bell":
                let aw = w / 3 - 2;
                return Math.max(0.01, Math.exp(aw - Math.pow(aw, 2) / 2) * 25);
        }
    }
    get length() {
        let l = this._length;
        switch (config.distanceWeight) {
            case "linear":
                return Math.sqrt(l);
            case "sqrt":
                return Math.pow(l, 0.25) * 5;
            case "square":
                return l / 25;
            case "exp":
                // yes this seems nuts, I'm just copying reference implementation for now
                return Math.min(1e6, Math.exp(Math.sqrt(l) / 10) / 3);
            case "log":
                return Math.max(1, (Math.log(l) / 2 + 1) * 25);
        }
    }
    get cost() {
        if (this.ends[0].isDead || this.ends[1].isDead)
            return Number.MAX_VALUE;
        else
            return this.length / this.weight;
    }
    receive(p, destination) {
        if (!(destination === this.ends[0] || destination === this.ends[1]))
            throw "Requested destination not available";
        log(`P${p.id} received by ${this.toString()}`);
        p.TAToB = destination === this.ends[1];
        p.TProgress = 0;
        p.TSpeed = Math.sqrt(this.weight / this.length) * 0.25;
        this.inflight.add(p);
        this.incrementWeight();
    }
    step() {
        const delivered = new Set();
        // loop through all the inflight packets, updating their status and making note
        // of those which are complete;
        for (let packet of this.inflight) {
            // todo: move weighting func to internal of weight property
            const newProgress = packet.TProgress + packet.TSpeed;
            if (newProgress < 1)
                packet.TProgress = newProgress;
            else
                delivered.add(packet);
        }
        for (let packet of delivered) {
            this.inflight.delete(packet);
            if (packet.TAToB) {
                log(`${packet.toString()} handed off to ${this.ends[1].toString()}`);
                this.ends[1].receive(packet);
            }
            else {
                log(`${packet.toString()} handed off to ${this.ends[0].toString()}`);
                this.ends[0].receive(packet);
            }
        }
        this.decrementWeight();
    }
}
class Hub {
    constructor(x, y) {
        this.position = [x, y];
        this.id = getId();
        this.neighbors = new Map();
        this.isDead = false;
    }
    receive(p) {
        if (p.isPOD)
            this.isDead = true;
        if (p.target === this) {
            if (p.isPOD) {
                let target;
                do {
                    target = randomSelection(Scene[0]);
                } while (target.isDead || !nav.has(target));
                let isPOD = true;
                p = new Packet(target, isPOD);
            }
            else {
                log(`P${p.id} delivered to ${this.id}!`);
                return;
            }
        }
        if (this.neighbors.size === 0)
            throw "No links";
        const nextHop = nav.get(p.target).get(this);
        let target = this.neighbors.get(nextHop);
        if (target !== undefined)
            target.receive(p, nextHop);
    }
}
function generateHub(hubs, pipes, width, height) {
    function addNeighbor(a, b) {
        if (a.neighbors.has(b))
            return;
        const p = new Pipe(a, b);
        pipes.push(p);
        a.neighbors.set(b, p);
        b.neighbors.set(a, p);
    }
    let x = Math.floor(Math.random() * width);
    let y = Math.floor(Math.random() * height);
    let newHub = new Hub(x, y);
    for (let x of hubs) {
        addNeighbor(x, newHub);
        addNeighbor(newHub, x);
    }
    hubs.push(newHub);
}
function generateScene(numHubs, width, height) {
    const hubs = [];
    const pipes = [];
    for (let i = 0; i < numHubs; i++) {
        generateHub(hubs, pipes, width, height);
    }
    return [hubs, pipes];
}
function randInt(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
let intToColor = (function () {
    const colorTable = new Map();
    return function intToColor(i) {
        if (colorTable.has(i))
            return colorTable.get(i);
        else {
            // turns out that random rgb values don't *look* random!
            // so instead randomize hue value of hsl color
            const colorString = `hsl(${randInt(0, 360)},100%,50%)`;
            colorTable.set(i, colorString);
            return colorString;
        }
    };
})();
function render(ctx, scene, height, width) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    const [hubs, pipes] = scene;
    for (let p of pipes) {
        let lineWidth = Math.min(6, (p.weight - 1) / 24);
        let [x1, y1] = p.ends[0].position;
        let [x2, y2] = p.ends[1].position;
        if (lineWidth >= 1 / 255) {
            if (p.ends[0].isDead || p.ends[1].isDead)
                ctx.strokeStyle = "red";
            else
                ctx.strokeStyle = "white";
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        const packetSize = 4;
        for (let packet of p.inflight.keys()) {
            ctx.fillStyle = intToColor(packet.target.id);
            const aToB = packet.TAToB;
            const progress = packet.TProgress;
            if (aToB) {
                let dx = (x2 - x1) * progress;
                let dy = (y2 - y1) * progress;
                ctx.fillRect((x1 + dx) - packetSize / 2, (y1 + dy) - packetSize / 2, packetSize, packetSize);
            }
            else {
                let dx = (x1 - x2) * progress;
                let dy = (y1 - y2) * progress;
                ctx.fillRect((x2 + dx) - packetSize / 2, (y2 + dy) - packetSize / 2, packetSize, packetSize);
            }
        }
    }
    const hubsize = 7;
    for (let h of hubs) {
        if (h.isDead)
            ctx.fillStyle = "red";
        else
            ctx.fillStyle = "white";
        let [x, y] = h.position;
        ctx.fillRect(x - (hubsize / 2), y - (hubsize / 2), hubsize, hubsize);
    }
}
/** Removes the hub from hubs which has the lowest cost in the lookup table */
// todo: replace this with priority queue
function popMinDist(hubs, costLookup) {
    let minDist = Infinity;
    let hub = hubs.values().next().value;
    for (let v of hubs.keys()) {
        let weight = costLookup.get(v);
        if (weight < minDist) {
            minDist = weight;
            hub = v;
        }
    }
    hubs.delete(hub);
    return hub;
}
function dijkstra(graph, source) {
    /** set of all verticies not yet considered by the algorithm */
    const candidateHubs = new Set();
    /** Map of Hub -> shortest path so far from source to Hub  */
    const minPathCost = new Map();
    /** map of hub -> next hop on path to source */
    const prev = new Map();
    for (let v of graph) {
        minPathCost.set(v, Infinity);
        prev.set(v, null);
        candidateHubs.add(v);
    }
    minPathCost.set(source, 0);
    while (candidateHubs.size > 0) {
        const closestHub = popMinDist(candidateHubs, minPathCost);
        for (let [hub, pipe] of closestHub.neighbors) {
            const currentBestCost = minPathCost.get(closestHub) + pipe.cost;
            const prevBestCost = minPathCost.get(hub);
            if (currentBestCost < prevBestCost) {
                minPathCost.set(hub, currentBestCost);
                prev.set(hub, closestHub);
            }
        }
    }
    return prev;
}
function updateNav(hubs) {
    for (let h of hubs) {
        const subnav = dijkstra(hubs, h);
        nav.set(h, subnav);
    }
}
function main() {
    let params = new URLSearchParams(document.location.search);
    for (let k in config) {
        if (params.has(k)) {
            try {
                config[k] = JSON.parse(params.get(k));
            }
            catch (e) {
                config[k] = params.get(k);
            }
        }
        else {
            params.set(k, config[k].toString());
        }
    }
    history.replaceState(0, document.title, "?" + params.toString());
    const height = window.innerHeight;
    const width = window.innerWidth;
    const canvas = document.getElementById('canvas');
    canvas.height = height;
    canvas.width = width;
    const ctx = canvas.getContext('2d');
    Scene = generateScene(config.nodeCount, width, height);
    const [hubs, pipes] = Scene;
    render(ctx, Scene, height, width);
    updateNav(hubs);
    if (config.packetOfDeath) {
        let isPOD = true;
        randomSelection(hubs).receive(new Packet(randomSelection(hubs), isPOD));
    }
    let toRemove = [];
    function renderStep() {
        render(ctx, Scene, height, width);
        if (frameCount % 10 == 0)
            updateNav(hubs);
        for (let i = 0; i < toRemove.length; i++) {
            let [h, t] = toRemove[i];
            if (frameCount - t > config.deadNodeTTL) {
                toRemove.splice(i, 1);
                i -= 1;
                let pos = hubs.indexOf(h);
                hubs.splice(pos, 1);
                for (let [n, p] of h.neighbors) {
                    h.neighbors.delete(n);
                    n.neighbors.delete(h);
                    let pos = pipes.indexOf(p);
                    pipes.splice(pos, 1);
                }
            }
        }
        for (let p of pipes)
            p.step();
        for (let h of hubs) {
            // test nav to make sure we only route to and from packets which we
            // have routing info on
            if (h.isDead || !nav.has(h))
                continue;
            if (Math.random() < config.packetSpawnChance) {
                let target;
                do {
                    target = randomSelection(hubs);
                } while (target.isDead || !nav.has(target));
                h.receive(new Packet(target));
            }
        }
        if (config.addRemoveNodes) {
            let popDelta = (config.nodeCount - Scene[0].length) / config.nodeCount;
            let roll = Math.random();
            let addChance = config.addRemoveChance / 2;
            if (roll < addChance + addChance * popDelta) {
                generateHub(Scene[0], Scene[1], width, height);
            }
            else if (roll < config.addRemoveChance) {
                let hub = randomSelection(hubs);
                hub.isDead = true;
                toRemove.push([hub, frameCount]);
            }
        }
        window.requestAnimationFrame(renderStep);
        frameCount += 1;
    }
    renderStep();
}
main();
