function safe$(selector) {
    var elem = document.querySelector(selector);
    if (!elem) throw new Error("can't find element: " + selector);
    return elem;
}

// TODO: add more IO sources
const io = new IOStack();
const player_controls = new MultiControl(
    new Keymap([
        ["ArrowUp", "while-held", Action.FORWARD],
        ["ArrowLeft", "while-held", Action.LEFT],
        ["ArrowRight", "while-held", Action.RIGHT],
    ]),
);

const game = new ParasiteGame({
    bottomBar: safe$("#bottom_bar"),
    canvas: new Canvas(safe$("#canvas_container"), { maxZoom: 2.5, minZoom: 0.5 }),
    popovers: {
        welcome: new Popover(safe$("#welcome"), "Play"),
        help: new Popover(safe$("#help")),
    },
    levels: [
        new Level({
            snakes: [
                new Snake(new NNBrain(), new Vector(0, 100), "Sheldon"),
                new Snake(new NNBrain(), new Vector(0, 200), "Raj"),
                new Snake(new NNBrain(), new Vector(0, 300), "Howard"),
                new Snake(new NNBrain(), new Vector(0, 400), "Leonard"),
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
                new Snake(new NNBrain(), new Vector(100, 100), "Joey"),
                new Snake(new NNBrain(), new Vector(125, 100), "Rachel"),
                new Snake(new NNBrain(), new Vector(150, 100), "Monica"),
                new Snake(new NNBrain(), new Vector(175, 100), "Phoebe"),
                new Snake(new NNBrain(), new Vector(200, 100), "Chandler"),
                new Snake(new NNBrain(), new Vector(225, 100), "Ross"),
            ],
            goal: null,
            title: "Bar Baz",
            objective: "This is another TEST LEVEL. ",
        }),
    ],
    player: new PlayerSnake(new PlayerBrain(io, player_controls), new Vector(0, 0), "Player (you)"),
});

async function main() {
    game.showPopover("welcome");
    await game.popovers.welcome.waitFor("close");
    game.openLevel(0);
    await game.mainLoop();
    throw new Error("Main loop returned (unreachable!!)");
}

main();
