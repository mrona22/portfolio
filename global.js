console.log('IT’S ALIVE!');
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

function normalize(path) {
    return path
      .replace(/^\/portfolio/, '') // Remove the GitHub Pages base path
      .replace(/\/index\.html$/, '')
      .replace(/\/$/, '');
  }
  

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url : 'contact/', title: 'Contact' },
    { url: 'https://github.com/mrona22', title: 'GitHub'}
  ];

let nav = document.createElement('nav');

document.body.prepend(nav);


for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // next step: create link and add it to nav
    url = !url.startsWith('http') ? BASE_PATH + url : url;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
        a.host === location.host && normalize(a.pathname) === normalize(location.pathname)
      );      
    
      // Open external links in a new tab
    if (a.host !== location.host) {
        a.target = '_blank';
    }
    nav.append(a);
  }

document.body.insertAdjacentHTML(
'afterbegin',
`
    <label class="color-scheme">
    Theme:
    <select>
        <option value="auto">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
    </select>
    </label>`
);



const select = document.querySelector('.color-scheme select');

if ("colorScheme" in localStorage) {
    const saved = localStorage.colorScheme;
    select.value = saved;
    document.documentElement.style.setProperty('color-scheme', saved);
  }

select.addEventListener('input', function (event) {
    const value = event.target.value;
    console.log('color scheme changed to', value);
    localStorage.colorScheme = value;
    document.documentElement.style.setProperty('color-scheme', event.target.value);
});

