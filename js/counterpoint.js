function noteToMidi(note) {
  const match = note.trim().match(/^([A-Ga-g])(#|b)?(-?\d)$/);

  if (!match) {
    return null;
  }

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

  if (accidental === "#") {
    value += 1;
  }

  if (accidental === "b") {
    value -= 1;
  }

  return 12 * (octave + 1) + value;
}

function getSimpleInterval(semitones) {
  return Math.abs(semitones) % 12;
}

function getIntervalName(semitones) {
  const abs = Math.abs(semitones);
  const simple = abs % 12;

  if (abs === 0) {
    return "完全1度";
  }

  if (abs === 12) {
    return "完全8度";
  }

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

function addResult(results, type, message) {
  results.push({
    type,
    message
  });
}

function renderResults(results) {
  const resultBox = document.getElementById("result");

  if (!results.length) {
    resultBox.innerHTML = "";
    return;
  }

  resultBox.innerHTML = results
    .map((item) => {
      let label = "OK";

      if (item.type === "warn") {
        label = "注意";
      }

      if (item.type === "error") {
        label = "禁止";
      }

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

  if (errorCount === 0 && warnCount === 0) {
    summary.innerHTML = `大きな問題は見つかりませんでした。OK項目：${okCount}件`;
    return;
  }

  summary.innerHTML = `
    禁止：${errorCount}件 / 注意：${warnCount}件 / OK：${okCount}件
  `;
}

function analyzeCounterpoint() {
  const cantusInput = document.getElementById("cantus").value.trim();
  const counterInput = document.getElementById("counterpoint").value.trim();

  const cantus = cantusInput.split(/\s+/).filter(Boolean);
  const counterpoint = counterInput.split(/\s+/).filter(Boolean);

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

    if (cpMidi < cMidi) {
      addResult(
        results,
        "warn",
        `${i + 1}音目：対旋律が定旋律より下にあります。上声対位として練習している場合は、声部交差に注意してください。`
      );
      warnCount++;
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
        `開始音程は ${getIntervalName(firstInterval)} です。開始音程として使用可能です。`
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

    if ([c1, c2, cp1, cp2].some((value) => value === null)) {
      continue;
    }

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
      addResult(
        results,
        "error",
        `${i + 1}音目 → ${i + 2}音目：連続5度があります。`
      );
      errorCount++;
    }

    if (
      bothMove &&
      sameDirection &&
      isPerfectOctaveOrUnison(interval1) &&
      isPerfectOctaveOrUnison(interval2)
    ) {
      addResult(
        results,
        "error",
        `${i + 1}音目 → ${i + 2}音目：連続8度または連続1度があります。`
      );
      errorCount++;
    }
  }

  renderSummary(errorCount, warnCount, okCount);
  renderResults(results);
}
