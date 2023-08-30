/**
 * @param {string} selector
 * @returns {HTMLElement}
 */
function safe$(selector) {
    var elem = document.querySelector(selector);
    if (elem === null) throw new Error("can't find element: " + selector);
    return elem;
}

// TODO: add more IO sources
const io = new IOStack();
const player_controls = new MultiControl(
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
        ["i", "once", Action.PHEREMONE_INC_COLOR],
        ["o", "once", Action.PHEREMONE_DEC_COLOR],
        ["p", "while-held", Action.PHEREMONE_RELEASE],
        ["k", "while-held", Action.HEAD_INC_COLOR],
        ["l", "while-held", Action.HEAD_DEC_COLOR],
        [";", "while-held", Action.TAIL_INC_COLOR],
        ["'", "while-held", Action.TAIL_DEC_COLOR],
        [",", "while-held", Action.SOUND_INC_FREQ],
        [".", "while-held", Action.SOUND_DEC_FREQ],
        ["/", "while-held", Action.CHIRP],
    ]),
);

const muck_controls = new MultiControl(
    new Keymap([
        ["w", "once", "next"],
        ["s", "once", "prev"],
        ["a", "auto-repeat", "inc"],
        ["d", "auto-repeat", "dec"],
    ]),
);

const game = new ParasiteGame({
    canvas: new Canvas(safe$("#canvas_container"), { maxZoom: 2.5, minZoom: 0.5 }),
    dialogs: {
        welcome: new Dialog(safe$("#welcome"), "Play"),
        help: new Dialog(safe$("#help")),
    },
    sidebar: safe$("#menuitems"),
    sidebarNames: ["help", "_levels"],
    levels: [
        new Level({
            snakes: [
                new Snake(new NNBrain(), new Vector(0, 100), io, muck_controls, "Sheldon"),
                new Snake(new NNBrain(), new Vector(0, 200), io, muck_controls, "Raj"),
                new Snake(new NNBrain(), new Vector(0, 300), io, muck_controls, "Howard"),
                new Snake(new NNBrain(), new Vector(0, 400), io, muck_controls, "Leonard"),
            ],
            blocks: [
                new Wall(20, 1000, new Vector(-30, 500)),
            ],
            goal: null,
            title: "Foo Bar",
            objective: "This is a TEST level. ",
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
            goal: null,
            title: "Bar Baz",
            objective: "This is another TEST LEVEL. ",
        }),
    ],
    player: new PlayerSnake(new PlayerBrain(io, player_controls, safe$("#bottom_bar")), new Vector(0, 0), io, muck_controls, "Player (you)"),
});

async function main() {
    game.showDialog("welcome");
    await game.dialogs.welcome.waitFor("close");
    game.openLevel(0);
    await game.mainLoop();
    throw new Error("Main loop returned (unreachable!!)");
}

main();
