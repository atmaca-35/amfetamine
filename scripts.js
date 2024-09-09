document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');
    const wordCountElement = document.getElementById('wordCount');

    let dictionaryData = {};
    let lastQuery = '';
    let hasError = false;

    const clickableWords = {
        // Tanımlamalar...
    };

    try {
        const response = await fetch('vocabulary.json');
        if (!response.ok) {
            throw new Error('Yoksa bir yerlerde bir harf mi kayıp?');
        }
        dictionaryData = await response.json();

        const wordCount = Object.keys(dictionaryData).length;
        wordCountElement.innerHTML = `Portrait of Proto-Turkic in <span class="highlight">${wordCount}</span> Entries.`;
    } catch (error) {
        console.error('Yoksa bir yerlerde bir harf mi kayıp?', error);
        hasError = true;

        wordCountElement.innerHTML = `<p class="error-message">Yoksa bir yerlerde bir harf mi kayıp?</p>`;

        searchContainer.classList.add('error');
        resultDiv.classList.add('hidden');
        ghostText.classList.add('hidden');
    }

    // Arama kelimesini URL'den al ve sayfa yüklendikten sonra arat
    function handleInitialUrlSearch() {
        const urlWord = window.location.hash.substring(1); // "#" işaretinden sonrasını al
        if (urlWord) {
            searchBox.value = urlWord;
            searchWord(urlWord); // Sayfa yüklendikten sonra arama yap
        }
    }

    function searchWord(query) {
        if (query === lastQuery) {
            return;
        }
        lastQuery = query;

        resultDiv.innerHTML = '';

        if (query.startsWith(' ') || query.trim().length === 0) {
            if (query.length === 0) {
                searchContainer.classList.remove('error');
                ghostText.textContent = "";
                updateUrl('');  // Arama kutusu boşsa URL'yi temizle
                return;
            }
            searchContainer.classList.add('error');
            ghostText.textContent = "";
            return;
        } else {
            searchContainer.classList.remove('error');
        }

        const normalizedQuery = normalizeTurkish(query);

        const sortedWords = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word));

        const closestWord = sortedWords
            .find(({ word }) => word.startsWith(normalizedQuery));

        if (closestWord) {
            const wordDetails = dictionaryData[closestWord.original];
            const description = wordDetails.a.replace(/\n/g, "<br>");
            const descriptionElement = document.createElement('p');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = highlightWords(sanitizeHTML(description));
            resultDiv.appendChild(descriptionElement);

            const descriptionHeight = descriptionElement.offsetHeight;
            descriptionElement.style.maxHeight = `${descriptionHeight}px`;

            // Fade-in animasyonu ekleniyor
            resultDiv.style.animation = 'fadeIn 1s ease-in-out';

            ghostText.textContent = closestWord.word.substring(query.length);

            // URL'yi güncelle
            updateUrl(closestWord.original);

        } else {
            ghostText.textContent = "";
            searchContainer.classList.add('error');
            updateUrl('');  // Arama sonucu yoksa URL'yi temizle
        }

        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 1s ease-in-out';

        createClickableWords();
    }

    function updateUrl(word) {
        const currentUrl = new URL(window.location.href);

        // Eğer arama kutusu boşsa, sadece hash kısmını kaldır
        if (!word) {
            currentUrl.hash = '';  // Hash kısmını tamamen temizle
        } else {
            // Yeni kelimeyi hash olarak ekle
            currentUrl.hash = `#${word}`;
        }

        // URL'yi güncelle
        window.history.pushState({}, '', currentUrl);
    }

    // Arama kutusu boş olduğunda URL'deki kelimeyi sil
    searchBox.addEventListener('input', () => {
        const query = searchBox.value.trim();
        if (query === '') {
            updateUrl('');  // Boşsa URL'den kaldır
        } else {
            updateSearchBoxPlaceholder(query);
            searchWord(query);
        }
    });

    function normalizeTurkish(text) {
        return text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    }

    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['b', 'span', 'i', 'em', 'strong', 'a', 'br'],
            ALLOWED_ATTR: ['href', 'class'],
        });
    }

    function highlightWords(text) {
        const specialWords = {
            // Tanımlamalar...
        };

        let markedText = text;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            markedText = markedText.replace(regex, (match) => `[SPECIAL:${key}]`);
        }

        let resultText = markedText;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\[SPECIAL:${key}\\](\\s+)(\\S+)`, 'gi');
            resultText = resultText.replace(regex, (match, p1, p2) => `<b>${value}</b>${p1}<span class="pink">${p2}</span>`);
        }

        resultText = resultText.replace(/\[SPECIAL:\S+\]/g, '');

        return resultText;
    }

    // Sayfa yüklendikten sonra URL'deki kelimeyi arat
    



    function updateSearchBoxPlaceholder(query) {
        const queryLower = normalizeTurkish(query);
        const matchingWord = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word))
            .find(({ word }) => word.startsWith(queryLower));

        if (matchingWord) {
            const remainingPart = matchingWord.word.substring(query.length);
            ghostText.textContent = remainingPart;

            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }

    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Poppins', sans-serif`;
        return context.measureText(text).width;
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value;
        updateSearchBoxPlaceholder(query);
        searchWord(query);
    });
    function bumbum(kelimee) {
        document.getElementByID("searchBox").innerhtml = kelimee
    }
    document.querySelector('#result').addEventListener('click', (e) => {
        if (e.target.classList.contains('searchable')) {
            const searchbox = document.querySelector('#searchbox');
            searchBox.value = e.target.textContent;
            searchBox.dispatchEvent(new Event('input'));
        }
    })
    handleInitialUrlSearch();
});
