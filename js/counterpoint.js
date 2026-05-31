const NATURAL_NOTES = [
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5", "E5", "F5", "G5", "A5", "B5",
  "C6"
];

const NOTE_LETTER_STEPS = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6
};

const SVG_NS = "http://www.w3.org/2000/svg";

const SCORE = {
  width: 960,
  height: 300,
  left: 95,
  right: 45,
  staffGap: 10,
  bottomLineY: 145,
  noteStep: 5
};

function noteToMidi(note) {
  const match = note.trim().match(/^([A-Ga-g])(#|b)?(-?\d)$/);

  if (!match) return null;

  const pitch = match[1].toUpperCase();
  const accidental = match[2] || "";
  const octave = parseInt(match[3], 10);

  const base = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };

  let value = base[pitch];

  if (accidental === "#") value += 1;
  if (accidental === "b") value -= 1;

  return 12 * (octave + 1) + value;
}

function parseNote(note) {
  const match = note.trim().match(/^([A-Ga-g])(#|b)?(-?\d)$/);

  if (!match) return null;

  return {
    letter: match[1].toUpperCase(),
    accidental: match[2] || "",
    octave: parseInt(match[3], 10)
  };
}

function getDiatonicStep(note) {
  const parsed = parseNote(note);
  if (!parsed) return null;

  return parsed.octave * 7 + NOTE_LETTER_STEPS[parsed.letter];
}

function getSimpleInterval(semitones) {
  return Math.abs(semitones) % 12;
}

function getIntervalName(semitones) {
  const abs = Math.abs(semitones);
  const simple = abs % 12;

  if (abs === 0) return "完全1度";
  if (abs === 12) return "完全8度";

  const names = {
    0: "完全8度または複合完全音程",
    1: "短2度",
    2: "長2度",
    3: "短3度",
    4: "長3度",
    5: "完全4度",
    6: "増4度 / 減5度",
    7: "完全5度",
    8: "短6度",
    9: "長6度",
    10: "短7度",
    11: "長7度"
  };

  return names[simple] || "不明な音程";
}

function isConsonant(semitones) {
  const simple = getSimpleInterval(semitones);
  return [0, 3, 4, 7, 8, 9].includes(simple);
}

function isPerfectFifth(semitones) {
  return getSimpleInterval(semitones) === 7;
}

function isPerfectOctaveOrUnison(semitones) {
  const abs = Math.abs(semitones);
  return abs === 0 || getSimpleInterval(semitones) === 0;
}

function direction(a, b) {
  if (b > a) return 1;
  if (b < a) return -1;
  return 0;
}

function getNotesFromTextarea(id) {
  const el = document.getElementById(id);
  if (!el) return [];

  const value = el.value.trim();
  if (!value) return [];

  return value.split(/\s+/).filter(Boolean);
}

function setNotesToTextarea(id, notes) {
  const el = document.getElementById(id);
  if (!el) return;

  el.value = notes.filter(Boolean).join(" ");
}

function updateDisplays() {
  const cantus = getNotesFromTextarea("cantus");
  const counterpoint = getNotesFromTextarea("counterpoint");

  const cantusDisplay = document.getElementById("cantusDisplay");
  const counterpointDisplay = document.getElementById("counterpointDisplay");
  const scoreStatus = document.getElementById("scoreStatus");

  if (cantusDisplay) cantusDisplay.textContent = cantus.join(" ");
  if (counterpointDisplay) {
    counterpointDisplay.textContent = counterpoint.length ? counterpoint.join(" ") : "未入力";
  }
  if (scoreStatus) {
    scoreStatus.textContent = `対旋律：${counterpoint.length}音 / 定旋律：${cantus.length}音`;
  }
}

function addResult(results, type, message) {
  results.push({ type, message });
}

function renderResults(results) {
  const resultBox = document.getElementById("result");

  if (!resultBox) return;

  if (!results.length) {
    resultBox.innerHTML = "";
    return;
  }

  resultBox.innerHTML = results
    .map((item) => {
      let label = "OK";
      if (item.type === "warn") label = "注意";
      if (item.type === "error") label = "禁止";

      return `
        <div class="result-item ${item.type}">
          <span class="result-label">${label}</span>
          ${item.message}
        </div>
      `;
    })
    .join("");
}

function renderSummary(errorCount, warnCount, okCount) {
  const summary = document.getElementById("summary");
  if (!summary) return;

  if (errorCount === 0 && warnCount === 0) {
    summary.innerHTML = `大きな問題は見つかりませんでした。OK項目：${okCount}件`;
    return;
  }

  summary.innerHTML = `禁止：${errorCount}件 / 注意：${warnCount}件 / OK：${okCount}件`;
}

function analyzeCounterpoint() {
  const cantus = getNotesFromTextarea("cantus");
  const counterpoint = getNotesFromTextarea("counterpoint");

  const results = [];

  let errorCount = 0;
  let warnCount = 0;
  let okCount = 0;

  if (cantus.length === 0 || counterpoint.length === 0) {
    addResult(results, "error", "定旋律と対旋律を入力してください。");
    renderSummary(1, 0, 0);
    renderResults(results);
    return;
  }

  if (cantus.length !== counterpoint.length) {
    addResult(
      results,
      "error",
      `音数が一致していません。定旋律は${cantus.length}音、対旋律は${counterpoint.length}音です。`
    );
    errorCount++;
  } else {
    addResult(results, "ok", `音数は一致しています。全${cantus.length}音です。`);
    okCount++;
  }

  const length = Math.min(cantus.length, counterpoint.length);
  const cantusMidi = [];
  const counterMidi = [];

  for (let i = 0; i < length; i++) {
    const cMidi = noteToMidi(cantus[i]);
    const cpMidi = noteToMidi(counterpoint[i]);

    cantusMidi.push(cMidi);
    counterMidi.push(cpMidi);

    if (cMidi === null || cpMidi === null) {
      addResult(
        results,
        "error",
        `${i + 1}音目：音名の形式が正しくありません。例：C4, F#4, Bb3`
      );
      errorCount++;
      continue;
    }

    const interval = cpMidi - cMidi;
    const intervalName = getIntervalName(interval);

    if (isConsonant(interval)) {
      addResult(
        results,
        "ok",
        `${i + 1}音目：${cantus[i]} - ${counterpoint[i]} は ${intervalName} です。`
      );
      okCount++;
    } else {
      addResult(
        results,
        "error",
        `${i + 1}音目：${cantus[i]} - ${counterpoint[i]} は ${intervalName} です。第一種対位法では不協和音程です。`
      );
      errorCount++;
    }
  }

  if (length > 0 && cantusMidi[0] !== null && counterMidi[0] !== null) {
    const firstInterval = counterMidi[0] - cantusMidi[0];

    if (
      Math.abs(firstInterval) === 0 ||
      getSimpleInterval(firstInterval) === 7 ||
      getSimpleInterval(firstInterval) === 0
    ) {
      addResult(
        results,
        "ok",
        `開始音程は ${getIntervalName(firstInterval)} です。`
      );
      okCount++;
    } else {
      addResult(
        results,
        "error",
        `開始音程は ${getIntervalName(firstInterval)} です。第一種では完全1度・完全5度・完全8度で始めるのが基本です。`
      );
      errorCount++;
    }
  }

  if (
    length > 0 &&
    cantusMidi[length - 1] !== null &&
    counterMidi[length - 1] !== null
  ) {
    const lastInterval = counterMidi[length - 1] - cantusMidi[length - 1];

    if (Math.abs(lastInterval) === 0 || getSimpleInterval(lastInterval) === 0) {
      addResult(
        results,
        "ok",
        `終止音程は ${getIntervalName(lastInterval)} です。`
      );
      okCount++;
    } else {
      addResult(
        results,
        "error",
        `終止音程は ${getIntervalName(lastInterval)} です。第一種では完全1度または完全8度で終止するのが基本です。`
      );
      errorCount++;
    }
  }

  for (let i = 0; i < length - 1; i++) {
    const c1 = cantusMidi[i];
    const c2 = cantusMidi[i + 1];
    const cp1 = counterMidi[i];
    const cp2 = counterMidi[i + 1];

    if ([c1, c2, cp1, cp2].some((value) => value === null)) continue;

    const interval1 = cp1 - c1;
    const interval2 = cp2 - c2;

    const cDir = direction(c1, c2);
    const cpDir = direction(cp1, cp2);

    const bothMove = cDir !== 0 && cpDir !== 0;
    const sameDirection = cDir === cpDir;

    if (
      bothMove &&
      sameDirection &&
      isPerfectFifth(interval1) &&
      isPerfectFifth(interval2)
    ) {
      addResult(results, "error", `${i + 1}音目 → ${i + 2}音目：連続5度があります。`);
      errorCount++;
    }

    if (
      bothMove &&
      sameDirection &&
      isPerfectOctaveOrUnison(interval1) &&
      isPerfectOctaveOrUnison(interval2)
    ) {
      addResult(results, "error", `${i + 1}音目 → ${i + 2}音目：連続8度または連続1度があります。`);
      errorCount++;
    }
  }

  renderSummary(errorCount, warnCount, okCount);
  renderResults(results);
  renderScore();
}

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

function clearSvg(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function noteToY(note) {
  const noteStep = getDiatonicStep(note);
  const e4Step = getDiatonicStep("E4");

  if (noteStep === null || e4Step === null) return null;

  return SCORE.bottomLineY - (noteStep - e4Step) * SCORE.noteStep;
}

function yToNaturalNote(y) {
  const e4Step = getDiatonicStep("E4");
  const rawStep = Math.round((SCORE.bottomLineY - y) / SCORE.noteStep);
  const targetStep = e4Step + rawStep;

  let closest = NATURAL_NOTES[0];
  let closestDistance = Infinity;

  NATURAL_NOTES.forEach((note) => {
    const step = getDiatonicStep(note);
    const distance = Math.abs(step - targetStep);

    if (distance < closestDistance) {
      closest = note;
      closestDistance = distance;
    }
  });

  return closest;
}

function getScorePositions(noteCount) {
  const usableWidth = SCORE.width - SCORE.left - SCORE.right;
  const count = Math.max(noteCount, 1);
  const spacing = usableWidth / count;

  return Array.from(
    { length: count },
    (_, i) => SCORE.left + spacing * i + spacing / 2
  );
}

function drawStaff(svg, noteCount) {
  const startX = SCORE.left - 30;
  const endX = SCORE.width - SCORE.right + 10;

  for (let i = 0; i < 5; i++) {
    const y = SCORE.bottomLineY - i * SCORE.staffGap;
    svg.appendChild(
      createSvgElement("line", {
        x1: startX,
        y1: y,
        x2: endX,
        y2: y,
        class: "staff-line"
      })
    );
  }

  svg.appendChild(
    createSvgElement("text", {
      x: 22,
      y: SCORE.bottomLineY - 25,
      class: "voice-label"
    })
  ).textContent = "Counterpoint";

  svg.appendChild(
    createSvgElement("text", {
      x: 22,
      y: SCORE.bottomLineY + 58,
      class: "voice-label"
    })
  ).textContent = "Cantus";

  const positions = getScorePositions(noteCount);

  positions.forEach((x, i) => {
    svg.appendChild(
      createSvgElement("circle", {
        cx: x,
        cy: SCORE.bottomLineY + 65,
        r: 2.8,
        class: "slot-marker"
      })
    );

    svg.appendChild(
      createSvgElement("text", {
        x: x - 4,
        y: SCORE.bottomLineY + 92,
        class: "note-label"
      })
    ).textContent = i + 1;

    if (i > 0) {
      const midX = (positions[i - 1] + x) / 2;
      svg.appendChild(
        createSvgElement("line", {
          x1: midX,
          y1: SCORE.bottomLineY - 52,
          x2: midX,
          y2: SCORE.bottomLineY + 78,
          class: "measure-line"
        })
      );
    }
  });
}

function drawLedgerLines(svg, x, y) {
  const topLineY = SCORE.bottomLineY - 4 * SCORE.staffGap;
  const bottomLineY = SCORE.bottomLineY;

  if (y < topLineY - SCORE.noteStep) {
    for (let ly = topLineY - 2 * SCORE.noteStep; ly >= y - 1; ly -= 2 * SCORE.noteStep) {
      svg.appendChild(
        createSvgElement("line", {
          x1: x - 14,
          y1: ly,
          x2: x + 14,
          y2: ly,
          class: "ledger-line"
        })
      );
    }
  }

  if (y > bottomLineY + SCORE.noteStep) {
    for (let ly = bottomLineY + 2 * SCORE.noteStep; ly <= y + 1; ly += 2 * SCORE.noteStep) {
      svg.appendChild(
        createSvgElement("line", {
          x1: x - 14,
          y1: ly,
          x2: x + 14,
          y2: ly,
          class: "ledger-line"
        })
      );
    }
  }
}

function drawNote(svg, note, x, voice) {
  const y = noteToY(note);
  const parsed = parseNote(note);

  if (y === null || !parsed) return;

  const isCantus = voice === "cantus";
  const xOffset = isCantus ? -7 : 7;
  const noteX = x + xOffset;

  drawLedgerLines(svg, noteX, y);

  if (parsed.accidental) {
    svg.appendChild(
      createSvgElement("text", {
        x: noteX - 28,
        y: y + 6,
        class: "accidental"
      })
    ).textContent = parsed.accidental === "#" ? "♯" : "♭";
  }

  svg.appendChild(
    createSvgElement("ellipse", {
      cx: noteX,
      cy: y,
      rx: 8.5,
      ry: 5.8,
      transform: `rotate(-18 ${noteX} ${y})`,
      class: isCantus ? "note-head cantus" : "note-head"
    })
  );

  if (isCantus) {
    svg.appendChild(
      createSvgElement("line", {
        x1: noteX - 7,
        y1: y,
        x2: noteX - 7,
        y2: y + 34,
        class: "note-stem cantus"
      })
    );
  } else {
    svg.appendChild(
      createSvgElement("line", {
        x1: noteX + 7,
        y1: y,
        x2: noteX + 7,
        y2: y - 34,
        class: "note-stem"
      })
    );
  }

  svg.appendChild(
    createSvgElement("text", {
      x: noteX - 12,
      y: isCantus ? SCORE.bottomLineY + 52 : SCORE.bottomLineY - 72,
      class: "note-label"
    })
  ).textContent = note;
}

function renderScore() {
  const svg = document.getElementById("scoreEditor");
  if (!svg) return;

  clearSvg(svg);

  const cantus = getNotesFromTextarea("cantus");
  const counterpoint = getNotesFromTextarea("counterpoint");
  const noteCount = Math.max(cantus.length, counterpoint.length, 1);
  const positions = getScorePositions(noteCount);

  drawStaff(svg, noteCount);

  cantus.forEach((note, i) => {
    drawNote(svg, note, positions[i], "cantus");
  });

  counterpoint.forEach((note, i) => {
    drawNote(svg, note, positions[i], "counterpoint");
  });

  updateDisplays();
}

function handleScoreClick(event) {
  const svg = document.getElementById("scoreEditor");
  if (!svg) return;

  const rect = svg.getBoundingClientRect();

  const viewX = ((event.clientX - rect.left) / rect.width) * SCORE.width;
  const viewY = ((event.clientY - rect.top) / rect.height) * SCORE.height;

  const cantus = getNotesFromTextarea("cantus");
  let counterpoint = getNotesFromTextarea("counterpoint");

  const noteCount = Math.max(cantus.length, 1);
  const positions = getScorePositions(noteCount);

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  positions.forEach((x, i) => {
    const distance = Math.abs(x - viewX);

    if (distance < nearestDistance) {
      nearestIndex = i;
      nearestDistance = distance;
    }
  });

  const clickedNote = yToNaturalNote(viewY);

  while (counterpoint.length < noteCount) {
    counterpoint.push("");
  }

  counterpoint[nearestIndex] = clickedNote;

  setNotesToTextarea("counterpoint", counterpoint);
  renderScore();
}

function undoCounterpointNote() {
  const counterpoint = getNotesFromTextarea("counterpoint");
  counterpoint.pop();
  setNotesToTextarea("counterpoint", counterpoint);
  renderScore();
}

function clearCounterpoint() {
  setNotesToTextarea("counterpoint", []);
  renderScore();
}

function setExample() {
  setNotesToTextarea("cantus", ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4"]);
  setNotesToTextarea("counterpoint", ["G4", "F4", "G4", "A4", "B4", "A4", "G4", "F4", "C5"]);
  renderScore();
}

window.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("scoreEditor");

  if (svg) {
    svg.addEventListener("click", handleScoreClick);
  }

  renderScore();
});
