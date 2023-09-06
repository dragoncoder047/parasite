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
    new PretrainPhase("seekFood", noop, noop),
    new PretrainPhase("avoidWalls", noop, noop),
);

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
    await pt.run();
    // TODO: load trained model into snakes
    game.openLevel(0);
    await game.mainLoop();
    throw new Error("Main loop returned (unreachable!!)");
}

main();
