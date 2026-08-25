'use client';

export default function OutboundLink({ slug, url, label }: { slug: string; url: string; label: string }) {
  const record = () => {
    fetch('/api/log-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, url }),
    }).catch(() => {});
  };
  return (
    <a className="visit" href={url} target="_blank" rel="noopener" onClick={record}>
      {label} →
    </a>
  );
}
