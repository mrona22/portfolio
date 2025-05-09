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
    { url : 'meta/', title : 'Meta'},
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


export async function fetchJSON(url) {
    try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`failed to fetch projects ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}


export function renderProjects(project, containerElement) {
  // Your code will go here
  containerElement.innerHTML = '';

  project.forEach(element => {
    const article = document.createElement('article');
    const imagePath = (location.pathname.includes("projects")) ? "../images/" : "images/";
    article.innerHTML = `
      <h3>${element.title}</h3>
      <img src="${imagePath}${element.image}" alt="${element.title}">
      <p1>${element.description}</p>
      <p2> ${element.year}</p>
      `;
      containerElement.appendChild(article)
  });
}

// export function renderProjects(project, containerElement, headingLevel = 'h2') {
//   // Clear out any existing content in the container
//   containerElement.innerHTML = '';

//   // Loop through each project in the array (assuming 'project' is an array)
//   project.forEach(element => {
//     // Create a new <article> for each project
//     const article = document.createElement('article');
    
//     // Create a dynamic heading element (h2, h3, etc.)
//     const heading = document.createElement(headingLevel);
//     heading.textContent = element.title; // Set the project title as the heading

//     // Set the inner HTML for the article, inserting project details
//     article.innerHTML = `
//       ${heading.outerHTML} <!-- Insert the heading -->
//       <img src="${element.image}" alt="${element.title}">
//       <p>${element.description}</p>
//     `;
    
//     // Append the article to the container
//     containerElement.appendChild(article);
//   });
// }

export async function fetchGitHubData(username) {
  // return statement here
  return fetchJSON(`https://api.github.com/users/${username}`);
}
