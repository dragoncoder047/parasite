function safe$(selector) {
    var elem = document.querySelector(selector);
    if (!elem) throw new Error("can't find " + selector);
    return elem;
}

const game = new ParasiteGame({
    main: safe$("main"),
    popovers: {
        help: safe$("#help"),
    },
    levels: [
        new Level({
            snakes: [
                new Snake(new Brain(), new Vector(100, 300)),
                new Snake(new Brain(), new Vector(100, 400)),
                new Snake(new Brain(), new Vector(100, 500)),
            ]
        }),
    ]
});

async function main() {
    game.startMainLoop();
}

main();
