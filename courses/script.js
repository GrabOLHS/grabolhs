(() => {
  const input = document.getElementById('course-search');
  const results = document.getElementById('course-results');
  const count = document.getElementById('result-count');

  if (!input || !results || !count) return;

  let courses = [];

  // Normalize text for case-insensitive, punctuation-insensitive matching.
  const normalize = (value) =>
    (value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  // The CSV is stored in /assets/ at the repository root.
  fetch('../assets/course_database.csv')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`CSV request failed (${response.status})`);
      }

      return response.text();
    })
    .then(parseCSV)
    .then((rows) => {
      courses = rows.filter((course) => course.name && course.link);
      render();
    })
    .catch((error) => {
      console.error(
        'Grab OLHS could not load assets/course_database.csv:',
        error
      );

      count.textContent = 'Database unavailable';
      results.replaceChildren();

      const message = document.createElement('p');
      message.className = 'state-message';
      message.textContent =
        'The course list could not be loaded. If you opened this page directly as a file, use a local web server or GitHub Pages. Also check that assets/course_database.csv exists at the repository root.';

      results.append(message);
    });

  // CSV parser supports quoted fields, commas inside names,
  // escaped quotes, Windows line endings, and UTF-8 BOMs.
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"' && field.length === 0) {
        quoted = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') {
          i++;
        }

        row.push(field);
        field = '';

        if (row.some((cell) => cell.trim())) {
          rows.push(row);
        }

        row = [];
      } else {
        field += char;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }

    if (!rows.length) return [];

    const headers = rows.shift().map((header) =>
      header.trim().replace(/^\uFEFF/, '').toLocaleLowerCase()
    );

    const linkIndex = headers.indexOf('link');
    const nameIndex = headers.indexOf('class name');
    const idIndex = headers.indexOf('id');

    if (linkIndex < 0 || nameIndex < 0) {
      throw new Error('CSV must contain ID,Link,Class Name headers.');
    }

    return rows
      .map((cells) => ({
        id: idIndex >= 0 ? (cells[idIndex] || '').trim() : '',
        link: (cells[linkIndex] || '').trim(),
        name: (cells[nameIndex] || '').trim()
      }))
      .filter((course) => /^https?:\/\//i.test(course.link));
  }

  // Levenshtein edit distance: counts the changes needed to
  // transform one word into another.
  function editDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let previous = Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= a.length; i++) {
      const current = [i];

      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }

      previous = current;
    }

    return previous[b.length];
  }

  function wordMatches(queryWord, courseWords) {
    // Exact and partial matches are preferred.
    if (
      courseWords.some(
        (word) => word.includes(queryWord) || queryWord.includes(word)
      )
    ) {
      return true;
    }

    // Allow a few spelling errors depending on word length.
    const maxDistance =
      queryWord.length <= 4 ? 1 :
      queryWord.length <= 8 ? 2 : 3;

    return courseWords.some((word) => {
      if (Math.abs(word.length - queryWord.length) > maxDistance) {
        return false;
      }

      return editDistance(queryWord, word) <= maxDistance;
    });
  }

  function matchScore(course, query) {
    if (!query) return 0;

    const name = normalize(course.name);

    // Full phrase matches always rank first.
    if (name.includes(query)) return 100;

    const queryWords = query.split(' ').filter(Boolean);
    const courseWords = name.split(' ').filter(Boolean);

    const matchedWords = queryWords.filter((word) =>
      wordMatches(word, courseWords)
    ).length;

    return matchedWords / queryWords.length;
  }

  function render() {
    const query = normalize(input.value);

    const filtered = courses
      .map((course) => ({
        course,
        score: matchScore(course, query)
      }))
      .filter((item) => !query || item.score >= 0.5)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.course.name.localeCompare(b.course.name)
      )
      .map((item) => item.course);

    count.textContent = query
      ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`
      : `${courses.length} courses`;

    results.replaceChildren();

    if (!filtered.length) {
      const message = document.createElement('p');
      message.className = 'state-message';
      message.textContent = courses.length
        ? 'No similar courses found. Try a shorter search or check the spelling.'
        : 'No courses were found in the CSV file.';

      results.append(message);
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((course) => {
      const link = document.createElement('a');

      link.className = 'course-option';
      link.setAttribute('role', 'option');
      link.href = course.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = course.name;

      fragment.append(link);
    });

    results.append(fragment);
  }

  input.addEventListener('input', () => {
    input.classList.toggle('has-value', input.value.length > 0);
    render();
  });
})();