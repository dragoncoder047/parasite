function safe$(selector) {
    var elem = document.querySelector(selector);
    if (!elem) throw new Error("can't find " + selector);
    return elem;
}

const game = new ParasiteGame({
    main: safe$("main"),
    popovers: {
        help: safe$("#help"),
    }
});

async function main() {
    game.toast("hello!", "success");
    await game.sleep(1000);
    game.showPopover("help");
    game.toast("bye!", "error");
    await game.sleep(2000);
    game.showPopover(false);
    await game.mainloop();
    //throw new Error("unreachable");
}

main();
