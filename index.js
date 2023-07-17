let currentWordIndex = 0
let stop = false
const speed = 500
const endOfSentenceSpeed = 60
const test = "Hello Xin chào đây là Long Đinh Hello Xin chào đây là Long Đinh Hello Xin chào đây là Long Đinh"
function containsEndOfSentence(word) {
    return word.includes(".") || word.includes("?") || word.includes("!") || word.includes(",") || word.includes("\"")
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getWords(str) {
    return str.substring(currentWordIndex, str.length).split(" ")
}

function wordReadingSpeed(word) {
    return speed * (Math.sqrt(word.length)+2.2) + (containsEndOfSentence(word) ? endOfSentenceSpeed : 0)
}

class DocumentReader {
    words = []
    cursor = 0
    isReading = false

    constructor(doc) {
        this.words = getWords(doc)
    }

    nextWord() {
        if(this.cursor < this.words.length){
            return this.words[++this.cursor]
        } else {
            this.cursor = 0
            return this.words[++this.cursor]
        }
    }

    async read() {
        while(this.isReading) {
            const word = this.nextWord()
            $("#text").text(word)
            await sleep(wordReadingSpeed(word))
        }
    }

}

$(document).ready(function() {
    const reader = new DocumentReader(test)

    const box = document.querySelector('.box');
    box.addEventListener('click', (e)=>{
        e.target.classList.toggle('pause');
        reader.isReading = !reader.isReading
        reader.read()
    })

    
})

