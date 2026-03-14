/**
 * QuranVerse Application
 * Logical, Methodical Front-End Implementation
 */

let quranData = null;
let chaptersData = {};
const canvas = document.getElementById('verseCanvas');
const ctx = canvas.getContext('2d');

// --- Initialization & Data Fetching ---

async function init() {
    try {
        const [quranRes, chaptersRes] = await Promise.all([
            fetch('./data/quran.json'),
            fetch('./data/chapters.json')
        ]);

        quranData = await quranRes.json();
        const chaptersList = await chaptersRes.json();

        chaptersList.forEach(ch => { chaptersData[ch.id] = ch; });

        populateSurahDropdown(chaptersList);
        attachEventListeners();
        render(); // Initial Render
    } catch (e) {
        console.error("Data Load Error:", e);
    }
}

function populateSurahDropdown(list) {
    const select = document.getElementById('surah-select');
    list.forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = ch.name;
        select.appendChild(opt);
    });
}

// --- Canvas Rendering Logic ---

function render() {
    const surahId = document.getElementById('surah-select').value;
    const start = parseInt(document.getElementById('start-verse').value);
    const end = parseInt(document.getElementById('end-verse').value);
    
    // UI Settings
    const bg = document.getElementById('bg-color').value;
    const txtColor = document.getElementById('text-color').value;
    const fSize = parseInt(document.getElementById('font-size').value);
    const fFamily = document.getElementById('font-family').value;
    const cWidth = parseInt(document.getElementById('canvas-width').value) || 1080;
    const cHeight = parseInt(document.getElementById('canvas-height').value) || 1080;

    // Apply Dimensions
    canvas.width = cWidth;
    canvas.height = cHeight;

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cWidth, cHeight);

    // Global Text Configuration
    ctx.fillStyle = txtColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl'; // CRITICAL: Fixes bracket reversal and Arabic shaping

    // Line 1: Bismillah
    ctx.font = `${fSize * 1.4}px ${fFamily}`;
    ctx.fillText("﷽", cWidth / 2, cHeight * 0.15);

    // Line 2: Verse Text Construction
    let verseContent = "";
    if (quranData && quranData[surahId]) {
        const verses = quranData[surahId].filter(v => v.verse >= start && v.verse <= end);
        verseContent = verses.map(v => v.text).join(" ");
    }
    
    // Exact Formatting as required: ﴿ verse text ﴾
    const fullVerseString = `﴿ ${verseContent} ﴾`;
    
    ctx.font = `${fSize}px ${fFamily}`;
    const wrapWidth = cWidth * 0.85;
    const wrappedLines = wrapArabicText(ctx, fullVerseString, wrapWidth);
    
    const totalBlockHeight = wrappedLines.length * (fSize * 1.5);
    let startY = (cHeight / 2) - (totalBlockHeight / 2) + (fSize / 2);

    wrappedLines.forEach(line => {
        ctx.fillText(line, cWidth / 2, startY);
        startY += (fSize * 1.5);
    });

    // Line 3: Reference
    const surahName = chaptersData[surahId]?.name || "";
    const refString = start === end ? `[${surahName}:${start}]` : `[${surahName}:${start}-${end}]`;
    
    ctx.font = `${fSize * 0.6}px ${fFamily}`;
    ctx.fillText(refString, cWidth / 2, cHeight * 0.85);
}

/**
 * Wraps Arabic text for Canvas. 
 * Note: Splits by space, maintaining word integrity.
 */
function wrapArabicText(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// --- Interaction & Download Logic ---

function attachEventListeners() {
    const ids = ['surah-select', 'start-verse', 'end-verse', 'bg-color', 'text-color', 'font-size', 'font-family', 'canvas-width', 'canvas-height'];
    
    ids.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            if (id === 'font-size') document.getElementById('font-size-val').textContent = document.getElementById(id).value;
            render();
        });
    });

    // FIXED: Download mechanism that prevents page reload
    document.getElementById('download-btn').addEventListener('click', (e) => {
        e.preventDefault(); // Safety against accidental form triggers
        
        try {
            const dataURL = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            
            link.setAttribute('download', 'quran-verse.png');
            link.setAttribute('href', dataURL);
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed:", err);
        }
    });
}

function openTab(evt, tabName) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    
    const links = document.getElementsByClassName("tab-link");
    for (let i = 0; i < links.length; i++) links[i].classList.remove("active");

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Kickstart
init();
