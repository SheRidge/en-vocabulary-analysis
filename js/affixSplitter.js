// ——————————————
// 1) 接辞データを fetch で読み込み、長さ順にソートして保持する
// ——————————————
let PREFIXES = [];
let SUFFIXES = [];

const PREFIX_JSON = 'data/prefixes.json';
const SUFFIX_JSON = 'data/suffixes.json';

// ページ読み込み時に接辞データを取得してソートする
async function loadAffixData() {
  try {
    // prefixes.json を取得
    const prefixResp = await fetch(PREFIX_JSON);
    const prefixData = await prefixResp.json();
    PREFIXES = prefixData.prefixes.slice(); // オブジェクトの配列コピー

    // suffixes.json を取得
    const suffixResp = await fetch(SUFFIX_JSON);
    const suffixData = await suffixResp.json();
    SUFFIXES = suffixData.suffixes.slice(); // オブジェクトの配列コピー

    // affix（文字列長）を基準に降順ソートする
    PREFIXES.sort((a, b) => b.affix.length - a.affix.length);
    SUFFIXES.sort((a, b) => b.affix.length - a.affix.length);
  } catch (err) {
    console.error('接辞データの読み込みに失敗しました:', err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadAffixData();
  const form = document.getElementById('affix-form');
  form.addEventListener('submit', onFormSubmit);
});

// ——————————————
// 2) フォーム送信時の処理: 単語を取得し、splitAffixes を呼び出して結果を表示
// ——————————————
function onFormSubmit(event) {
  event.preventDefault();

  const input = document.getElementById('word');
  const word = input.value.trim();
  if (!word) return;

  const result = splitAffixes(word);
  renderResult(result);
}

// ——————————————
// 3) splitAffixes 関数: 意味付きの接辞オブジェクトに対応
// ——————————————
function splitAffixes(originalWord) {
  const word = originalWord.toLowerCase();

  // 3-1) 接頭辞マッチ（オブジェクト配列 PREFIXES から最長マッチを探す）
  let matchedPrefix = '';
  let prefixMeaning = '';
  for (let p of PREFIXES) {
    if (word.startsWith(p.affix)) {
      matchedPrefix = p.affix;
      prefixMeaning = p.meaning;
      break;
    }
  }

  // 接頭辞を除いた残り
  const coreAfterPrefix = matchedPrefix ? word.slice(matchedPrefix.length) : word;

  // 3-2) 接尾辞マッチ（SUFFIXES から最長マッチを探す）
  let matchedSuffix = '';
  let suffixMeaning = '';
  for (let s of SUFFIXES) {
    if (coreAfterPrefix.endsWith(s.affix)) {
      matchedSuffix = s.affix;
      suffixMeaning = s.meaning;
      break;
    }
  }

  // 語幹部分
  const root = matchedSuffix
    ? coreAfterPrefix.slice(0, coreAfterPrefix.length - matchedSuffix.length)
    : coreAfterPrefix;

  // unmatched 部分（ここでは root と同じ）
  const unmatched = root;

  return {
    original: originalWord,
    prefix: matchedPrefix,
    prefixMeaning: prefixMeaning,
    root: root,
    suffix: matchedSuffix,
    suffixMeaning: suffixMeaning,
    unmatched: unmatched
  };
}

// ——————————————
// 4) renderResult: 分解結果を HTML として描画（意味も併記）
// ——————————————
function renderResult(res) {
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = ''; // 前の結果をクリア

  const container = document.createElement('div');
  container.classList.add('result');

  // 見出し
  const h2 = document.createElement('h2');
  h2.textContent = '解析結果';
  container.appendChild(h2);

  // 各セグメントの表示
  const p = document.createElement('p');

  // 1) prefix
  if (res.prefix) {
    const spanPref = document.createElement('span');
    spanPref.classList.add('segment', 'prefix');
    spanPref.textContent = res.prefix;

    // 意味を小さい行で追加
    const small = document.createElement('span');
    small.classList.add('meaning');
    small.textContent = res.prefixMeaning;
    spanPref.appendChild(small);

    p.appendChild(spanPref);
  }

  // 2) root
  if (res.root) {
    const spanRoot = document.createElement('span');
    spanRoot.classList.add('segment', 'root');
    spanRoot.textContent = res.root;
    p.appendChild(spanRoot);
  }

  // 3) suffix
  if (res.suffix) {
    const spanSuf = document.createElement('span');
    spanSuf.classList.add('segment', 'suffix');
    spanSuf.textContent = res.suffix;

    // 意味を小さい行で追加
    const small2 = document.createElement('span');
    small2.classList.add('meaning');
    small2.textContent = res.suffixMeaning;
    spanSuf.appendChild(small2);

    p.appendChild(spanSuf);
  }

  // 4) prefix も suffix もマッチせず unmatched のみの場合
  if (!res.prefix && !res.suffix && res.unmatched) {
    const spanUm = document.createElement('span');
    spanUm.textContent = res.unmatched;
    spanUm.classList.add('segment', 'unmatched');
    p.appendChild(spanUm);
  }

  container.appendChild(p);

  // 詳細テキストとしてコード表示
  const detail = document.createElement('p');
  detail.innerHTML =
    '（prefix: <code>' +
    (res.prefix || '—') +
    '</code> / meaning: <code>' +
    (res.prefixMeaning || '—') +
    '</code> / root: <code>' +
    (res.root || '—') +
    '</code> / suffix: <code>' +
    (res.suffix || '—') +
    '</code> / meaning: <code>' +
    (res.suffixMeaning || '—') +
    '</code>）';
  container.appendChild(detail);

  outputDiv.appendChild(container);
}
