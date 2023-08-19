function safe$(selector) {
    var elem = document.querySelector(selector);
    if (!elem) throw new Error("can't find " + selector);
    return elem;
}

const helpDialog = safe$("#help");

async function main() {
    helpDialog.close();
    helpDialog.showModal();
}

main();
