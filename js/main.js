function safe$(selector) {
    var elem = document.querySelector(selector);
    if (!elem) throw new Error("can't find element: " + selector);
    return elem;
}

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
                new Snake(new NNBrain(), new Vector(0, 100), "Test snake 1"),
                new Snake(new NNBrain(), new Vector(0, 200), "Test snake 2"),
                new Snake(new NNBrain(), new Vector(0, 300), "Test snake 3"),
            ],
            blocks: [
                new Wall(20, 1000, new Vector(-30, 500)),
            ],
            goal: null,
            title: "Foo Bar",
            objective: "This is a TEST level. ".repeat(50),
        }),
        new Level({
            snakes: [
                new Snake(new NNBrain(), new Vector(100, 100), "Test snake 4"),
                new Snake(new NNBrain(), new Vector(200, 200), "Test snake 5"),
                new Snake(new NNBrain(), new Vector(300, 300), "Test snake 6"),
            ],
            goal: null,
            title: "Bar Baz",
            objective: "This is another TEST LEVEL. ".repeat(50),
        }),
    ],
    player: new PlayerSnake(new TestBrain(), new Vector(0, 0), "Player (you)"),
});

async function main() {
    game.showPopover("welcome");
    await game.popovers.welcome.waitFor("close");
    game.openLevel(0);
    await game.mainLoop();
    throw new Error("Main loop returned (unreachable!!)");
}

main();
