/**
 * QuranVerse Refined Generator
 * Methodical Logic for UI States and Canvas Rendering
 */

let quranData = null, chaptersData = {}, bgImageObj = null;
const canvas = document.getElementById('verseCanvas');
const ctx = canvas.getContext('2d');

async function init() {
    try {
        const [qRes, cRes] = await Promise.all([
            fetch('./data/quran.json'), fetch('./data/chapters.json')
        ]);
        quranData = await qRes.json();
        (await cRes.json()).forEach(ch => chaptersData[ch.id] = ch);
        
        populateSurahDropdown();
        setupEvents();
        
        // Initial Draw with Default Values
        render();
    } catch (e) { console.error("App failed to start:", e); }
}

function populateSurahDropdown() {
    const select = document.getElementById('surah-select');
    Object.values(chaptersData).forEach(ch => {
        const opt = document.createElement('option');
        opt.value = ch.id; opt.textContent = ch.name;
        select.appendChild(opt);
    });
}

function render() {
    const sId = document.getElementById('surah-select').value;
    const start = parseInt(document.getElementById('start-verse').value);
    const end = parseInt(document.getElementById('end-verse').value);
    const bgCol = document.getElementById('bg-color').value;
    const txCol = document.getElementById('text-color').value;
    const font = document.getElementById('font-family').value;
    
    // Typography Defaults & Controls
    const basSize = parseInt(document.getElementById('basmala-size').value);
    const verSize = parseInt(document.getElementById('verse-size').value);
    const refSize = parseInt(document.getElementById('ref-size').value);
    const basDist = parseInt(document.getElementById('basmala-dist').value);

    // Feature Toggles
    const bgEnabled = document.getElementById('bg-image-enable').checked;
    const wmEnabled = document.getElementById('wm-enable').checked;

    const cw = canvas.width = 1080;
    const ch = canvas.height = 1080;

    // 1. Background Logic
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, cw, ch);

    if (bgEnabled && bgImageObj) {
        ctx.save();
        ctx.globalAlpha = parseInt(document.getElementById('bg-opacity').value) / 100;
        const scale = Math.max(cw / bgImageObj.width, ch / bgImageObj.height);
        const x = (cw / 2) - (bgImageObj.width / 2) * scale;
        const y = (ch / 2) - (bgImageObj.height / 2) * scale;
        ctx.drawImage(bgImageObj, x, y, bgImageObj.width * scale, bgImageObj.height * scale);
        ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillStyle = txCol;

    // 2. Text Logic
    let text = "";
    if (quranData[sId]) {
        text = quranData[sId].filter(v => v.verse >= start && v.verse <= end).map(v => v.text).join(" ");
    }
    const verseTxt = `﴿ ${text} ﴾`;
    const refTxt = `[${chaptersData[sId]?.name || ''}:${start === end ? start : start + '-' + end}]`;

    ctx.font = `${verSize}px ${font}`;
    const wrapped = wrapText(ctx, verseTxt, cw * 0.85);
    const verseH = wrapped.length * (verSize * 1.4);
    
    const centerY = ch / 2;
    const basY = centerY - (verseH / 2) - basDist;
    const verY = centerY - (verseH / 2);
    const refY = centerY + (verseH / 2) + (verSize * 0.8);

    // Draw
    ctx.font = `${basSize}px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.fillText("﷽", cw / 2, basY);

    ctx.font = `${verSize}px ${font}`;
    wrapped.forEach((l, i) => ctx.fillText(l, cw / 2, verY + (i * verSize * 1.4) + (verSize / 2)));

    ctx.font = `${refSize}px ${font}`;
    ctx.fillText(refTxt, cw / 2, refY + (refSize / 2));

    // 3. Watermark Logic
    if (wmEnabled) {
        ctx.save();
        ctx.globalAlpha = parseInt(document.getElementById('wm-opacity').value) / 100;
        ctx.fillStyle = document.getElementById('wm-color').value;
        ctx.direction = 'ltr';
        ctx.font = `24px 'Inter', sans-serif`;
        ctx.fillText(document.getElementById('wm-text').value, cw / 2, ch - 50);
        ctx.restore();
    }
}

function setupEvents() {
    const ids = [
        'surah-select', 'start-verse', 'end-verse', 'bg-color', 'text-color', 
        'basmala-size', 'verse-size', 'ref-size', 'basmala-dist', 'font-family',
        'bg-image-enable', 'bg-opacity', 'wm-enable', 'wm-text', 'wm-color', 'wm-opacity'
    ];

    ids.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const span = document.getElementById(id + '-val');
            if (span) span.textContent = document.getElementById(id).value;
            
            // Handle Feature Group Visibility
            toggleUIStates();
            render();
        });
    });

    document.getElementById('bg-image-upload').addEventListener('change', (e) => {
        const r = new FileReader();
        r.onload = (ev) => {
            const i = new Image();
            i.onload = () => { bgImageObj = i; render(); };
            i.src = ev.target.result;
        };
        if(e.target.files[0]) r.readAsDataURL(e.target.files[0]);
    });

    document.getElementById('download-btn').addEventListener('click', () => {
        const a = document.createElement('a');
        a.download = 'quran-verse.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
    });

    // Initial Toggle check
    toggleUIStates();
}

function toggleUIStates() {
    const bgOn = document.getElementById('bg-image-enable').checked;
    document.getElementById('bg-image-upload').disabled = !bgOn;
    document.getElementById('bg-opacity').disabled = !bgOn;
    document.getElementById('bg-image-controls').className = bgOn ? "" : "disabled-group";

    const wmOn = document.getElementById('wm-enable').checked;
    document.getElementById('wm-text').disabled = !wmOn;
    document.getElementById('wm-color').disabled = !wmOn;
    document.getElementById('wm-opacity').disabled = !wmOn;
    document.getElementById('wm-controls').className = wmOn ? "" : "disabled-group";
}

function wrapText(c, t, w) {
    const words = t.split(' '), lines = [];
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
        if (c.measureText(cur + " " + words[i]).width < w) cur += " " + words[i];
        else { lines.push(cur); cur = words[i]; }
    }
    lines.push(cur); return lines;
}

function openTab(evt, name) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-trigger').forEach(t => t.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    evt.currentTarget.classList.add('active');
}

init();
