// ✅ Complete Indian Number → Hindi Words Converter
// Handles: 1 to 99,99,99,999 (99 crore tak)

const ones = [
    "", "ek", "do", "teen", "chaar", "paanch", "chheh", "saat", "aath", "nau",
    "das", "gyarah", "barah", "terah", "chaudah", "pandrah", "solah", "satrah", "atharah", "unnees",
    "bees", "ikkees", "baais", "teis", "chaubees", "pachees", "chhabbees", "sattaais", "atthaais", "untees",
    "tees", "ikattees", "battees", "taintees", "chautees", "paintees", "chhattees", "saintees", "adtees", "untaalees",
    "chaalees", "iktaalees", "bayaalees", "tentaalees", "chawaalees", "paintaalees", "chhiyaalees", "saintaalees", "adtaalees", "unchaas",
    "pachaas", "ikyaavan", "baavan", "tirpan", "chauvan", "pachpan", "chhappan", "sattavan", "atthaavan", "unsath",
    "saath", "iksath", "baasath", "tirsath", "chausath", "painsath", "chhiyasath", "sadsath", "adsath", "unhattar",
    "sattar", "ikhattar", "bahattar", "tihattar", "chauhattar", "pachhattar", "chhihattar", "sathattar", "atthahattar", "unnaasi",
    "assi", "ikyaasi", "bayaasi", "tiraasi", "chaurasi", "pachhaasi", "chhiyaasi", "sataasi", "atthaasi", "navaasi",
    "nabbe", "ikyanve", "baanve", "tiranve", "chauranve", "pachanve", "chhiyanve", "sattanve", "atthanve", "ninyaanve"
];

const numberToHindiWords = (num) => {
    if (num === 0) return "zero";
    if (!Number.isFinite(num) || num < 0) return num.toString();

    num = Math.round(num); // decimals hata do pehle

    let result = "";

    // Crore (1,00,00,000)
    if (num >= 10000000) {
        const crore = Math.floor(num / 10000000);
        result += ones[crore] + " crore ";
        num = num % 10000000;
    }

    // Lakh (1,00,000)
    if (num >= 100000) {
        const lakh = Math.floor(num / 100000);
        result += ones[lakh] + " lakh ";
        num = num % 100000;
    }

    // Hazaar (1,000)
    if (num >= 1000) {
        const hazaar = Math.floor(num / 1000);
        result += ones[hazaar] + " hazaar ";
        num = num % 1000;
    }

    // Sau (100)
    if (num >= 100) {
        const sau = Math.floor(num / 100);
        result += ones[sau] + " sau ";
        num = num % 100;
    }

    // Baaki (1-99)
    if (num > 0) {
        result += ones[num] + " ";
    }

    return result.trim() + " rupaye";
};

// ========================
// TEST — Uncomment to verify
// ========================
// console.log(numberToHindiWords(13000));    // terah hazaar rupaye
// console.log(numberToHindiWords(120000));   // ek lakh bees hazaar rupaye
// console.log(numberToHindiWords(1500000));  // ek lakh paanch hazaar rupaye  → 15 lakh rupaye
// console.log(numberToHindiWords(10000000)); // ek crore rupaye
// console.log(numberToHindiWords(12500000)); // ek crore pachchees lakh rupaye
// console.log(numberToHindiWords(500));      // paanch sau rupaye
// console.log(numberToHindiWords(21000));    // ikkees hazaar rupaye
// console.log(numberToHindiWords(99999));    // ninyaanve hazaar nau sau ninyaanve rupaye

export default numberToHindiWords;