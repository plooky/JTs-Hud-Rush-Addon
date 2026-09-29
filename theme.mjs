// Reuse the manager's installed default theme rather than redistribute its bundle.
export async function loadDefaultTheme() {
  const base = new URL('/huds/default/index.html', location.origin);
  const response = await fetch(base);
  if (!response.ok) throw new Error('Default JT HUD is unavailable');
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  const css = page.querySelector('link[rel="stylesheet"][href*="assets/"]');
  const script = page.querySelector('script[type="module"][src]');
  if (!css || !script) throw new Error('Default JT HUD theme format is unsupported');
  const cssURL = new URL(css.getAttribute('href'), base);
  const cssResponse = await fetch(cssURL);
  if (!cssResponse.ok) throw new Error('Default JT HUD stylesheet could not load');
  const style = document.createElement('style');
  style.dataset.defaultJtTheme = 'true';
  // Use the original rules, with local Oswald replacing the external font import.
  style.textContent = (await cssResponse.text()).replace(/@import[^;]+;/g, '')
    .replace(/url\(([^)]+)\)/g, (_, value) => `url("${new URL(value.trim().replace(/^["']|["']$/g, ''), cssURL).href}")`);
  document.head.insertBefore(style, document.querySelector('link[href="style.css"]'));
  const scriptURL = new URL(script.getAttribute('src'), base);
  const bundleResponse = await fetch(scriptURL);
  if (!bundleResponse.ok) throw new Error('Default JT HUD assets are unavailable');
  const bundle = await bundleResponse.text();
  const asset = prefix => {
    const name = bundle.match(new RegExp(`${prefix}-[a-zA-Z0-9_-]+\\.png`))?.[0];
    if (!name) throw new Error(`Default JT HUD asset ${prefix} is unavailable`);
    return new URL(name, scriptURL).href;
  };
  const weapons = await fetch('./assets/weapons.json').then(r => r.json());
  return {
    portraits: { CT: asset('default_CT'), T: asset('default_T') },
    logos: { CT: asset('logo_CT_default'), T: asset('logo_T_default') },
    weapons: new Set(weapons)
  };
}
