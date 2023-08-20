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
        new Level(null),
    ]
});

async function main() {
    game.message("hello!", "success");
    await game.sleep(1000);
    game.showPopover("help");
    game.message("bye!", "error");
    await game.sleep(2000);
    game.showPopover(false);
    game.showLevelCompleteToast();
    await game.mainloop();
    //throw new Error("unreachable");
}

main();
