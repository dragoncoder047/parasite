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
                new Snake(new Brain(), new Vector(0, 1)),
                new Snake(new Brain(), new Vector(0, 2)),
                new Snake(new Brain(), new Vector(0, 3)),
            ],
            goal: null,
            title: "Foo Bar",
            objective: "Spam, spam, spam, sausage, eggs, and spam! ".repeat(200),
        }),
    ]
});

async function main() {
    game.showPopover("welcome");
    await game.waitFor("popover-welcome-closed");
    game.openLevel(0);
    await game.mainLoop();
}

main();
