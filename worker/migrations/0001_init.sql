CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    excerpt          TEXT,
    content          TEXT NOT NULL,
    author_name      TEXT NOT NULL,
    author_email     TEXT,
    category_id      INTEGER,
    location         TEXT,
    cover_image_key  TEXT,
    status           TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    created_at       TEXT NOT NULL,
    updated_at       TEXT,
    approved_at      TEXT,
    approved_by      TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    action     TEXT NOT NULL,
    post_id    INTEGER,
    actor      TEXT,
    note       TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug_status ON posts (slug, status);
CREATE INDEX IF NOT EXISTS idx_posts_category_status ON posts (category_id, status);

INSERT OR IGNORE INTO categories (name, slug, created_at) VALUES
    ('Wisata', 'wisata', datetime('now')),
    ('Budaya', 'budaya', datetime('now')),
    ('Kuliner', 'kuliner', datetime('now')),
    ('Sejarah', 'sejarah', datetime('now')),
    ('Berita Lokal', 'berita-lokal', datetime('now')),
    ('Cerita Warga', 'cerita-warga', datetime('now')),
    ('UMKM', 'umkm', datetime('now')),
    ('Politik', 'politik', datetime('now'));
