class Linnaeus {
    static SC = "b c d f g h j k l m n p r s t v w y z bl br ch cl cr dr fl fr gh gl gn gr kn ph pl pr qu sc sh sk sl sm sn sp st th tr wh wr sch scr shm shr squ str thr".split(/\s+/g);
    static V = "a e i o u ae ai ao au ea ee ei eu ia ie io oa oe oi oo ou ue ui".split(/\s+/g);
    static EC = "b c d f g l m n p r s t x z bt ch ck ct ft gh gn lb ld lf lk ll lm ln lp lt mb mn mp nk ng nt ph pt rb rc rd rf rg rk rl rm rn rp rt rv rz sh sk sp ss st zz lch lsh lth rch rsh rst rth sch tch".split(/\s+/g);
    static syllable_types = [
        [Linnaeus.SC, Linnaeus.V, Linnaeus.EC],
        [Linnaeus.V, Linnaeus.EC],
        [Linnaeus.SC, Linnaeus.V],
        [Linnaeus.V],
    ];
    static bad_vowels_re = /([aeiou][aeiou])[aeiou]+/g;
    static bad_rep_re = /(.)\1\1+/g;
    /**
     * @param {T[]} arr
     * @returns {T}
     * @typevar T
     */
    static choose(arr) {
        return arr[(Math.random() * arr.length) | 0];
    }
    /**
     * @param {number} n min syllables
     * @param {number} m more syllables
     * @returns {string}
     */
    static randomLatin(n = 2, m = 2) {
        const length = n + ((Math.random() * m) | 0);
        var out = [];
        var last = [];
        var syllable;
        for (var i = 0; i < length; i++) {
            do {
                syllable = Linnaeus.choose(Linnaeus.syllable_types);
            } while (syllable[0].toString() == last.toString());
            for (var group of syllable) out.push(Linnaeus.choose(group));
            last = syllable.at(-1);
        }
        return out.join("").replaceAll(Linnaeus.bad_vowels_re, "$1").replaceAll(Linnaeus.bad_rep_re, "$1$1");
    }
    /**
     * @returns {string}
     */
    static randomBinomial() {
        var latin1 = Linnaeus.randomLatin();
        return latin1[0].toUpperCase() + latin1.slice(1) + " " + Linnaeus.randomLatin(3);
    }
}
