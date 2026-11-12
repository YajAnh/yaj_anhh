
const themeToggleButton = document.querySelector('.dark_mode_button');
const themeToggleIcon = themeToggleButton.querySelector('.material-symbols-outlined');
const settingsSheet = document.querySelector('#settings-sheet');
const menuSheet = document.querySelector('#menu-sheet');
const fontPicker = document.querySelector('#font-picker');

const readingFonts = {
    newsreader: '"Newsreader", Georgia, serif',
    'libre-baskerville': '"Libre Baskerville", Georgia, serif',
    lora: '"Lora", Georgia, serif',
    literata: '"Literata", Georgia, serif'
};

function toggleTheme() {
    document.body.classList.toggle('darkmode');
    const isDarkMode = document.body.classList.contains('darkmode');

    themeToggleIcon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
    themeToggleButton.setAttribute('aria-pressed', String(isDarkMode));
    themeToggleButton.setAttribute('aria-label', isDarkMode ? 'Enable light mode' : 'Enable dark mode');
}

themeToggleButton.addEventListener('click', toggleTheme);

document.querySelector('#settings-button').addEventListener('click', () => settingsSheet.showModal());
document.querySelector('#menu-button').addEventListener('click', () => menuSheet.showModal());

document.querySelectorAll('.settings_close').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});

fontPicker.addEventListener('change', () => {
    const selectedFont = readingFonts[fontPicker.value];

    if (selectedFont) {
        document.documentElement.style.setProperty('--reading-font', selectedFont);
    }
});