let from, dest;

function KeyPress(e) {
  var evtobj = window.event ? event : e;
  if (evtobj.keyCode == 84 && evtobj.altKey && evtobj.shiftKey) {
    chrome.storage.sync.get(
      {
        from: "eng",
        dest: "tur"
      },
      items => {
        from = items.from;
        dest = items.dest;
        main();
      }
    );
  }
}

function specialCharacterCheckAndEncode(word) {
  let specialCharactersAndEncodes = [
    { specialCharacter: "'", encode: "%27" },
    { specialCharacter: "[", encode: "%5B" },
    { specialCharacter: "]", encode: "%5D" }
  ];

  specialCharactersAndEncodes.map(specialCharacterAndEncode => {
    if (word.includes(specialCharacterAndEncode.specialCharacter)) {
      word = word.split("");
      let index = word.indexOf(specialCharacterAndEncode.specialCharacter);
      word[index] = specialCharacterAndEncode.encode;
      word = word.join("");
    }
  });

  return word;
}

async function fetchTranslateResult(from, dest, phrase) {
  phrase = specialCharacterCheckAndEncode(phrase);
  const response = await fetch(
    "https://glosbe.com/gapi/translate?from=" +
      from +
      "&dest=" +
      dest +
      "&format=json&phrase=" +
      phrase
  );

  const data = await response.json();

  let threeResult = "";

  for (let index = 0; index < 3; index++) {
    if (
      data.tuc[index] &&
      data.tuc[index].phrase &&
      data.tuc[index].phrase.text
    ) {
      threeResult += " " + (index + 1) + ". " + data.tuc[index].phrase.text;
    } else if (index === 0) {
      threeResult = "no result";
    }
  }

  return threeResult;
}

function main() {
  let subtitleWrapper = document.getElementById("caption-window-1");
  if (!subtitleWrapper) {
    subtitleWrapper = document.getElementById("caption-window-_0");
  }

  const video = document.getElementsByTagName("video")[0];

  subtitleWrapper.addEventListener("mouseenter", () => {
    video.pause();

    const subtitle = document.getElementsByClassName("captions-text")[0];
    const subtitleArray = subtitle.firstChild.textContent.trim().split(/\s+/);
    const inSubtitle = subtitle.firstChild,
      style = window.getComputedStyle(inSubtitle),
      firstFontSize = style.getPropertyValue("font-size");

    inSubtitle.innerHTML = "";

    subtitleArray.map((word, index) => {
      const span = document.createElement("SPAN");
      const textnode = document.createTextNode(" " + word);

      span.appendChild(textnode);

      inSubtitle.appendChild(span);

      span.setAttribute("data-tooltip", "Loading...");

      span.addEventListener("mouseenter", () => {
        const howMuchPxGrow = 5;
        let newFontSize = parseInt(firstFontSize) + howMuchPxGrow;

        newFontSize += "px";
        span.style.fontSize = newFontSize;

        if (span.getAttribute("data-tooltip") === "Loading...") {
          const result = fetchTranslateResult(from, dest, word);

          result.then(translatedWords => {
            span.setAttribute("data-tooltip", translatedWords);
          });
        }
      });

      span.addEventListener("mouseleave", () => {
        span.style.fontSize = firstFontSize;
      });
    });
  });

  subtitleWrapper.addEventListener("mouseleave", () => {
    video.play();
  });
}

document.onkeydown = KeyPress;
