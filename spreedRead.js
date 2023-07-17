var language = 0;
const tagR = /<([\/]*([^>]+))>/gi;

function _processNonChunkedSplitTextStyling(nonChunkedSplitText) {
  let newNonChunkedSplitText = [];
  let activeTags = [];
  const startTagR = /<([^>|\/]+)>/gi;
  const endTagR = /<\/([^>]+)>/gi;

  // iterate through words
  for (let i = 0; i < nonChunkedSplitText.length; i++) {
    let word = nonChunkedSplitText[i];
    // console.log('---');
    // console.log('current word:', word);

    // try to match tags and words
    const allTagMatches = [...word.matchAll(tagR)].map((match) => {
      match.isClose = match[1].includes("/") ? true : false;
      return match;
    }); // [tagName, true/false is opening tag, raw tag]
    // console.log('all tag matches:',allTagMatches);

    // get position of word
    const wordAlone = word.replace(tagR, ""); // to handle special case: "<b>word</b>.". worAlone is "word." but the entire substring is not in the word...
    // get index of word start, where any preceding html tags end
    let wordIndex = _getWordStartInHtml(word);
    // word.indexOf(wordAlone);

    // console.log('wordAlone:',wordAlone);
    // console.log('wordIndex:',wordIndex);

    // iterate through each character
    let inTag = false;
    let isCloseTag = false;
    let newWord = "";
    let curTag = "";
    let wordStartIndex;
    let openTagEndIndex;
    let closeTagEndIndex;
    for (let j = 0; j < word.length; j++) {
      const char = word[j];
      if (char === "<") {
        inTag = true;
      } else if (char === "/") {
        if (inTag) isCloseTag = true;
      } else if (char === ">") {
        // detected end of current tag
        if (!isCloseTag) {
          // we finished an open tag
          activeTags.push(curTag);
          // keep track of end of open tag
          openTagEndIndex = j;
          // add start span
          newWord += `<span class='start ${curTag}'></span>`;
        } else {
          // we finished a closing tag
          // keep track of end of closing tag
          closeTagEndIndex = j;
          // remove from activeTags
          const index = activeTags.indexOf(curTag);
          if (index > -1) {
            activeTags.splice(index, 1);
            // add end span
            newWord += `<span class='end ${curTag}'></span>`;
          }
        }
        // console.log('curTag:', curTag);
        // console.log('isCloseTag:',isCloseTag);

        isCloseTag = false;
        inTag = false;
        curTag = "";
      } else {
        if (inTag) curTag += char;
        else {
          // if at start of word, encapsulate
          if (j === wordIndex) {
            const startTagString = activeTags.map((x) => `<${x}>`).join("");
            const endTagString = activeTags
              .reverse()
              .map((x) => `</${x}>`)
              .join("");
            newWord += `${startTagString}${wordAlone}${endTagString}`;
          }
        }
      }
    }
    // console.log('activeTags:',activeTags);
    // console.log('newWord:', newWord);

    newNonChunkedSplitText.push(newWord);

    // console.log('---');
  }

  return newNonChunkedSplitText;
}

function getMatchBounds(match) {
  return {
    match: match[0],
    length: match[0].length,
    index: match.index,
    indexEnd: match.index + match[0].length - 1,
  };
}

function processWord(word) {
  // console.log('---');

  // determine highlight center and add span
  var divisor = 2;
  let charOffset = 0;
  // console.log('language:', language);
  if (language === 0 || language === 1) {
    // if language is english or chinese/japanese
    divisor = 2;
    // if english, add a 1 character offset too
    if (language === 0) charOffset = 1;
  } else {
    divisor = 2.5;
  }

  // create temp element with word only, no styles
  let tmp = document.createElement("DIV");
  tmp.innerHTML = word;

  let wordContent = tmp.textContent || tmp.innerText || "";
  // console.log('wordContent before trim:', wordContent);
  wordContent = wordContent.trim();
  // console.log('wordContent after trim:', wordContent);

  // find center based on real displayed word
  var center = Math.max(
    Math.round(wordContent.length / divisor - 1) - charOffset,
    0
  );
  // console.log('center:', center);

  // reconstruct "word"/chunk with center highlighted
  // split on every character
  var letters = word.split("");

  // DEAL WITH SPECIAL HTML CHARACTERS
  // get all special character positions
  let specialTokenMatches = [];

  const tagMatches = [...word.matchAll(tagR)].map(getMatchBounds);
  // console.log('tagMatches:',tagMatches);
  specialTokenMatches = specialTokenMatches.concat(tagMatches);

  const ltgtMatches = [...word.matchAll(/\&[l|g]t\;/gi)].map(getMatchBounds);
  // console.log('ltgtMatches:', ltgtMatches);
  specialTokenMatches = specialTokenMatches.concat(ltgtMatches);

  const nbspMatches = [...word.matchAll(/\&nbsp\;/gi)].map(getMatchBounds);
  // console.log('nbspMatches:', nbspMatches);
  specialTokenMatches = specialTokenMatches.concat(nbspMatches);

  const ampMatches = [...word.matchAll(/\&amp\;/gi)].map(getMatchBounds);
  // console.log('ampMatches:', ampMatches);
  specialTokenMatches = specialTokenMatches.concat(ampMatches);

  const whitespaceMatches = [...word.matchAll(/\s/gi)].map(getMatchBounds);
  // console.log('whitespaceMatches:', whitespaceMatches);
  specialTokenMatches = specialTokenMatches.concat(whitespaceMatches);

  // console.log('specialTokenMatches:', specialTokenMatches);

  // iterate through every letter in the entire styled chunk, finding the center of the "real" word
  // and ignoring any special tokens. add the highlight tag span to the center letter so that the letter is visually highlighted AND centered
  let idxCount = 0;
  let newWord = [];
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];

    const curMatches = specialTokenMatches.filter(
      (x) => i >= x.index && i <= x.indexEnd
    );
    // console.log('curMatches:', curMatches);

    if (curMatches.length === 0) {
      // if this letter isn't inside a special token
      if (idxCount === center) {
        newWord.push('<span class="highlight">' + letter + "</span>");
      } else {
        newWord.push(letter);
      }
      idxCount += 1;
    } else {
      newWord.push(letter);
    }
  }

  return newWord.join("");
}

let currentWordIndex = 0
let stop = false
var wpm = 400
var speed = (1 / (wpm / 60)) * 1000;
const endOfSentenceSpeed = 60
const test = localStorage.getItem("readText")

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
            return this.words[this.cursor++]
        } else {
            this.cursor = this.words.length
            return this.words[this.cursor]
        }
    }

    async read() {
        while(this.isReading) {
            const word = this.nextWord()
            var box = document.getElementsByClassName('highlight-box')[0]
            box.innerHTML = processWord(word)
            await sleep(wordReadingSpeed(word))
        }
    }

}

button = document.getElementById("start-button");

$(document).ready(function() {
  const reader = new DocumentReader(test)

  const box = document.querySelector('.box');
  box.addEventListener('click', (e)=>{
      banner = document.getElementById("start-text");
      banner.remove();
      e.target.classList.toggle('pause');
      reader.isReading = !reader.isReading
      reader.read()
  })

  
})