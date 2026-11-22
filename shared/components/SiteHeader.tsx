import './site-header.css';

export function SiteHeader() {
  return (
    <header className="site-navigation">
      <nav className="site-navigation__inner" aria-label="Main navigation">
        <a className="site-navigation__brand" href="/" aria-label="Tim Qi home">
          TQ
        </a>
        <ul className="site-navigation__links">
          <li><a href="/about.html">About</a></li>
          <li><a href="/writing.html">Writing</a></li>
          <li><a href="/projects.html" aria-current="location">Projects</a></li>
        </ul>
      </nav>
    </header>
  );
}
