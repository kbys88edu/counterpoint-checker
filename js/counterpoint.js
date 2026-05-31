const NATURAL_NOTES = [
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5", "E5", "F5", "G5", "A5", "B5",
  "C6", "D6", "E6", "F6", "G6", "A6", "B6"
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
  noteStep: 5,
  playheadTop: 55,
  playheadBottom: 228
};

const EXERCISES = [
  {
    id: "species1-c-major-01",
    title: "第一種 C major 01",
    description: "基本的な山型。順次進行中心の定旋律です。",
    cantus: ["C4", "D4", "E4", "F4", "G4", "A4", "G4", "F4", "E4", "D4", "C4"],
    counterpoint: []
  },
  {
    id: "species1-c-major-02",
    title: "第一種 C major 02",
    description: "小さな跳躍を含む練習。跳躍後は反対方向に戻ります。",
    cantus: ["C4", "E4", "D4", "F4", "G4", "A4", "G4", "E4", "F4", "D4", "C4"],
    counterpoint: []
  },
  {
    id: "species1-c-major-03",
    title: "第一種 C major 03",
    description: "低めから始まり、中央で頂点を作る旋律です。",
    cantus: ["C4", "D4", "F4", "E4", "G4", "A4", "G4", "F4", "E4", "D4", "C4"],
    counterpoint: []
  },
  {
    id: "species1-g-major-01",
    title: "第一種 G major 01",
    description: "G majorの基本課題。F#を含みます。",
    cantus: ["G3", "A3", "B3", "C4", "D4", "E4", "D4", "C4", "B3", "A3", "G3"],
    counterpoint: []
  },
  {
    id: "species1-g-major-02",
    title: "第一種 G major 02",
    description: "順次進行と3度跳躍を組み合わせた課題です。",
    cantus: ["G3", "B3", "A3", "C4", "D4", "E4", "D4", "B3", "C4", "A3", "G3"],
    counterpoint: []
  },
  {
    id: "species1-f-major-01",
    title: "第一種 F major 01",
    description: "F majorの基本課題。Bbを含みます。",
    cantus: ["F3", "G3", "A3", "Bb3", "C4", "D4", "C4", "Bb3", "A3", "G3", "F3"],
    counterpoint: []
  },
  {
    id: "species1-f-major-02",
    title: "第一種 F major 02",
    description: "ゆるやかな上行と下行を持つF majorの課題です。",
    cantus: ["F3", "A3", "G3", "Bb3", "C4", "D4", "C4", "A3", "Bb3", "G3", "F3"],
    counterpoint: []
  },
  {
    id: "species1-a-minor-01",
    title: "第一種 A minor 01",
    description: "自然短音階に近い短調課題です。",
    cantus: ["A3", "B3", "C4", "D4", "E4", "F4", "E4", "D4", "C4", "B3", "A3"],
    counterpoint: []
  },
  {
    id: "species1-a-minor-02",
    title: "第一種 A minor 02",
    description: "短調で3度跳躍を含む課題です。",
    cantus: ["A3", "C4", "B3", "D4", "E4", "F4", "E4", "C4", "D4", "B3", "A3"],
    counterpoint: []
  },
  {
    id: "species1-d-minor-01",
    title: "第一種 D minor 01",
    description: "D minorの基本課題。Bbを含みます。",
    cantus: ["D4", "E4", "F4", "G4", "A4", "Bb4", "A4", "G4", "F4", "E4", "D4"],
    counterpoint: []
  },
  {
    id: "species1-d-minor-02",
    title: "第一種 D minor 02",
    description: "D minorで跳躍後に反対方向へ進む課題です。",
    cantus: ["D4", "F4", "E4", "G4", "A4", "Bb4", "A4", "F4", "G4", "E4", "D4"],
    counterpoint: []
  },
  {
    id: "species1-example-filled",
    title: "入力例つき",
    description: "動作確認用。対旋律があらかじめ入っています。",
    cantus: ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4"],
    counterpoint: ["G4", "F4", "G4", "A4", "Bb4", "A4", "G4", "F4", "C5"]
  }
];

let selectedIndex = 0;
let playbackIndex = 0;
let isPlaying = false;
let playbackTimerId = null;
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playMidiNote(midi, duration = 0.35, gainValue = 0.16, waveform = "sine") {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(midiToFrequency(midi), now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playNoteName(note, duration = 0.35, gainValue = 0.16, waveform = "sine") {
  const midi = noteToMidi(note);

  if (midi === null) return;

  playMidiNote(midi, duration, gainValue, waveform);
}

function playSelectedNote() {
  const counterpoint = getNotesFromTextarea("counterpoint");
  const note = counterpoint[selectedIndex];

  if (!note) return;

  playNoteName(note, 0.35);
}

function getTempo() {
  const input = document.getElementById("tempoInput");
  const raw = input ? parseInt(input.value, 10) : 72;

  if (Number.isNaN(raw)) return 72;

  return Math.min(180, Math.max(40, raw));
}

function getStepDurationSeconds() {
  return 60 / getTempo();
}

function getPlaybackLength() {
  const cantus = getNotesFromTextarea("cantus");
  const counterpoint = getNotesFromTextarea("counterpoint");

  return Math.max(cantus.length, counterpoint.length, 0);
}

function playVerticalSonority(index) {
  const cantus = getNotesFromTextarea("cantus");
  const counterpoint = getNotesFromTextarea("counterpoint");

  const stepDuration = getStepDurationSeconds();
  const noteDuration = Math.max(0.18, stepDuration * 0.82);

  const cantusNote = cantus[index];
  const counterpointNote = counterpoint[index];

  if (cantusNote) {
    playNoteName(cantusNote, noteDuration, 0.11, "sine");
  }

  if (counterpointNote) {
    playNoteName(counterpointNote, noteDuration, 0.16, "triangle");
  }
}

function updatePlayPauseButton() {
  const button = document.getElementById("playPauseButton");

  if (!button) return;

  button.textContent = isPlaying ? "停止" : "再生";
}

function togglePlayback() {
  if (isPlaying) {
    stopPlayback(false);
  } else {
    startPlayback();
  }
}

function startPlayback() {
  const length = getPlaybackLength();

  if (!length) return;

  if (playbackIndex >= length) {
    playbackIndex = 0;
  }

  getAudioContext();
  isPlaying = true;
  updatePlayPauseButton();
  playCurrentStep();
}

function stopPlayback(resetToStart = false) {
  isPlaying = false;

  if (playbackTimerId !== null) {
    window.clearTimeout(playbackTimerId);
    playbackTimerId = null;
  }

  if (resetToStart) {
    playbackIndex = 0;
  }

  updatePlayPauseButton();
  renderScore();
}

function playCurrentStep() {
  if (!isPlaying) return;

  const length = getPlaybackLength();

  if (!length) {
    stopPlayback(true);
    return;
  }

  if (playbackIndex >= length) {
    isPlaying = false;
    playbackIndex = 0;
    updatePlayPauseButton();
    renderScore();
    return;
  }

  selectedIndex = Math.min(playbackIndex, Math.max(0, length - 1));
  renderScore();
  playVerticalSonority(playbackIndex);

  const stepMs = getStepDurationSeconds() * 1000;

  playbackTimerId = window.setTimeout(() => {
    playbackIndex += 1;

    if (playbackIndex >= length) {
      isPlaying = false;
      playbackIndex = 0;
      playbackTimerId = null;
      updatePlayPauseButton();
      renderScore();
      return;
    }

    playCurrentStep();
  }, stepMs);
}

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

function midiToNote(midi, preference = "sharp") {
  const sharpNames = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
  ];

  const flatNames = [
    "C", "Db", "D", "Eb", "E", "F",
    "Gb", "G", "Ab", "A", "Bb", "B"
  ];

  const pitch = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const names = preference === "flat" ? flatNames : sharpNames;

  return names[pitch] + octave;
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

  if (cantusDisplay) {
    cantusDisplay.textContent = cantus.join(" ");
  }

  if (counterpointDisplay) {
    counterpointDisplay.textContent = counterpoint.length
      ? counterpoint.join(" ")
      : "未入力";
  }

  if (scoreStatus) {
    const length = getPlaybackLength();
    const displayIndex = length ? Math.min(playbackIndex + 1, length) : 0;
    scoreStatus.textContent =
      `対旋律：${counterpoint.length}音 / 定旋律：${cantus.length}音 / 再生位置：${displayIndex}/${length}`;
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
      addResult(results, "ok", `開始音程は ${getIntervalName(firstInterval)} です。`);
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
      addResult(results, "ok", `終止音程は ${getIntervalName(lastInterval)} です。`);
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

function moveNoteChromatic(note, semitone) {
  const midi = noteToMidi(note);
  if (midi === null) return note;

  const preference = semitone > 0 ? "sharp" : "flat";
  return midiToNote(midi + semitone, preference);
}

function moveSelectedNote(semitone) {
  if (isPlaying) return;

  const cantus = getNotesFromTextarea("cantus");
  let counterpoint = getNotesFromTextarea("counterpoint");

  if (!cantus.length) return;

  const noteCount = cantus.length;

  while (counterpoint.length < noteCount) {
    counterpoint.push("");
  }

  if (selectedIndex < 0) selectedIndex = 0;
  if (selectedIndex >= noteCount) selectedIndex = noteCount - 1;

  const currentNote = counterpoint[selectedIndex];

  if (!currentNote) {
    counterpoint[selectedIndex] = "G4";
  } else {
    counterpoint[selectedIndex] = moveNoteChromatic(currentNote, semitone);
  }

  setNotesToTextarea("counterpoint", counterpoint);
  renderScore();

  playNoteName(counterpoint[selectedIndex], 0.25);
}

function deleteSelectedNote() {
  if (isPlaying) return;

  const cantus = getNotesFromTextarea("cantus");
  let counterpoint = getNotesFromTextarea("counterpoint");

  if (!cantus.length) return;

  while (counterpoint.length < cantus.length) {
    counterpoint.push("");
  }

  counterpoint[selectedIndex] = "";

  setNotesToTextarea("counterpoint", counterpoint);
  renderScore();
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

function drawPlayhead(svg, positions, noteCount) {
  if (!noteCount) return;

  const safeIndex = Math.min(playbackIndex, noteCount - 1);
  const x = positions[safeIndex];

  svg.appendChild(
    createSvgElement("rect", {
      x: x - 20,
      y: SCORE.playheadTop,
      width: 40,
      height: SCORE.playheadBottom - SCORE.playheadTop,
      rx: 10,
      class: "playhead-halo"
    })
  );

  svg.appendChild(
    createSvgElement("line", {
      x1: x,
      y1: SCORE.playheadTop,
      x2: x,
      y2: SCORE.playheadBottom,
      class: "playhead-line"
    })
  );
}

function drawLedgerLines(svg, x, y) {
  const topLineY = SCORE.bottomLineY - 4 * SCORE.staffGap;
  const bottomLineY = SCORE.bottomLineY;

  if (y < topLineY - SCORE.noteStep) {
    for (
      let ly = topLineY - 2 * SCORE.noteStep;
      ly >= y - 1;
      ly -= 2 * SCORE.noteStep
    ) {
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
    for (
      let ly = bottomLineY + 2 * SCORE.noteStep;
      ly <= y + 1;
      ly += 2 * SCORE.noteStep
    ) {
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

function drawAccidental(svg, parsed, x, y, isCantus, isSelected, isCurrentPlayback) {
  if (!parsed.accidental) return;

  const symbol = parsed.accidental === "#" ? "♯" : "♭";

  svg.appendChild(
    createSvgElement("text", {
      x: x - 30,
      y: y + 1,
      class: `accidental${isCantus ? " cantus" : ""}${isSelected ? " selected" : ""}${isCurrentPlayback ? " playing" : ""}`
    })
  ).textContent = symbol;
}

function drawNote(svg, note, x, voice, index) {
  const y = noteToY(note);
  const parsed = parseNote(note);

  if (y === null || !parsed) return;

  const isCantus = voice === "cantus";
  const isSelected = !isCantus && index === selectedIndex && !isPlaying;
  const isCurrentPlayback = index === playbackIndex && (isPlaying || getPlaybackLength() > 0);

  const xOffset = isCantus ? -7 : 7;
  const noteX = x + xOffset;

  drawLedgerLines(svg, noteX, y);
  drawAccidental(svg, parsed, noteX, y, isCantus, isSelected, isCurrentPlayback);

  svg.appendChild(
    createSvgElement("ellipse", {
      cx: noteX,
      cy: y,
      rx: 8.5,
      ry: 5.8,
      transform: `rotate(-18 ${noteX} ${y})`,
      class: isCantus
        ? isCurrentPlayback
          ? "note-head cantus playing"
          : "note-head cantus"
        : isCurrentPlayback
          ? "note-head playing"
          : isSelected
            ? "note-head selected"
            : "note-head"
    })
  );

  if (isCantus) {
    svg.appendChild(
      createSvgElement("line", {
        x1: noteX - 7,
        y1: y,
        x2: noteX - 7,
        y2: y + 34,
        class: isCurrentPlayback ? "note-stem cantus playing" : "note-stem cantus"
      })
    );
  } else {
    svg.appendChild(
      createSvgElement("line", {
        x1: noteX + 7,
        y1: y,
        x2: noteX + 7,
        y2: y - 34,
        class: isCurrentPlayback
          ? "note-stem playing"
          : isSelected
            ? "note-stem selected"
            : "note-stem"
      })
    );
  }

  svg.appendChild(
    createSvgElement("text", {
      x: noteX - 12,
      y: isCantus ? SCORE.bottomLineY + 52 : SCORE.bottomLineY - 72,
      class: isCurrentPlayback
        ? "note-label playing"
        : isSelected
          ? "note-label selected"
          : "note-label"
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

  if (selectedIndex >= noteCount) selectedIndex = noteCount - 1;
  if (selectedIndex < 0) selectedIndex = 0;

  if (playbackIndex >= noteCount) playbackIndex = 0;
  if (playbackIndex < 0) playbackIndex = 0;

  drawStaff(svg, noteCount);
  drawPlayhead(svg, positions, noteCount);

  cantus.forEach((note, i) => {
    drawNote(svg, note, positions[i], "cantus", i);
  });

  counterpoint.forEach((note, i) => {
    if (note) {
      drawNote(svg, note, positions[i], "counterpoint", i);
    }
  });

  updateDisplays();
}

function handleScoreClick(event) {
  if (isPlaying) return;

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

  selectedIndex = nearestIndex;
  playbackIndex = nearestIndex;
  counterpoint[nearestIndex] = clickedNote;

  setNotesToTextarea("counterpoint", counterpoint);
  renderScore();

  playNoteName(clickedNote, 0.35);

  svg.focus();
}

function undoCounterpointNote() {
  if (isPlaying) return;

  const counterpoint = getNotesFromTextarea("counterpoint");

  counterpoint.pop();

  if (selectedIndex >= counterpoint.length) {
    selectedIndex = Math.max(0, counterpoint.length - 1);
  }

  if (playbackIndex >= counterpoint.length) {
    playbackIndex = Math.max(0, counterpoint.length - 1);
  }

  setNotesToTextarea("counterpoint", counterpoint);
  renderScore();
}

function clearCounterpoint() {
  stopPlayback(true);
  selectedIndex = 0;
  playbackIndex = 0;
  setNotesToTextarea("counterpoint", []);
  renderScore();
}

function setExample() {
  const select = document.getElementById("exerciseSelect");

  if (select) {
    select.value = "species1-example-filled";
    updateExerciseDescription();
  }

  loadSelectedExercise();
}


function populateExerciseSelect() {
  const select = document.getElementById("exerciseSelect");
  if (!select) return;

  select.innerHTML = "";

  EXERCISES.forEach((exercise, index) => {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = exercise.title;

    if (index === 0) {
      option.selected = true;
    }

    select.appendChild(option);
  });

  updateExerciseDescription();
}

function getSelectedExercise() {
  const select = document.getElementById("exerciseSelect");

  if (!select) return EXERCISES[0];

  return EXERCISES.find((exercise) => exercise.id === select.value) || EXERCISES[0];
}

function updateExerciseDescription() {
  const description = document.getElementById("exerciseDescription");
  const exercise = getSelectedExercise();

  if (!description || !exercise) return;

  description.textContent = exercise.description;
}

function loadSelectedExercise() {
  const exercise = getSelectedExercise();

  if (!exercise) return;

  stopPlayback(true);

  setNotesToTextarea("cantus", exercise.cantus);
  setNotesToTextarea("counterpoint", exercise.counterpoint || []);

  selectedIndex = 0;
  playbackIndex = 0;
  renderScore();
}

function moveSelection(delta) {
  if (isPlaying) return;

  const length = getPlaybackLength();

  if (!length) return;

  selectedIndex += delta;

  if (selectedIndex < 0) {
    selectedIndex = length - 1;
  }

  if (selectedIndex >= length) {
    selectedIndex = 0;
  }

  playbackIndex = selectedIndex;
  renderScore();

  const counterpoint = getNotesFromTextarea("counterpoint");
  const note = counterpoint[selectedIndex];

  if (note) {
    playNoteName(note, 0.18);
  }
}


window.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("scoreEditor");

  if (svg) {
    svg.addEventListener("click", handleScoreClick);
  }

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();

    if (activeTag === "textarea" || activeTag === "input") {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      togglePlayback();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSelection(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelection(-1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelectedNote(1);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelectedNote(-1);
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      deleteSelectedNote();
    }
  });

  const exerciseSelect = document.getElementById("exerciseSelect");

  if (exerciseSelect) {
    exerciseSelect.addEventListener("change", updateExerciseDescription);
  }

  populateExerciseSelect();
  renderScore();
  updatePlayPauseButton();
});
