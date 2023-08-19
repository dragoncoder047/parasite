const SC = "b c d f g h j k l m n p r s t v w y z bl br ch cl cr dr fl fr gh gl gn gr kn ph pl pr qu sc sh sk sl sm sn sp st th tr wh wr sch scr shm shr squ str thr".split(/\s+/g);
const V = "a e i o u ae ai ao au ea ee ei eu ia ie io oa oe oi oo ou ue ui".split(/\s+/g);
const EC = "b c d f g l m n p r s t x z bt ch ck ct ft gh gn lb ld lf lk ll lm ln lp lt mb mn mp nk ng nt ph pt rb rc rd rf rg rk rl rm rn rp rt rv rz sh sk sp ss st zz lch lsh lth rch rsh rst rth sch tch".split(/\s+/g);
const syllable_types = [
    [SC, V, EC],
    [V, EC],
    [SC, V],
    [V],
];

const bad_vowels_re = /([aeiou][aeiou])[aeiou]+/g;
const bad_rep_re = /(.)\1\1+/g;

function choose(arr) {
    return arr[(Math.random() * arr.length) | 0];
}

function randomLatin(n = 2, m = 2) {
    const length = n + ((Math.random() * m) | 0);
    var out = [];
    var last = [];
    var syllable, choice;
    for (var i = 0; i < length; i++) {
        do {
            syllable = choose(syllable_types);
        } while (syllable[0].toString() == last.toString());
        for (var group of syllable) out.push(choose(group));
        last = syllable.at(-1);
    }
    return out.join("").replaceAll(bad_vowels_re, "$1").replaceAll(bad_rep_re, "$1$1");
}

function randomBinomial() {
    var latin1 = randomLatin();
    return latin1[0].toUpperCase() + latin1.slice(1) + " " + randomLatin(3);
}

for (var i = 0; i < 10; i++) console.log(randomBinomial());
