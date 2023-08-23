function safe$(selector) {
    var elem = document.querySelector(selector);
    if (!elem) throw new Error("can't find element: " + selector);
    return elem;
}

const game = new ParasiteGame({
    main: safe$("main"),
    popovers: {
        welcome: safe$("#welcome"),
        help: safe$("#help"),
        levelInfo: safe$("#level"),
    },
    levels: [
        new Level({
            snakes: [
                new Snake(new TestBrain(), new Vector(0, 100), "Test snake 1"),
                new Snake(new TestBrain(), new Vector(0, 200), "Test snake 2"),
                new Snake(new TestBrain(), new Vector(0, 300), "Test snake 3"),
            ],
            goal: null,
            title: "Foo Bar",
            objective: "Spam, spam, spam, sausage, eggs, and spam! ".repeat(50),
        }),
    ],
    player: new Snake(new TestBrain(), new Vector(0, 0), "Player (you)"),
});

async function main() {
    game.showPopover("welcome");
    await game.waitFor("popover-welcome-closed");
    game.openLevel(0);
    await game.mainLoop();
    throw new Error("Main loop returned (unreachable!!)");
}

main();
