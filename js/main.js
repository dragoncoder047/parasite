window.addEventListener("beforeunload", e => {
    e.preventDefault();
    e.returnValue = "foo"; // it doesn't matter what this is except that it isn't ""
    return e.returnValue;
});

/**
 * @param {string} selector
 * @returns {HTMLElement}
 */
function safe$(selector) {
    var elem = document.querySelector(selector);
    if (elem === null) throw new Error("can't find element: " + selector);
    return elem;
}

function noop() { }

const pt = new Pretrainer(
    new PretrainPhase("seekFood", noop, (l, b, s) => {
        s.energy = Math.random() * 300 + 200;
        var mult = 200 / s.energy;
        // place food randomly
        // check to see if snake responds:
        // farther away: move self or tongue
        // turn self or tongue depeding on side
        // eat it if it is close enough
        var sz = gauss(30, 10);
        var theta = gauss(0, Math.PI / 2);
        var dist = gauss(20, 5);
        var pos = Vector.polar(dist, Math.PI / 2 + theta);
        l.addParticle(new FoodParticle(sz, pos, Vector.zero()));
        b.scan(l);
        var action = b.think();
        var distanceToFood = s.tongueTip.minus(pos).length();
        switch (action) {
            case Action.FORWARD:
                b.learn(mult * Math.atan(dist - s.tongueLength));
                s.energy--;
                break;
            case Action.LEFT:
            case Action.RIGHT:
                b.learn(mult * Math.abs(theta) * 5 * (theta < 0 ? -1 : 1) * (action === Action.LEFT ? -1 : 1));
                break;
            case Action.TONGUE_IN:
            case Action.TONGUE_OUT:
            case Action.TONGUE_LEFT:
            case Action.TONGUE_RIGHT:
                s.executeAction(action);
                break;
            case Action.EAT:
                b.learn(mult * sz * (1 / Math.atan(sz - distanceToFood)));
                if (sz > distanceToFood) s.energy += sz;
                break;
            default:
                b.learn(-1);
                // other things are not as desirable
                break;
        }
        // remove old particle
        l.particles = [];
    }),
    // new PretrainPhase("avoidWalls", noop, (l, b, s) => {
    //     // TODO
    // }),
    new PretrainPhase("seekFoodAtAllCostsWhenOutOfEnergy", noop, (l, b, s) => {
        s.energy = clamp(gauss(100, 75), 0, 200);
        var sz = gauss(30, 10);
        var theta = gauss(0, Math.PI / 2);
        var dist = gauss(20, 5);
        var pos = Vector.polar(dist, Math.PI / 2 + theta);
        l.addParticle(new FoodParticle(sz, pos, Vector.zero()));
        b.scan(l);
        var action = b.think();
        var distanceToFood = s.tongueTip.minus(pos).length();
        switch (action) {
            case Action.FORWARD:
                b.learn(-100);
                break;
            case Action.LEFT:
            case Action.RIGHT:
                b.learn(-100);
                break;
            case Action.TONGUE_IN:
            case Action.TONGUE_OUT:
            case Action.TONGUE_LEFT:
            case Action.TONGUE_RIGHT:
                s.executeAction(action);
                break;
            case Action.EAT:
                b.learn(sz * sz * (1 / Math.atan(sz - distanceToFood)));
                break;
            default:
                b.learn(-50);
                break;
        }
        // remove old particle
        l.particles = [];
    }),
);

function makeBigBox(sz = 5000) {
    return [
        new Wall(10, sz, new Vector(-sz / 2, 0)),
        new Wall(10, sz, new Vector(sz / 2, 0)),
        new Wall(sz, 10, new Vector(0, -sz / 2)),
        new Wall(sz, 10, new Vector(0, sz / 2)),
    ];
}

// TODO: add more IO sources
const io = new IOStack();
const player_controls = new MultiControl(

    /*

    Key assignments:

    `=grab  1=reward 2=punish    3         4          6 7            8 9 0 - =
            q=grow                e=eat        5rty=move uj=turn      iop=pheremones
                     wasd=tongue             f            h            kl;'=colors
             z=mate      x=muck    c=mate       gvbn=size  m            ,./=sound

    */

    new Keymap([
        ["ArrowUp", "while-held", Action.FORWARD],
        ["ArrowLeft", "while-held", Action.LEFT],
        ["ArrowRight", "while-held", Action.RIGHT],
        ["a", "while-held", Action.TONGUE_LEFT],
        ["d", "while-held", Action.TONGUE_RIGHT],
        ["s", "while-held", Action.TONGUE_IN],
        ["w", "while-held", Action.TONGUE_OUT],
        ["e", "once", Action.EAT],
        ["q", "once", Action.GROW],
        ["z", "while-held", Action.MATE_H],
        ["c", "while-held", Action.MATE_T],
        ["i", "auto-repeat", Action.PHEREMONE_INC_COLOR],
        ["o", "auto-repeat", Action.PHEREMONE_DEC_COLOR],
        ["p", "while-held", Action.PHEREMONE_RELEASE],
        ["k", "auto-repeat", Action.HEAD_INC_COLOR],
        ["l", "auto-repeat", Action.HEAD_DEC_COLOR],
        [";", "auto-repeat", Action.TAIL_INC_COLOR],
        ["'", "auto-repeat", Action.TAIL_DEC_COLOR],
        [",", "auto-repeat", Action.SOUND_INC_FREQ],
        [".", "auto-repeat", Action.SOUND_DEC_FREQ],
        ["/", "while-held", Action.CHIRP],
        ["x", "once", Action.MUCK],
        ["`", "once", Action.GRAB_RELEASE],
        ["1", "while-held", Action.REWARD],
        ["2", "while-held", Action.PUNISH],
        ["5", "while-held", Action.WORLD_MOVE_U],
        ["r", "while-held", Action.WORLD_MOVE_L],
        ["t", "while-held", Action.WORLD_MOVE_D],
        ["y", "while-held", Action.WORLD_MOVE_R],
        ["u", "while-held", Action.WORLD_TURN_CW],
        ["j", "while-held", Action.WORLD_TURN_CCW],
        ["g", "while-held", Action.WORLD_INCREASE_HEIGHT],
        ["b", "while-held", Action.WORLD_DECREASE_HEIGHT],
        ["v", "while-held", Action.WORLD_INCREASE_WIDTH],
        ["n", "while-held", Action.WORLD_DECREASE_WIDTH],
    ]),
);

const muck_controls = new MultiControl(
    new Keymap([
        ["w", "once", "prev"],
        ["s", "once", "next"],
        ["a", "auto-repeat", "dec"],
        ["d", "auto-repeat", "inc"],
        ["Escape", "once", "exit"],
    ]),
);

const game = new ParasiteGame({
    canvas: new Canvas(safe$("#canvas_container"), { maxZoom: 2.5, minZoom: 0.5 }),
    dialogs: {
        welcome: new Dialog(safe$("#welcome"), "Play"),
        help: new Dialog(safe$("#help")),
    },
    sidebar: safe$("#menuitems"),
    sidebarDialogNames: ["help", "_levels"],
    levels: [
        new Level({
            snakes: [
                new Snake(new NNBrain(), new Vector(0, 100), io, muck_controls, "Sheldon"),
                new Snake(new NNBrain(), new Vector(0, 200), io, muck_controls, "Raj"),
                new Snake(new NNBrain(), new Vector(0, 300), io, muck_controls, "Howard"),
                new Snake(new NNBrain(), new Vector(0, 400), io, muck_controls, "Leonard"),
            ],
            blocks: [
                ...makeBigBox(),
                new Glass(100, 100, new Vector(200, 0)),
                new Grate(100, 100, new Vector(100, 0)),
            ],
            goal: new Goal(level => {
                return level.snakes.some(snake => snake.length > Snake.INITIAL_LENGTH + 10);
            }),
            title: "Foo Bar",
            objective: "This is a TEST level. The goal is to cause any snake to grow by 10 units. (On a good day this usually happens by itself.)",
        }),
        new Level({
            snakes: [
                new Snake(new NNBrain(), new Vector(100, 100), io, muck_controls, "Joey"),
                new Snake(new NNBrain(), new Vector(125, 100), io, muck_controls, "Rachel"),
                new Snake(new NNBrain(), new Vector(150, 100), io, muck_controls, "Monica"),
                new Snake(new NNBrain(), new Vector(175, 100), io, muck_controls, "Phoebe"),
                new Snake(new NNBrain(), new Vector(200, 100), io, muck_controls, "Chandler"),
                new Snake(new NNBrain(), new Vector(225, 100), io, muck_controls, "Ross"),
            ],
            blocks: [
                ...makeBigBox(),
            ],
            goal: null,
            title: "Bar Baz",
            objective: "This is another TEST LEVEL. ",
        }),
    ],
    player: new PlayerSnake(new PlayerBrain(io, player_controls, safe$("#bottom_bar")), Vector.zero(), io, muck_controls, "Player (you)"),
});

async function main() {
    game.showDialog("welcome");
    await game.dialogs.welcome.waitFor("close");
    await pt.run(1000); // TODO: make this more training
    // load trained model into snakes
    var model = JSON.stringify(pt.brain.agent.toJSON());
    game.levels.forEach(level => level.snakes.forEach(snake => snake.brain.agent.fromJSON(JSON.parse(model))));
    game.openLevel(0);
    await game.mainLoop();
    throw new Error("Main loop returned (unreachable!!)");
}

main();
